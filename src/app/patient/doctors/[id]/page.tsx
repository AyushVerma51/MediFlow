"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/app/providers";
import { Clock, ArrowLeft, CalendarDays, CirclePlus } from "lucide-react";
import { format, addDays, startOfWeek } from "date-fns";
import { isDemoMode, demoDoctors, generateDemoSlots } from "@/lib/demo-data";

export default function DoctorDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { profile } = useAuth();
  const [doctor, setDoctor] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [slots, setSlots] = useState<any[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [holdLoading, setHoldLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isDemoMode()) {
      const doc = demoDoctors.find(d => d.id === id) || demoDoctors[0];
      setDoctor(doc);
      setSelectedDate(format(new Date(), "yyyy-MM-dd"));
      return;
    }
    fetch(`/api/doctors/${id}`).then(r => r.json()).then(d => {
      setDoctor(d.data);
      setSelectedDate(format(new Date(), "yyyy-MM-dd"));
    });
  }, [id]);

  useEffect(() => {
    if (!selectedDate) return;
    if (isDemoMode()) {
      setSlots(generateDemoSlots(selectedDate));
      setLoadingSlots(false);
      return;
    }
    setLoadingSlots(true);
    fetch(`/api/doctors/${id}/slots?date=${selectedDate}`)
      .then(r => r.json())
      .then(d => { setSlots(d.data?.slots || []); setLoadingSlots(false); })
      .catch(() => setLoadingSlots(false));
  }, [id, selectedDate]);

  const handleHoldSlot = async (slot: any) => {
    if (!profile) {
      router.push("/");
      return;
    }
    setHoldLoading(slot.startTime);
    setError("");
    try {
      const res = await fetch("/api/appointments/hold", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctor_id: id,
          start_time: slot.startTime,
          end_time: slot.endTime,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error?.message || "Failed to hold slot");
        return;
      }
      // Navigate to booking confirmation with appointment ID
      router.push(`/patient/book/${id}?appointment=${data.data.appointment_id}&hold=${data.data.hold_expires_at}`);
    } catch {
      setError("Failed to hold slot");
    } finally {
      setHoldLoading(null);
    }
  };

  if (!doctor) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="h-32 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4 text-sm">
        <ArrowLeft className="h-4 w-4" /> Back to doctors
      </button>

      {/* Doctor Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-cyan-100 rounded-full flex items-center justify-center">
            <CalendarDays className="h-8 w-8 text-cyan-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Dr. {doctor.profile?.full_name}</h1>
            <p className="text-cyan-600 font-medium">{doctor.specialisation}</p>
            <p className="text-sm text-gray-500 mt-1">{doctor.qualification} • {doctor.experience} years experience</p>
            {doctor.bio && <p className="text-sm text-gray-600 mt-2">{doctor.bio}</p>}
          </div>
        </div>
      </div>

      {/* Date Selection */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">Select a Date</h2>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {weekDays.map((day) => {
            const dateStr = format(day, "yyyy-MM-dd");
            const isSelected = selectedDate === dateStr;
            const isToday = dateStr === format(new Date(), "yyyy-MM-dd");
            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDate(dateStr)}
                className={`flex flex-col items-center min-w-[70px] p-3 rounded-lg border transition-colors ${
                  isSelected
                    ? "bg-cyan-50 border-cyan-300 text-cyan-700"
                    : "border-gray-200 hover:bg-gray-50 text-gray-700"
                }`}
              >
                <span className="text-xs font-medium">{format(day, "EEE")}</span>
                <span className={`text-lg font-bold ${isToday ? "text-cyan-600" : ""}`}>{format(day, "d")}</span>
                <span className="text-xs">{format(day, "MMM")}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Slots */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Available Slots</h2>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
        )}
        {loadingSlots ? (
          <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
            {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />)}
          </div>
        ) : slots.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No available slots for this date</p>
        ) : (
          <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
            {slots.map((slot, i) => (
              <button
                key={i}
                onClick={() => slot.available && handleHoldSlot(slot)}
                disabled={!slot.available || holdLoading === slot.startTime}
                className={`py-3 px-4 rounded-lg text-sm font-medium border transition-colors ${
                  !slot.available
                    ? "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed"
                    : holdLoading === slot.startTime
                    ? "bg-cyan-50 border-cyan-300 text-cyan-600"
                    : "bg-white border-gray-200 text-gray-700 hover:bg-cyan-50 hover:border-cyan-300 hover:text-cyan-700"
                }`}
              >
                {holdLoading === slot.startTime ? "Holding..." : format(new Date(slot.startTime), "h:mm a")}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
