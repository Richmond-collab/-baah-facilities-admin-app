'use client';

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { DashboardShell } from "./dashboard-shell";
import { ApiError } from "../lib/api";
import { getUserSnapshot, subscribeToAuthSession } from "../lib/auth-session";
import { useOperationsReport } from "../lib/use-reports";

export default function DashboardPage() {
  const user = useSyncExternalStore(
    subscribeToAuthSession,
    getUserSnapshot,
    () => undefined,
  );
  const canViewReports =
    user?.role === "SUPER_ADMIN" ||
    user?.role === "ADMIN" ||
    user?.role === "MANAGER";
  const report = useOperationsReport(canViewReports);
  const latest = (values: Array<{ month: string; value: number }>) => values.at(-1);
  const latestMonth = (values: Array<{ month: string; value: number }>) =>
    latest(values)?.month ?? null;
  const monthDescription = (month: string | null) =>
    month ? `latest recorded month: ${month}` : "no records yet";
  const backlogCount = report.data?.maintenanceBacklog.reduce(
    (total, item) => total + item.count,
    0,
  );
  const summary = report.data
    ? [
        {
          label: "Maintenance backlog",
          value: String(backlogCount ?? 0),
          detail: "open work orders",
        },
        {
          label: "Trips",
          value: String(Math.round(latest(report.data.tripsPerMonth)?.value ?? 0)),
          detail: monthDescription(latestMonth(report.data.tripsPerMonth)),
        },
        {
          label: "Visitor check-ins",
          value: String(Math.round(latest(report.data.visitorCounts)?.value ?? 0)),
          detail: monthDescription(latestMonth(report.data.visitorCounts)),
        },
        {
          label: "Vehicle maintenance costs",
          value: (latest(report.data.vehicleMaintenanceCosts)?.value ?? 0).toLocaleString(
            undefined,
            { maximumFractionDigits: 2 },
          ),
          detail: monthDescription(latestMonth(report.data.vehicleMaintenanceCosts)),
        },
      ]
    : [];

  return (
    <DashboardShell>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Operations</div>
          <h2 className="mt-1 text-2xl font-semibold text-white">Branch overview</h2>
          <p className="mt-2 text-sm text-slate-400">Latest operational metrics within your permitted branch scope.</p>
        </div>
        <Link href="/reports" className="text-sm font-medium text-blue-300 hover:text-blue-200">
          View all reports
        </Link>
      </div>

      {!canViewReports && user && (
        <p className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 text-sm text-slate-300">
          Operational reports are available to managers and administrators.
        </p>
      )}
      {canViewReports && report.isPending && <p className="py-8 text-center text-slate-400">Loading operational data...</p>}
      {canViewReports && report.isError && (
        <p role="alert" className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
          {report.error instanceof ApiError ? report.error.message : "Unable to load operational data."}
        </p>
      )}

      {canViewReports && report.data && (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {summary.map((item) => (
            <article key={item.label} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
              <h3 className="text-sm text-slate-400">{item.label}</h3>
              <p className="mt-3 text-3xl font-semibold text-white">{item.value}</p>
              <p className="mt-1 text-xs text-slate-500">{item.detail}</p>
            </article>
          ))}
        </section>
      )}
    </DashboardShell>
  );
}
