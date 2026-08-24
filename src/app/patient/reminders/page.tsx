"use client";

import { useEffect, useState } from "react";
import { Clock, Bell, FlaskConical } from "lucide-react";
import { format } from "date-fns";

export default function RemindersPage() {
  const [reminders, setReminders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/appointments?status=CONFIRMED").then(r => r.json()).then(d => {
      setReminders(d.data?.items || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Reminders</h1>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <p className="text-gray-500 text-center py-8">
          <Bell className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          Medication reminders are sent via email based on your prescriptions.
          <br />
          <span className="text-sm">You&apos;ll receive reminders at the scheduled times.</span>
        </p>
      </div>
    </div>
  );
}
