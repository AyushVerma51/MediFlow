import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth";
import { successResponse, handleApiError } from "@/lib/errors";

export async function GET() {
  try {
    const profile = await getCurrentProfile();
    return successResponse(profile);
  } catch (error) {
    return handleApiError(error);
  }
}
