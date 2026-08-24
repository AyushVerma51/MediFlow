"use client";

import { useAuth } from "@/app/providers";
import { CircleUser, Mail, Hospital } from "lucide-react";
import { useEffect, useState } from "react";

export default function DoctorProfile() {
  const { profile } = useAuth();
  const [doctorProfile, setDoctorProfile] = useState<any>(null);

  useEffect(() => {
    if (profile) {
      fetch(`/api/doctors?search=${profile.full_name}`).then(r => r.json()).then(d => {
        setDoctorProfile(d.data?.items?.[0]);
      });
    }
  }, [profile]);

  if (!profile) return <div className="p-6"><div className="animate-pulse h-48 bg-gray-100 rounded-xl" /></div>;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-cyan-100 rounded-full flex items-center justify-center">
            <CircleUser className="h-8 w-8 text-cyan-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Dr. {profile.full_name}</h2>
            <p className="text-cyan-600 font-medium">{doctorProfile?.specialisation || "Doctor"}</p>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Mail className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-700">{profile.email}</span>
          </div>
          {doctorProfile && (
            <>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Hospital className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-700">{doctorProfile.qualification}</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Experience</p>
                <p className="text-sm font-medium text-gray-900">{doctorProfile.experience} years</p>
              </div>
              {doctorProfile.bio && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Bio</p>
                  <p className="text-sm text-gray-700">{doctorProfile.bio}</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
