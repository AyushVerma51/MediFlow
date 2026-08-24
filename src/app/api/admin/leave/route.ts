import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { successResponse, handleApiError } from "@/lib/errors";
import { createLeaveSchema } from "@/validators";
import { createAuditLog } from "@/lib/audit";

export async function GET() {
  try {
    await requireRole("ADMIN");
    const admin = createAdminClient();

    const { data, error } = await admin
      .from("doctor_leaves")
      .select(`
        *,
        doctor:doctor_profiles(id, profile:profiles!doctor_profiles_user_id_fkey(full_name))
      `)
      .order("start_date", { ascending: false });

    if (error) return handleApiError(error);
    return successResponse({ items: data || [] });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const profile = await requireRole("ADMIN");
    const body = await request.json();
    const validated = createLeaveSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: validated.error.issues[0].message } }, { status: 422 });
    }

    const admin = createAdminClient();
    const { doctor_id, start_date, end_date, reason } = validated.data;

    // Check for overlapping leave
    const { data: existingLeave } = await admin
      .from("doctor_leaves")
      .select("id")
      .eq("doctor_id", doctor_id)
      .lte("start_date", end_date)
      .gte("end_date", start_date)
      .single();

    if (existingLeave) {
      return NextResponse.json({ success: false, error: { code: "OVERLAPPING_LEAVE", message: "Doctor already has leave during this period" } }, { status: 409 });
    }

    // Find affected appointments
    const { data: affectedAppts } = await admin
      .from("appointments")
      .select("id, patient_id, start_time")
      .eq("doctor_id", doctor_id)
      .in("status", ["CONFIRMED", "HELD"])
      .gte("start_time", `${start_date}T00:00:00Z`)
      .lte("start_time", `${end_date}T23:59:59Z`);

    // Create leave
    const { data: leave, error: leaveError } = await admin
      .from("doctor_leaves")
      .insert({ doctor_id, start_date, end_date, reason: reason || null })
      .select()
      .single();

    if (leaveError) return handleApiError(leaveError);

    // Cancel affected appointments and create notifications
    if (affectedAppts && affectedAppts.length > 0) {
      const apptIds = affectedAppts.map(a => a.id);
      await admin.from("appointments").update({ status: "CANCELLED", cancellation_reason: "Doctor on leave" }).in("id", apptIds);

      // Create notification records for affected patients
      const { data: doctorUser } = await admin.from("doctor_profiles").select("user_id").eq("id", doctor_id).single();
      const { data: doctorProfileData } = doctorUser ? await admin.from("profiles").select("full_name").eq("id", doctorUser.user_id).single() : { data: null };
      const doctorName = doctorProfileData?.full_name || "Doctor";

      for (const appt of affectedAppts) {
        const { data: patient } = await admin.from("profiles").select("full_name, email").eq("id", appt.patient_id).single();
        if (patient) {
          await admin.from("notifications").insert({
            user_id: appt.patient_id,
            appointment_id: appt.id,
            type: "APPOINTMENT_CANCELLED_BY_LEAVE",
            status: "PENDING",
            subject: `Appointment Cancelled — Doctor on Leave`,
            body: `Your appointment with Dr. ${doctorName} has been cancelled because the doctor will be on leave from ${start_date} to ${end_date}.`,
            recipient_email: patient.email,
            idempotency_key: `leave-cancel-${appt.id}`,
          });
        }
      }
    }

    createAuditLog({
      actorId: profile.id,
      action: "DOCTOR_LEAVE_CREATED",
      entityType: "doctor_leave",
      entityId: leave.id,
      metadata: { affected_appointments: affectedAppts?.length || 0 },
    }).catch(() => {});

    return successResponse({ leave, affected_appointments: affectedAppts?.length || 0 }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    await requireRole("ADMIN");
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: "ID is required" } }, { status: 400 });

    const admin = createAdminClient();
    const { error } = await admin.from("doctor_leaves").delete().eq("id", id);
    if (error) return handleApiError(error);
    return successResponse({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
