"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/app/providers";
import { Calendar, Clock, AlertCircle, CheckCircle } from "lucide-react";
import { format, isToday, isFuture } from "date-fns";
import { isDemoMode, demoDoctorAppointments } from "@/lib/demo-data";

export default function DoctorDashboard() {
  const { profile } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemoMode()) { setAppointments(demoDoctorAppointments); setLoading(false); return; }
    fetch("/api/appointments?status=CONFIRMED")
      .then(r => r.json())
      .then(d => { setAppointments(d.data?.items || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const today = appointments.filter(a => isToday(new Date(a.start_time)));
  const upcoming = appointments.filter(a => isFuture(new Date(a.start_time)) && !isToday(new Date(a.start_time)));

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Welcome, Dr. {profile?.full_name?.split(" ")[1] || profile?.full_name}</h1>
        <p className="text-gray-500 mt-1">Here&apos;s your practice overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-50 rounded-lg"><Calendar className="h-5 w-5 text-cyan-600" /></div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{today.length}</p>
              <p className="text-sm text-gray-500">Today&apos;s Appointments</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg"><Clock className="h-5 w-5 text-blue-600" /></div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{upcoming.length}</p>
              <p className="text-sm text-gray-500">Upcoming</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg"><CheckCircle className="h-5 w-5 text-green-600" /></div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{appointments.length}</p>
              <p className="text-sm text-gray-500">Total Active</p>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Appointments */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Today&apos;s Appointments</h2>
        {loading ? (
          <div className="space-y-3">{[1, 2].map(i => <div key={i} className="h-16 bg-gray-50 rounded-lg animate-pulse" />)}</div>
        ) : today.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No appointments today</p>
        ) : (
          <div className="space-y-3">
            {today.map(appt => (
              <Link key={appt.id} href={`/doctor/appointments/${appt.id}`} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="p-2 bg-cyan-50 rounded-lg"><Clock className="h-5 w-5 text-cyan-600" /></div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{appt.patient?.full_name}</p>
                  <p className="text-sm text-gray-500">{format(new Date(appt.start_time), "h:mm a")} - {format(new Date(appt.end_time), "h:mm a")}</p>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">{appt.status}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
