import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth";
import { getAuthUrl } from "@/lib/calendar/google-calendar.service";

export async function GET() {
  try {
    const profile = await getCurrentProfile();
    const state = profile.id;
    const url = getAuthUrl(state);
    return NextResponse.redirect(url);
  } catch {
    return NextResponse.json({ success: false, error: { code: "ERROR", message: "Failed to initiate calendar connection" } }, { status: 500 });
  }
}
