import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Public routes
  if (pathname === "/" || pathname === "/api/health" || pathname.startsWith("/api/auth")) {
    return supabaseResponse;
  }

  // Demo mode — allow all routes via cookie
  const demoMode = request.cookies.get("demo_mode");
  if (demoMode?.value === "true") {
    return supabaseResponse;
  }

  // Cron routes — check CRON_SECRET
  if (pathname.startsWith("/api/cron/")) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return supabaseResponse;
  }

  // Protected routes require auth
  if (!user) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Role-based route protection
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const role = profile.role;

  if (pathname.startsWith("/patient") && role !== "PATIENT") {
    return NextResponse.redirect(new URL(`/${role.toLowerCase()}/dashboard`, request.url));
  }

  if (pathname.startsWith("/doctor") && role !== "DOCTOR") {
    return NextResponse.redirect(new URL(`/${role.toLowerCase()}/dashboard`, request.url));
  }

  if (pathname.startsWith("/admin") && role !== "ADMIN") {
    return NextResponse.redirect(new URL(`/${role.toLowerCase()}/dashboard`, request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
