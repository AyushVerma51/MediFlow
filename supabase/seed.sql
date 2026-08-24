-- ==============================================
-- SEED DATA — Demo accounts and sample data
-- Password for all demo accounts: password123
-- ==============================================

-- NOTE: In production, you would create Supabase Auth users via the Supabase dashboard
-- or the Auth API. This seed creates the profile and related data.
-- For demo purposes, use the register endpoint to create auth users, then run this.

-- ==============================================
-- PROFILES
-- ==============================================
INSERT INTO profiles (id, full_name, email, role, phone, is_active) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Admin User', 'admin@example.com', 'ADMIN', '+1-555-0100', true),
  ('a0000000-0000-0000-0000-000000000002', 'Dr. Sarah Chen', 'doctor@example.com', 'DOCTOR', '+1-555-0201', true),
  ('a0000000-0000-0000-0000-000000000003', 'Dr. James Wilson', 'doctor2@example.com', 'DOCTOR', '+1-555-0202', true),
  ('a0000000-0000-0000-0000-000000000004', 'Dr. Emily Patel', 'doctor3@example.com', 'DOCTOR', '+1-555-0203', true),
  ('a0000000-0000-0000-0000-000000000005', 'John Smith', 'patient@example.com', 'PATIENT', '+1-555-0301', true),
  ('a0000000-0000-0000-0000-000000000006', 'Maria Garcia', 'patient2@example.com', 'PATIENT', '+1-555-0302', true),
  ('a0000000-0000-0000-0000-000000000007', 'David Kim', 'patient3@example.com', 'PATIENT', '+1-555-0303', true),
  ('a0000000-0000-0000-0000-000000000008', 'Lisa Johnson', 'patient4@example.com', 'PATIENT', '+1-555-0304', true),
  ('a0000000-0000-0000-0000-000000000009', 'Robert Brown', 'patient5@example.com', 'PATIENT', '+1-555-0305', true)
ON CONFLICT (id) DO NOTHING;

-- ==============================================
-- DOCTOR PROFILES
-- ==============================================
INSERT INTO doctor_profiles (id, user_id, specialisation, qualification, experience, bio, slot_duration) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 'Cardiology', 'MD, FACC', 15, 'Board-certified cardiologist with expertise in preventive cardiology and heart failure management.', 30),
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000003', 'General Practice', 'MD, FAAFP', 10, 'Family medicine physician providing comprehensive primary care for patients of all ages.', 30),
  ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000004', 'Dermatology', 'MD, FAAD', 8, 'Dermatologist specializing in skin cancer detection, acne treatment, and cosmetic dermatology.', 45)
ON CONFLICT (id) DO NOTHING;

-- ==============================================
-- WORKING HOURS
-- ==============================================
INSERT INTO doctor_working_hours (doctor_id, day_of_week, start_time, end_time) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'MONDAY', '09:00', '17:00'),
  ('b0000000-0000-0000-0000-000000000001', 'TUESDAY', '09:00', '17:00'),
  ('b0000000-0000-0000-0000-000000000001', 'WEDNESDAY', '09:00', '17:00'),
  ('b0000000-0000-0000-0000-000000000001', 'THURSDAY', '09:00', '17:00'),
  ('b0000000-0000-0000-0000-000000000001', 'FRIDAY', '09:00', '15:00'),
  ('b0000000-0000-0000-0000-000000000002', 'MONDAY', '08:00', '16:00'),
  ('b0000000-0000-0000-0000-000000000002', 'TUESDAY', '08:00', '16:00'),
  ('b0000000-0000-0000-0000-000000000002', 'WEDNESDAY', '08:00', '16:00'),
  ('b0000000-0000-0000-0000-000000000002', 'THURSDAY', '08:00', '16:00'),
  ('b0000000-0000-0000-0000-000000000002', 'FRIDAY', '08:00', '14:00'),
  ('b0000000-0000-0000-0000-000000000003', 'MONDAY', '10:00', '18:00'),
  ('b0000000-0000-0000-0000-000000000003', 'TUESDAY', '10:00', '18:00'),
  ('b0000000-0000-0000-0000-000000000003', 'THURSDAY', '10:00', '18:00'),
  ('b0000000-0000-0000-0000-000000000003', 'FRIDAY', '10:00', '16:00')
ON CONFLICT (doctor_id, day_of_week) DO NOTHING;

-- ==============================================
-- DOCTOR LEAVES
-- ==============================================
INSERT INTO doctor_leaves (doctor_id, start_date, end_date, reason) VALUES
  ('b0000000-0000-0000-0000-000000000001', CURRENT_DATE + INTERVAL '14 days', CURRENT_DATE + INTERVAL '14 days', 'Conference attendance')
ON CONFLICT DO NOTHING;
