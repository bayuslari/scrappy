"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);
    if (error) setError(error.message);
    else setSent(true);
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold">Job Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          Sign in with a magic link sent to your email.
        </p>

        {sent ? (
          <div className="mt-6 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800">
            Check your inbox — we sent a sign-in link to{" "}
            <span className="font-medium">{email}</span>.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send magic link"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
