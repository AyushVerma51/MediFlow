"use client";

import { useEffect, useState } from "react";
import { FlaskConical, Clock } from "lucide-react";
import { isDemoMode, demoPrescriptions } from "@/lib/demo-data";

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isDemoMode()) { setPrescriptions(demoPrescriptions); setLoading(false); return; }
    fetch("/api/prescriptions").then(r => r.json()).then(d => {
      setPrescriptions(d.data?.items || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Prescriptions</h1>
      {loading ? (
        <div className="space-y-3">{[1, 2].map(i => <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : prescriptions.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <FlaskConical className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">No prescriptions yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {prescriptions.map(rx => (
            <div key={rx.id} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-3">
                <FlaskConical className="h-5 w-5 text-cyan-600" />
                <h3 className="font-medium text-gray-900">Prescription</h3>
                <span className="text-xs text-gray-400 ml-auto">{new Date(rx.created_at).toLocaleDateString()}</span>
              </div>
              {rx.prescription_medications?.map((med: any) => (
                <div key={med.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg mb-2">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{med.medication_name}</p>
                    <p className="text-sm text-gray-500">{med.dosage} • {med.frequency} • {med.duration}</p>
                  </div>
                  {med.instructions && <p className="text-xs text-gray-400 max-w-[200px]">{med.instructions}</p>}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
