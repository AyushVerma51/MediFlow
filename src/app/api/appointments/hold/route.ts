import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { successResponse, errorResponse, handleApiError } from "@/lib/errors";
import { holdSlotSchema } from "@/validators";
import { createAuditLog } from "@/lib/audit";

export async function POST(request: Request) {
  try {
    const profile = await getCurrentProfile();
    if (profile.role !== "PATIENT") {
      return errorResponse("FORBIDDEN", "Only patients can hold slots", 403);
    }

    const body = await request.json();
    const validated = holdSlotSchema.safeParse(body);

    if (!validated.success) {
      return errorResponse("VALIDATION_ERROR", validated.error.issues[0].message, 422);
    }

    const { doctor_id, start_time, end_time } = validated.data;
    const admin = createAdminClient();

    // Use the PostgreSQL RPC function for atomic hold
    const { data, error } = await admin.rpc("hold_appointment_slot", {
      p_doctor_id: doctor_id,
      p_patient_id: profile.id,
      p_start_time: start_time,
      p_end_time: end_time,
      p_hold_minutes: parseInt(process.env.HOLD_EXPIRY_MINUTES || "5"),
    });

    if (error) {
      console.error("RPC error:", error);
      return errorResponse("BOOKING_ERROR", "Failed to hold slot", 500);
    }

    if (!data.success) {
      return errorResponse(data.error || "SLOT_UNAVAILABLE", data.message || "This slot is no longer available", 409);
    }

    await createAuditLog({
      actorId: profile.id,
      action: "APPOINTMENT_HELD",
      entityType: "appointment",
      entityId: data.appointment_id,
    });

    return successResponse({
      appointment_id: data.appointment_id,
      hold_expires_at: data.hold_expires_at,
    }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
