-- ==============================================
-- MediFlow — Initial Schema
-- ==============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================
-- ENUMS
-- ==============================================

CREATE TYPE user_role AS ENUM ('PATIENT', 'DOCTOR', 'ADMIN');
CREATE TYPE appointment_status AS ENUM ('HELD', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'EXPIRED');
CREATE TYPE day_of_week AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');
CREATE TYPE notification_status AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'FAILED');
CREATE TYPE notification_channel AS ENUM ('EMAIL', 'IN_APP');
CREATE TYPE notification_type AS ENUM (
  'BOOKING_CONFIRMATION',
  'APPOINTMENT_REMINDER',
  'CANCELLATION',
  'RESCHEDULE',
  'DOCTOR_LEAVE',
  'MEDICATION_REMINDER',
  'POST_VISIT_SUMMARY',
  'NEW_APPOINTMENT',
  'PATIENT_SYMPTOM',
  'APPOINTMENT_CANCELLED_BY_LEAVE'
);
CREATE TYPE urgency_level AS ENUM ('LOW', 'MEDIUM', 'HIGH');
CREATE TYPE sync_status AS ENUM ('PENDING', 'SYNCED', 'FAILED', 'RETRYING');

-- ==============================================
-- PROFILES (extends Supabase auth.users)
-- ==============================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'PATIENT',
  phone TEXT,
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_email ON profiles(email);

-- ==============================================
-- DOCTOR PROFILES
-- ==============================================

CREATE TABLE doctor_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  specialisation TEXT NOT NULL,
  qualification TEXT NOT NULL,
  experience INTEGER NOT NULL DEFAULT 0,
  bio TEXT,
  slot_duration INTEGER NOT NULL DEFAULT 30, -- minutes
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_doctor_profiles_specialisation ON doctor_profiles(specialisation);

-- ==============================================
-- DOCTOR WORKING HOURS
-- ==============================================

CREATE TABLE doctor_working_hours (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id UUID NOT NULL REFERENCES doctor_profiles(id) ON DELETE CASCADE,
  day_of_week day_of_week NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  CONSTRAINT valid_time_range CHECK (start_time < end_time),
  CONSTRAINT unique_doctor_day UNIQUE (doctor_id, day_of_week)
);

CREATE INDEX idx_working_hours_doctor ON doctor_working_hours(doctor_id);

-- ==============================================
-- DOCTOR LEAVES
-- ==============================================

CREATE TABLE doctor_leaves (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id UUID NOT NULL REFERENCES doctor_profiles(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_leave_dates CHECK (start_date <= end_date),
  CONSTRAINT no_overlapping_leave EXCLUDE USING gist (
    doctor_id WITH =,
    daterange(start_date, end_date, '[]') WITH &&
  )
);

CREATE INDEX idx_doctor_leaves_doctor_date ON doctor_leaves(doctor_id, start_date, end_date);

-- ==============================================
-- APPOINTMENTS (with concurrency protection)
-- ==============================================

CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id UUID NOT NULL REFERENCES doctor_profiles(id) ON DELETE RESTRICT,
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status appointment_status NOT NULL DEFAULT 'HELD',
  hold_expires_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  google_event_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_appointment_times CHECK (start_time < end_time),
  CONSTRAINT hold_must_have_expiry CHECK (
    (status = 'HELD' AND hold_expires_at IS NOT NULL) OR
    (status != 'HELD')
  ),
  -- CRITICAL: Exclusion constraint for double-booking prevention
  -- Only active (non-cancelled, non-expired) appointments block slots
  EXCLUDE USING gist (
    doctor_id WITH =,
    tstzrange(start_time, end_time) WITH &&
  ) WHERE (status IN ('HELD', 'CONFIRMED'))
);

CREATE INDEX idx_appointments_doctor_start ON appointments(doctor_id, start_time);
CREATE INDEX idx_appointments_patient_start ON appointments(patient_id, start_time);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_hold_expires ON appointments(hold_expires_at) WHERE status = 'HELD';

-- ==============================================
-- APPOINTMENT SYMPTOMS
-- ==============================================

