import { NextResponse, type NextRequest } from "next/server";

// Placeholder — Supabase's @supabase/ssr package can refresh the auth
// session here once the project is wired to a live Supabase instance.
// Kept intentionally minimal for the Launch MVP; route-level auth checks
// (see app/dashboard/page.tsx and the API routes) already enforce login.
export function middleware(_req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/assessment/:path*"],
};
