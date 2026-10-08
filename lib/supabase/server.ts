import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/** Server-side Supabase client for use in API routes and server components.
 * Reads/writes the auth cookie so a logged-in founder's session carries
 * through server-rendered pages and route handlers. */
export function createClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options) {
          cookieStore.set({ name, value: "", ...options });
        },
      },
    }
  );
}

/** Admin client (service role) — server-only, never imported in client
 * components. Used for webhook handlers (e.g. Flutterwave) that need to
 * write entitlements without a logged-in user session. */
export function createAdminClient() {
  const { createClient: createSupabaseClient } = require("@supabase/supabase-js");
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    // Server-only, one request at a time: never store or refresh a session.
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
