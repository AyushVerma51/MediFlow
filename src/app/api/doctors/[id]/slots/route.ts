import { NextResponse } from "next/server";
import { generateSlots } from "@/lib/appointments/slot.service";
import { successResponse, handleApiError } from "@/lib/errors";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");

    if (!date) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "date query parameter is required" } },
        { status: 400 }
      );
    }

    const slots = await generateSlots(id, date);
    return successResponse({ slots, date });
  } catch (error) {
    return handleApiError(error);
  }
}
