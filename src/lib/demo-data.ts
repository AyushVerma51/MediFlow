import { format, addDays, subDays } from "date-fns";

const today = new Date();
const todayStr = format(today, "yyyy-MM-dd");

// ==============================================
// Demo Profiles
// ==============================================

export const demoProfiles = {
  PATIENT: {
    id: "demo-patient-001",
    full_name: "Alex Johnson",
    email: "demo-patient@mediflow.local",
    role: "PATIENT" as const,
    phone: "+1-555-0101",
    avatar_url: null,
    is_active: true,
    created_at: "2024-01-15T00:00:00Z",
    updated_at: "2024-01-15T00:00:00Z",
  },
  DOCTOR: {
    id: "demo-doctor-001",
    full_name: "Dr. Sarah Chen",
    email: "demo-doctor@mediflow.local",
    role: "DOCTOR" as const,
    phone: "+1-555-0201",
    avatar_url: null,
    is_active: true,
    created_at: "2023-06-01T00:00:00Z",
    updated_at: "2023-06-01T00:00:00Z",
  },
  ADMIN: {
    id: "demo-admin-001",
    full_name: "Jordan Rivera",
    email: "demo-admin@mediflow.local",
    role: "ADMIN" as const,
    phone: "+1-555-0301",
    avatar_url: null,
    is_active: true,
    created_at: "2023-01-01T00:00:00Z",
    updated_at: "2023-01-01T00:00:00Z",
  },
};

export const demoUser = {
  id: "demo-user-001",
  email: "demo@mediflow.local",
  aud: "authenticated",
  role: "authenticated",
  created_at: "2024-01-15T00:00:00Z",
};

// ==============================================
// Demo Doctors
// ==============================================

