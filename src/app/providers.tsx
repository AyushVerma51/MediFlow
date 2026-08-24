"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { isDemoMode, demoProfiles, demoUser, installDemoFetchInterceptor } from "@/lib/demo-data";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/types";

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  demoRole: string;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  refreshProfile: async () => {},
  demoRole: "PATIENT",
});

export function useAuth() {
  return useContext(AuthContext);
}

export function Providers({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [demoRole, setDemoRole] = useState("PATIENT");
  const supabase = createClient();

  useEffect(() => {
    // Install demo fetch interceptor once
    installDemoFetchInterceptor();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
    setProfile(data as Profile | null);
  };

  useEffect(() => {
    const init = async () => {
      // Check demo mode first
      if (isDemoMode()) {
        const role = (localStorage.getItem("demo_role") || "PATIENT") as keyof typeof demoProfiles;
        setDemoRole(role);
        setUser(demoUser as any);
        setProfile(demoProfiles[role] as Profile);
        setLoading(false);
        return;
      }

      // Normal Supabase auth
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        if (user) await fetchProfile(user.id);
      } catch {
        // Supabase not configured
      }
      setLoading(false);
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event: string, session: { user: User | null } | null) => {
      if (isDemoMode()) return; // Don't override demo mode
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      demoRole,
      refreshProfile: async () => {
        if (isDemoMode()) {
          const role = (localStorage.getItem("demo_role") || "PATIENT") as keyof typeof demoProfiles;
          setProfile(demoProfiles[role] as Profile);
          return;
        }
        if (user) await fetchProfile(user.id);
      },
    }}>
      {children}
    </AuthContext.Provider>
  );
}
