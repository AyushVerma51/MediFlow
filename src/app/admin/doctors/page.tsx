"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Group, Clock, Edit, Plus } from "lucide-react";
import { isDemoMode, demoDoctors } from "@/lib/demo-data";

export default function AdminDoctors() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemoMode()) { setDoctors(demoDoctors); setLoading(false); return; }
    fetch("/api/admin/doctors").then(r => r.json()).then(d => {
      setDoctors(d.data?.items || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Doctor Management</h1>
        <Link href="/admin/doctors/new" className="px-4 py-2 bg-cyan-600 text-white rounded-lg text-sm font-medium hover:bg-cyan-700 flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add Doctor
        </Link>
      </div>
      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="space-y-3">
          {doctors.map(doc => (
            <div key={doc.id} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-200">
              <div className="w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center">
                <Group className="h-6 w-6 text-cyan-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Dr. {doc.profile?.full_name}</p>
                <p className="text-sm text-gray-500">{doc.specialisation} • {doc.experience} yrs</p>
              </div>
              <div className="flex items-center gap-2">
                <Link href={`/admin/doctors/${doc.id}`} className="p-2 bg-gray-50 rounded-lg hover:bg-gray-100">
                  <Edit className="h-4 w-4 text-gray-600" />
                </Link>
              </div>
            </div>
          ))}
          {doctors.length === 0 && <p className="text-gray-400 text-center py-12">No doctors found</p>}
        </div>
      )}
    </div>
  );
}