export const demoDoctors = [
  {
    id: "doc-001",
    user_id: "user-doc-001",
    specialisation: "Cardiology",
    qualification: "MD, FACC — Johns Hopkins",
    experience: 15,
    bio: "Board-certified cardiologist with expertise in preventive cardiology, heart failure management, and cardiac imaging. Published 30+ peer-reviewed papers.",
    slot_duration: 30,
    created_at: "2023-06-01T00:00:00Z",
    updated_at: "2023-06-01T00:00:00Z",
    profile: {
      id: "user-doc-001",
      full_name: "Sarah Chen",
      email: "dr.chen@mediflow.local",
      avatar_url: null,
      phone: "+1-555-0201",
    },
    doctor_working_hours: [
      {
        id: "wh-001",
        doctor_id: "doc-001",
        day_of_week: "MONDAY",
        start_time: "09:00:00",
        end_time: "17:00:00",
      },
      {
        id: "wh-002",
        doctor_id: "doc-001",
        day_of_week: "TUESDAY",
        start_time: "09:00:00",
        end_time: "17:00:00",
      },
      {
        id: "wh-003",
        doctor_id: "doc-001",
        day_of_week: "WEDNESDAY",
        start_time: "09:00:00",
        end_time: "17:00:00",
      },
      {
        id: "wh-004",
        doctor_id: "doc-001",
        day_of_week: "THURSDAY",
        start_time: "09:00:00",
        end_time: "17:00:00",
      },
      {
        id: "wh-005",
        doctor_id: "doc-001",
        day_of_week: "FRIDAY",
        start_time: "09:00:00",
        end_time: "15:00:00",
      },
    ],
  },
  {
    id: "doc-002",
    user_id: "user-doc-002",
    specialisation: "General Practice",
    qualification: "MD, FAAFP — Stanford",
    experience: 10,
    bio: "Family medicine physician providing comprehensive primary care. Special interest in preventive medicine and chronic disease management.",
    slot_duration: 30,
    created_at: "2023-08-01T00:00:00Z",
    updated_at: "2023-08-01T00:00:00Z",
    profile: {
      id: "user-doc-002",
      full_name: "James Wilson",
      email: "dr.wilson@healthconnect.local",
      avatar_url: null,
      phone: "+1-555-0202",
    },
    doctor_working_hours: [
      {
        id: "wh-006",
        doctor_id: "doc-002",
        day_of_week: "MONDAY",
        start_time: "08:00:00",
        end_time: "16:00:00",
      },
      {
        id: "wh-007",
        doctor_id: "doc-002",
        day_of_week: "TUESDAY",
        start_time: "08:00:00",
        end_time: "16:00:00",
      },
      {
        id: "wh-008",
        doctor_id: "doc-002",
        day_of_week: "WEDNESDAY",
        start_time: "08:00:00",
        end_time: "16:00:00",
      },
      {
        id: "wh-009",
        doctor_id: "doc-002",
        day_of_week: "THURSDAY",
        start_time: "08:00:00",
        end_time: "16:00:00",
      },
      {
        id: "wh-010",
        doctor_id: "doc-002",
        day_of_week: "FRIDAY",
        start_time: "08:00:00",
        end_time: "14:00:00",
      },
    ],
  },
  {
    id: "doc-003",
    user_id: "user-doc-003",
    specialisation: "Dermatology",
    qualification: "MD, FAAD — Yale",
    experience: 8,
    bio: "Dermatologist specializing in skin cancer detection, acne treatment, psoriasis management, and cosmetic dermatology procedures.",
    slot_duration: 45,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    profile: {
      id: "user-doc-003",
      full_name: "Emily Patel",
      email: "dr.patel@healthconnect.local",
      avatar_url: null,
      phone: "+1-555-0203",
    },
    doctor_working_hours: [
      {
        id: "wh-011",
        doctor_id: "doc-003",
        day_of_week: "MONDAY",
        start_time: "10:00:00",
        end_time: "18:00:00",
      },
      {
        id: "wh-012",
        doctor_id: "doc-003",
        day_of_week: "TUESDAY",
        start_time: "10:00:00",
        end_time: "18:00:00",
      },
      {
        id: "wh-013",
        doctor_id: "doc-003",
        day_of_week: "THURSDAY",
        start_time: "10:00:00",
        end_time: "18:00:00",
      },
      {
        id: "wh-014",
        doctor_id: "doc-003",
        day_of_week: "FRIDAY",
        start_time: "10:00:00",
        end_time: "16:00:00",
      },
    ],
  },
  {
    id: "doc-004",
    user_id: "user-doc-004",
    specialisation: "Neurology",
    qualification: "MD, PhD — Mayo Clinic",
    experience: 20,
    bio: "Neurologist with expertise in headache disorders, epilepsy, and neurodegenerative diseases. Director of the Neurology Research Center.",
    slot_duration: 30,
    created_at: "2023-03-01T00:00:00Z",
    updated_at: "2023-03-01T00:00:00Z",
    profile: {
      id: "user-doc-004",
      full_name: "Michael Torres",
      email: "dr.torres@healthconnect.local",
      avatar_url: null,
      phone: "+1-555-0204",
    },
    doctor_working_hours: [
      {
        id: "wh-015",
        doctor_id: "doc-004",
        day_of_week: "MONDAY",
        start_time: "09:00:00",
        end_time: "17:00:00",
      },
      {
        id: "wh-016",
        doctor_id: "doc-004",
        day_of_week: "WEDNESDAY",
        start_time: "09:00:00",
        end_time: "17:00:00",
      },
      {
        id: "wh-017",
        doctor_id: "doc-004",
        day_of_week: "FRIDAY",
        start_time: "09:00:00",
        end_time: "13:00:00",
      },
    ],
  },
];

// ==============================================
// Demo Appointments
// ==============================================

