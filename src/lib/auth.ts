import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { UnauthorizedError, ForbiddenError } from "@/lib/errors";
import type { Profile, UserRole } from "@/types";

// Get the current authenticated user
export async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    throw new UnauthorizedError();
  }

  return user;
}

// Get the current user's profile
export async function getCurrentProfile(): Promise<Profile> {
  const user = await getCurrentUser();
  const admin = createAdminClient();

  const { data: profile, error } = await admin
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    throw new UnauthorizedError("Profile not found");
  }

  return profile as Profile;
}

// Require a specific role
export async function requireRole(...roles: UserRole[]): Promise<Profile> {
  const profile = await getCurrentProfile();

  if (!roles.includes(profile.role)) {
    throw new ForbiddenError(`Required role: ${roles.join(" or ")}`);
  }

  return profile;
}

// Get doctor profile for current user
export async function getCurrentDoctorProfile() {
  const profile = await requireRole("DOCTOR");
  const admin = createAdminClient();

  const { data: doctorProfile, error } = await admin
    .from("doctor_profiles")
    .select("*")
    .eq("user_id", profile.id)
    .single();

  if (error || !doctorProfile) {
    throw new ForbiddenError("Doctor profile not found");
  }

  return { profile, doctorProfile };
}

// Get user from request (for route handlers)
export async function getUserFromRequest(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return { user, profile: profile as Profile | null };
}
