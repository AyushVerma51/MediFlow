"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/app/providers";
import { createClient } from "@/lib/supabase/client";
import { isDemoMode, setDemoMode } from "@/lib/demo-data";
import {
  LayoutDashboard, Calendar, FileText, Bell, LogOut,
  ClipboardList, Clock, ChevronRight, Group, Hospital,
  Cog, AlignJustify, CircleX, FlaskConical,
} from "lucide-react";
import { useState } from "react";

const navItems: Record<string, { label: string; href: string; icon: React.ElementType }[]> = {
  PATIENT: [
    { label: "Dashboard", href: "/patient/dashboard", icon: LayoutDashboard },
    { label: "Find Doctors", href: "/patient/doctors", icon: Hospital },
    { label: "Appointments", href: "/patient/appointments", icon: Calendar },
    { label: "Prescriptions", href: "/patient/prescriptions", icon: FlaskConical },
    { label: "Reminders", href: "/patient/reminders", icon: Bell },
    { label: "Profile", href: "/patient/profile", icon: Cog },
  ],
  DOCTOR: [
    { label: "Dashboard", href: "/doctor/dashboard", icon: LayoutDashboard },
    { label: "Appointments", href: "/doctor/appointments", icon: Calendar },
    { label: "Profile", href: "/doctor/profile", icon: Cog },
  ],
  ADMIN: [
    { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Doctors", href: "/admin/doctors", icon: Group },
    { label: "Appointments", href: "/admin/appointments", icon: ClipboardList },
    { label: "Leave Management", href: "/admin/leave", icon: Calendar },
    { label: "Notifications", href: "/admin/notifications", icon: Bell },
  ],
};

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, loading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    if (isDemoMode()) {
      localStorage.removeItem("demo_mode");
      localStorage.removeItem("demo_role");
      document.cookie = "demo_mode=; path=/; max-age=0";
      window.location.href = "/";
      return;
    }
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  if (loading || !profile) {
    return (
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-200 p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-8 bg-gray-200 rounded w-32" />
          <div className="h-4 bg-gray-200 rounded w-24" />
          <div className="space-y-2 mt-6">
            {[1, 2, 3].map(i => <div key={i} className="h-10 bg-gray-100 rounded" />)}
          </div>
        </div>
      </aside>
    );
  }

  const items = navItems[profile.role] || navItems.PATIENT;

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow border border-gray-200"
      >
        <AlignJustify className="h-5 w-5 text-gray-600" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-white border-r border-gray-200
        flex flex-col transition-transform duration-200
        ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div>
            <h1 className="text-lg font-bold text-cyan-700">MediFlow</h1>
            <div className="flex items-center gap-2">
              <p className="text-xs text-gray-500">{profile.role}</p>
              {isDemoMode() && <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] font-medium">DEMO</span>}
            </div>
          </div>
          <button onClick={() => setMobileOpen(false)} className="lg:hidden p-1">
            <CircleX className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {items.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-cyan-50 text-cyan-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-gray-100">
          <div className="px-3 py-2 mb-2">
            <p className="text-sm font-medium text-gray-900">{profile.full_name}</p>
            <p className="text-xs text-gray-500">{profile.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            {isDemoMode() ? "Exit Demo" : "Sign Out"}
          </button>
        </div>
      </aside>
    </>
  );
}
