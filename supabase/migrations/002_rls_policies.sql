-- ==============================================
-- ROW LEVEL SECURITY POLICIES
-- ==============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_working_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_symptoms ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_previsit_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescription_medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_visit_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper: get user role from JWT
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS user_role AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::json->>'role',
    ''
  )::user_role;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper: get user ID from JWT
CREATE OR REPLACE FUNCTION auth.uid()
RETURNS UUID AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::json->>'sub',
    '00000000-0000-0000-0000-000000000000'
  )::uuid;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ==============================================
-- PROFILES
-- ==============================================

-- Everyone can read profiles (for doctor search, etc.)
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own profile (on registration)
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Admin can manage all profiles
CREATE POLICY "Admins can manage all profiles"
  ON profiles FOR ALL
  USING (auth.user_role() = 'ADMIN');

-- ==============================================
-- DOCTOR PROFILES
-- ==============================================

-- Everyone can read doctor profiles (for search)
CREATE POLICY "Doctor profiles are viewable by everyone"
  ON doctor_profiles FOR SELECT
  USING (true);

-- Admin can manage doctor profiles
CREATE POLICY "Admins can manage doctor profiles"
  ON doctor_profiles FOR ALL
  USING (auth.user_role() = 'ADMIN');

-- Doctors can update their own profile
CREATE POLICY "Doctors can update own profile"
  ON doctor_profiles FOR UPDATE
  USING (
    auth.user_role() = 'DOCTOR' AND
    user_id = auth.uid()
  );

-- ==============================================
-- DOCTOR WORKING HOURS
-- ==============================================

-- Everyone can read working hours (for slot generation)
CREATE POLICY "Working hours are viewable by everyone"
  ON doctor_working_hours FOR SELECT
  USING (true);

-- Admin can manage working hours
CREATE POLICY "Admins can manage working hours"
  ON doctor_working_hours FOR ALL
  USING (auth.user_role() = 'ADMIN');

-- ==============================================
-- DOCTOR LEAVES
-- ==============================================

-- Everyone can read doctor leaves (for slot generation)
CREATE POLICY "Doctor leaves are viewable by everyone"
  ON doctor_leaves FOR SELECT
  USING (true);

-- Admin can manage leaves
CREATE POLICY "Admins can manage doctor leaves"
  ON doctor_leaves FOR ALL
  USING (auth.user_role() = 'ADMIN');

-- ==============================================
-- APPOINTMENTS
-- ==============================================

-- Patients can view own appointments
CREATE POLICY "Patients can view own appointments"
  ON appointments FOR SELECT
  USING (
    auth.user_role() = 'PATIENT' AND
    patient_id = auth.uid()
  );

-- Doctors can view appointments where they are the doctor
CREATE POLICY "Doctors can view own appointments"
  ON appointments FOR SELECT
  USING (
    auth.user_role() = 'DOCTOR' AND
    doctor_id IN (SELECT id FROM doctor_profiles WHERE user_id = auth.uid())
  );

-- Admin can view all appointments
CREATE POLICY "Admins can view all appointments"
  ON appointments FOR SELECT
  USING (auth.user_role() = 'ADMIN');

-- Patients can create appointments (booking)
CREATE POLICY "Patients can book appointments"
  ON appointments FOR INSERT
  WITH CHECK (
    auth.user_role() = 'PATIENT' AND
    patient_id = auth.uid()
  );

-- Patients can update own appointments (cancel, reschedule)
CREATE POLICY "Patients can update own appointments"
  ON appointments FOR UPDATE
  USING (
    auth.user_role() = 'PATIENT' AND
    patient_id = auth.uid()
  );

-- Doctors can update appointments (complete)
CREATE POLICY "Doctors can update their appointments"
  ON appointments FOR UPDATE
  USING (
    auth.user_role() = 'DOCTOR' AND
    doctor_id IN (SELECT id FROM doctor_profiles WHERE user_id = auth.uid())
  );

-- Admin can manage all appointments
CREATE POLICY "Admins can manage all appointments"
  ON appointments FOR ALL
  USING (auth.user_role() = 'ADMIN');

-- ==============================================
-- APPOINTMENT SYMPTOMS
-- ==============================================

-- Patients can read own symptoms
CREATE POLICY "Patients can view own symptoms"
  ON appointment_symptoms FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM appointments
      WHERE appointments.id = appointment_id
      AND appointments.patient_id = auth.uid()
    )
  );

-- Doctors can read symptoms for their appointments
CREATE POLICY "Doctors can view symptoms for own appointments"
  ON appointment_symptoms FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM appointments
      WHERE appointments.id = appointment_id
      AND appointments.doctor_id IN (SELECT id FROM doctor_profiles WHERE user_id = auth.uid())
    )
  );

-- Patients can create symptoms for own appointments
CREATE POLICY "Patients can add symptoms to own appointments"
  ON appointment_symptoms FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM appointments
      WHERE appointments.id = appointment_id
      AND appointments.patient_id = auth.uid()
    )
  );

