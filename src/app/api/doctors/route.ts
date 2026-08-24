import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { successResponse, handleApiError } from "@/lib/errors";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const specialisation = searchParams.get("specialisation");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");

    const admin = createAdminClient();

    let query = admin
      .from("doctor_profiles")
      .select("*, profile:profiles!doctor_profiles_user_id_fkey(id, full_name, email, avatar_url, phone)", { count: "exact" })
      .eq("profiles.is_active", true);

    if (specialisation) {
      query = query.ilike("specialisation", `%${specialisation}%`);
    }

    if (search) {
      query = query.or(`specialisation.ilike.%${search}%,qualification.ilike.%${search}%`);
    }

    const { data, error, count } = await query
      .range((page - 1) * pageSize, page * pageSize - 1)
      .order("created_at", { ascending: false });

    if (error) {
      return handleApiError(error);
    }

    return successResponse({
      items: data || [],
      total: count || 0,
      page,
      pageSize,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
