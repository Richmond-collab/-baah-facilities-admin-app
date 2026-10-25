'use client';

import { FormEvent } from "react";
import { DashboardShell } from "../dashboard-shell";
import { ApiError } from "../../lib/api";
import { getUserSnapshot, subscribeToAuthSession } from "../../lib/auth-session";
import { useApiList, useApiMutation } from "../../lib/use-api-data";
import { useSyncExternalStore } from "react";

interface WorkOrder {
  id: string;
  title: string;
  target: string;
  status: string;
  priority: string;
  scheduledFor: string | null;
  cost: number | string | null;
  vehicle: { plateNumber: string } | null;
}

interface CreateWorkOrder {
  title: string;
  target: "VEHICLE" | "FACILITY";
  priority: string;
  vehicleId?: string;
}

interface UpdateWorkOrder {
  id: string;
  status: string;
}

export default function MaintenancePage() {
  const user = useSyncExternalStore(subscribeToAuthSession, getUserSnapshot, () => undefined);
  const jobs = useApiList<WorkOrder>("maintenance", "maintenance");
  const createJob = useApiMutation<CreateWorkOrder, WorkOrder>(
    "maintenance",
    "maintenance",
    "POST",
  );
  const updateJob = useApiMutation<UpdateWorkOrder, WorkOrder>(
    "maintenance",
    (input) => `maintenance/${input.id}`,
    "PATCH",
    ({ status }) => ({ status }),
  );

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const vehicleId = String(form.get("vehicleId") ?? "").trim();
    createJob.mutate(
      {
        title: String(form.get("title") ?? "").trim(),
        target: String(form.get("target")) as CreateWorkOrder["target"],
        priority: String(form.get("priority")),
        ...(vehicleId ? { vehicleId } : {}),
      },
      { onSuccess: () => formElement.reset() },
    );
  }

  return (
    <DashboardShell>
      <div className="mb-5">
        <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Service</div>
        <h2 className="mt-1 text-2xl font-semibold text-white">Maintenance</h2>
      </div>
      <form onSubmit={submit} className="mb-6 grid gap-3 rounded-2xl border border-slate-800 bg-slate-900/80 p-5 sm:grid-cols-2 xl:grid-cols-5">
        <input name="title" required placeholder="Work order title" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white" />
        <select name="target" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white">
          <option value="FACILITY">Facility</option>
          <option value="VEHICLE">Vehicle</option>
        </select>
        <input name="vehicleId" placeholder="Vehicle ID (if vehicle work)" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white" />
        <select name="priority" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white">
          <option>MEDIUM</option><option>LOW</option><option>HIGH</option><option>URGENT</option>
        </select>
        <button disabled={createJob.isPending} className="rounded-xl bg-emerald-500 px-3 py-2 font-medium text-slate-950 disabled:opacity-60">
          {createJob.isPending ? "Saving..." : "Create work order"}
        </button>
      </form>
      {(jobs.isError || createJob.isError || updateJob.isError) && (
        <p role="alert" className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
          {[jobs.error, createJob.error, updateJob.error].find(Boolean) instanceof ApiError
            ? ([jobs.error, createJob.error, updateJob.error].find(Boolean) as ApiError).message
            : "Unable to complete the maintenance request."}
        </p>
      )}
      {jobs.isPending ? <p className="text-slate-400">Loading work orders...</p> : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {(jobs.data ?? []).map((job) => (
            <article key={job.id} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-medium text-white">{job.title}</h3>
                <span className="rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-300">{job.status}</span>
              </div>
              <p className="mt-3 text-sm text-slate-400">{job.target}{job.vehicle ? ` · ${job.vehicle.plateNumber}` : ""} · {job.priority}</p>
              <p className="mt-1 text-sm text-slate-400">Scheduled: {job.scheduledFor ? new Date(job.scheduledFor).toLocaleDateString() : "Not set"}</p>
              <p className="mt-1 text-sm text-slate-400">Cost: {job.cost ?? "Not recorded"}</p>
              {(user?.role === "ADMIN" || user?.role === "MANAGER" || user?.role === "SUPER_ADMIN") && job.status !== "COMPLETED" && job.status !== "CANCELLED" && (
                <button
                  onClick={() => updateJob.mutate({ id: job.id, status: "COMPLETED" })}
                  className="mt-4 rounded-lg border border-emerald-500/40 px-3 py-1.5 text-sm text-emerald-300"
                >
                  Mark completed
                </button>
              )}
            </article>
          ))}
          {!jobs.data?.length && <p className="text-slate-400">No work orders found.</p>}
        </div>
      )}
    </DashboardShell>
  );
}
