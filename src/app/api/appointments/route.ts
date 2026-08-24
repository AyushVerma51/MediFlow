import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { successResponse, handleApiError } from "@/lib/errors";
import { bookAppointmentSchema } from "@/validators";
import { createAuditLog } from "@/lib/audit";
import { notifyBookingConfirmation, notifyNewAppointmentForDoctor } from "@/lib/notifications/notification.service";
import { createCalendarEvent } from "@/lib/calendar/google-calendar.service";
import { getAIService } from "@/lib/ai/ai.service";
import { format } from "date-fns";

// GET /api/appointments — list appointments for current user
export async function GET(request: Request) {
  try {
    const profile = await getCurrentProfile();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "20");
    const admin = createAdminClient();

    let query = admin
      .from("appointments")
      .select(`
        *,
        doctor:doctor_profiles(
          id, specialisation, slot_duration,
          profile:profiles!doctor_profiles_user_id_fkey(full_name, email)
        ),
        patient:profiles!appointments_patient_id_fkey(full_name, email)
      `);

    // Filter by role
    if (profile.role === "PATIENT") {
      query = query.eq("patient_id", profile.id);
    } else if (profile.role === "DOCTOR") {
      const { data: dp } = await admin.from("doctor_profiles").select("id").eq("user_id", profile.id).single();
      if (dp) query = query.eq("doctor_id", dp.id);
    }
    // Admin sees all

    if (status) query = query.eq("status", status);

    const { data, error } = await query
      .order("start_time", { ascending: true })
      .limit(limit);

    if (error) return handleApiError(error);
    return successResponse({ items: data || [] });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST /api/appointments — confirm a held appointment
export async function POST(request: Request) {
  try {
    const profile = await getCurrentProfile();
    if (profile.role !== "PATIENT") {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Only patients can book" } }, { status: 403 });
    }

    const body = await request.json();
    const validated = bookAppointmentSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: validated.error.issues[0].message } }, { status: 422 });
    }

    const { appointment_id, symptoms } = validated.data;
    const admin = createAdminClient();

    // Use the PostgreSQL RPC to confirm atomically
    const { data: confirmResult, error: confirmError } = await admin.rpc("confirm_appointment", {
      p_appointment_id: appointment_id,
      p_patient_id: profile.id,
    });

    if (confirmError) return handleApiError(confirmError);
    if (!confirmResult.success) {
      return NextResponse.json({ success: false, error: { code: confirmResult.error, message: confirmResult.message || "Booking failed" } }, { status: 400 });
    }

    // Save symptoms
    await admin.from("appointment_symptoms").insert({
      appointment_id,
      chief_complaint: symptoms.chief_complaint,
      symptoms: symptoms.symptoms,
      duration: symptoms.duration || null,
      severity: symptoms.severity || null,
      additional_information: symptoms.additional_information || null,
    });

    // Get full appointment for side effects
    const { data: appointment } = await admin
      .from("appointments")
      .select(`
        *,
        doctor:doctor_profiles(id, specialisation, user_id, profile:profiles!doctor_profiles_user_id_fkey(full_name, email)),
        patient:profiles!appointments_patient_id_fkey(full_name, email)
      `)
      .eq("id", appointment_id)
      .single();

    if (appointment) {
      const dateStr = format(new Date(appointment.start_time), "MMMM d, yyyy");
      const timeStr = format(new Date(appointment.start_time), "h:mm a");

      // Side effects — these should not block the booking
      // 1. Notify patient
      notifyBookingConfirmation(
        appointment.patient_id, profile.full_name, profile.email,
        appointment.doctor?.profile?.full_name || "Unknown",
        dateStr, timeStr, appointment_id
      ).catch(e => console.error("Patient notification failed:", e));

      // 2. Notify doctor
      notifyNewAppointmentForDoctor(
        appointment.doctor.user_id, appointment.doctor.profile.full_name,
        profile.full_name, appointment.doctor.profile.email,
        dateStr, timeStr, appointment_id
      ).catch(e => console.error("Doctor notification failed:", e));

      // 3. Trigger AI summary (async, non-blocking)
      getAIService().generatePreVisitSummary({
        chiefComplaint: symptoms.chief_complaint,
        symptoms: symptoms.symptoms,
        duration: symptoms.duration || "",
        severity: symptoms.severity || "",
        additionalInformation: symptoms.additional_information,
      }).then(async (summary) => {
        if (summary) {
          await admin.from("ai_previsit_summaries").insert({
            appointment_id,
            urgency: summary.urgency,
            chief_complaint: summary.chiefComplaint,
            suggested_questions: JSON.stringify(summary.suggestedQuestions),
            is_available: true,
          });
        }
      }).catch(e => console.error("AI summary failed:", e));

      // 4. Queue calendar sync (async)
      createCalendarEvent(
        appointment.doctor.user_id, appointment_id,
        `Appointment: ${profile.full_name} with Dr. ${appointment.doctor.profile.full_name}`,
        `Patient: ${profile.full_name}\nDoctor: Dr. ${appointment.doctor.profile.full_name}\nStatus: CONFIRMED`,
        appointment.start_time, appointment.end_time
      ).catch(e => console.error("Calendar sync failed:", e));

      // 5. Audit log
      createAuditLog({
        actorId: profile.id,
        action: "APPOINTMENT_BOOKED",
        entityType: "appointment",
        entityId: appointment_id,
      }).catch(e => console.error("Audit log failed:", e));
    }

    return successResponse({ appointment_id, status: "CONFIRMED" }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
