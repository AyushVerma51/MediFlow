"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/providers";
import { Clock, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";
import { format } from "date-fns";

export default function BookAppointmentPage() {
  const { doctorId } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { profile } = useAuth();
  const appointmentId = searchParams.get("appointment");
  const holdExpires = searchParams.get("hold");

  const [timeLeft, setTimeLeft] = useState("");
  const [symptoms, setSymptoms] = useState({
    chief_complaint: "",
    symptoms: "",
    duration: "",
    severity: "Moderate",
    additional_information: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Hold countdown timer
  useEffect(() => {
    if (!holdExpires) return;
    const expiry = new Date(holdExpires).getTime();
    const interval = setInterval(() => {
      const now = Date.now();
      const diff = expiry - now;
      if (diff <= 0) {
        setTimeLeft("EXPIRED");
        clearInterval(interval);
        return;
      }
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [holdExpires]);

  const handleConfirm = async () => {
    if (!appointmentId || !profile) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointment_id: appointmentId, symptoms }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error?.message || "Booking failed");
        return;
      }
      setSuccess(true);
      setTimeout(() => router.push("/patient/appointments"), 2000);
    } catch {
      setError("Booking failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="p-6 max-w-2xl mx-auto text-center py-20">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Appointment Confirmed!</h1>
        <p className="text-gray-500">Redirecting to your appointments...</p>
      </div>
    );
  }

  if (timeLeft === "EXPIRED") {
    return (
      <div className="p-6 max-w-2xl mx-auto text-center py-20">
        <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Slot Hold Expired</h1>
        <p className="text-gray-500 mb-4">Your reserved slot has expired. Please select a new slot.</p>
        <button onClick={() => router.push(`/patient/doctors/${doctorId}`)} className="px-6 py-2.5 bg-cyan-600 text-white rounded-lg font-medium hover:bg-cyan-700">
          Select New Slot
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4 text-sm">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      {/* Hold Timer */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center gap-3">
        <Clock className="h-5 w-5 text-amber-600" />
        <div>
          <p className="text-sm font-medium text-amber-800">Slot Reserved</p>
          <p className="text-lg font-bold text-amber-900">{timeLeft}</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}

      {/* Symptom Form */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Describe Your Symptoms</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Chief Complaint *</label>
            <input
              type="text"
              value={symptoms.chief_complaint}
              onChange={e => setSymptoms(s => ({ ...s, chief_complaint: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
              placeholder="What brings you in today?"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Symptoms *</label>
            <textarea
              value={symptoms.symptoms}
              onChange={e => setSymptoms(s => ({ ...s, symptoms: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
              rows={3}
              placeholder="Describe your symptoms in detail..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
              <input
                type="text"
                value={symptoms.duration}
                onChange={e => setSymptoms(s => ({ ...s, duration: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
                placeholder="e.g., 3 days"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
              <select
                value={symptoms.severity}
                onChange={e => setSymptoms(s => ({ ...s, severity: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
              >
                <option value="Mild">Mild</option>
                <option value="Moderate">Moderate</option>
                <option value="Severe">Severe</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Additional Information</label>
            <textarea
              value={symptoms.additional_information}
              onChange={e => setSymptoms(s => ({ ...s, additional_information: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
              rows={2}
              placeholder="Any other relevant information..."
            />
          </div>
          <button
            onClick={handleConfirm}
            disabled={loading || !symptoms.chief_complaint || !symptoms.symptoms}
            className="w-full py-3 bg-cyan-600 text-white rounded-lg font-medium hover:bg-cyan-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Confirming..." : "Confirm Appointment"}
          </button>
        </div>
      </div>
    </div>
  );
}