export const demoAppointments = [
  // Patient's upcoming confirmed appointment
  {
    id: "appt-001",
    doctor_id: "doc-001",
    patient_id: "demo-patient-001",
    start_time: `${todayStr}T10:00:00Z`,
    end_time: `${todayStr}T10:30:00Z`,
    status: "CONFIRMED" as const,
    hold_expires_at: null,
    cancellation_reason: null,
    google_event_id: null,
    created_at: "2024-01-10T00:00:00Z",
    updated_at: "2024-01-10T00:00:00Z",
    doctor: { ...demoDoctors[0], profile: demoDoctors[0].profile },
    patient: demoProfiles.PATIENT,
    appointment_symptoms: {
      id: "sym-001",
      appointment_id: "appt-001",
      chief_complaint:
        "Chest tightness and shortness of breath during exercise",
      symptoms:
        "Intermittent chest tightness when climbing stairs, mild shortness of breath, occasional palpitations after coffee. No pain at rest.",
      duration: "2 weeks",
      severity: "Moderate",
      additional_information:
        "I stopped exercising last week because of the symptoms. Family history of heart disease — father had a heart attack at 55.",
      created_at: "2024-01-10T00:00:00Z",
    },
    ai_previsit_summaries: {
      id: "ai-001",
      appointment_id: "appt-001",
      urgency: "MEDIUM" as const,
      chief_complaint:
        "Exercise-induced chest tightness with cardiac risk factors",
      suggested_questions: [
        "Can you describe the exact nature of the chest tightness — is it pressure, burning, or stabbing?",
        "Have you noticed any radiation of discomfort to the arm, jaw, or back?",
        "What is your current exercise tolerance compared to 3 months ago?",
      ],
      raw_response: null,
      is_available: true,
      created_at: "2024-01-10T00:00:00Z",
    },
    clinical_notes: null,
    prescriptions: [],
    post_visit_summaries: null,
  },
  // Past completed appointment
  {
    id: "appt-002",
    doctor_id: "doc-002",
    patient_id: "demo-patient-001",
    start_time: `${format(subDays(today, 7), "yyyy-MM-dd")}T14:00:00Z`,
    end_time: `${format(subDays(today, 7), "yyyy-MM-dd")}T14:30:00Z`,
    status: "COMPLETED" as const,
    hold_expires_at: null,
    cancellation_reason: null,
    google_event_id: "gcal-002",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-17T14:30:00Z",
    doctor: { ...demoDoctors[1], profile: demoDoctors[1].profile },
    patient: demoProfiles.PATIENT,
    appointment_symptoms: {
      id: "sym-002",
      appointment_id: "appt-002",
      chief_complaint: "Persistent headache for 5 days",
      symptoms:
        "Tension-type headache, bilateral, band-like pressure. Worsens in the afternoon. OTC ibuprofen provides temporary relief.",
      duration: "5 days",
      severity: "Mild",
      additional_information:
        "Started a new remote job last month — lots of screen time.",
      created_at: "2024-01-01T00:00:00Z",
    },
    ai_previsit_summaries: {
      id: "ai-002",
      appointment_id: "appt-002",
      urgency: "LOW" as const,
      chief_complaint:
        "Tension-type headaches associated with increased screen time",
      suggested_questions: [
        "How many hours per day are you spending on screens?",
        "Do you take regular breaks following the 20-20-20 rule?",
        "Have you noticed any visual changes or eye strain?",
      ],
      raw_response: null,
      is_available: true,
      created_at: "2024-01-01T00:00:00Z",
    },
    clinical_notes: [
      {
        id: "cn-002",
        appointment_id: "appt-002",
        doctor_id: "doc-002",
        clinical_notes:
          "Patient presents with tension-type headaches. Bilateral band-like pressure, no neurological deficits. Symptoms correlate with increased screen time from new remote position. BP 122/78. Neurological exam normal.",
        diagnosis:
          "Tension-type headache, likely related to occupational ergonomics",
        treatment_plan:
          "Conservative management: ergonomic assessment, regular breaks, stress management techniques",
        follow_up_instructions:
          "Follow 20-20-20 rule every 20 minutes. Consider ergonomic workstation assessment. Return in 2 weeks if symptoms persist.",
        created_at: "2024-01-17T14:30:00Z",
        updated_at: "2024-01-17T14:30:00Z",
      },
    ],
    prescriptions: [
      {
        id: "rx-002",
        appointment_id: "appt-002",
        doctor_id: "doc-002",
        patient_id: "demo-patient-001",
        created_at: "2024-01-17T14:35:00Z",
        prescription_medications: [
          {
            id: "med-001",
            prescription_id: "rx-002",
            medication_name: "Ibuprofen",
            dosage: "400mg",
            frequency: "As needed (max 3x/day)",
            duration: "2 weeks",
            start_date: "2024-01-17",
            end_date: "2024-01-31",
            instructions: "Take with food. Do not exceed 1200mg per day.",
            created_at: "2024-01-17T14:35:00Z",
          },
        ],
      },
    ],
    post_visit_summaries: {
      id: "pvs-002",
      appointment_id: "appt-002",
      summary:
        "You visited Dr. Wilson about persistent headaches. The doctor found that your headaches are likely tension-type, caused by increased screen time from your new job. Your exam was normal — no serious concerns. The doctor recommends taking regular screen breaks and improving your workstation setup.",
      medications: [
        {
          name: "Ibuprofen 400mg",
          instructions:
            "Take with food as needed for headaches, up to 3 times per day for 2 weeks.",
        },
      ],
      follow_up_steps: [
        "Follow the 20-20-20 rule: every 20 minutes, look at something 20 feet away for 20 seconds",
        "Get an ergonomic assessment for your home workstation",
        "Return in 2 weeks if headaches persist or worsen",
      ],
      raw_response: null,
      is_available: true,
      created_at: "2024-01-17T15:00:00Z",
    },
  },
  // Cancelled appointment
  {
    id: "appt-003",
    doctor_id: "doc-003",
    patient_id: "demo-patient-001",
    start_time: `${format(subDays(today, 3), "yyyy-MM-dd")}T11:00:00Z`,
    end_time: `${format(subDays(today, 3), "yyyy-MM-dd")}T11:45:00Z`,
    status: "CANCELLED" as const,
    hold_expires_at: null,
    cancellation_reason: "Doctor on leave",
    google_event_id: null,
    created_at: "2024-01-05T00:00:00Z",
    updated_at: "2024-01-14T00:00:00Z",
    doctor: { ...demoDoctors[2], profile: demoDoctors[2].profile },
    patient: demoProfiles.PATIENT,
    appointment_symptoms: null,
    ai_previsit_summaries: null,
    clinical_notes: null,
    prescriptions: [],
    post_visit_summaries: null,
  },
  // Future appointment
  {
    id: "appt-004",
    doctor_id: "doc-001",
    patient_id: "demo-patient-001",
    start_time: `${format(addDays(today, 5), "yyyy-MM-dd")}T14:00:00Z`,
    end_time: `${format(addDays(today, 5), "yyyy-MM-dd")}T14:30:00Z`,
    status: "CONFIRMED" as const,
    hold_expires_at: null,
    cancellation_reason: null,
    google_event_id: "gcal-004",
    created_at: "2024-01-18T00:00:00Z",
    updated_at: "2024-01-18T00:00:00Z",
    doctor: { ...demoDoctors[0], profile: demoDoctors[0].profile },
    patient: demoProfiles.PATIENT,
    appointment_symptoms: null,
    ai_previsit_summaries: null,
    clinical_notes: null,
    prescriptions: [],
    post_visit_summaries: null,
  },
];

