# System Design — MediFlow

## 1. Architecture Overview

The system uses a **modular Next.js 15 monolith** with the App Router:

```
┌─────────────────────────────────────────┐
│           Next.js 15 (App Router)       │
│                                         │
│  ┌──────────┐  ┌──────────────────────┐ │
│  │ Frontend │  │ API Route Handlers   │ │
│  │ (React)  │  │ /api/*               │ │
│  └────┬─────┘  └──────┬───────────────┘ │
│       │               │                 │
│       └───────┬───────┘                 │
│               │                         │
│  ┌────────────┴────────────────────┐    │
│  │        Supabase Client          │    │
│  │   (anon key / service role key) │    │
│  └────────────┬────────────────────┘    │
└───────────────┼─────────────────────────┘
                │
    ┌───────────┴───────────┐
    │                       │
    ▼                       ▼
┌──────────┐      ┌──────────────────┐
│Supabase  │      │  External APIs   │
│PostgreSQL│      │  Gemini AI       │
│+ RLS     │      │  Resend Email    │
│+ RPCs    │      │  Google Calendar │
└──────────┘      └──────────────────┘
```

## 2. Double-Booking Prevention

**The database is the final authority.** Two mechanisms prevent double-booking:

### Exclusion Constraint
```sql
EXCLUDE USING gist (
  doctor_id WITH =,
  tstzrange(start_time, end_time) WITH &&
) WHERE (status IN ('HELD', 'CONFIRMED'))
```

This PostgreSQL constraint physically prevents overlapping time ranges for the same doctor when appointments are active. Any INSERT or UPDATE that violates this is rejected by the database engine.

### Atomic RPC Function
```sql
hold_appointment_slot(doctor_id, patient_id, start_time, end_time, hold_minutes)
```

This function performs all validations (working hours, leave, availability) and the INSERT in a single atomic operation. The exclusion constraint acts as the final safety net.

**Result:** 100 simultaneous booking attempts for the same slot → exactly 1 succeeds, 99 receive SLOT_UNAVAILABLE.

## 3. Slot Hold Mechanism

When a patient selects a slot:
1. `hold_appointment_slot()` creates an appointment with `status = HELD` and `hold_expires_at = now + 5 minutes`
2. The exclusion constraint immediately blocks other bookings for that slot
3. A cron job (`/api/cron/expire-holds`) runs periodically to expire held slots
4. The frontend shows a countdown timer, but **the backend is authoritative**

If the patient completes booking within the hold period, `confirm_appointment()` atomically transitions HELD → CONFIRMED. If the hold expires, the slot becomes available again.

## 4. Doctor Leave Conflict Handling

When an admin creates leave:
1. Check for overlapping existing leave
2. Find all affected future appointments (CONFIRMED or HELD)
3. Display affected appointments to admin for confirmation
4. On confirmation: cancel affected appointments and create notification records

All within a single logical operation. Patients are notified via email.

## 5. Notification Architecture

Notifications are **decoupled from core booking**:

```
Appointment CONFIRMED (database)
       │
       ├── Notification record created (PENDING)
       ├── Calendar sync queued
       ├── AI summary triggered
       │
       ▼
Cron: /api/cron/process-notifications
       │
       ▼
  Resend API → SENT / FAILED
```

Failed notifications are retried (up to 3 attempts) by the cron job. Exponential backoff is implemented at the scheduling level.

## 6. AI Failure Handling

AI (Gemini) is an **async side effect**, not a booking requirement:

- Pre-visit summary: Generated after booking confirmation. If it fails, the appointment still succeeds. Doctor sees: "AI summary unavailable. Please review the patient's original symptoms."
- Post-visit summary: Generated after consultation completion. If it fails, doctor's clinical notes remain the source of truth.
- All AI responses are validated with Zod before storage.

## 7. Calendar Failure Handling

Google Calendar sync is also decoupled:

```
Appointment CONFIRMED
       ↓
  Calendar sync attempted
       ↓
  ┌─────┴─────┐
  │           │
Success    Failure
  │           │
SYNCED     FAILED (retry later)
```

The appointment remains CONFIRMED regardless of calendar status. The cron job retries failed syncs.

## 8. Security Model

- **Supabase Auth** for authentication (JWT-based)
- **Row Level Security (RLS)** on all tables
- **Role-based access:** PATIENT, DOCTOR, ADMIN
- **Server-side middleware** validates auth on every request
- **Service role key** used only in server-side route handlers
- **CRON_SECRET** protects background job endpoints
- **Zod validation** on all API inputs

## 9. Database Transactions

Critical operations use PostgreSQL transactions:

- **Booking:** hold_appointment_slot() is atomic
- **Confirmation:** confirm_appointment() uses SELECT FOR UPDATE + status transition
- **Leave creation:** Cancellation of affected appointments is atomic

External API calls (email, calendar, AI) are performed **after** the database transaction commits.
