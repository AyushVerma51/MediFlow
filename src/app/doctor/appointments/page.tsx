"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, Clock, Filter } from "lucide-react";
import { format } from "date-fns";
import { isDemoMode, demoDoctorAppointments } from "@/lib/demo-data";

export default function DoctorAppointments() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    if (isDemoMode()) { setAppointments(demoDoctorAppointments); setLoading(false); return; }
    fetch("/api/appointments").then(r => r.json()).then(d => {
      setAppointments(d.data?.items || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = filter === "ALL" ? appointments : appointments.filter(a => a.status === filter);
  const statusColors: Record<string, string> = {
    CONFIRMED: "bg-green-100 text-green-700",
    COMPLETED: "bg-blue-100 text-blue-700",
    CANCELLED: "bg-red-100 text-red-700",
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Appointments</h1>
      <div className="flex gap-2 mb-6">
        {["ALL", "CONFIRMED", "COMPLETED", "CANCELLED"].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === f ? "bg-cyan-50 text-cyan-700 border border-cyan-200" : "bg-gray-50 text-gray-600 border border-gray-200"}`}>
            {f === "ALL" ? "All" : f}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(appt => (
            <Link key={appt.id} href={`/doctor/appointments/${appt.id}`} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
              <div className="p-3 bg-cyan-50 rounded-xl"><Calendar className="h-5 w-5 text-cyan-600" /></div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{appt.patient?.full_name}</p>
                <p className="text-sm text-gray-500">{format(new Date(appt.start_time), "MMM d, yyyy")} • {format(new Date(appt.start_time), "h:mm a")}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[appt.status] || "bg-gray-100 text-gray-600"}`}>{appt.status}</span>
            </Link>
          ))}
          {filtered.length === 0 && <p className="text-gray-400 text-center py-12">No appointments found</p>}
        </div>
      )}
    </div>
  );
}
