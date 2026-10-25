'use client';

import { FormEvent, useSyncExternalStore } from "react";
import { DashboardShell } from "../dashboard-shell";
import { ApiError } from "../../lib/api";
import { getUserSnapshot, subscribeToAuthSession } from "../../lib/auth-session";
import { useCreateVehicle, useVehicles } from "../../lib/use-vehicles";

export default function VehiclesPage() {
  const user = useSyncExternalStore(
    subscribeToAuthSession,
    getUserSnapshot,
    () => undefined,
  );
  const vehicles = useVehicles();
  const createVehicle = useCreateVehicle();
  const canCreate = user?.role === "ADMIN" || user?.role === "MANAGER" || user?.role === "SUPER_ADMIN";

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) {
      return;
    }

    const formElement = event.currentTarget;
    const form = new FormData(event.currentTarget);
    const year = String(form.get("year") ?? "");
    createVehicle.mutate(
      {
        plateNumber: String(form.get("plateNumber") ?? "").trim(),
        make: String(form.get("make") ?? "").trim(),
        model: String(form.get("model") ?? "").trim(),
        mileage: Number(form.get("mileage") ?? 0),
        branchId: user.branchId,
        ...(year ? { year: Number(year) } : {}),
      },
      { onSuccess: () => formElement.reset() },
    );
  }

  return (
    <DashboardShell>
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Fleet</div>
            <h2 className="mt-1 text-2xl font-semibold text-white">Vehicles</h2>
          </div>
          {canCreate && <a href="#add-vehicle" className="rounded-xl bg-blue-500 px-3 py-2 text-sm font-medium text-white">Add vehicle</a>}
        </div>

        {vehicles.isPending && <p className="py-8 text-center text-slate-400">Loading vehicles...</p>}
        {vehicles.isError && (
          <p role="alert" className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
            {vehicles.error instanceof ApiError ? vehicles.error.message : "Unable to load vehicles."}
          </p>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-slate-400">
              <tr>
                <th className="pb-3 pr-4 font-medium">Plate</th>
                <th className="pb-3 pr-4 font-medium">Model</th>
                <th className="pb-3 pr-4 font-medium">Branch</th>
                <th className="pb-3 pr-4 font-medium">Mileage</th>
                <th className="pb-3 pr-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {(vehicles.data ?? []).map((vehicle) => (
                <tr key={vehicle.id} className="border-t border-slate-800 text-slate-200">
                  <td className="py-3 pr-4 font-medium">{vehicle.plateNumber}</td>
                  <td className="py-3 pr-4">{vehicle.make} {vehicle.model}{vehicle.year ? ` (${vehicle.year})` : ""}</td>
                  <td className="py-3 pr-4">{vehicle.branchId}</td>
                  <td className="py-3 pr-4">{vehicle.mileage.toLocaleString()}</td>
                  <td className="py-3 pr-4">
                    <span className="rounded-full bg-blue-500/10 px-2 py-1 text-xs font-medium text-blue-300">{vehicle.status}</span>
                  </td>
                </tr>
              ))}
              {!vehicles.isPending && vehicles.data?.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">No vehicles found for this branch.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {canCreate && <form id="add-vehicle" onSubmit={handleCreate} className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
        <h2 className="mb-4 text-lg font-semibold text-white">Add a vehicle</h2>
        <p className="mb-4 text-sm text-slate-400">New vehicles are assigned to your signed-in branch.</p>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <input name="plateNumber" required placeholder="Plate number" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white" />
          <input name="make" required placeholder="Make" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white" />
          <input name="model" required placeholder="Model" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white" />
          <input name="year" type="number" min="1900" placeholder="Year (optional)" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white" />
          <input name="mileage" type="number" min="0" required defaultValue="0" placeholder="Mileage" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white" />
        </div>
        {createVehicle.isError && (
          <p role="alert" className="mt-4 text-sm text-red-300">
            {createVehicle.error instanceof ApiError ? createVehicle.error.message : "Unable to add vehicle."}
          </p>
        )}
        <button type="submit" disabled={createVehicle.isPending || !user} className="mt-4 rounded-xl bg-blue-500 px-4 py-2 font-medium text-white disabled:opacity-60">
          {createVehicle.isPending ? "Saving..." : "Save vehicle"}
        </button>
      </form>}
    </DashboardShell>
  );
}