// Doctor's appointments (reusing some, adding doctor-specific ones)
export const demoDoctorAppointments = [
  {
    id: "appt-d01",
    doctor_id: "doc-001",
    patient_id: "patient-001",
    start_time: `${todayStr}T09:00:00Z`,
    end_time: `${todayStr}T09:30:00Z`,
    status: "CONFIRMED" as const,
    hold_expires_at: null,
    cancellation_reason: null,
    google_event_id: null,
    created_at: "2024-01-15T00:00:00Z",
    updated_at: "2024-01-15T00:00:00Z",
    patient: { full_name: "Maria Garcia", email: "maria@example.com" },
    doctor: { ...demoDoctors[0], profile: demoDoctors[0].profile },
    appointment_symptoms: {
      id: "sym-d01",
      appointment_id: "appt-d01",
      chief_complaint: "Recurring lower back pain",
      symptoms:
        "Dull ache in lower back, worse after sitting for long periods. Occasional sharp pain when bending. No radiation to legs.",
      duration: "3 weeks",
      severity: "Moderate",
      additional_information:
        "Works a desk job. Started doing home workouts recently.",
      created_at: "2024-01-15T00:00:00Z",
    },
    ai_previsit_summaries: {
      id: "ai-d01",
      appointment_id: "appt-d01",
      urgency: "LOW" as const,
      chief_complaint:
        "Mechanical lower back pain likely related to prolonged sitting and recent exercise changes",
      suggested_questions: [
        "Can you pinpoint the exact location of the pain — is it central, left, or right side?",
        "Does the pain radiate down either leg or cause numbness/tingling?",
        "What specific exercises did you recently start, and when did the pain begin in relation to that?",
      ],
      raw_response: null,
      is_available: true,
      created_at: "2024-01-15T00:00:00Z",
    },
    clinical_notes: null,
    prescriptions: [],
    post_visit_summaries: null,
  },
  demoAppointments[0], // Alex Johnson's appointment
  {
    id: "appt-d03",
    doctor_id: "doc-001",
    patient_id: "patient-002",
    start_time: `${todayStr}T11:00:00Z`,
    end_time: `${todayStr}T11:30:00Z`,
    status: "CONFIRMED" as const,
    hold_expires_at: null,
    cancellation_reason: null,
    google_event_id: null,
    created_at: "2024-01-16T00:00:00Z",
    updated_at: "2024-01-16T00:00:00Z",
    patient: { full_name: "David Kim", email: "david@example.com" },
    doctor: { ...demoDoctors[0], profile: demoDoctors[0].profile },
    appointment_symptoms: {
      id: "sym-d03",
      appointment_id: "appt-d03",
      chief_complaint: "Heart palpitations and anxiety",
      symptoms:
        "Feeling heart race intermittently, especially at night. Sweating, difficulty sleeping. No chest pain.",
      duration: "1 week",
      severity: "Moderate",
      additional_information:
        "Going through a stressful period at work. Drinks 3-4 cups of coffee daily.",
      created_at: "2024-01-16T00:00:00Z",
    },
    ai_previsit_summaries: {
      id: "ai-d03",
      appointment_id: "appt-d03",
      urgency: "MEDIUM" as const,
      chief_complaint:
        "Palpitations with probable anxiety and caffeine contribution",
      suggested_questions: [
        "Have you noticed if the palpitations correlate with specific times, meals, or activities?",
        "How has your caffeine intake changed recently, and do you consume it after 2pm?",
        "Are you experiencing any other symptoms like dizziness, fainting, or significant weight changes?",
      ],
      raw_response: null,
      is_available: true,
      created_at: "2024-01-16T00:00:00Z",
    },
    clinical_notes: null,
    prescriptions: [],
    post_visit_summaries: null,
  },
  // Tomorrow's appointment
  {
    id: "appt-d04",
    doctor_id: "doc-001",
    patient_id: "patient-003",
    start_time: `${format(addDays(today, 1), "yyyy-MM-dd")}T10:00:00Z`,
    end_time: `${format(addDays(today, 1), "yyyy-MM-dd")}T10:30:00Z`,
    status: "CONFIRMED" as const,
    hold_expires_at: null,
    cancellation_reason: null,
    google_event_id: null,
    created_at: "2024-01-19T00:00:00Z",
    updated_at: "2024-01-19T00:00:00Z",
    patient: { full_name: "Lisa Johnson", email: "lisa@example.com" },
    doctor: { ...demoDoctors[0], profile: demoDoctors[0].profile },
    appointment_symptoms: null,
    ai_previsit_summaries: null,
    clinical_notes: null,
    prescriptions: [],
    post_visit_summaries: null,
  },
];

