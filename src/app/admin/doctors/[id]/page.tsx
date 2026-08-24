"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Clock, Save } from "lucide-react";

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

export default function AdminDoctorDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [doctor, setDoctor] = useState<any>(null);
  const [hours, setHours] = useState<Record<string, { start_time: string; end_time: string; enabled: boolean }>>({});
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetch(`/api/doctors/${id}`).then(r => r.json()).then(d => {
      setDoctor(d.data);
      const h: Record<string, { start_time: string; end_time: string; enabled: boolean }> = {};
      DAYS.forEach(day => {
        const existing = d.data?.doctor_working_hours?.find((wh: any) => wh.day_of_week === day);
        h[day] = existing
          ? { start_time: existing.start_time.slice(0, 5), end_time: existing.end_time.slice(0, 5), enabled: true }
          : { start_time: "09:00", end_time: "17:00", enabled: false };
      });
      setHours(h);
    });
  }, [id]);

  const handleSaveHours = async () => {
    setSaving(true);
    setSuccess("");
    try {
      const workingHours = Object.entries(hours)
        .filter(([, v]) => v.enabled)
        .map(([day, v]) => ({ day_of_week: day, start_time: v.start_time, end_time: v.end_time }));

      // Save via a simple approach: delete all and re-create
      await fetch(`/api/admin/doctors/${id}/working-hours`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ working_hours: workingHours }),
      });
      setSuccess("Working hours saved!");
    } catch {
      setSuccess("");
    } finally {
      setSaving(false);
    }
  };

  if (!doctor) return <div className="p-6"><div className="animate-pulse h-48 bg-gray-100 rounded-xl" /></div>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4 text-sm">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h1 className="text-xl font-bold text-gray-900">Dr. {doctor.profile?.full_name}</h1>
        <p className="text-cyan-600">{doctor.specialisation}</p>
        <p className="text-sm text-gray-500 mt-1">{doctor.qualification} • {doctor.experience} years</p>
      </div>

      {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">{success}</div>}

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5" /> Working Hours
        </h2>
        <div className="space-y-3">
          {DAYS.map(day => (
            <div key={day} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
              <label className="flex items-center gap-2 w-32">
                <input
                  type="checkbox"
                  checked={hours[day]?.enabled || false}
                  onChange={e => setHours(h => ({ ...h, [day]: { ...h[day], enabled: e.target.checked } }))}
                  className="rounded border-gray-300"
                />
                <span className="text-sm font-medium text-gray-700">{day.slice(0, 3)}</span>
              </label>
              {hours[day]?.enabled && (
                <div className="flex items-center gap-2">
                  <input type="time" value={hours[day].start_time} onChange={e => setHours(h => ({ ...h, [day]: { ...h[day], start_time: e.target.value } }))} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm outline-none" />
                  <span className="text-gray-400">to</span>
                  <input type="time" value={hours[day].end_time} onChange={e => setHours(h => ({ ...h, [day]: { ...h[day], end_time: e.target.value } }))} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm outline-none" />
                </div>
              )}
            </div>
          ))}
        </div>
        <button onClick={handleSaveHours} disabled={saving} className="mt-4 px-6 py-2 bg-cyan-600 text-white rounded-lg text-sm font-medium hover:bg-cyan-700 disabled:opacity-50 flex items-center gap-2">
          <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Working Hours"}
        </button>
      </div>
    </div>
  );
}
