"use client";

import { useAuth } from "@/app/providers";
import { isDemoMode, demoProfiles } from "@/lib/demo-data";
import { CircleUser, Mail, Phone, Calendar } from "lucide-react";

export default function ProfilePage() {
  const { profile } = useAuth();

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
            <h2 className="text-xl font-semibold text-gray-900">{profile.full_name}</h2>
            <p className="text-cyan-600 font-medium">{profile.role}</p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Mail className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-700">{profile.email}</span>
          </div>
          {profile.phone && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Phone className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-700">{profile.phone}</span>
            </div>
          )}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-700">Member since {new Date(profile.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
