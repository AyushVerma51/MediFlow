import { createAdminClient } from "@/lib/supabase/admin";
import { getEmailService } from "@/lib/email/email.service";
import { emailTemplates } from "@/lib/email/templates";
import type { NotificationType, Notification } from "@/types";

// ==============================================
// Notification Service
// ==============================================

interface CreateNotificationParams {
  userId: string;
  appointmentId?: string;
  type: NotificationType;
  subject: string;
  body: string;
  recipientEmail?: string;
  idempotencyKey?: string;
  scheduledFor?: Date;
}

export async function createNotification(params: CreateNotificationParams): Promise<Notification | null> {
  const admin = createAdminClient();

  // Idempotency check
  if (params.idempotencyKey) {
    const { data: existing } = await admin
      .from("notifications")
      .select("id")
      .eq("idempotency_key", params.idempotencyKey)
      .single();

    if (existing) {
      return existing as Notification;
    }
  }

  const { data, error } = await admin
    .from("notifications")
    .insert({
      user_id: params.userId,
      appointment_id: params.appointmentId || null,
      type: params.type,
      channel: "EMAIL",
      status: "PENDING",
      subject: params.subject,
      body: params.body,
      recipient_email: params.recipientEmail,
      idempotency_key: params.idempotencyKey || null,
      scheduled_for: params.scheduledFor?.toISOString() || new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to create notification:", error);
    return null;
  }

  return data as Notification;
}

export async function sendNotification(notification: Notification): Promise<boolean> {
  const admin = createAdminClient();
  const emailService = getEmailService();

  if (!notification.recipient_email) {
    console.warn("No recipient email for notification:", notification.id);
    return false;
  }

  // Mark as processing
  await admin
    .from("notifications")
    .update({ status: "PROCESSING", attempts: notification.attempts + 1 })
    .eq("id", notification.id);

  const success = await emailService.send({
    to: notification.recipient_email,
    subject: notification.subject || "",
    html: notification.body || "",
  });

  if (success) {
    await admin
      .from("notifications")
      .update({ status: "SENT", sent_at: new Date().toISOString() })
      .eq("id", notification.id);
    return true;
  } else {
    const newStatus = notification.attempts + 1 >= notification.max_attempts ? "FAILED" : "PENDING";
    await admin
      .from("notifications")
      .update({
        status: newStatus,
        last_error: "Email send failed",
      })
      .eq("id", notification.id);
    return false;
  }
}

// ==============================================
// Notification Helpers
// ==============================================

export async function notifyBookingConfirmation(
  patientId: string,
  patientName: string,
  patientEmail: string,
  doctorName: string,
  date: string,
  time: string,
  appointmentId: string
) {
  const template = emailTemplates.bookingConfirmation(patientName, doctorName, date, time);
  return createNotification({
    userId: patientId,
    appointmentId,
    type: "BOOKING_CONFIRMATION",
    subject: template.subject,
    body: template.html,
    recipientEmail: patientEmail,
    idempotencyKey: `booking-confirm-${appointmentId}`,
  });
}

export async function notifyNewAppointmentForDoctor(
  doctorUserId: string,
  doctorName: string,
  patientName: string,
  doctorEmail: string,
  date: string,
  time: string,
  appointmentId: string
) {
  const template = emailTemplates.newAppointmentForDoctor(doctorName, patientName, date, time);
  return createNotification({
    userId: doctorUserId,
    appointmentId,
    type: "NEW_APPOINTMENT",
    subject: template.subject,
    body: template.html,
    recipientEmail: doctorEmail,
    idempotencyKey: `new-appt-doctor-${appointmentId}`,
  });
}

export async function notifyCancellation(
  patientId: string,
  patientName: string,
  patientEmail: string,
  doctorName: string,
  date: string,
  time: string,
  appointmentId: string,
  reason?: string
) {
  const template = emailTemplates.cancellation(patientName, doctorName, date, time, reason);
  return createNotification({
    userId: patientId,
    appointmentId,
    type: "CANCELLATION",
    subject: template.subject,
    body: template.html,
    recipientEmail: patientEmail,
    idempotencyKey: `cancel-${appointmentId}`,
  });
}

export async function notifyDoctorLeave(
  patientId: string,
  patientName: string,
  patientEmail: string,
  doctorName: string,
  leaveDate: string,
  appointmentId: string
) {
  const template = emailTemplates.doctorLeave(patientName, doctorName, leaveDate);
  return createNotification({
    userId: patientId,
    appointmentId,
    type: "APPOINTMENT_CANCELLED_BY_LEAVE",
    subject: template.subject,
    body: template.html,
    recipientEmail: patientEmail,
    idempotencyKey: `leave-cancel-${appointmentId}`,
  });
}
