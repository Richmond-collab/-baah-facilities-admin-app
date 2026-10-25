'use client';

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ApiError, apiRequest } from "../../lib/api";
import { saveAuthSession } from "../../lib/auth-session";
import type { AuthUser } from "../../lib/auth-session";

interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@ops.local");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const session = await apiRequest<LoginResponse>("auth/login", {
        method: "POST",
        body: { email, password },
        authenticated: false,
      });
      saveAuthSession(session.accessToken, session.user);
      router.replace("/");
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : "Unable to sign in. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-8 text-slate-100">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/80 shadow-2xl shadow-slate-950/40 lg:grid-cols-2">
        <div className="flex flex-col justify-between bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 p-8 text-white">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-100">Ops Platform</div>
            <h1 className="mt-6 text-4xl font-semibold">Mission control for daily operations.</h1>
          </div>

          <div className="mt-8 grid gap-4 text-sm text-blue-50/90">
            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">Live vehicle, maintenance, and visitor oversight.</div>
            <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-sm">Built for branch managers, security teams, and dispatchers.</div>
          </div>
        </div>

        <div className="p-8 sm:p-10">
          <div className="mb-8">
            <div className="text-sm font-medium text-blue-300">Welcome back</div>
            <h2 className="mt-2 text-3xl font-semibold text-white">Sign in</h2>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm text-slate-300">Email</span>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="name@company.com"
                className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-3 text-slate-100 outline-none ring-0 transition focus:border-blue-500"
                required
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm text-slate-300">Password</span>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-3 text-slate-100 outline-none transition focus:border-blue-500"
                required
              />
            </label>

            <div className="flex items-center justify-between text-sm text-slate-400">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="accent-blue-500" defaultChecked />
                Remember me
              </label>
              <span className="text-slate-500">Contact your administrator for account help</span>
            </div>

            {error && (
              <p role="alert" className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-blue-500 px-4 py-3 font-semibold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