// ==============================================
// Demo Prescriptions (for patient view)
// ==============================================

export const demoPrescriptions = [
  {
    id: "rx-002",
    appointment_id: "appt-002",
    doctor_id: "doc-002",
    patient_id: "demo-patient-001",
    created_at: "2024-01-17T14:35:00Z",
    prescription_medications: [
      {
        id: "med-001",
        prescription_id: "rx-002",
        medication_name: "Ibuprofen",
        dosage: "400mg",
        frequency: "As needed (max 3x/day)",
        duration: "2 weeks",
        start_date: "2024-01-17",
        end_date: "2024-01-31",
        instructions: "Take with food. Do not exceed 1200mg per day.",
        created_at: "2024-01-17T14:35:00Z",
      },
    ],
  },
  {
    id: "rx-003",
    appointment_id: "appt-001",
    doctor_id: "doc-001",
    patient_id: "demo-patient-001",
    created_at: "2024-01-20T10:30:00Z",
    prescription_medications: [
      {
        id: "med-002",
        prescription_id: "rx-003",
        medication_name: "Aspirin",
        dosage: "81mg",
        frequency: "Once daily",
        duration: "Ongoing",
        start_date: "2024-01-20",
        end_date: "2024-07-20",
        instructions: "Take in the morning with breakfast.",
        created_at: "2024-01-20T10:30:00Z",
      },
      {
        id: "med-003",
        prescription_id: "rx-003",
        medication_name: "Atorvastatin",
        dosage: "20mg",
        frequency: "Once daily at bedtime",
        duration: "3 months",
        start_date: "2024-01-20",
        end_date: "2024-04-20",
        instructions:
          "Take at bedtime. Avoid grapefruit. Follow up with liver function tests in 6 weeks.",
        created_at: "2024-01-20T10:30:00Z",
      },
    ],
  },
];

