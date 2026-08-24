-- ==============================================
-- ATOMIC APPOINTMENT BOOKING FUNCTION
-- This is the critical concurrency protection.
-- The exclusion constraint handles the DB-level
-- double-booking prevention. This function wraps
-- the full hold→confirm flow atomically.
-- ==============================================

-- Hold a slot atomically
CREATE OR REPLACE FUNCTION hold_appointment_slot(
  p_doctor_id UUID,
  p_patient_id UUID,
  p_start_time TIMESTAMPTZ,
  p_end_time TIMESTAMPTZ,
  p_hold_minutes INTEGER DEFAULT 5
)
RETURNS JSON AS $$
DECLARE
  v_appointment_id UUID;
  v_hold_expires TIMESTAMPTZ;
  v_day_of_week day_of_week;
  v_work_start TIME;
  v_work_end TIME;
  v_slot_duration INTEGER;
BEGIN
  -- Get doctor's slot duration
  SELECT dp.slot_duration INTO v_slot_duration
  FROM doctor_profiles dp WHERE dp.id = p_doctor_id;

  IF v_slot_duration IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Doctor not found');
  END IF;

  -- Check doctor is not on leave
  IF EXISTS (
    SELECT 1 FROM doctor_leaves
    WHERE doctor_id = p_doctor_id
    AND p_start_time::date BETWEEN start_date AND end_date
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Doctor is on leave for this date');
  END IF;

  -- Check working hours (convert to day of week)
  v_day_of_week := CASE EXTRACT(DOW FROM p_start_time)
    WHEN 0 THEN 'SUNDAY'
    WHEN 1 THEN 'MONDAY'
    WHEN 2 THEN 'TUESDAY'
    WHEN 3 THEN 'WEDNESDAY'
    WHEN 4 THEN 'THURSDAY'
    WHEN 5 THEN 'FRIDAY'
    WHEN 6 THEN 'SATURDAY'
  END;

  SELECT wh.start_time, wh.end_time INTO v_work_start, v_work_end
  FROM doctor_working_hours wh
  WHERE wh.doctor_id = p_doctor_id AND wh.day_of_week = v_day_of_week;

  IF v_work_start IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Doctor is not available on this day');
  END IF;

  -- Validate slot is within working hours
  IF p_start_time::time < v_work_start OR p_end_time::time > v_work_end THEN
    RETURN json_build_object('success', false, 'error', 'Slot is outside doctor working hours');
  END IF;

  -- Calculate hold expiry
  v_hold_expires := now() + (p_hold_minutes || ' minutes')::interval;

  -- Create the hold — the exclusion constraint will reject if slot is taken
  BEGIN
    INSERT INTO appointments (doctor_id, patient_id, start_time, end_time, status, hold_expires_at)
    VALUES (p_doctor_id, p_patient_id, p_start_time, p_end_time, 'HELD', v_hold_expires)
    RETURNING id INTO v_appointment_id;

    RETURN json_build_object(
      'success', true,
      'appointment_id', v_appointment_id,
      'hold_expires_at', v_hold_expires
    );
  EXCEPTION
    WHEN exclusion_violation THEN
      RETURN json_build_object('success', false, 'error', 'SLOT_UNAVAILABLE', 'message', 'This slot is no longer available');
    WHEN unique_violation THEN
      RETURN json_build_object('success', false, 'error', 'SLOT_UNAVAILABLE', 'message', 'This slot is no longer available');
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Confirm a held appointment
CREATE OR REPLACE FUNCTION confirm_appointment(
  p_appointment_id UUID,
  p_patient_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_appointment RECORD;
BEGIN
  -- Lock the appointment row
  SELECT * INTO v_appointment
  FROM appointments
  WHERE id = p_appointment_id
  FOR UPDATE;

  IF v_appointment IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Appointment not found');
  END IF;

  IF v_appointment.patient_id != p_patient_id THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  IF v_appointment.status != 'HELD' THEN
    RETURN json_build_object('success', false, 'error', 'Appointment is not in HELD status');
  END IF;

  IF v_appointment.hold_expires_at < now() THEN
    -- Mark as expired
    UPDATE appointments SET status = 'EXPIRED' WHERE id = p_appointment_id;
    RETURN json_build_object('success', false, 'error', 'HOLD_EXPIRED', 'message', 'Your hold has expired. Please select another slot.');
  END IF;

  -- Confirm the appointment
  UPDATE appointments
  SET status = 'CONFIRMED', hold_expires_at = NULL, updated_at = now()
  WHERE id = p_appointment_id;

  RETURN json_build_object('success', true, 'appointment_id', p_appointment_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cancel an appointment
CREATE OR REPLACE FUNCTION cancel_appointment(
  p_appointment_id UUID,
  p_user_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_appointment RECORD;
BEGIN
  SELECT * INTO v_appointment
  FROM appointments
  WHERE id = p_appointment_id
  FOR UPDATE;

  IF v_appointment IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Appointment not found');
  END IF;

  -- Check authorization
  IF NOT (
    v_appointment.patient_id = p_user_id OR
    v_appointment.doctor_id IN (SELECT id FROM doctor_profiles WHERE user_id = p_user_id) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = p_user_id AND role = 'ADMIN')
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  IF v_appointment.status NOT IN ('HELD', 'CONFIRMED') THEN
    RETURN json_build_object('success', false, 'error', 'Cannot cancel appointment in current status');
  END IF;

  UPDATE appointments
  SET status = 'CANCELLED',
      cancellation_reason = p_reason,
      hold_expires_at = NULL,
      updated_at = now()
  WHERE id = p_appointment_id;

  RETURN json_build_object('success', true, 'appointment_id', p_appointment_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Expire all held slots past their expiry time
CREATE OR REPLACE FUNCTION expire_held_slots()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE appointments
  SET status = 'EXPIRED', updated_at = now()
  WHERE status = 'HELD' AND hold_expires_at < now();

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Complete an appointment (doctor action)
CREATE OR REPLACE FUNCTION complete_appointment(
  p_appointment_id UUID,
  p_doctor_user_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_appointment RECORD;
BEGIN
  SELECT * INTO v_appointment
  FROM appointments
  WHERE id = p_appointment_id
  FOR UPDATE;

  IF v_appointment IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Appointment not found');
  END IF;

  IF NOT v_appointment.doctor_id IN (SELECT id FROM doctor_profiles WHERE user_id = p_doctor_user_id) THEN
    RETURN json_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  IF v_appointment.status != 'CONFIRMED' THEN
    RETURN json_build_object('success', false, 'error', 'Cannot complete appointment in current status');
  END IF;

  UPDATE appointments
  SET status = 'COMPLETED', updated_at = now()
  WHERE id = p_appointment_id;

  RETURN json_build_object('success', true, 'appointment_id', p_appointment_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
