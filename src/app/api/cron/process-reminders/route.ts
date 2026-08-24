import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEmailService } from "@/lib/email/email.service";
import { emailTemplates } from "@/lib/email/templates";
import { format } from "date-fns";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const admin = createAdminClient();
    const emailService = getEmailService();

    const { data: reminders } = await admin
      .from("medication_reminders")
      .select("*, patient:profiles!medication_reminders_patient_id_fkey(full_name, email)")
      .eq("status", "PENDING")
      .lte("scheduled_for", new Date().toISOString())
      .order("scheduled_for", { ascending: true })
      .limit(20);

    let sent = 0;

    for (const reminder of reminders || []) {
      if (!reminder.patient?.email) continue;

      const timeStr = format(new Date(reminder.scheduled_for), "h:mm a");
      const template = emailTemplates.medicationReminder(
        reminder.patient.full_name,
        reminder.medication_name,
        reminder.dosage,
        timeStr,
      );

      const success = await emailService.send({
        to: reminder.patient.email,
        subject: template.subject,
        html: template.html,
      });

      if (success) {
        await admin.from("medication_reminders").update({ status: "SENT" }).eq("id", reminder.id);
        sent++;
      } else {
        await admin.from("medication_reminders").update({ status: "FAILED" }).eq("id", reminder.id);
      }
    }

    return NextResponse.json({ processed: (reminders || []).length, sent });
  } catch (error: any) {
    console.error("Reminder cron failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
