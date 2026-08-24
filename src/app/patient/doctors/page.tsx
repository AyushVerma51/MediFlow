"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Hospital, Clock, ArrowRight, FileSearch } from "lucide-react";
import type { DoctorProfile } from "@/types";
import { isDemoMode, demoDoctors } from "@/lib/demo-data";

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [specialisation, setSpecialisation] = useState("");

  useEffect(() => {
    if (isDemoMode()) {
      let filtered = demoDoctors;
      if (search) filtered = filtered.filter(d => d.profile?.full_name.toLowerCase().includes(search.toLowerCase()) || d.specialisation.toLowerCase().includes(search.toLowerCase()));
      if (specialisation) filtered = filtered.filter(d => d.specialisation === specialisation);
      setDoctors(filtered);
      setLoading(false);
      return;
    }
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (specialisation) params.set("specialisation", specialisation);
    fetch(`/api/doctors?${params}`)
      .then(r => r.json())
      .then(d => { setDoctors(d.data?.items || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [search, specialisation]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Find a Doctor</h1>
        <p className="text-gray-500 mt-1">Search by name or specialisation</p>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <FileSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search doctors..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
          />
        </div>
        <select
          value={specialisation}
          onChange={e => setSpecialisation(e.target.value)}
          className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
        >
          <option value="">All Specialisations</option>
          <option value="Cardiology">Cardiology</option>
          <option value="Dermatology">Dermatology</option>
          <option value="General Practice">General Practice</option>
          <option value="Neurology">Neurology</option>
          <option value="Orthopedics">Orthopedics</option>
          <option value="Pediatrics">Pediatrics</option>
        </select>
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
              <div className="h-12 w-12 bg-gray-200 rounded-full mb-4" />
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
              <div className="h-8 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      ) : doctors.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Hospital className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">No doctors found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {doctors.map((doc) => (
            <div key={doc.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center">
                  <Hospital className="h-6 w-6 text-cyan-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Dr. {doc.profile?.full_name}</h3>
                  <p className="text-sm text-cyan-600">{doc.specialisation}</p>
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-1">{doc.qualification}</p>
              <p className="text-sm text-gray-500 mb-4 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> {doc.experience} years experience
              </p>
              <Link
                href={`/patient/doctors/${doc.id}`}
                className="inline-flex items-center gap-1 text-sm font-medium text-cyan-600 hover:text-cyan-700"
              >
                View Profile & Book <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