// ==============================================
// Demo Doctor Leaves
// ==============================================

export const demoLeaves = [
  {
    id: "leave-001",
    doctor_id: "doc-003",
    start_date: format(addDays(today, 10), "yyyy-MM-dd"),
    end_date: format(addDays(today, 12), "yyyy-MM-dd"),
    reason: "Medical conference in Boston",
    created_at: "2024-01-10T00:00:00Z",
    doctor: { profile: { full_name: "Emily Patel" } },
  },
  {
    id: "leave-002",
    doctor_id: "doc-001",
    start_date: format(addDays(today, 20), "yyyy-MM-dd"),
    end_date: format(addDays(today, 20), "yyyy-MM-dd"),
    reason: "Continuing medical education",
    created_at: "2024-01-15T00:00:00Z",
    doctor: { profile: { full_name: "Sarah Chen" } },
  },
];

// ==============================================
// Demo Slots
// ==============================================

export function generateDemoSlots(
  dateStr: string,
): { startTime: string; endTime: string; available: boolean }[] {
  const dateObj = new Date(dateStr + "T12:00:00Z");
  const dayIndex = dateObj.getUTCDay();
  const days = [
    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
  ];
  const dayOfWeek = days[dayIndex];

  // Check if doctor works this day
  const doctor = demoDoctors[0];
  const wh = doctor.doctor_working_hours?.find(
    (h: any) => h.day_of_week === dayOfWeek,
  );
  if (!wh) return [];

  const [startH, startM] = wh.start_time.split(":").map(Number);
  const [endH, endM] = wh.end_time.split(":").map(Number);
  const slotDuration = doctor.slot_duration;

  const startMin = startH * 60 + startM;
  const endMin = endH * 60 + endM;

  const bookedTimes = demoAppointments
    .filter(
      (a) =>
        a.doctor_id === doctor.id &&
        a.start_time.startsWith(dateStr) &&
        (a.status as string) !== "CANCELLED" &&
        (a.status as string) !== "EXPIRED",
    )
    .map((a) => ({
      start: new Date(a.start_time).getTime(),
      end: new Date(a.end_time).getTime(),
    }));

  const slots: { startTime: string; endTime: string; available: boolean }[] =
    [];
  let current = startMin;

  while (current + slotDuration <= endMin) {
    const slotStart = new Date(`${dateStr}T00:00:00Z`);
    slotStart.setUTCHours(Math.floor(current / 60), current % 60, 0, 0);
    const slotEnd = new Date(slotStart.getTime() + slotDuration * 60 * 1000);

    const isBooked = bookedTimes.some(
      (b) => slotStart.getTime() < b.end && slotEnd.getTime() > b.start,
    );
    slots.push({
      startTime: slotStart.toISOString(),
      endTime: slotEnd.toISOString(),
      available: !isBooked,
    });
    current += slotDuration;
  }

  return slots;
}

// ==============================================
// Demo Stats (for admin)
// ==============================================

export const demoStats = {
  doctors: 4,
  patients: 127,
  todayAppointments: 8,
  upcomingAppointments: 34,
  cancelledAppointments: 5,
  failedNotifications: 2,
};

// ==============================================
// Demo API interceptor
// ==============================================

let _isDemoMode = false;

export function setDemoMode(value: boolean) {
  _isDemoMode = value;
  if (typeof window !== "undefined") {
    if (value) {
      localStorage.setItem("demo_mode", "true");
      document.cookie = "demo_mode=true; path=/; max-age=86400";
    } else {
      localStorage.removeItem("demo_mode");
      document.cookie = "demo_mode=; path=/; max-age=0";
    }
  }
}

export function isDemoMode(): boolean {
  if (typeof window !== "undefined") {
    return localStorage.getItem("demo_mode") === "true";
  }
  return _isDemoMode;
}

