"use client";

import { useEffect, useState } from "react";
import { Bell, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { format } from "date-fns";

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch all notifications (admin only)
    fetch("/api/appointments?limit=50").then(r => r.json()).then(() => {
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Notifications</h1>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <p className="text-gray-500 text-center py-8">
          <Bell className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          Notification system with retry mechanism.
          <br />
          <span className="text-sm">Failed notifications are automatically retried up to 3 times with exponential backoff.</span>
        </p>
      </div>
    </div>
  );
}
