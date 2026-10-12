"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PasswordInput } from "@/components/PasswordInput";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
        return;
      }
      router.push("/dashboard");
    } catch (err) {
      console.error("Login failed:", err);
      setError(
        err instanceof Error
          ? `Couldn't reach the login service: ${err.message}`
          : "Couldn't reach the login service. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold text-navy">Log in</h1>
        <input
          className="w-full rounded border px-3 py-2"
          type="email"
          autoComplete="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <PasswordInput value={password} onChange={setPassword} autoComplete="current-password" />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <p className="text-sm text-ink-soft">
          New here?{" "}
          <a href="/register" className="text-teal underline">
            Create an account
          </a>
        </p>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-navy px-6 py-3 text-white font-semibold disabled:opacity-50"
        >
          {loading ? "Logging in…" : "Log in"}
        </button>
      </form>
    </main>
  );
}
