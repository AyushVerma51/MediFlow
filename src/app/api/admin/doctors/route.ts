import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { successResponse, handleApiError } from "@/lib/errors";
import { createDoctorSchema } from "@/validators";
import { createAuditLog } from "@/lib/audit";

export async function GET() {
  try {
    await requireRole("ADMIN");
    const admin = createAdminClient();

    const { data, error } = await admin
      .from("doctor_profiles")
      .select(`
        *,
        profile:profiles!doctor_profiles_user_id_fkey(id, full_name, email, is_active, phone),
        doctor_working_hours(*)
      `)
      .order("created_at", { ascending: false });

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
    const validated = createDoctorSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json({ success: false, error: { code: "VALIDATION_ERROR", message: validated.error.issues[0].message } }, { status: 422 });
    }

    const admin = createAdminClient();
    const { user_id, ...doctorData } = validated.data;

    const { data, error } = await admin
      .from("doctor_profiles")
      .insert({ user_id, ...doctorData })
      .select()
      .single();

    if (error) return handleApiError(error);

    // Update user role to DOCTOR
    await admin.from("profiles").update({ role: "DOCTOR" }).eq("id", user_id);

    createAuditLog({ actorId: profile.id, action: "DOCTOR_CREATED", entityType: "doctor_profile", entityId: data.id }).catch(() => {});

    return successResponse(data, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
