const baseTemplate = (title: string, content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #0891b2; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .body { padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
    .footer { margin-top: 20px; font-size: 12px; color: #9ca3af; text-align: center; }
    .btn { display: inline-block; background: #0891b2; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; margin: 10px 0; }
    .info-box { background: #f0f9ff; border-left: 4px solid #0891b2; padding: 12px; margin: 10px 0; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="header">
    <h2 style="margin:0">MediFlow</h2>
  </div>
  <div class="body">
    <h3>${title}</h3>
    ${content}
  </div>
  <div class="footer">
    <p>MediFlow — This is an automated notification.</p>
  </div>
</body>
</html>`;

export const emailTemplates = {
  bookingConfirmation: (patientName: string, doctorName: string, date: string, time: string) => ({
    subject: `Appointment Confirmed — ${date} at ${time}`,
    html: baseTemplate(
      "Appointment Confirmed",
      `<p>Hi ${patientName},</p>
       <p>Your appointment has been confirmed.</p>
       <div class="info-box">
         <p><strong>Doctor:</strong> Dr. ${doctorName}</p>
         <p><strong>Date:</strong> ${date}</p>
         <p><strong>Time:</strong> ${time}</p>
       </div>
       <p>Please arrive 10 minutes before your scheduled time.</p>`
    ),
  }),

  appointmentReminder: (patientName: string, doctorName: string, date: string, time: string) => ({
    subject: `Appointment Reminder — Tomorrow at ${time}`,
    html: baseTemplate(
      "Appointment Reminder",
      `<p>Hi ${patientName},</p>
       <p>This is a reminder about your upcoming appointment.</p>
       <div class="info-box">
         <p><strong>Doctor:</strong> Dr. ${doctorName}</p>
         <p><strong>Date:</strong> ${date}</p>
         <p><strong>Time:</strong> ${time}</p>
       </div>`
    ),
  }),

  cancellation: (patientName: string, doctorName: string, date: string, time: string, reason?: string) => ({
    subject: `Appointment Cancelled — ${date}`,
    html: baseTemplate(
      "Appointment Cancelled",
      `<p>Hi ${patientName},</p>
       <p>Your appointment with Dr. ${doctorName} on ${date} at ${time} has been cancelled.</p>
       ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
       <p>If you need to reschedule, please book a new appointment through the app.</p>`
    ),
  }),

  newAppointmentForDoctor: (doctorName: string, patientName: string, date: string, time: string) => ({
    subject: `New Appointment — ${patientName} on ${date}`,
    html: baseTemplate(
      "New Appointment Booked",
      `<p>Hi Dr. ${doctorName},</p>
       <p>A new appointment has been booked.</p>
       <div class="info-box">
         <p><strong>Patient:</strong> ${patientName}</p>
         <p><strong>Date:</strong> ${date}</p>
         <p><strong>Time:</strong> ${time}</p>
       </div>`
    ),
  }),

  doctorLeave: (patientName: string, doctorName: string, leaveDate: string) => ({
    subject: `Appointment Cancelled — Doctor on Leave`,
    html: baseTemplate(
      "Appointment Affected by Doctor Leave",
      `<p>Hi ${patientName},</p>
       <p>Unfortunately, Dr. ${doctorName} will be on leave on ${leaveDate}.</p>
       <p>Your appointment has been cancelled. We apologize for the inconvenience.</p>
       <p>Please book a new appointment through the app.</p>`
    ),
  }),

  medicationReminder: (patientName: string, medicationName: string, dosage: string, time: string) => ({
    subject: `Medication Reminder — ${medicationName}`,
    html: baseTemplate(
      "Medication Reminder",
      `<p>Hi ${patientName},</p>
       <p>This is your medication reminder.</p>
       <div class="info-box">
         <p><strong>Medication:</strong> ${medicationName}</p>
         <p><strong>Dosage:</strong> ${dosage}</p>
         <p><strong>Time:</strong> ${time}</p>
       </div>
       <p>Take your medication as prescribed by your doctor.</p>`
    ),
  }),

  postVisitSummary: (patientName: string, doctorName: string, summaryUrl: string) => ({
    subject: `Your Visit Summary — Dr. ${doctorName}`,
    html: baseTemplate(
      "Visit Summary Available",
      `<p>Hi ${patientName},</p>
       <p>Your visit summary from Dr. ${doctorName} is now available.</p>
       <p>Log in to view your summary, medications, and follow-up instructions.</p>`
    ),
  }),
};
