import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { successResponse, handleApiError } from "@/lib/errors";
import { prescriptionSchema } from "@/validators";
import { createAuditLog } from "@/lib/audit";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const profile = await getCurrentProfile();
    if (profile.role !== "DOCTOR") {
      return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Only doctors can create prescriptions" } }, { status: 403 });
    }

    const body = await request.json();
    const validated = prescriptionSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: validated.error.issues[0].message } }, { status: 422 });
    }

    const admin = createAdminClient();

    // Get doctor profile
    const { data: doctorProfile } = await admin.from("doctor_profiles").select("id").eq("user_id", profile.id).single();
    if (!doctorProfile) return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Doctor profile not found" } }, { status: 404 });

    // Get appointment for patient_id
    const { data: appointment } = await admin.from("appointments").select("patient_id").eq("id", id).single();
    if (!appointment) return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Appointment not found" } }, { status: 404 });

    // Create prescription with medications
    const { data: prescription, error: rxError } = await admin
      .from("prescriptions")
      .insert({
        appointment_id: id,
        doctor_id: doctorProfile.id,
        patient_id: appointment.patient_id,
      })
      .select()
      .single();

    if (rxError) return handleApiError(rxError);

    // Insert medications
    const meds = validated.data.medications.map(med => ({
      prescription_id: prescription.id,
      medication_name: med.medication_name,
      dosage: med.dosage,
      frequency: med.frequency,
      duration: med.duration,
      start_date: med.start_date,
      end_date: med.end_date,
      instructions: med.instructions || null,
    }));

    const { error: medError } = await admin.from("prescription_medications").insert(meds);
    if (medError) return handleApiError(medError);

    createAuditLog({ actorId: profile.id, action: "PRESCRIPTION_CREATED", entityType: "prescription", entityId: prescription.id }).catch(() => {});

    return successResponse({ prescription_id: prescription.id, medications: meds.length }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
