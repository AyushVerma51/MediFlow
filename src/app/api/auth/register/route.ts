import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { successResponse, errorResponse } from "@/lib/errors";
import { registerSchema } from "@/validators";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = registerSchema.safeParse(body);

    if (!validated.success) {
      return errorResponse("VALIDATION_ERROR", validated.error.issues[0].message, 422);
    }

    const { email, password, full_name, role, phone } = validated.data;
    const admin = createAdminClient();

    // Register with Supabase Auth
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      if (authError.message.includes("already registered")) {
        return errorResponse("DUPLICATE_EMAIL", "An account with this email already exists", 409);
      }
      return errorResponse("AUTH_ERROR", authError.message, 400);
    }

    // Create profile
    const { error: profileError } = await admin.from("profiles").insert({
      id: authData.user.id,
      full_name,
      email,
      role: role || "PATIENT",
      phone: phone || null,
      is_active: true,
    });

    if (profileError) {
      // Rollback: delete auth user
      await admin.auth.admin.deleteUser(authData.user.id);
      return errorResponse("PROFILE_ERROR", "Failed to create profile", 500);
    }

    return successResponse(
      { user: { id: authData.user.id, email, full_name, role } },
      201
    );
  } catch (error: any) {
    console.error("Registration error:", error);
    return errorResponse("INTERNAL_ERROR", "Registration failed", 500);
  }
}
