'use client';

import { FormEvent } from "react";
import { DashboardShell } from "../dashboard-shell";
import { ApiError } from "../../lib/api";
import { useApiList, useApiMutation } from "../../lib/use-api-data";

interface Host {
  id: string;
  fullName: string;
}

interface Visit {
  id: string;
  visitorName: string;
  visitorCompany: string | null;
  purpose: string;
  expectedAt: string;
  status: string;
  host: Host;
}

interface CreateVisit {
  visitorName: string;
  visitorCompany?: string;
  purpose: string;
  hostId: string;
  expectedAt: string;
}

interface VisitAction {
  id: string;
}

export default function VisitorsPage() {
  const visits = useApiList<Visit>("visitors", "visitors");
  const hosts = useApiList<Host>("visitor-hosts", "visitors/hosts");
  const createVisit = useApiMutation<CreateVisit, Visit>("visitors", "visitors", "POST");
  const checkIn = useApiMutation<VisitAction, Visit>("visitors", ({ id }) => `visitors/${id}/check-in`, "PATCH", () => undefined);
  const checkOut = useApiMutation<VisitAction, Visit>("visitors", ({ id }) => `visitors/${id}/check-out`, "PATCH", () => undefined);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const element = event.currentTarget;
    const form = new FormData(element);
    const visitorCompany = String(form.get("visitorCompany") ?? "").trim();
    createVisit.mutate(
      {
        visitorName: String(form.get("visitorName") ?? "").trim(),
        purpose: String(form.get("purpose") ?? "").trim(),
        hostId: String(form.get("hostId") ?? ""),
        expectedAt: new Date(String(form.get("expectedAt"))).toISOString(),
        ...(visitorCompany ? { visitorCompany } : {}),
      },
      { onSuccess: () => element.reset() },
    );
  }

  const error = visits.error ?? hosts.error ?? createVisit.error ?? checkIn.error ?? checkOut.error;

  return (
    <DashboardShell>
      <div className="mb-5">
        <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Front desk</div>
        <h2 className="mt-1 text-2xl font-semibold text-white">Visitors</h2>
      </div>
      <form onSubmit={submit} className="mb-6 grid gap-3 rounded-2xl border border-slate-800 bg-slate-900/80 p-5 sm:grid-cols-2 xl:grid-cols-5">
        <input name="visitorName" required placeholder="Visitor name" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white" />
        <input name="visitorCompany" placeholder="Company (optional)" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white" />
        <input name="purpose" required placeholder="Purpose of visit" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white" />
        <select name="hostId" required defaultValue="" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white">
          <option value="" disabled>Select host</option>
          {(hosts.data ?? []).map((host) => <option key={host.id} value={host.id}>{host.fullName}</option>)}
        </select>
        <input name="expectedAt" type="datetime-local" required className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white" />
        <button disabled={createVisit.isPending || hosts.isPending} className="rounded-xl bg-amber-500 px-3 py-2 font-medium text-slate-950 disabled:opacity-60">
          {createVisit.isPending ? "Saving..." : "Register visitor"}
        </button>
      </form>
      {error && <p role="alert" className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">{error instanceof ApiError ? error.message : "Unable to complete the visitor request."}</p>}
      {visits.isPending ? <p className="text-slate-400">Loading visitors...</p> : (
        <div className="space-y-3">
          {(visits.data ?? []).map((visit) => (
            <article key={visit.id} className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/80 p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="font-medium text-white">{visit.visitorName}{visit.visitorCompany ? ` · ${visit.visitorCompany}` : ""}</h3>
                <p className="mt-1 text-sm text-slate-400">Host: {visit.host.fullName} · {visit.purpose} · Expected {new Date(visit.expectedAt).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-300">{visit.status}</span>
                {visit.status === "EXPECTED" && <button onClick={() => checkIn.mutate({ id: visit.id })} className="rounded-lg bg-emerald-500 px-3 py-1.5 text-sm font-medium text-slate-950">Check in</button>}
                {visit.status === "CHECKED_IN" && <button onClick={() => checkOut.mutate({ id: visit.id })} className="rounded-lg border border-amber-500/50 px-3 py-1.5 text-sm text-amber-300">Check out</button>}
              </div>
            </article>
          ))}
          {!visits.data?.length && <p className="text-slate-400">No visitors found.</p>}
        </div>
      )}
    </DashboardShell>
  );
}
