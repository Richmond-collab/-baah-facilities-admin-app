'use client';

import { FormEvent, useMemo, useState } from "react";
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
  const [destinationQuery, setDestinationQuery] = useState("");
  const [destinationBranchId, setDestinationBranchId] = useState("");
  const [destinationError, setDestinationError] = useState("");
  const packages = useApiList<PackageRecord>("packages", "packages");
  const branches = useApiList<Branch>("branches", "branches");
  const createPackage = useApiMutation<CreatePackage, PackageRecord>("packages", "packages", "POST");
  const dispatch = useApiMutation<PackageAction, PackageRecord>("packages", ({ id }) => `packages/${id}/dispatch`, "POST", () => ({}));
  const inTransit = useApiMutation<PackageAction, PackageRecord>("packages", ({ id }) => `packages/${id}/in-transit`, "POST", () => ({}));
  const receive = useApiMutation<PackageAction, PackageRecord>("packages", ({ id }) => `packages/${id}/receive`, "POST", () => ({}));
  const destinationOptions = useMemo(
    () => (branches.data ?? []).filter((branch) => branch.id !== user?.branchId),
    [branches.data, user?.branchId],
  );
  const matchingBranches = destinationOptions.filter((branch) =>
    `${branch.name} ${branch.city ?? ""}`.toLowerCase().includes(destinationQuery.trim().toLowerCase()),
  );
  const selectedDestination = destinationOptions.find((branch) => branch.id === destinationBranchId);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!destinationBranchId) {
      setDestinationError("Search for and select a destination branch.");
      return;
    }
    const element = event.currentTarget;
    const form = new FormData(element);
    setDestinationError("");
    createPackage.mutate(
      {
        trackingCode: String(form.get("trackingCode") ?? "").trim(),
        description: String(form.get("description") ?? "").trim(),
        recipientName: String(form.get("recipientName") ?? "").trim(),
        toBranchId: destinationBranchId,
      },
      { onSuccess: () => {
        element.reset();
        setDestinationBranchId("");
        setDestinationQuery("");
      } },
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
        <div className="relative min-w-0" role="group" aria-labelledby="destination-branch-label">
          <label id="destination-branch-label" htmlFor="destination-branch-search" className="mb-1 block text-sm text-slate-300">Destination branch</label>
          {selectedDestination ? (
            <div className="flex min-h-11 items-center justify-between gap-2 rounded-xl border border-cyan-500/40 bg-slate-950 px-3 py-2 text-sm text-white">
              <span className="min-w-0 truncate">{selectedDestination.name}{selectedDestination.city ? ` · ${selectedDestination.city}` : ""}</span>
              <button type="button" onClick={() => { setDestinationBranchId(""); setDestinationQuery(""); }} className="shrink-0 rounded-lg px-2 py-1 text-cyan-300 hover:bg-slate-800">Change</button>
            </div>
          ) : (
            <>
              <input
                id="destination-branch-search"
                type="search"
                role="combobox"
                aria-autocomplete="list"
                aria-expanded={destinationQuery.length > 0}
                aria-controls="destination-branch-options"
                autoComplete="off"
                value={destinationQuery}
                onChange={(event) => {
                  setDestinationQuery(event.target.value);
                  setDestinationError("");
                }}
                placeholder={branches.isPending ? "Loading branches..." : "Type to search branches"}
                disabled={branches.isPending || branches.isError}
                className="min-h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white disabled:opacity-60"
              />
              {destinationQuery && <ul id="destination-branch-options" role="listbox" aria-label="Destination branches" className="absolute left-0 right-0 top-full z-10 mt-1 max-h-56 overflow-y-auto rounded-xl border border-slate-700 bg-slate-900 p-1 shadow-xl">
                {matchingBranches.map((branch) => (
                  <li key={branch.id} role="none">
                    <button
                      type="button"
                      role="option"
                      aria-selected={false}
                      onClick={() => {
                        setDestinationBranchId(branch.id);
                        setDestinationQuery("");
                        setDestinationError("");
                      }}
                      className="min-h-11 w-full rounded-lg px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-800"
                    >
                      {branch.name}{branch.city ? ` · ${branch.city}` : ""}
                    </button>
                  </li>
                ))}
                {matchingBranches.length === 0 && <li className="px-3 py-2 text-sm text-slate-400">No matching branches.</li>}
              </ul>}
            </>
          )}
          {destinationError && <p role="alert" className="mt-1 text-sm text-red-300">{destinationError}</p>}
        </div>
        <button type="submit" disabled={createPackage.isPending || branches.isPending || branches.isError} className="rounded-xl bg-cyan-500 px-3 py-2 font-medium text-slate-950 disabled:opacity-60">
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
