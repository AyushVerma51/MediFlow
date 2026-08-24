"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Clock, FlaskConical, AlertCircle, Info } from "lucide-react";
import { format } from "date-fns";
import { isDemoMode, demoAppointments } from "@/lib/demo-data";

export default function PatientAppointmentDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [appointment, setAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemoMode()) {
      // Always use the full demo data, not the list-filtered version
      const appt = demoAppointments.find(a => a.id === id);
      setAppointment(appt || demoAppointments[1]); // appt-002 has full post-visit data
      setLoading(false);
      return;
    }
    fetch(`/api/appointments/${id}`).then(r => r.json()).then(d => {
      setAppointment(d.data);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <div className="p-6"><div className="animate-pulse space-y-4"><div className="h-8 bg-gray-200 rounded w-48" /><div className="h-48 bg-gray-200 rounded" /></div></div>;
  if (!appointment) return <div className="p-6 text-center py-20 text-gray-500">Appointment not found</div>;

  const postVisit = Array.isArray(appointment.post_visit_summaries) ? appointment.post_visit_summaries[0] : appointment.post_visit_summaries;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4 text-sm">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      {/* Appointment Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h1 className="text-xl font-bold text-gray-900 mb-4">Appointment Details</h1>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-gray-500">Doctor:</span> <span className="font-medium ml-2">Dr. {appointment.doctor?.profile?.full_name}</span></div>
          <div><span className="text-gray-500">Specialisation:</span> <span className="font-medium ml-2">{appointment.doctor?.specialisation}</span></div>
          <div><span className="text-gray-500">Date:</span> <span className="font-medium ml-2">{format(new Date(appointment.start_time), "MMMM d, yyyy")}</span></div>
          <div><span className="text-gray-500">Time:</span> <span className="font-medium ml-2">{format(new Date(appointment.start_time), "h:mm a")} - {format(new Date(appointment.end_time), "h:mm a")}</span></div>
          <div><span className="text-gray-500">Status:</span> <span className="font-medium ml-2 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">{appointment.status}</span></div>
        </div>
      </div>

      {/* Post-Visit Summary */}
      {postVisit?.is_available && (
        <div className="bg-green-50 rounded-xl border border-green-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Your Visit Summary</h2>
          <p className="text-xs text-green-600 italic mb-3">AI-generated patient-friendly summary. Not a medical record.</p>
          <p className="text-sm text-gray-700 mb-4">{postVisit.summary}</p>

          {postVisit.medications && (
            <div className="mb-4">
              <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2"><FlaskConical className="h-4 w-4" /> Medications</h3>
              {(typeof postVisit.medications === "string" ? JSON.parse(postVisit.medications) : postVisit.medications).map((med: any, i: number) => (
                <div key={i} className="p-3 bg-white rounded-lg mb-2 border border-green-100">
                  <p className="font-medium text-gray-900">{med.name}</p>
                  <p className="text-sm text-gray-600">{med.instructions}</p>
                </div>
              ))}
            </div>
          )}

          {postVisit.follow_up_steps && (
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Follow-up Steps</h3>
              <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1">
                {(typeof postVisit.follow_up_steps === "string" ? JSON.parse(postVisit.follow_up_steps) : postVisit.follow_up_steps).map((step: string, i: number) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}

      {/* Prescriptions */}
      {appointment.prescriptions?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Prescriptions</h2>
          {appointment.prescriptions.map((rx: any) =>
            rx.prescription_medications?.map((med: any) => (
              <div key={med.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg mb-2">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{med.medication_name}</p>
                  <p className="text-sm text-gray-500">{med.dosage} • {med.frequency} • {med.duration}</p>
                </div>
                {med.instructions && <p className="text-xs text-gray-400">{med.instructions}</p>}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
