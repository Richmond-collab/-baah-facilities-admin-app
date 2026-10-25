'use client';

import { FormEvent } from "react";
import { DashboardShell } from "../dashboard-shell";
import { ApiError } from "../../lib/api";
import { useApiList, useApiMutation } from "../../lib/use-api-data";
import { useSyncExternalStore } from "react";
import { getUserSnapshot, subscribeToAuthSession } from "../../lib/auth-session";

interface Branch {
  id: string;
  name: string;
  city: string | null;
}

interface PackageRecord {
  id: string;
  trackingCode: string;
  description: string;
  fromBranchId: string;
  toBranchId: string;
  recipientName: string;
  status: string;
}

interface CreatePackage {
  trackingCode: string;
  description: string;
  toBranchId: string;
  recipientName: string;
}

interface PackageAction {
  id: string;
}

export default function PackagesPage() {
  const user = useSyncExternalStore(subscribeToAuthSession, getUserSnapshot, () => undefined);
  const packages = useApiList<PackageRecord>("packages", "packages");
  const branches = useApiList<Branch>("branches", "branches");
  const createPackage = useApiMutation<CreatePackage, PackageRecord>("packages", "packages", "POST");
  const dispatch = useApiMutation<PackageAction, PackageRecord>("packages", ({ id }) => `packages/${id}/dispatch`, "POST", () => ({}));
  const inTransit = useApiMutation<PackageAction, PackageRecord>("packages", ({ id }) => `packages/${id}/in-transit`, "POST", () => ({}));
  const receive = useApiMutation<PackageAction, PackageRecord>("packages", ({ id }) => `packages/${id}/receive`, "POST", () => ({}));

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const element = event.currentTarget;
    const form = new FormData(element);
    createPackage.mutate(
      {
        trackingCode: String(form.get("trackingCode") ?? "").trim(),
        description: String(form.get("description") ?? "").trim(),
        recipientName: String(form.get("recipientName") ?? "").trim(),
        toBranchId: String(form.get("toBranchId") ?? ""),
      },
      { onSuccess: () => element.reset() },
    );
  }

  const error = packages.error ?? branches.error ?? createPackage.error ?? dispatch.error ?? inTransit.error ?? receive.error;
  const actionBusy = dispatch.isPending || inTransit.isPending || receive.isPending;

  return (
    <DashboardShell>
      <div className="mb-5">
        <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Logistics</div>
        <h2 className="mt-1 text-2xl font-semibold text-white">Packages</h2>
      </div>
      {["ADMIN", "MANAGER", "STAFF", "SUPER_ADMIN"].includes(user?.role ?? "") && <form onSubmit={submit} className="mb-6 grid gap-3 rounded-2xl border border-slate-800 bg-slate-900/80 p-5 sm:grid-cols-2 xl:grid-cols-5">
        <input name="trackingCode" required placeholder="Tracking code" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white" />
        <input name="description" required placeholder="Package description" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white" />
        <input name="recipientName" required placeholder="Recipient" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white" />
        <select name="toBranchId" required defaultValue="" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white">
          <option value="" disabled>Destination branch</option>
          {(branches.data ?? []).filter((branch) => branch.id !== user?.branchId).map((branch) => (
            <option key={branch.id} value={branch.id}>{branch.name}{branch.city ? ` · ${branch.city}` : ""}</option>
          ))}
        </select>
        <button disabled={createPackage.isPending || branches.isPending} className="rounded-xl bg-cyan-500 px-3 py-2 font-medium text-slate-950 disabled:opacity-60">
          {createPackage.isPending ? "Saving..." : "Register package"}
        </button>
      </form>}
      {error && <p role="alert" className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">{error instanceof ApiError ? error.message : "Unable to complete the package request."}</p>}
      {packages.isPending ? <p className="text-slate-400">Loading packages...</p> : (
        <div className="space-y-3">
          {(packages.data ?? []).map((pkg) => (
            <article key={pkg.id} className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/80 p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="font-medium text-white">{pkg.trackingCode} · {pkg.recipientName}</h3>
                <p className="mt-1 text-sm text-slate-400">{pkg.description} · {pkg.fromBranchId} → {pkg.toBranchId}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-300">{pkg.status}</span>
                {pkg.status === "REGISTERED" && pkg.fromBranchId === user?.branchId && (
                  <button disabled={actionBusy} onClick={() => dispatch.mutate({ id: pkg.id })} className="rounded-lg bg-blue-500 px-3 py-1.5 text-sm font-medium text-white">Dispatch</button>
                )}
                {pkg.status === "DISPATCHED" && pkg.fromBranchId === user?.branchId && (
                  <button disabled={actionBusy} onClick={() => inTransit.mutate({ id: pkg.id })} className="rounded-lg bg-blue-500 px-3 py-1.5 text-sm font-medium text-white">Mark in transit</button>
                )}
                {["DISPATCHED", "IN_TRANSIT"].includes(pkg.status) && pkg.toBranchId === user?.branchId && (
                  <button disabled={actionBusy} onClick={() => receive.mutate({ id: pkg.id })} className="rounded-lg bg-emerald-500 px-3 py-1.5 text-sm font-medium text-slate-950">Receive</button>
                )}
              </div>
            </article>
          ))}
          {!packages.data?.length && <p className="text-slate-400">No packages found.</p>}
        </div>
      )}
    </DashboardShell>
  );
}