-- Admin can view all symptoms
CREATE POLICY "Admins can view all symptoms"
  ON appointment_symptoms FOR SELECT
  USING (auth.user_role() = 'ADMIN');

-- ==============================================
-- AI PRE-VISIT SUMMARIES
-- ==============================================

-- Doctors can read summaries for their appointments
CREATE POLICY "Doctors can view AI summaries for own appointments"
  ON ai_previsit_summaries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM appointments
      WHERE appointments.id = appointment_id
      AND appointments.doctor_id IN (SELECT id FROM doctor_profiles WHERE user_id = auth.uid())
    )
  );

-- Admin can view all summaries
CREATE POLICY "Admins can view all AI summaries"
  ON ai_previsit_summaries FOR SELECT
  USING (auth.user_role() = 'ADMIN');

-- ==============================================
-- CLINICAL NOTES
-- ==============================================

-- Doctors can read/write their own clinical notes
CREATE POLICY "Doctors can manage own clinical notes"
  ON clinical_notes FOR ALL
  USING (
    auth.user_role() = 'DOCTOR' AND
    doctor_id IN (SELECT id FROM doctor_profiles WHERE user_id = auth.uid())
  );

-- Patients can read clinical notes for their appointments
CREATE POLICY "Patients can view own clinical notes"
  ON clinical_notes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM appointments
      WHERE appointments.id = appointment_id
      AND appointments.patient_id = auth.uid()
    )
  );

-- Admin can view all
CREATE POLICY "Admins can view all clinical notes"
  ON clinical_notes FOR SELECT
  USING (auth.user_role() = 'ADMIN');

-- ==============================================
-- PRESCRIPTIONS
-- ==============================================

-- Patients can view own prescriptions
CREATE POLICY "Patients can view own prescriptions"
  ON prescriptions FOR SELECT
  USING (
    auth.user_role() = 'PATIENT' AND
    patient_id = auth.uid()
  );

-- Doctors can manage prescriptions for their appointments
CREATE POLICY "Doctors can manage prescriptions for own appointments"
  ON prescriptions FOR ALL
  USING (
    auth.user_role() = 'DOCTOR' AND
    doctor_id IN (SELECT id FROM doctor_profiles WHERE user_id = auth.uid())
  );

-- Admin can view all prescriptions
CREATE POLICY "Admins can view all prescriptions"
  ON prescriptions FOR SELECT
  USING (auth.user_role() = 'ADMIN');

-- ==============================================
-- PRESCRIPTION MEDICATIONS
-- ==============================================

-- Read access through prescriptions
CREATE POLICY "View medications through prescriptions"
  ON prescription_medications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM prescriptions
      WHERE prescriptions.id = prescription_id
      AND (
        prescriptions.patient_id = auth.uid() OR
        prescriptions.doctor_id IN (SELECT id FROM doctor_profiles WHERE user_id = auth.uid()) OR
        auth.user_role() = 'ADMIN'
      )
    )
  );

CREATE POLICY "Doctors can manage medications for own prescriptions"
  ON prescription_medications FOR ALL
  USING (
    auth.user_role() = 'DOCTOR' AND
    EXISTS (
      SELECT 1 FROM prescriptions
      WHERE prescriptions.id = prescription_id
      AND prescriptions.doctor_id IN (SELECT id FROM doctor_profiles WHERE user_id = auth.uid())
    )
  );

-- ==============================================
-- POST-VISIT SUMMARIES
-- ==============================================

CREATE POLICY "Patients can view own post-visit summaries"
  ON post_visit_summaries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM appointments
      WHERE appointments.id = appointment_id
      AND appointments.patient_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all post-visit summaries"
  ON post_visit_summaries FOR SELECT
  USING (auth.user_role() = 'ADMIN');

-- ==============================================
-- CALENDAR CONNECTIONS
-- ==============================================

CREATE POLICY "Users can view own calendar connections"
  ON calendar_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own calendar connections"
  ON calendar_connections FOR ALL
  USING (auth.uid() = user_id);

-- ==============================================
-- CALENDAR EVENTS
-- ==============================================

CREATE POLICY "Users can view calendar events for own appointments"
  ON calendar_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM appointments
      WHERE appointments.id = appointment_id
      AND (
        appointments.patient_id = auth.uid() OR
        appointments.doctor_id IN (SELECT id FROM doctor_profiles WHERE user_id = auth.uid()) OR
        auth.user_role() = 'ADMIN'
      )
    )
  );

-- ==============================================
-- NOTIFICATIONS
-- ==============================================

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all notifications"
  ON notifications FOR SELECT
  USING (auth.user_role() = 'ADMIN');

-- ==============================================
-- MEDICATION REMINDERS
-- ==============================================

CREATE POLICY "Patients can view own medication reminders"
  ON medication_reminders FOR SELECT
  USING (
    auth.user_role() = 'PATIENT' AND
    patient_id = auth.uid()
  );

-- ==============================================
-- AUDIT LOGS
-- ==============================================

CREATE POLICY "Admins can view all audit logs"
  ON audit_logs FOR SELECT
  USING (auth.user_role() = 'ADMIN');
