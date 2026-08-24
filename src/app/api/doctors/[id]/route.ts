import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { successResponse, handleApiError, NotFoundError } from "@/lib/errors";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const admin = createAdminClient();

    const { data: doctor, error } = await admin
      .from("doctor_profiles")
      .select(`
        *,
        profile:profiles!doctor_profiles_user_id_fkey(id, full_name, email, avatar_url, phone, bio),
        doctor_working_hours(*)
      `)
      .eq("id", id)
      .single();

    if (error || !doctor) {
      throw new NotFoundError("Doctor");
    }

    return successResponse(doctor);
  } catch (error) {
    return handleApiError(error);
  }
}
