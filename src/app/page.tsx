"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "./providers";
import { useEffect } from "react";
import { setDemoMode, demoProfiles, demoUser, installDemoFetchInterceptor } from "@/lib/demo-data";
import { Play, Zap } from "lucide-react";

export default function HomePage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"PATIENT" | "DOCTOR" | "ADMIN">("PATIENT");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [demoRole, setDemoRole] = useState<"PATIENT" | "DOCTOR" | "ADMIN">("PATIENT");
  const supabase = createClient();

  useEffect(() => {
    installDemoFetchInterceptor();
    if (!loading && profile) {
      router.push(`/${profile.role.toLowerCase()}/dashboard`);
    }
  }, [loading, profile, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      if (mode === "login") {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw new Error(authError.message);
      } else {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, full_name: fullName, role }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error?.message || "Registration failed");
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw new Error(authError.message);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemo = (selectedRole: "PATIENT" | "DOCTOR" | "ADMIN") => {
    installDemoFetchInterceptor();
    localStorage.setItem("demo_mode", "true");
    localStorage.setItem("demo_role", selectedRole);
    setDemoMode(true);
    // Force reload to trigger providers with demo data
    window.location.href = `/${selectedRole.toLowerCase()}/dashboard`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600" />
      </div>
    );
  }

  if (profile) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 to-blue-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-cyan-700">MediFlow</h1>
          <p className="text-gray-500 mt-2">Healthcare Appointment & Follow-up Manager</p>
        </div>

        {/* Demo Banner */}
        <div className="bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl p-5 mb-6 text-white shadow-lg">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <Play className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">Explore the Demo</h2>
              <p className="text-cyan-100 text-sm">Experience the full application — no setup required</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(["PATIENT", "DOCTOR", "ADMIN"] as const).map(r => (
              <button
                key={r}
                onClick={() => handleDemo(r)}
                className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-lg transition-all ${
                  demoRole === r
                    ? "bg-white text-cyan-700 shadow-md"
                    : "bg-white/15 hover:bg-white/25 text-white"
                }`}
              >
                <Zap className="h-4 w-4" />
                <span className="text-xs font-bold">{r === "PATIENT" ? "Patient" : r === "DOCTOR" ? "Doctor" : "Admin"}</span>
                <span className="text-[10px] opacity-80">
                  {r === "PATIENT" ? "Book & manage" : r === "DOCTOR" ? "Consultations" : "Full control"}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="text-center text-xs text-gray-400 mb-4">— or sign in normally —</div>

        {/* Auth Form */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setMode("login")}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                mode === "login" ? "bg-white text-cyan-700 shadow" : "text-gray-500"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode("register")}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                mode === "register" ? "bg-white text-cyan-700 shadow" : "text-gray-500"
              }`}
            >
              Register
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={role}
                    onChange={e => setRole(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
                  >
                    <option value="PATIENT">Patient</option>
                    <option value="DOCTOR">Doctor</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
              </>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-cyan-600 text-white rounded-lg text-sm font-medium hover:bg-cyan-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 text-center mb-2">Demo Accounts (password: password123)</p>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button onClick={() => { setEmail("admin@example.com"); setPassword("password123"); setMode("login"); }} className="p-2 bg-gray-50 rounded text-center hover:bg-gray-100 transition-colors">
                <span className="font-medium text-gray-700">Admin</span>
              </button>
              <button onClick={() => { setEmail("doctor@example.com"); setPassword("password123"); setMode("login"); }} className="p-2 bg-gray-50 rounded text-center hover:bg-gray-100 transition-colors">
                <span className="font-medium text-gray-700">Doctor</span>
              </button>
              <button onClick={() => { setEmail("patient@example.com"); setPassword("password123"); setMode("login"); }} className="p-2 bg-gray-50 rounded text-center hover:bg-gray-100 transition-colors">
                <span className="font-medium text-gray-700">Patient</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
