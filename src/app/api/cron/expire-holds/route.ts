import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("expire_held_slots");
    if (error) throw error;
    return NextResponse.json({ expired: data || 0 });
  } catch (error: any) {
    console.error("Expire holds cron failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
