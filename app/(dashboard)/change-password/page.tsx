"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { DashboardShell } from "../dashboard-shell";
import { ApiError, apiRequest } from "../../lib/api";
import { clearAuthSession } from "../../lib/auth-session";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (newPassword !== confirmPassword) {
      setError("The new passwords do not match.");
      return;
    }
    setIsSubmitting(true);
    try {
      await apiRequest("auth/change-password", {
        method: "POST",
        body: { currentPassword, newPassword },
      });
      clearAuthSession();
      setComplete(true);
    } catch (cause) {
      setError(
        cause instanceof ApiError ? cause.message : "Unable to change password.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <DashboardShell>
      <section className="mx-auto max-w-xl rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Account security</p>
        <h2 className="mt-1 text-2xl font-semibold text-white">Change password</h2>
        {complete ? (
          <>
            <p role="status" className="mt-4 text-sm text-emerald-200">
              Your password has been changed and your other sessions have been signed out.
            </p>
            <button
              type="button"
              onClick={() => router.replace("/login")}
              className="mt-5 rounded-xl bg-blue-500 px-4 py-2 font-medium text-white"
            >
              Sign in with your new password
            </button>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm text-slate-300">Current password</span>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-white"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm text-slate-300">New password</span>
              <input
                type="password"
                required
                minLength={12}
                autoComplete="new-password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
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
              className="rounded-xl bg-blue-500 px-4 py-2 font-medium text-white disabled:opacity-60"
            >
              {isSubmitting ? "Saving..." : "Change password"}
            </button>
          </form>
        )}
        {!complete && (
          <Link href="/" className="ml-4 text-sm text-blue-300 hover:text-blue-200">
            Cancel
          </Link>
        )}
      </section>
    </DashboardShell>
  );
}
