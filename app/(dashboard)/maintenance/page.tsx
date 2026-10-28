'use client';

import { FormEvent, useState, useSyncExternalStore } from "react";
import { DashboardShell } from "../dashboard-shell";
import { ApiError } from "../../lib/api";
import { getUserSnapshot, subscribeToAuthSession } from "../../lib/auth-session";
import { useApiList, useApiMutation } from "../../lib/use-api-data";
import { useVehicles } from "../../lib/use-vehicles";

interface WorkOrder {
  id: string;
  title: string;
  description: string | null;
  target: "VEHICLE" | "FACILITY";
  status: string;
  priority: string;
  scheduledFor: string | null;
  cost: number | string | null;
  assignedTo: string | null;
  branchId: string;
  vehicle: { plateNumber: string } | null;
}

interface Assignee {
  id: string;
  fullName: string;
  branchId: string;
}

interface CreateWorkOrder {
  title: string;
  target: "VEHICLE" | "FACILITY";
  priority: string;
  description?: string;
  scheduledFor?: string;
  vehicleId?: string;
}

interface UpdateWorkOrder {
  id: string;
  status: string;
  cost?: number;
  assignedTo?: string;
}

export default function MaintenancePage() {
  const user = useSyncExternalStore(subscribeToAuthSession, getUserSnapshot, () => undefined);
  const [target, setTarget] = useState<CreateWorkOrder["target"]>("FACILITY");
  const canManage = user?.role === "ADMIN" || user?.role === "MANAGER";
  const jobs = useApiList<WorkOrder>("maintenance", "maintenance");
  const vehicles = useVehicles();
  const assignees = useApiList<Assignee>("maintenance-assignees", "maintenance/assignees", canManage);
  const createJob = useApiMutation<CreateWorkOrder, WorkOrder>("maintenance", "maintenance", "POST");
  const updateJob = useApiMutation<UpdateWorkOrder, WorkOrder>(
    "maintenance",
    ({ id }) => `maintenance/${id}`,
    "PATCH",
    ({ status, cost, assignedTo }) => ({
      status,
      ...(cost === undefined ? {} : { cost }),
      ...(assignedTo ? { assignedTo } : {}),
    }),
  );

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const element = event.currentTarget;
    const form = new FormData(element);
    const description = String(form.get("description") ?? "").trim();
    const scheduledFor = String(form.get("scheduledFor") ?? "");
    const vehicleId = String(form.get("vehicleId") ?? "");
    createJob.mutate({
      title: String(form.get("title") ?? "").trim(),
      target,
      priority: String(form.get("priority")),
      ...(description ? { description } : {}),
      ...(scheduledFor ? { scheduledFor: new Date(scheduledFor).toISOString() } : {}),
      ...(target === "VEHICLE" && vehicleId ? { vehicleId } : {}),
    }, { onSuccess: () => element.reset() });
  }

  function update(event: FormEvent<HTMLFormElement>, jobId: string) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const assignedTo = String(form.get("assignedTo") ?? "");
    const cost = String(form.get("cost") ?? "");
    updateJob.mutate({
      id: jobId,
      status: String(form.get("status")),
      ...(cost ? { cost: Number(cost) } : {}),
      ...(assignedTo ? { assignedTo } : {}),
    });
  }

  const errors = [jobs.error, vehicles.error, assignees.error, createJob.error, updateJob.error].filter(Boolean);

  return (
    <DashboardShell>
      <div className="mb-5">
        <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Service</div>
        <h2 className="mt-1 text-2xl font-semibold text-white">Maintenance</h2>
      </div>
      {errors.length > 0 && <p role="alert" className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
        {errors[0] instanceof ApiError ? errors[0].message : "Unable to complete the maintenance request."}
      </p>}
      <form onSubmit={submit} className="mb-6 grid gap-3 rounded-2xl border border-slate-800 bg-slate-900/80 p-5 sm:grid-cols-2 xl:grid-cols-4">
        <input name="title" required placeholder="Work order title" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white" />
        <select name="target" value={target} onChange={(event) => setTarget(event.target.value as CreateWorkOrder["target"])} className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white">
          <option value="FACILITY">Facility</option>
          <option value="VEHICLE">Vehicle</option>
        </select>
        <select name="vehicleId" disabled={target !== "VEHICLE" || vehicles.isPending} required={target === "VEHICLE"} defaultValue="" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white disabled:opacity-50">
          <option value="" disabled>{target === "VEHICLE" ? "Select vehicle" : "Vehicle (not applicable)"}</option>
          {(vehicles.data ?? []).map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.plateNumber} · {vehicle.make} {vehicle.model}</option>)}
        </select>
        <select name="priority" defaultValue="MEDIUM" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white">
          <option>MEDIUM</option><option>LOW</option><option>HIGH</option><option>URGENT</option>
        </select>
        <input name="description" placeholder="Description (optional)" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white sm:col-span-2" />
        <label className="text-xs text-slate-400">Schedule for<input name="scheduledFor" type="date" className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white" /></label>
        <button disabled={createJob.isPending || vehicles.isPending} className="self-end rounded-xl bg-emerald-500 px-3 py-2 font-medium text-slate-950 disabled:opacity-60">
          {createJob.isPending ? "Saving..." : "Create work order"}
        </button>
      </form>

      {jobs.isPending ? <p className="text-slate-400">Loading work orders...</p> : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {(jobs.data ?? []).map((job) => (
            <article key={job.id} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-medium text-white">{job.title}</h3>
                <span className="rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-300">{job.status}</span>
              </div>
              <p className="mt-3 text-sm text-slate-400">{job.target}{job.vehicle ? ` · ${job.vehicle.plateNumber}` : ""} · {job.priority}</p>
              {job.description && <p className="mt-2 text-sm text-slate-300">{job.description}</p>}
              <p className="mt-1 text-sm text-slate-400">Scheduled: {job.scheduledFor ? new Date(job.scheduledFor).toLocaleDateString() : "Not set"}</p>
              <p className="mt-1 text-sm text-slate-400">Cost: {job.cost ?? "Not recorded"}</p>
              {job.assignedTo && <p className="mt-1 text-sm text-slate-400">Assigned to: {assignees.data?.find((person) => person.id === job.assignedTo)?.fullName ?? "Assigned"}</p>}
              {canManage && job.status !== "COMPLETED" && job.status !== "CANCELLED" && <form onSubmit={(event) => update(event, job.id)} className="mt-4 grid gap-2 border-t border-slate-800 pt-4">
                <label className="text-xs text-slate-400">Status<select name="status" defaultValue={job.status} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white">
                  <option>OPEN</option><option>IN_PROGRESS</option><option>COMPLETED</option><option>CANCELLED</option>
                </select></label>
                <label className="text-xs text-slate-400">Cost<input name="cost" type="number" min="0" step="0.01" defaultValue={job.cost ?? ""} placeholder="Not recorded" className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white" /></label>
                <label className="text-xs text-slate-400">Assigned to<select name="assignedTo" defaultValue={job.assignedTo ?? ""} disabled={assignees.isPending} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white disabled:opacity-50">
                  <option value="">No change</option>
                  {(assignees.data ?? []).filter((person) => person.branchId === job.branchId).map((person) => <option key={person.id} value={person.id}>{person.fullName}</option>)}
                </select></label>
                <button disabled={updateJob.isPending} className="rounded-lg border border-blue-500/40 px-3 py-2 text-sm text-blue-300 disabled:opacity-60">Save work order</button>
              </form>}
            </article>
          ))}
          {!jobs.data?.length && <p className="text-slate-400">No work orders found.</p>}
        </div>
      )}
    </DashboardShell>
  );
}
