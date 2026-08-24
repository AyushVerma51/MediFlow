import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { successResponse, handleApiError } from "@/lib/errors";

export async function GET() {
  try {
    await requireRole("ADMIN");
    const admin = createAdminClient();
    const today = new Date().toISOString().split("T")[0];

    const [doctors, patients, todayAppts, upcomingAppts, cancelledAppts, failedNotifs] = await Promise.all([
      admin.from("doctor_profiles").select("id", { count: "exact", head: true }),
      admin.from("profiles").select("id", { count: "exact", head: true }).eq("role", "PATIENT"),
      admin.from("appointments").select("id", { count: "exact", head: true }).eq("status", "CONFIRMED").gte("start_time", today).lt("start_time", `${today}T23:59:59`),
      admin.from("appointments").select("id", { count: "exact", head: true }).in("status", ["CONFIRMED", "HELD"]).gt("start_time", new Date().toISOString()),
      admin.from("appointments").select("id", { count: "exact", head: true }).eq("status", "CANCELLED"),
      admin.from("notifications").select("id", { count: "exact", head: true }).eq("status", "FAILED"),
    ]);

    return successResponse({
      doctors: doctors.count || 0,
      patients: patients.count || 0,
      todayAppointments: todayAppts.count || 0,
      upcomingAppointments: upcomingAppts.count || 0,
      cancelledAppointments: cancelledAppts.count || 0,
      failedNotifications: failedNotifs.count || 0,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
