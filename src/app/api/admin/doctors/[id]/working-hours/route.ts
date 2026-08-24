import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { successResponse, handleApiError } from "@/lib/errors";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await requireRole("ADMIN");
    const body = await request.json();
    const admin = createAdminClient();

    // Delete existing hours
    await admin.from("doctor_working_hours").delete().eq("doctor_id", id);

    // Insert new hours
    if (body.working_hours?.length > 0) {
      const hours = body.working_hours.map((wh: any) => ({
        doctor_id: id,
        day_of_week: wh.day_of_week,
        start_time: wh.start_time,
        end_time: wh.end_time,
      }));
      const { error } = await admin.from("doctor_working_hours").insert(hours);
      if (error) return handleApiError(error);
    }

    return successResponse({ updated: true });
  } catch (error) {
    return handleApiError(error);
  }
}
