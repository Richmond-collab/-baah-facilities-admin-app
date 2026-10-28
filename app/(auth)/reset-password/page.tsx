"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ApiError, apiRequest } from "../../lib/api";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) {
      setError("This reset link is missing its token. Request a new link.");
      return;
    }
    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }
    setIsSubmitting(true);
    try {
      await apiRequest("auth/reset-password", {
        method: "POST",
        body: { token, newPassword: password },
        authenticated: false,
      });
      setComplete(true);
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : "Unable to reset your password. Request a new link and try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-8 text-slate-100">
      <section className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl">
        <p className="text-sm font-medium text-blue-300">Account recovery</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Set a new password</h1>
        {complete ? (
          <>
            <p role="status" className="mt-4 text-sm text-emerald-200">
              Your password was reset. Sign in with your new password.
            </p>
            <Link href="/login" className="mt-5 inline-block rounded-xl bg-blue-500 px-4 py-3 font-semibold text-white">
              Go to sign in
            </Link>
          </>
        ) : (
          <>
            <p className="mt-3 text-sm text-slate-400">Choose a password with at least 12 characters.</p>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm text-slate-300">New password</span>
                <input
                  type="password"
                  required
                  minLength={12}
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-white"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm text-slate-300">Confirm new password</span>
                <input
                  type="password"
                  required
                  minLength={12}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-white"
                />
              </label>
              {error && <p role="alert" className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl bg-blue-500 px-4 py-3 font-semibold text-white disabled:opacity-60"
              >
                {isSubmitting ? "Saving..." : "Reset password"}
              </button>
            </form>
          </>
        )}
        <Link href="/login" className="mt-5 inline-block text-sm text-blue-300 hover:text-blue-200">
          Back to sign in
        </Link>
      </section>
    </main>
  );
}
