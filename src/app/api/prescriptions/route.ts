import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { successResponse, handleApiError } from "@/lib/errors";

export async function GET() {
  try {
    const profile = await getCurrentProfile();
    const admin = createAdminClient();

    let query = admin
      .from("prescriptions")
      .select("*, prescription_medications(*)");

    if (profile.role === "PATIENT") {
      query = query.eq("patient_id", profile.id);
    } else if (profile.role === "DOCTOR") {
      const { data: dp } = await admin.from("doctor_profiles").select("id").eq("user_id", profile.id).single();
      if (dp) query = query.eq("doctor_id", dp.id);
    }

    const { data, error } = await query.order("created_at", { ascending: false });
    if (error) return handleApiError(error);
    return successResponse({ items: data || [] });
  } catch (error) {
    return handleApiError(error);
  }
}