// Intercept fetch for demo mode
export function installDemoFetchInterceptor() {
  if (typeof window === "undefined") return;

  const originalFetch = window.fetch;
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url;

    if (!isDemoMode()) {
      return originalFetch(input, init);
    }

    // Demo API responses
    if (url.startsWith("/api/appointments/hold")) {
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            appointment_id: "demo-new-appt",
            hold_expires_at: new Date(Date.now() + 5 * 60000).toISOString(),
          },
        }),
        { status: 201, headers: { "Content-Type": "application/json" } },
      );
    }
    if (url === "/api/appointments" && init?.method === "POST") {
      return new Response(
        JSON.stringify({
          success: true,
          data: { appointment_id: "demo-new-appt", status: "CONFIRMED" },
        }),
        { status: 201, headers: { "Content-Type": "application/json" } },
      );
    }
    if (
      url.startsWith("/api/appointments?") &&
      (!init?.method || init.method === "GET")
    ) {
      const role = localStorage.getItem("demo_role") || "PATIENT";
      const items =
        role === "DOCTOR" ? demoDoctorAppointments : demoAppointments;
      return new Response(JSON.stringify({ success: true, data: { items } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (url.match(/\/api\/appointments\/[^/]+\/consultation/)) {
      return new Response(
        JSON.stringify({ success: true, data: { id: "demo-cn" } }),
        { status: 201, headers: { "Content-Type": "application/json" } },
      );
    }
    if (url.match(/\/api\/appointments\/[^/]+\/prescription/)) {
      return new Response(
        JSON.stringify({
          success: true,
          data: { prescription_id: "demo-rx", medications: 1 },
        }),
        { status: 201, headers: { "Content-Type": "application/json" } },
      );
    }
    if (url.match(/\/api\/appointments\/[^/]+$/) && init?.method === "PATCH") {
      return new Response(
        JSON.stringify({ success: true, data: { status: "COMPLETED" } }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }
    if (
      url.match(/\/api\/appointments\/[^/]+$/) &&
      (!init?.method || init.method === "GET")
    ) {
      const id = url.split("/api/appointments/")[1]?.split("?")[0];
      const appt =
        [...demoAppointments, ...demoDoctorAppointments].find(
          (a) => a.id === id,
        ) || demoAppointments[0];
      return new Response(JSON.stringify({ success: true, data: appt }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (url.startsWith("/api/appointments")) {
      return new Response(
        JSON.stringify({ success: true, data: { items: demoAppointments } }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }
    if (url.startsWith("/api/doctors") && url.includes("/slots")) {
      const dateStr =
        new URL(url, window.location.origin).searchParams.get("date") ||
        format(new Date(), "yyyy-MM-dd");
      return new Response(
        JSON.stringify({
          success: true,
          data: { slots: generateDemoSlots(dateStr), date: dateStr },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }
    if (url.match(/\/api\/doctors\/[^/]+$/) && !url.includes("/slots")) {
      return new Response(
        JSON.stringify({ success: true, data: demoDoctors[0] }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }
    if (url.startsWith("/api/doctors")) {
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            items: demoDoctors,
            total: demoDoctors.length,
            page: 1,
            pageSize: 20,
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }
    if (url.startsWith("/api/prescriptions")) {
      return new Response(
        JSON.stringify({ success: true, data: { items: demoPrescriptions } }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }
    if (url.startsWith("/api/admin/stats")) {
      return new Response(JSON.stringify({ success: true, data: demoStats }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (url.startsWith("/api/admin/doctors")) {
      return new Response(
        JSON.stringify({ success: true, data: { items: demoDoctors } }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }
    if (url.startsWith("/api/admin/leave") && init?.method === "POST") {
      return new Response(
        JSON.stringify({
          success: true,
          data: { leave: { id: "demo-leave" }, affected_appointments: 0 },
        }),
        { status: 201, headers: { "Content-Type": "application/json" } },
      );
    }
    if (url.startsWith("/api/admin/leave")) {
      return new Response(
        JSON.stringify({ success: true, data: { items: demoLeaves } }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }
    if (url.startsWith("/api/auth/me")) {
      const role = localStorage.getItem("demo_role") || "PATIENT";
      return new Response(
        JSON.stringify({
          success: true,
          data: demoProfiles[role as keyof typeof demoProfiles],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    return originalFetch(input, init);
  };
}
