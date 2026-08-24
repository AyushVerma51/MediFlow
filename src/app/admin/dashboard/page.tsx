"use client";

import { useEffect, useState } from "react";
import { Group, Calendar, Clock, AlertCircle, ClipboardList } from "lucide-react";
import { isDemoMode, demoStats } from "@/lib/demo-data";

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemoMode()) { setStats(demoStats); setLoading(false); return; }
    fetch("/api/admin/stats").then(r => r.json()).then(d => {
      setStats(d.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const statCards = [
    { label: "Doctors", value: stats?.doctors || 0, icon: Group, color: "bg-cyan-50 text-cyan-600" },
    { label: "Patients", value: stats?.patients || 0, icon: Group, color: "bg-blue-50 text-blue-600" },
    { label: "Today's Appointments", value: stats?.todayAppointments || 0, icon: Calendar, color: "bg-green-50 text-green-600" },
    { label: "Upcoming", value: stats?.upcomingAppointments || 0, icon: Clock, color: "bg-amber-50 text-amber-600" },
    { label: "Cancelled", value: stats?.cancelledAppointments || 0, icon: AlertCircle, color: "bg-red-50 text-red-600" },
    { label: "Failed Notifications", value: stats?.failedNotifications || 0, icon: ClipboardList, color: "bg-gray-50 text-gray-600" },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>
      {loading ? (
        <div className="grid grid-cols-3 gap-4">{[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {statCards.map(card => (
            <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${card.color}`}><card.icon className="h-5 w-5" /></div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                  <p className="text-sm text-gray-500">{card.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