CREATE TABLE appointment_symptoms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID NOT NULL UNIQUE REFERENCES appointments(id) ON DELETE CASCADE,
  chief_complaint TEXT NOT NULL,
  symptoms TEXT NOT NULL,
  duration TEXT,
  severity TEXT,
  additional_information TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================
-- AI PRE-VISIT SUMMARIES
-- ==============================================

CREATE TABLE ai_previsit_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID NOT NULL UNIQUE REFERENCES appointments(id) ON DELETE CASCADE,
  urgency urgency_level NOT NULL DEFAULT 'LOW',
  chief_complaint TEXT,
  suggested_questions JSONB,
  raw_response TEXT,
  is_available BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================
-- CLINICAL NOTES
-- ==============================================

CREATE TABLE clinical_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID NOT NULL UNIQUE REFERENCES appointments(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES doctor_profiles(id) ON DELETE RESTRICT,
  clinical_notes TEXT NOT NULL,
  diagnosis TEXT,
  treatment_plan TEXT,
  follow_up_instructions TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================
-- PRESCRIPTIONS
-- ==============================================

CREATE TABLE prescriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES doctor_profiles(id) ON DELETE RESTRICT,
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_prescriptions_patient ON prescriptions(patient_id);
CREATE INDEX idx_prescriptions_doctor ON prescriptions(doctor_id);

-- ==============================================
-- PRESCRIPTION MEDICATIONS
-- ==============================================

CREATE TABLE prescription_medications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
  medication_name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  duration TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  instructions TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_medications_prescription ON prescription_medications(prescription_id);

-- ==============================================
-- POST-VISIT SUMMARIES (AI-generated)
-- ==============================================

CREATE TABLE post_visit_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID NOT NULL UNIQUE REFERENCES appointments(id) ON DELETE CASCADE,
  summary TEXT,
  medications JSONB,
  follow_up_steps JSONB,
  raw_response TEXT,
  is_available BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================
-- CALENDAR CONNECTIONS
-- ==============================================

CREATE TABLE calendar_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  calendar_id TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_calendar_connections_user ON calendar_connections(user_id) WHERE is_active = true;

-- ==============================================
-- CALENDAR EVENTS
-- ==============================================

CREATE TABLE calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id UUID NOT NULL UNIQUE REFERENCES appointments(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES calendar_connections(id) ON DELETE CASCADE,
  google_event_id TEXT,
  sync_status sync_status NOT NULL DEFAULT 'PENDING',
  last_error TEXT,
  action TEXT NOT NULL DEFAULT 'CREATE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_calendar_events_status ON calendar_events(sync_status) WHERE sync_status IN ('PENDING', 'FAILED', 'RETRYING');

-- ==============================================
-- NOTIFICATIONS
-- ==============================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  type notification_type NOT NULL,
  channel notification_channel NOT NULL DEFAULT 'EMAIL',
  status notification_status NOT NULL DEFAULT 'PENDING',
  subject TEXT,
  body TEXT,
  recipient_email TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  last_error TEXT,
  idempotency_key TEXT UNIQUE,
  scheduled_for TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_status ON notifications(status, scheduled_for) WHERE status IN ('PENDING', 'FAILED');
CREATE INDEX idx_notifications_user ON notifications(user_id);

-- ==============================================
-- MEDICATION REMINDERS
-- ==============================================

CREATE TABLE medication_reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  medication_name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  status notification_status NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_medication_reminders_pending ON medication_reminders(scheduled_for) WHERE status = 'PENDING';
CREATE INDEX idx_medication_reminders_patient ON medication_reminders(patient_id);
-- Prevent duplicate reminders
CREATE UNIQUE INDEX idx_medication_reminders_unique ON medication_reminders(prescription_id, scheduled_for);

-- ==============================================
-- AUDIT LOGS
-- ==============================================

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);

-- ==============================================
-- UPDATED_AT TRIGGER
-- ==============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_doctor_profiles_updated_at
  BEFORE UPDATE ON doctor_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clinical_notes_updated_at
  BEFORE UPDATE ON clinical_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_connections_updated_at
  BEFORE UPDATE ON calendar_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_events_updated_at
  BEFORE UPDATE ON calendar_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
