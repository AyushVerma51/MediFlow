"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Clock, AlertCircle, CheckCircle, FlaskConical } from "lucide-react";
import { format } from "date-fns";
import { isDemoMode, demoDoctorAppointments } from "@/lib/demo-data";

export default function DoctorAppointmentDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [appointment, setAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [consultation, setConsultation] = useState({
    clinical_notes: "",
    diagnosis: "",
    treatment_plan: "",
    follow_up_instructions: "",
  });
  const [medications, setMedications] = useState([{ medication_name: "", dosage: "", frequency: "", duration: "", start_date: "", end_date: "", instructions: "" }]);
  const [submitting, setSubmitting] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (isDemoMode()) {
      const appt = demoDoctorAppointments.find(a => a.id === id) || demoDoctorAppointments[0];
      setAppointment(appt);
      setLoading(false);
      return;
    }
    fetch(`/api/appointments/${id}`).then(r => r.json()).then(d => {
      setAppointment(d.data);
      setLoading(false);
    });
  }, [id]);

  const handleSaveConsultation = async () => {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/appointments/${id}/consultation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(consultation),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error?.message);
      setSuccess("Consultation notes saved");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSavePrescription = async () => {
    setSubmitting(true);
    setError("");
    try {
      const validMeds = medications.filter(m => m.medication_name);
      if (!validMeds.length) throw new Error("Add at least one medication");
      const res = await fetch(`/api/appointments/${id}/prescription`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ medications: validMeds }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error?.message);
      setSuccess("Prescription saved");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplete = async () => {
    setCompleting(true);
    setError("");
    try {
      const res = await fetch(`/api/appointments/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "COMPLETED" }) });
      const data = await res.json();
      if (!data.success) throw new Error(data.error?.message);
      setSuccess("Appointment completed! Generating post-visit summary...");
      setTimeout(() => router.push("/doctor/appointments"), 2000);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCompleting(false);
    }
  };

  const urgencyColors: Record<string, string> = { LOW: "bg-green-100 text-green-700", MEDIUM: "bg-amber-100 text-amber-700", HIGH: "bg-red-100 text-red-700" };

  if (loading) return <div className="p-6"><div className="animate-pulse space-y-4"><div className="h-8 bg-gray-200 rounded w-48" /><div className="h-48 bg-gray-200 rounded" /></div></div>;
  if (!appointment) return <div className="p-6 text-center py-20 text-gray-500">Appointment not found</div>;

  const symptoms = appointment.appointment_symptoms;
  const aiSummary = appointment.ai_previsit_summaries;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4 text-sm">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
      {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">{success}</div>}

      {/* Patient Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Patient Information</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-gray-500">Name:</span> <span className="font-medium ml-2">{appointment.patient?.full_name}</span></div>
          <div><span className="text-gray-500">Email:</span> <span className="font-medium ml-2">{appointment.patient?.email}</span></div>
          <div><span className="text-gray-500">Date:</span> <span className="font-medium ml-2">{format(new Date(appointment.start_time), "MMMM d, yyyy")}</span></div>
          <div><span className="text-gray-500">Time:</span> <span className="font-medium ml-2">{format(new Date(appointment.start_time), "h:mm a")} - {format(new Date(appointment.end_time), "h:mm a")}</span></div>
        </div>
      </div>

      {/* Symptoms */}
      {symptoms && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Patient Symptoms</h2>
          <div className="space-y-2 text-sm">
            <div><span className="text-gray-500">Chief Complaint:</span> <span className="ml-2 font-medium">{symptoms.chief_complaint}</span></div>
            <div><span className="text-gray-500">Symptoms:</span> <span className="ml-2">{symptoms.symptoms}</span></div>
            {symptoms.duration && <div><span className="text-gray-500">Duration:</span> <span className="ml-2">{symptoms.duration}</span></div>}
            {symptoms.severity && <div><span className="text-gray-500">Severity:</span> <span className="ml-2">{symptoms.severity}</span></div>}
          </div>
        </div>
      )}

      {/* AI Summary */}
      {aiSummary?.is_available && (
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">AI Pre-Visit Summary</h2>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${urgencyColors[aiSummary.urgency] || ""}`}>{aiSummary.urgency}</span>
          </div>
          <p className="text-xs text-blue-600 italic mb-3">AI-generated summary for clinical assistance. This is not a diagnosis.</p>
          {aiSummary.chief_complaint && <div className="mb-2"><span className="text-gray-600 text-sm">Chief Complaint:</span> <span className="text-sm ml-2">{aiSummary.chief_complaint}</span></div>}
          {aiSummary.suggested_questions && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Suggested Questions:</p>
              <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1">
                {(Array.isArray(aiSummary.suggested_questions) ? aiSummary.suggested_questions : JSON.parse(aiSummary.suggested_questions || "[]")).map((q: string, i: number) => <li key={i}>{q}</li>)}
              </ol>
            </div>
          )}
        </div>
      )}

      {!aiSummary?.is_available && aiSummary !== null && (
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 mb-6 text-sm text-gray-500">
          AI summary unavailable. Please review the patient&apos;s original symptoms above.
        </div>
      )}

      {/* Consultation Form */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Clinical Notes</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Clinical Notes *</label>
            <textarea value={consultation.clinical_notes} onChange={e => setConsultation(c => ({ ...c, clinical_notes: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none" rows={4} placeholder="Enter clinical observations..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis</label>
              <input type="text" value={consultation.diagnosis} onChange={e => setConsultation(c => ({ ...c, diagnosis: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none" placeholder="Diagnosis" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Treatment Plan</label>
              <input type="text" value={consultation.treatment_plan} onChange={e => setConsultation(c => ({ ...c, treatment_plan: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none" placeholder="Treatment plan" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up Instructions</label>
            <textarea value={consultation.follow_up_instructions} onChange={e => setConsultation(c => ({ ...c, follow_up_instructions: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none" rows={2} placeholder="Follow-up instructions..." />
          </div>
          <button onClick={handleSaveConsultation} disabled={submitting || !consultation.clinical_notes} className="px-6 py-2 bg-cyan-600 text-white rounded-lg text-sm font-medium hover:bg-cyan-700 disabled:opacity-50">
            {submitting ? "Saving..." : "Save Consultation"}
          </button>
        </div>
      </div>

      {/* Prescription */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Prescriptions</h2>
        {medications.map((med, i) => (
          <div key={i} className="grid grid-cols-4 gap-3 mb-3 p-3 bg-gray-50 rounded-lg">
            <input placeholder="Medication" value={med.medication_name} onChange={e => { const m = [...medications]; m[i].medication_name = e.target.value; setMedications(m); }} className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" />
            <input placeholder="Dosage" value={med.dosage} onChange={e => { const m = [...medications]; m[i].dosage = e.target.value; setMedications(m); }} className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" />
            <input placeholder="Frequency" value={med.frequency} onChange={e => { const m = [...medications]; m[i].frequency = e.target.value; setMedications(m); }} className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" />
            <input placeholder="Duration" value={med.duration} onChange={e => { const m = [...medications]; m[i].duration = e.target.value; setMedications(m); }} className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none" />
          </div>
        ))}
        <div className="flex gap-3">
          <button onClick={() => setMedications([...medications, { medication_name: "", dosage: "", frequency: "", duration: "", start_date: "", end_date: "", instructions: "" }])} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">
            + Add Medication
          </button>
          <button onClick={handleSavePrescription} disabled={submitting} className="px-6 py-2 bg-cyan-600 text-white rounded-lg text-sm font-medium hover:bg-cyan-700 disabled:opacity-50">
            Save Prescription
          </button>
        </div>
      </div>

      {/* Complete */}
      {appointment.status === "CONFIRMED" && (
        <button onClick={handleComplete} disabled={completing} className="w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50">
          {completing ? "Completing..." : "Complete Consultation"}
        </button>
      )}
    </div>
  );
}
