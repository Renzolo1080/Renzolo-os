import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/** Runs before every signed-in page. Two jobs:
 *
 * 1. Keep the founder logged in. A Supabase login is a short-lived token
 *    (about an hour) plus a refresh token. This asks Supabase who the
 *    visitor is, which renews an expired token, and saves the renewed
 *    cookies on both the incoming request (so the page being rendered
 *    sees them) and the outgoing response (so the browser keeps them).
 *    Without this, a founder who left a tab open would be bounced to the
 *    login page — or hit an error — about an hour in.
 *
 * 2. Send anyone who is not logged in to /login before a protected page
 *    starts loading. Each page and API route still does its own check;
 *    this is the first line, not the only one. */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return response; // not configured yet: let the page's own check handle it

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
      },
    },
  });

  // getUser() checks with Supabase (it does not just trust the cookie) and
  // is what triggers the renewal. Nothing may run between creating the
  // client and this call.
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    // Supabase unreachable: treat as not logged in rather than erroring.
  }

  if (!user) {
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    login.search = "";
    return NextResponse.redirect(login);
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/assessment/:path*", "/advisor/:path*", "/tools/:path*", "/report/:path*", "/plan/:path*", "/market/:path*", "/coaching/:path*", "/coach/:path*"],
};
