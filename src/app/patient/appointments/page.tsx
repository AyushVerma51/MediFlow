"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, Clock, Filter } from "lucide-react";
import { format } from "date-fns";
import { isDemoMode, demoAppointments } from "@/lib/demo-data";

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    if (isDemoMode()) { setAppointments(demoAppointments); setLoading(false); return; }
    fetch("/api/appointments")
      .then(r => r.json())
      .then(d => { setAppointments(d.data?.items || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = filter === "ALL" ? appointments : appointments.filter(a => a.status === filter);
  const statusColors: Record<string, string> = {
    HELD: "bg-amber-100 text-amber-700",
    CONFIRMED: "bg-green-100 text-green-700",
    COMPLETED: "bg-blue-100 text-blue-700",
    CANCELLED: "bg-red-100 text-red-700",
    EXPIRED: "bg-gray-100 text-gray-500",
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Appointments</h1>
          <p className="text-gray-500 mt-1">View and manage your appointments</p>
        </div>
        <Link href="/patient/doctors" className="px-4 py-2 bg-cyan-600 text-white rounded-lg text-sm font-medium hover:bg-cyan-700">
          Book New
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {["ALL", "CONFIRMED", "COMPLETED", "CANCELLED"].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              filter === f ? "bg-cyan-50 text-cyan-700 border border-cyan-200" : "bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100"
            }`}
          >
            {f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">No appointments found</p>
          <Link href="/patient/doctors" className="mt-3 inline-block text-sm text-cyan-600 hover:underline">
            Find a doctor →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(appt => (
            <Link
              key={appt.id}
              href={`/patient/appointments/${appt.id}`}
              className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="p-3 bg-cyan-50 rounded-xl">
                <Calendar className="h-5 w-5 text-cyan-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">Dr. {appt.doctor?.profile?.full_name}</p>
                <p className="text-sm text-gray-500">{appt.doctor?.specialisation}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{format(new Date(appt.start_time), "MMM d, yyyy")}</p>
                <p className="text-sm text-gray-500 flex items-center justify-end gap-1">
                  <Clock className="h-3 w-3" /> {format(new Date(appt.start_time), "h:mm a")}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[appt.status] || "bg-gray-100"}`}>
                {appt.status}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
