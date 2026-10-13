"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PasswordInput } from "@/components/PasswordInput";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (error) {
        setError(error.message);
        setStatus("error");
        return;
      }
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
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-md text-center space-y-3">
          <p>
            We sent a confirmation link to <strong className="break-all">{email}</strong>. Open it to confirm your
            account, then log in to take your free Quick Check.
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
    <main className="min-h-screen flex items-center justify-center px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold text-navy">Create your account</h1>
        <input
          className="w-full rounded border px-3 py-2"
          placeholder="Full name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />
        <input
          className="w-full rounded border px-3 py-2"
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
          className="w-full rounded bg-navy px-6 py-3 text-white font-semibold disabled:opacity-50"
        >
          {status === "loading" ? "Creating account…" : "Create account"}
        </button>
      </form>
    </main>
  );
}
