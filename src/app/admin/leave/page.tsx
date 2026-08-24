"use client";

import { useEffect, useState } from "react";
import { Calendar, Plus, Trash2, AlertCircle } from "lucide-react";
import { isDemoMode, demoLeaves, demoDoctors } from "@/lib/demo-data";

export default function AdminLeave() {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ doctor_id: "", start_date: "", end_date: "", reason: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (isDemoMode()) { setLeaves(demoLeaves); setDoctors(demoDoctors); setLoading(false); return; }
    Promise.all([
      fetch("/api/admin/leave").then(r => r.json()),
      fetch("/api/admin/doctors").then(r => r.json()),
    ]).then(([leaveData, docData]) => {
      setLeaves(leaveData.data?.items || []);
      setDoctors(docData.data?.items || []);
      setLoading(false);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/admin/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error?.message);
      setShowForm(false);
      setForm({ doctor_id: "", start_date: "", end_date: "", reason: "" });
      // Reload
      const leaveData = await fetch("/api/admin/leave").then(r => r.json());
      setLeaves(leaveData.data?.items || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this leave?")) return;
    await fetch(`/api/admin/leave?id=${id}`, { method: "DELETE" });
    setLeaves(leaves.filter(l => l.id !== id));
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Leave Management</h1>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-cyan-600 text-white rounded-lg text-sm font-medium hover:bg-cyan-700 flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add Leave
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Doctor</label>
              <select value={form.doctor_id} onChange={e => setForm(f => ({ ...f, doctor_id: e.target.value }))} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none">
                <option value="">Select doctor</option>
                {doctors.map((d: any) => <option key={d.id} value={d.id}>Dr. {d.profile?.full_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
              <input type="text" value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" placeholder="Optional reason" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" />
            </div>
          </div>
          <button type="submit" disabled={submitting} className="px-6 py-2 bg-cyan-600 text-white rounded-lg text-sm font-medium hover:bg-cyan-700 disabled:opacity-50">
            {submitting ? "Creating..." : "Create Leave"}
          </button>
        </form>
      )}

      {loading ? (
        <div className="space-y-3">{[1, 2].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="space-y-3">
          {leaves.map(leave => (
            <div key={leave.id} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200">
              <Calendar className="h-5 w-5 text-cyan-600" />
              <div className="flex-1">
                <p className="font-medium text-gray-900">{leave.doctor?.profile?.full_name || "Doctor"}</p>
                <p className="text-sm text-gray-500">{leave.start_date} to {leave.end_date}{leave.reason ? ` • ${leave.reason}` : ""}</p>
              </div>
              <button onClick={() => handleDelete(leave.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          {leaves.length === 0 && <p className="text-gray-400 text-center py-12">No leave records</p>}
        </div>
      )}
    </div>
  );
}
