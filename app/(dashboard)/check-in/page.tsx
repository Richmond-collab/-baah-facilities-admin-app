'use client';

import { DashboardShell } from "../dashboard-shell";
import { ApiError } from "../../lib/api";
import { useApiList, useApiMutation } from "../../lib/use-api-data";

interface Visit {
  id: string;
  visitorName: string;
  visitorCompany: string | null;
  purpose: string;
  expectedAt: string;
  status: string;
  host: { fullName: string };
}

interface VisitAction {
  id: string;
}

export default function CheckInPage() {
  const visits = useApiList<Visit>("visitors", "visitors");
  const checkIn = useApiMutation<VisitAction, Visit>(
    "visitors",
    ({ id }) => `visitors/${id}/check-in`,
    "PATCH",
    () => undefined,
  );
  const error = visits.error ?? checkIn.error;

  return (
    <DashboardShell>
      <div className="mb-5">
        <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Security</div>
        <h2 className="mt-1 text-2xl font-semibold text-white">Check-in desk</h2>
        <p className="mt-2 text-sm text-slate-400">Expected visitors at your branch.</p>
      </div>
      {error && <p role="alert" className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">{error instanceof ApiError ? error.message : "Unable to load the check-in list."}</p>}
      {visits.isPending ? <p className="text-slate-400">Loading visitor list...</p> : (
        <div className="space-y-3">
          {(visits.data ?? []).filter((visit) => visit.status === "EXPECTED" || visit.status === "CHECKED_IN").map((visit) => (
            <article key={visit.id} className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/80 p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="font-medium text-white">{visit.visitorName}{visit.visitorCompany ? ` · ${visit.visitorCompany}` : ""}</h2>
                <p className="mt-1 text-sm text-slate-400">Host: {visit.host.fullName} · {visit.purpose} · {new Date(visit.expectedAt).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-300">{visit.status}</span>
                {visit.status === "EXPECTED" && (
                  <button
                    disabled={checkIn.isPending}
                    onClick={() => checkIn.mutate({ id: visit.id })}
                    className="rounded-xl bg-emerald-500 px-3 py-2 text-sm font-medium text-slate-950 disabled:opacity-60"
                  >
                    Check in
                  </button>
                )}
              </div>
            </article>
          ))}
          {!visits.data?.some((visit) => visit.status === "EXPECTED" || visit.status === "CHECKED_IN") && (
            <p className="text-slate-400">No expected or checked-in visitors.</p>
          )}
        </div>
      )}
    </DashboardShell>
  );
}
