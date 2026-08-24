"use client";

import { useEffect, useState } from "react";
import { Calendar, Clock, Filter } from "lucide-react";
import { format } from "date-fns";
import { isDemoMode, demoAppointments } from "@/lib/demo-data";

export default function AdminAppointments() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    if (isDemoMode()) { setAppointments(demoAppointments); setLoading(false); return; }
    fetch("/api/appointments").then(r => r.json()).then(d => {
      setAppointments(d.data?.items || []);
      setLoading(false);
    });
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
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">All Appointments</h1>
      <div className="flex gap-2 mb-6">
        {["ALL", "CONFIRMED", "COMPLETED", "CANCELLED", "HELD"].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === f ? "bg-cyan-50 text-cyan-700 border border-cyan-200" : "bg-gray-50 text-gray-600 border border-gray-200"}`}>
            {f === "ALL" ? "All" : f}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Patient</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Doctor</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Date</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Time</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(appt => (
                <tr key={appt.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">{appt.patient?.full_name}</td>
                  <td className="px-4 py-3">Dr. {appt.doctor?.profile?.full_name}</td>
                  <td className="px-4 py-3">{format(new Date(appt.start_time), "MMM d, yyyy")}</td>
                  <td className="px-4 py-3">{format(new Date(appt.start_time), "h:mm a")}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[appt.status] || ""}`}>{appt.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
