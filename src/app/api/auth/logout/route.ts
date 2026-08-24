import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { successResponse, errorResponse } from "@/lib/errors";

export async function POST() {
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      return errorResponse("LOGOUT_ERROR", error.message, 500);
    }

    return successResponse({ message: "Logged out successfully" });
  } catch (error: any) {
    return errorResponse("INTERNAL_ERROR", "Logout failed", 500);
  }
}
