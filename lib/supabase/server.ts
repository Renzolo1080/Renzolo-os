import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

/** Server-side Supabase client for use in API routes and server components.
 * Reads/writes the auth cookies so a logged-in founder's session carries
 * through server-rendered pages and route handlers.
 *
 * Writing cookies is only allowed in route handlers and the proxy, not
 * while a page is rendering. If Supabase needs to save a refreshed login
 * during a page render, that write is skipped here on purpose — the
 * proxy (proxy.ts) has already refreshed and saved it for this
 * request, so nothing is lost, and the page doesn't crash. */
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) cookieStore.set(name, value, options);
        } catch {
          // Called while rendering a page: see the note above.
        }
      },
    },
  });
}

/** Admin client (service role) — server-only, never imported in client
 * components. Used where the server must write something a founder's own
 * session is not allowed to (scores, reports, payments, subscriptions). */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    // Server-only, one request at a time: never store or refresh a session.
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
