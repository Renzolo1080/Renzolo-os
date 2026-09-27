"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

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
        <p className="max-w-md text-center">
          Check your email to confirm your account, then log in to start your Readiness Assessment.
        </p>
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
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="w-full rounded border px-3 py-2"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
        />
        {error && <p className="text-red-600 text-sm">{error}</p>}
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
