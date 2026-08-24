import { NextResponse } from "next/server";
import { handleOAuthCallback } from "@/lib/calendar/google-calendar.service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state"); // user ID

    if (!code || !state) {
      return NextResponse.redirect(new URL("/patient/dashboard?error=calendar_auth_failed", request.url));
    }

    const success = await handleOAuthCallback(code, state);
    if (success) {
      return NextResponse.redirect(new URL("/patient/dashboard?calendar=connected", request.url));
    } else {
      return NextResponse.redirect(new URL("/patient/dashboard?error=calendar_auth_failed", request.url));
    }
  } catch {
    return NextResponse.redirect(new URL("/patient/dashboard?error=calendar_auth_failed", request.url));
  }
}
