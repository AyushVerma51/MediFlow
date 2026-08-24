// ==============================================
// Database Types — mirrors PostgreSQL schema
// ==============================================

export type UserRole = "PATIENT" | "DOCTOR" | "ADMIN";
export type AppointmentStatus = "HELD" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "EXPIRED";
export type DayOfWeek = "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";
export type NotificationStatus = "PENDING" | "PROCESSING" | "SENT" | "FAILED";
export type NotificationChannel = "EMAIL" | "IN_APP";
export type UrgencyLevel = "LOW" | "MEDIUM" | "HIGH";
export type SyncStatus = "PENDING" | "SYNCED" | "FAILED" | "RETRYING";

export type NotificationType =
  | "BOOKING_CONFIRMATION"
  | "APPOINTMENT_REMINDER"
  | "CANCELLATION"
  | "RESCHEDULE"
  | "DOCTOR_LEAVE"
  | "MEDICATION_REMINDER"
  | "POST_VISIT_SUMMARY"
  | "NEW_APPOINTMENT"
  | "PATIENT_SYMPTOM"
  | "APPOINTMENT_CANCELLED_BY_LEAVE";

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DoctorProfile {
  id: string;
  user_id: string;
  specialisation: string;
  qualification: string;
  experience: number;
  bio: string | null;
  slot_duration: number;
  created_at: string;
  updated_at: string;
  profile?: Profile;
  doctor_working_hours?: DoctorWorkingHour[];
}

export interface DoctorWorkingHour {
  id: string;
  doctor_id: string;
  day_of_week: DayOfWeek;
  start_time: string;
  end_time: string;
}

export interface DoctorLeave {
  id: string;
  doctor_id: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  created_at: string;
}

export interface Appointment {
  id: string;
  doctor_id: string;
  patient_id: string;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  hold_expires_at: string | null;
  cancellation_reason: string | null;
  google_event_id: string | null;
  created_at: string;
  updated_at: string;
  doctor?: DoctorProfile;
  patient?: Profile;
  appointment_symptoms?: AppointmentSymptom;
  ai_previsit_summaries?: AIPrevisitSummary;
  clinical_notes?: ClinicalNote;
  prescriptions?: Prescription[];
  post_visit_summaries?: PostVisitSummary;
}

export interface AppointmentSymptom {
  id: string;
  appointment_id: string;
  chief_complaint: string;
  symptoms: string;
  duration: string | null;
  severity: string | null;
  additional_information: string | null;
  created_at: string;
}

export interface AIPrevisitSummary {
  id: string;
  appointment_id: string;
  urgency: UrgencyLevel;
  chief_complaint: string | null;
  suggested_questions: string[];
  raw_response: string | null;
  is_available: boolean;
  created_at: string;
}

export interface ClinicalNote {
  id: string;
  appointment_id: string;
  doctor_id: string;
  clinical_notes: string;
  diagnosis: string | null;
  treatment_plan: string | null;
  follow_up_instructions: string | null;
  created_at: string;
  updated_at: string;
}

export interface Prescription {
  id: string;
  appointment_id: string;
  doctor_id: string;
  patient_id: string;
  created_at: string;
  prescription_medications?: PrescriptionMedication[];
}

export interface PrescriptionMedication {
  id: string;
  prescription_id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  start_date: string;
  end_date: string;
  instructions: string | null;
  created_at: string;
}

export interface PostVisitSummary {
  id: string;
  appointment_id: string;
  summary: string | null;
  medications: { name: string; instructions: string }[] | null;
  follow_up_steps: string[] | null;
  raw_response: string | null;
  is_available: boolean;
  created_at: string;
}

export interface CalendarConnection {
  id: string;
  user_id: string;
  access_token: string | null;
  refresh_token: string | null;
  token_expires_at: string | null;
  calendar_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CalendarEvent {
  id: string;
  appointment_id: string;
  connection_id: string;
  google_event_id: string | null;
  sync_status: SyncStatus;
  last_error: string | null;
  action: string;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  appointment_id: string | null;
  type: NotificationType;
  channel: NotificationChannel;
  status: NotificationStatus;
  subject: string | null;
  body: string | null;
  recipient_email: string | null;
  attempts: number;
  max_attempts: number;
  last_error: string | null;
  idempotency_key: string | null;
  scheduled_for: string;
  sent_at: string | null;
  created_at: string;
}

export interface MedicationReminder {
  id: string;
  prescription_id: string;
  patient_id: string;
  appointment_id: string | null;
  medication_name: string;
  dosage: string;
  scheduled_for: string;
  status: NotificationStatus;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

// ==============================================
// API Response Types
// ==============================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ==============================================
// Slot Types
// ==============================================

export interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
}
