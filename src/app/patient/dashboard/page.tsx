"use client";

import { useAuth } from "@/app/providers";
import Link from "next/link";
import { Calendar, Hospital, FlaskConical, Bell, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { isDemoMode, demoAppointments } from "@/lib/demo-data";

export default function PatientDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemoMode()) {
      const confirmed = demoAppointments.filter(a => a.status === "CONFIRMED");
      setStats({ items: confirmed.slice(0, 5) });
      setLoading(false);
      return;
    }
    fetch("/api/appointments?status=CONFIRMED&limit=5")
      .then(r => r.json())
      .then(d => { setStats(d.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const quickActions = [
    { label: "Find Doctor", href: "/patient/doctors", icon: Hospital, color: "bg-cyan-50 text-cyan-700" },
    { label: "Appointments", href: "/patient/appointments", icon: Calendar, color: "bg-blue-50 text-blue-700" },
    { label: "Prescriptions", href: "/patient/prescriptions", icon: FlaskConical, color: "bg-green-50 text-green-700" },
    { label: "Reminders", href: "/patient/reminders", icon: Bell, color: "bg-amber-50 text-amber-700" },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {profile?.full_name?.split(" ")[0]}</h1>
        <p className="text-gray-500 mt-1">Here&apos;s your health dashboard</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {quickActions.map(action => (
          <Link
            key={action.href}
            href={action.href}
            className="flex flex-col items-center gap-3 p-6 bg-white rounded-xl border border-gray-200 hover:shadow-md transition-shadow"
          >
            <div className={`p-3 rounded-xl ${action.color}`}>
              <action.icon className="h-6 w-6" />
            </div>
            <span className="text-sm font-medium text-gray-700">{action.label}</span>
          </Link>
        ))}
      </div>

      {/* Upcoming Appointments */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Appointments</h2>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-50 rounded-lg animate-pulse" />)}
          </div>
        ) : !stats?.items?.length ? (
          <div className="text-center py-8 text-gray-400">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No upcoming appointments</p>
            <Link href="/patient/doctors" className="mt-3 inline-block text-sm text-cyan-600 hover:underline">
              Find a doctor →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {stats.items.map((appt: any) => (
              <Link
                key={appt.id}
                href={`/patient/appointments/${appt.id}`}
                className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="p-2 bg-cyan-50 rounded-lg">
                  <Clock className="h-5 w-5 text-cyan-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    Dr. {appt.doctor?.profile?.full_name || "Unknown"}
                  </p>
                  <p className="text-sm text-gray-500">
                    {appt.doctor?.specialisation} • {new Date(appt.start_time).toLocaleDateString()}
                  </p>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                  {appt.status}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
