import { createAdminClient } from "@/lib/supabase/admin";

// ==============================================
// Audit Log Service
// ==============================================

type AuditAction =
  | "DOCTOR_CREATED"
  | "DOCTOR_UPDATED"
  | "DOCTOR_DEACTIVATED"
  | "DOCTOR_LEAVE_CREATED"
  | "DOCTOR_LEAVE_DELETED"
  | "WORKING_HOURS_UPDATED"
  | "APPOINTMENT_BOOKED"
  | "APPOINTMENT_CANCELLED"
  | "APPOINTMENT_RESCHEDULED"
  | "APPOINTMENT_COMPLETED"
  | "APPOINTMENT_HELD"
  | "CLINICAL_NOTES_CREATED"
  | "PRESCRIPTION_CREATED"
  | "POST_VISIT_SUMMARY_GENERATED"
  | "CALENDAR_CONNECTED"
  | "CALENDAR_DISCONNECTED";

interface AuditLogParams {
  actorId?: string;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}

export async function createAuditLog(params: AuditLogParams): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.from("audit_logs").insert({
      actor_id: params.actorId || null,
      action: params.action,
      entity_type: params.entityType,
      entity_id: params.entityId || null,
      metadata: params.metadata ? JSON.stringify(params.metadata) : null,
    });
  } catch (error) {
    // Audit log failures should not break the main flow
    console.error("Failed to create audit log:", error);
  }
}
