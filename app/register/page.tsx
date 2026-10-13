"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PasswordInput } from "@/components/PasswordInput";
import { track } from "@/lib/track";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [marketingConsent, setMarketingConsent] = useState(false);

  // Coming from the free Snapshot: fill in the name and email they gave,
  // so their Snapshot is matched to the new account.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const e = q.get("email");
    const n = q.get("name");
    if (e) setEmail(e);
    if (n) setFullName(n);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, marketing_consent: marketingConsent } },
      });
      if (error) {
        setError(error.message);
        setStatus("error");
        return;
      }
      track("sign_up");
      setStatus("sent");
    } catch (err) {
      console.error("Registration failed:", err);
      setError(
        err instanceof Error
          ? `Couldn't reach the signup service: ${err.message}`
          : "Couldn't reach the signup service. Please try again."
      );
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <main className="flex min-h-[70vh] items-center justify-center px-4 py-12 sm:px-6">
        <div className="max-w-md space-y-3 rounded-2xl bg-white p-6 text-center shadow-sm sm:p-8">
          <p>
            We sent a confirmation link to <strong className="break-all">{email}</strong>. Open it to confirm your
            account, then log in. If you took the free Readiness Snapshot with this email, your results will be waiting.
          </p>
          <p className="text-sm text-ink-soft">
            Not the right email?{" "}
            <button type="button" className="text-teal underline" onClick={() => setStatus("idle")}>
              Go back and fix it
            </button>
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4 py-12 sm:px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-bold text-navy">Create your account</h1>
        <p className="text-sm text-ink-soft">Your Founder Trajectory™ starts here.</p>
        <input
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:border-navy focus:outline-none"
          autoComplete="name"
          placeholder="Full name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />
        <input
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 focus:border-navy focus:outline-none"
          type="email"
          autoComplete="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <PasswordInput
          value={password}
          onChange={setPassword}
          placeholder="Password (at least 8 characters)"
          minLength={8}
          autoComplete="new-password"
        />
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" className="mt-1" checked={marketingConsent} onChange={(e) => setMarketingConsent(e.target.checked)} />
          <span>Email me practical tips for growing my venture. You can unsubscribe at any time.</span>
        </label>
        <p className="text-xs text-ink-soft">
          By creating an account you agree to our <a href="/terms" className="underline">terms</a> and{" "}
          <a href="/privacy" className="underline">privacy policy</a>.
        </p>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <p className="text-sm text-ink-soft">
          Already have an account?{" "}
          <a href="/login" className="text-teal underline">
            Log in
          </a>
        </p>
        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full rounded-lg bg-navy px-6 py-3 text-white font-semibold disabled:opacity-50"
        >
          {status === "loading" ? "Creating account…" : "Create account"}
        </button>
      </form>
    </main>
  );
}
