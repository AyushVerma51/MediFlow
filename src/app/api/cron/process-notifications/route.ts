import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEmailService } from "@/lib/email/email.service";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const admin = createAdminClient();
    const emailService = getEmailService();

    const { data: notifications } = await admin
      .from("notifications")
      .select("*")
      .eq("status", "PENDING")
      .lte("scheduled_for", new Date().toISOString())
      .lt("attempts", 3)
      .order("scheduled_for", { ascending: true })
      .limit(20);

    let sent = 0;
    let failed = 0;

    for (const notif of notifications || []) {
      // Idempotency check
      if (notif.status === "SENT") continue;

      await admin.from("notifications").update({ status: "PROCESSING", attempts: notif.attempts + 1 }).eq("id", notif.id);

      const success = await emailService.send({
        to: notif.recipient_email,
        subject: notif.subject || "",
        html: notif.body || "",
      });

      if (success) {
        await admin.from("notifications").update({ status: "SENT", sent_at: new Date().toISOString() }).eq("id", notif.id);
        sent++;
      } else {
        const newStatus = notif.attempts + 1 >= notif.max_attempts ? "FAILED" : "PENDING";
        await admin.from("notifications").update({ status: newStatus, last_error: "Email send failed" }).eq("id", notif.id);
        failed++;
      }
    }

    return NextResponse.json({ processed: (notifications || []).length, sent, failed });
  } catch (error: any) {
    console.error("Notification cron failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
