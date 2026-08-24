import { z } from "zod";

// ==============================================
// Auth Validators
// ==============================================

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  role: z.enum(["PATIENT", "DOCTOR", "ADMIN"]).default("PATIENT"),
  phone: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// ==============================================
// Doctor Validators
// ==============================================

export const createDoctorSchema = z.object({
  user_id: z.string().uuid(),
  specialisation: z.string().min(2, "Specialisation is required"),
  qualification: z.string().min(2, "Qualification is required"),
  experience: z.number().int().min(0),
  bio: z.string().optional(),
  slot_duration: z.number().int().min(10).max(120).default(30),
});

export const updateDoctorSchema = z.object({
  specialisation: z.string().min(2).optional(),
  qualification: z.string().min(2).optional(),
  experience: z.number().int().min(0).optional(),
  bio: z.string().optional(),
  slot_duration: z.number().int().min(10).max(120).optional(),
});

export const workingHoursSchema = z.object({
  day_of_week: z.enum(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"]),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, "Time must be in HH:MM format"),
  end_time: z.string().regex(/^\d{2}:\d{2}$/, "Time must be in HH:MM format"),
}).refine(data => data.start_time < data.end_time, {
  message: "Start time must be before end time",
});

// ==============================================
// Leave Validators
// ==============================================

export const createLeaveSchema = z.object({
  doctor_id: z.string().uuid(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().optional(),
}).refine(data => data.start_date <= data.end_date, {
  message: "Start date must be before or equal to end date",
});

// ==============================================
// Appointment Validators
// ==============================================

export const holdSlotSchema = z.object({
  doctor_id: z.string().uuid(),
  start_time: z.string().datetime(),
  end_time: z.string().datetime(),
});

export const bookAppointmentSchema = z.object({
  appointment_id: z.string().uuid(),
  symptoms: z.object({
    chief_complaint: z.string().min(1, "Chief complaint is required").max(500),
    symptoms: z.string().min(1, "Symptoms are required").max(2000),
    duration: z.string().max(200).optional(),
    severity: z.string().max(50).optional(),
    additional_information: z.string().max(2000).optional(),
  }),
});

export const rescheduleSchema = z.object({
  new_start_time: z.string().datetime(),
  new_end_time: z.string().datetime(),
});

// ==============================================
// Consultation Validators
// ==============================================

export const consultationSchema = z.object({
  clinical_notes: z.string().min(1, "Clinical notes are required"),
  diagnosis: z.string().optional(),
  treatment_plan: z.string().optional(),
  follow_up_instructions: z.string().optional(),
});

// ==============================================
// Prescription Validators
// ==============================================

export const medicationSchema = z.object({
  medication_name: z.string().min(1, "Medication name is required"),
  dosage: z.string().min(1, "Dosage is required"),
  frequency: z.string().min(1, "Frequency is required"),
  duration: z.string().min(1, "Duration is required"),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  instructions: z.string().optional(),
});

export const prescriptionSchema = z.object({
  medications: z.array(medicationSchema).min(1, "At least one medication is required"),
});

// ==============================================
// Query Validators
// ==============================================

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const doctorSearchSchema = z.object({
  specialisation: z.string().optional(),
  search: z.string().optional(),
  ...paginationSchema.shape,
});
