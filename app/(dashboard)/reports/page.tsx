'use client';

import { DashboardShell } from "../dashboard-shell";
import { ApiError } from "../../lib/api";
import { MonthlyReportValue, useOperationsReport } from "../../lib/use-reports";

function MonthlyList({
  title,
  rows,
  formatValue,
}: {
  title: string;
  rows: MonthlyReportValue[];
  formatValue: (value: number) => string;
}) {
  const visibleRows = rows.slice(-6).reverse();
  const maxValue = Math.max(...visibleRows.map((row) => row.value), 1);

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
      <h2 className="mb-4 text-lg font-semibold text-white">{title}</h2>
      {visibleRows.length === 0 ? (
        <p className="text-sm text-slate-400">No records in the last 12 months.</p>
      ) : (
        <div className="space-y-3">
          {visibleRows.map((row) => (
            <div key={row.month}>
              <div className="mb-1 flex justify-between text-sm">
                <span className="text-slate-300">{row.month}</span>
                <span className="text-slate-400">{formatValue(row.value)}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-800">
                <div
                  className="h-2 rounded-full bg-blue-500"
                  style={{ width: `${Math.max((row.value / maxValue) * 100, 1)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default function ReportsPage() {
  const report = useOperationsReport();

  return (
    <DashboardShell>
      <div className="mb-6">
        <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Management</div>
        <h2 className="mt-1 text-2xl font-semibold text-white">Operations reports</h2>
        <p className="mt-2 text-sm text-slate-400">Monthly trends for the last 12 months.</p>
      </div>

      {report.isPending && <p className="py-8 text-center text-slate-400">Loading reports...</p>}
      {report.isError && (
        <p role="alert" className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
          {report.error instanceof ApiError ? report.error.message : "Unable to load reports."}
        </p>
      )}

      {report.data && (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <MonthlyList
              title="Vehicle maintenance costs"
              rows={report.data.vehicleMaintenanceCosts}
              formatValue={(value) => value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            />
            <MonthlyList
              title="Trips per month"
              rows={report.data.tripsPerMonth}
              formatValue={(value) => Math.round(value).toLocaleString()}
            />
            <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
              <h2 className="mb-4 text-lg font-semibold text-white">Maintenance backlog</h2>
              {report.data.maintenanceBacklog.length === 0 ? (
                <p className="text-sm text-slate-400">No open work orders.</p>
              ) : (
                <div className="space-y-3">
                  {report.data.maintenanceBacklog.map((item) => (
                    <div key={item.status} className="flex justify-between rounded-xl bg-slate-950/70 p-3">
                      <span className="text-slate-300">{item.status.replaceAll("_", " ")}</span>
                      <span className="font-semibold text-white">{item.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
            <MonthlyList
              title="Average package delivery time"
              rows={report.data.packageDeliveryTimesHours}
              formatValue={(value) => `${value.toFixed(1)} hours`}
            />
            <MonthlyList
              title="Visitor counts"
              rows={report.data.visitorCounts}
              formatValue={(value) => Math.round(value).toLocaleString()}
            />
          </div>
          <p className="mt-4 text-xs text-slate-500">Report period starts {new Date(report.data.rangeStart).toLocaleDateString()}.</p>
        </>
      )}
    </DashboardShell>
  );
}
