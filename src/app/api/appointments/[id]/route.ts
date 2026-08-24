import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { successResponse, handleApiError } from "@/lib/errors";
import { createAuditLog } from "@/lib/audit";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const profile = await getCurrentProfile();
    const admin = createAdminClient();

    const { data, error } = await admin
      .from("appointments")
      .select(`
        *,
        doctor:doctor_profiles(id, specialisation, slot_duration, user_id,
          profile:profiles!doctor_profiles_user_id_fkey(full_name, email)
        ),
        patient:profiles!appointments_patient_id_fkey(full_name, email),
        appointment_symptoms(*),
        ai_previsit_summaries(*),
        clinical_notes(*),
        prescriptions(id, prescription_medications(*)),
        post_visit_summaries(*)
      `)
      .eq("id", id)
      .single();

    if (error || !data) return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Appointment not found" } }, { status: 404 });
    return successResponse(data);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const profile = await getCurrentProfile();
    const body = await request.json();
    const admin = createAdminClient();

    if (body.status === "COMPLETED") {
      const { data: result, error } = await admin.rpc("complete_appointment", {
        p_appointment_id: id,
        p_doctor_user_id: profile.id,
      });
      if (error) return handleApiError(error);
      if (!result.success) return NextResponse.json({ success: false, error: { code: result.error, message: result.message } }, { status: 400 });

      // Generate post-visit summary async
      const { getAIService } = await import("@/lib/ai/ai.service");
      const { data: appointment } = await admin.from("appointments").select("*, clinical_notes(*), prescriptions(id, prescription_medications(*))").eq("id", id).single();
      if (appointment?.clinical_notes?.[0]) {
        const cn = appointment.clinical_notes[0];
        const meds = appointment.prescriptions?.flatMap((p: any) => p.prescription_medications || []) || [];
        getAIService().generatePostVisitSummary({
          clinicalNotes: cn.clinical_notes,
          treatmentPlan: cn.treatment_plan || "",
          prescriptions: meds.map((m: any) => `${m.medication_name} ${m.dosage} ${m.frequency}`).join(", "),
          followUpInstructions: cn.follow_up_instructions || "",
        }).then(async (summary) => {
          if (summary) {
            await admin.from("post_visit_summaries").insert({
              appointment_id: id, summary: summary.summary,
              medications: JSON.stringify(summary.medications),
              follow_up_steps: JSON.stringify(summary.followUpSteps),
              is_available: true,
            });
          }
        }).catch(e => console.error("Post-visit summary failed:", e));
      }

      createAuditLog({ actorId: profile.id, action: "APPOINTMENT_COMPLETED", entityType: "appointment", entityId: id }).catch(() => {});
      return successResponse({ status: "COMPLETED" });
    }

    return NextResponse.json({ success: false, error: { code: "INVALID_ACTION", message: "Invalid status update" } }, { status: 400 });
  } catch (error) {
    return handleApiError(error);
  }
}
