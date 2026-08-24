import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { successResponse, errorResponse } from "@/lib/errors";
import { loginSchema } from "@/validators";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = loginSchema.safeParse(body);

    if (!validated.success) {
      return errorResponse("VALIDATION_ERROR", validated.error.issues[0].message, 422);
    }

    const { email, password } = validated.data;
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return errorResponse("INVALID_CREDENTIALS", "Invalid email or password", 401);
    }

    return successResponse({
      user: {
        id: data.user.id,
        email: data.user.email,
      },
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
      },
    });
  } catch (error: any) {
    console.error("Login error:", error);
    return errorResponse("INTERNAL_ERROR", "Login failed", 500);
  }
}
