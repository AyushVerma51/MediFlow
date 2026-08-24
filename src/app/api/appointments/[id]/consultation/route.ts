import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { successResponse, handleApiError } from "@/lib/errors";
import { consultationSchema } from "@/validators";
import { createAuditLog } from "@/lib/audit";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const profile = await getCurrentProfile();
    if (profile.role !== "DOCTOR") {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Only doctors can create consultations" } }, { status: 403 });
    }

    const body = await request.json();
    const validated = consultationSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: validated.error.issues[0].message } }, { status: 422 });
    }

    const admin = createAdminClient();

    // Get doctor profile
    const { data: doctorProfile } = await admin.from("doctor_profiles").select("id").eq("user_id", profile.id).single();
    if (!doctorProfile) return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Doctor profile not found" } }, { status: 404 });

    const { data, error } = await admin
      .from("clinical_notes")
      .upsert({
        appointment_id: id,
        doctor_id: doctorProfile.id,
        clinical_notes: validated.data.clinical_notes,
        diagnosis: validated.data.diagnosis || null,
        treatment_plan: validated.data.treatment_plan || null,
        follow_up_instructions: validated.data.follow_up_instructions || null,
      }, { onConflict: "appointment_id" })
      .select()
      .single();

    if (error) return handleApiError(error);

    createAuditLog({ actorId: profile.id, action: "CLINICAL_NOTES_CREATED", entityType: "clinical_notes", entityId: data.id }).catch(() => {});

    return successResponse(data, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
