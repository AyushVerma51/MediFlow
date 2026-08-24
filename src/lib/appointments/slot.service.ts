import { createAdminClient } from "@/lib/supabase/admin";
import type { TimeSlot, DayOfWeek } from "@/types";

// ==============================================
// Slot Generation Service
// ==============================================

export async function generateSlots(
  doctorId: string,
  date: string
): Promise<TimeSlot[]> {
  const admin = createAdminClient();

  // 1. Get doctor profile for slot duration
  const { data: doctor } = await admin
    .from("doctor_profiles")
    .select("slot_duration")
    .eq("id", doctorId)
    .single();

  if (!doctor) return [];

  const slotDuration = doctor.slot_duration;

  // 2. Get day of week
  const dateObj = new Date(date + "T12:00:00Z");
  const dayIndex = dateObj.getUTCDay();
  const days: DayOfWeek[] = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
  const dayOfWeek = days[dayIndex];

  // 3. Get working hours for this day
  const { data: workingHours } = await admin
    .from("doctor_working_hours")
    .select("start_time, end_time")
    .eq("doctor_id", doctorId)
    .eq("day_of_week", dayOfWeek)
    .single();

  if (!workingHours) return []; // Doctor doesn't work this day

  // 4. Check for doctor leave
  const { data: leaves } = await admin
    .from("doctor_leaves")
    .select("id")
    .eq("doctor_id", doctorId)
    .lte("start_date", date)
    .gte("end_date", date);

  if (leaves && leaves.length > 0) return []; // Doctor is on leave

  // 5. Get existing appointments (HELD or CONFIRMED) for this date
  const startOfDay = `${date}T00:00:00Z`;
  const endOfDay = `${date}T23:59:59Z`;

  const { data: appointments } = await admin
    .from("appointments")
    .select("start_time, end_time")
    .eq("doctor_id", doctorId)
    .in("status", ["HELD", "CONFIRMED"])
    .gte("start_time", startOfDay)
    .lte("start_time", endOfDay);

  // 6. Generate all possible slots
  const slots: TimeSlot[] = [];
  const [workStartHour, workStartMin] = workingHours.start_time.split(":").map(Number);
  const [workEndHour, workEndMin] = workingHours.end_time.split(":").map(Number);

  const workStartMinutes = workStartHour * 60 + workStartMin;
  const workEndMinutes = workEndHour * 60 + workEndMin;

  const bookedSlots = (appointments || []).map((a) => ({
    start: new Date(a.start_time).getTime(),
    end: new Date(a.end_time).getTime(),
  }));

  let currentMinutes = workStartMinutes;

  while (currentMinutes + slotDuration <= workEndMinutes) {
    const slotStart = new Date(`${date}T00:00:00Z`);
    slotStart.setUTCHours(Math.floor(currentMinutes / 60), currentMinutes % 60, 0, 0);

    const slotEnd = new Date(slotStart.getTime() + slotDuration * 60 * 1000);

    const slotStartMs = slotStart.getTime();
    const slotEndMs = slotEnd.getTime();

    // Check if slot overlaps with any booked appointment
    const isBooked = bookedSlots.some(
      (b) => slotStartMs < b.end && slotEndMs > b.start
    );

    slots.push({
      startTime: slotStart.toISOString(),
      endTime: slotEnd.toISOString(),
      available: !isBooked,
    });

    currentMinutes += slotDuration;
  }

  return slots;
}
