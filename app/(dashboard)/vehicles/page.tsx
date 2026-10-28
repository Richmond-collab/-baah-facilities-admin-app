'use client';

import { FormEvent } from "react";
import { useSyncExternalStore } from "react";
import { DashboardShell } from "../dashboard-shell";
import { ApiError } from "../../lib/api";
import { getUserSnapshot, subscribeToAuthSession } from "../../lib/auth-session";
import { useApiMutation } from "../../lib/use-api-data";
import { CreateVehicleInput, Vehicle, VehicleTrip, useCreateVehicle, useVehicles } from "../../lib/use-vehicles";

type VehicleUpdate = { id: string; changes: Partial<CreateVehicleInput> };
type StartTrip = { id: string; driverName: string; purpose: string };
type EndTrip = { id: string; endMileage: number };

function dateValue(value: string | null) {
  return value ? value.slice(0, 10) : "";
}

function apiError(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

export default function VehiclesPage() {
  const user = useSyncExternalStore(subscribeToAuthSession, getUserSnapshot, () => undefined);
  const vehicles = useVehicles();
  const createVehicle = useCreateVehicle();
  const updateVehicle = useApiMutation<VehicleUpdate, Vehicle>(
    "vehicles",
    ({ id }) => `vehicles/${id}`,
    "PATCH",
    ({ changes }) => changes,
  );
  const startTrip = useApiMutation<StartTrip, VehicleTrip>(
    "vehicles",
    ({ id }) => `vehicles/${id}/trips`,
    "POST",
    ({ driverName, purpose }) => ({ driverName, purpose }),
  );
  const endTrip = useApiMutation<EndTrip, { ok: boolean }>(
    "vehicles",
    ({ id }) => `vehicles/trips/${id}/end`,
    "POST",
    ({ endMileage }) => ({ endMileage }),
  );
  const canManage = ["ADMIN", "MANAGER", "SUPER_ADMIN"].includes(user?.role ?? "");
  const canUse = ["ADMIN", "MANAGER", "STAFF"].includes(user?.role ?? "");

  function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    const element = event.currentTarget;
    const values = new FormData(element);
    const date = (key: string) => String(values.get(key) ?? "");
    const year = String(values.get("year") ?? "");
    createVehicle.mutate({
      plateNumber: String(values.get("plateNumber") ?? "").trim(),
      make: String(values.get("make") ?? "").trim(),
      model: String(values.get("model") ?? "").trim(),
      mileage: Number(values.get("mileage") ?? 0),
      branchId: user.branchId,
      ...(year ? { year: Number(year) } : {}),
      ...(date("insuranceExpiry") ? { insuranceExpiry: new Date(date("insuranceExpiry")).toISOString() } : {}),
      ...(date("roadworthyExpiry") ? { roadworthyExpiry: new Date(date("roadworthyExpiry")).toISOString() } : {}),
      ...(date("nextServiceDate") ? { nextServiceDate: new Date(date("nextServiceDate")).toISOString() } : {}),
    }, { onSuccess: () => element.reset() });
  }

  function update(event: FormEvent<HTMLFormElement>, vehicleId: string) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const date = (key: string) => String(values.get(key) ?? "");
    const year = String(values.get("year") ?? "");
    updateVehicle.mutate({
      id: vehicleId,
      changes: {
        plateNumber: String(values.get("plateNumber") ?? "").trim(),
        make: String(values.get("make") ?? "").trim(),
        model: String(values.get("model") ?? "").trim(),
        mileage: Number(values.get("mileage") ?? 0),
        ...(year ? { year: Number(year) } : {}),
        ...(date("insuranceExpiry") ? { insuranceExpiry: new Date(date("insuranceExpiry")).toISOString() } : {}),
        ...(date("roadworthyExpiry") ? { roadworthyExpiry: new Date(date("roadworthyExpiry")).toISOString() } : {}),
        ...(date("nextServiceDate") ? { nextServiceDate: new Date(date("nextServiceDate")).toISOString() } : {}),
      },
    });
  }

  const errors = [
    [vehicles.error, "Unable to load vehicles."],
    [createVehicle.error, "Unable to add vehicle."],
    [updateVehicle.error, "Unable to update vehicle."],
    [startTrip.error, "Unable to start trip."],
    [endTrip.error, "Unable to end trip."],
  ] as const;
  const activeError = errors.find(([error]) => error);

  return (
    <DashboardShell>
      <div className="mb-5">
        <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Fleet</div>
        <h2 className="mt-1 text-2xl font-semibold text-white">Vehicles</h2>
      </div>
      {activeError && <p role="alert" className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">{apiError(activeError[0], activeError[1])}</p>}

      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
        {vehicles.isPending ? <p className="py-8 text-center text-slate-400">Loading vehicles...</p> : (
          <table className="min-w-full text-left text-sm">
            <thead className="text-slate-400">
              <tr>
                <th className="pb-3 pr-4 font-medium">Plate</th>
                <th className="pb-3 pr-4 font-medium">Vehicle</th>
                <th className="pb-3 pr-4 font-medium">Mileage</th>
                <th className="pb-3 pr-4 font-medium">Status</th>
                <th className="pb-3 pr-4 font-medium">Service / documents</th>
              </tr>
            </thead>
            <tbody>
              {(vehicles.data ?? []).map((vehicle) => (
                <tr key={vehicle.id} className="border-t border-slate-800 text-slate-200">
                  <td className="py-3 pr-4 font-medium">{vehicle.plateNumber}</td>
                  <td className="py-3 pr-4">{vehicle.make} {vehicle.model}{vehicle.year ? ` (${vehicle.year})` : ""}</td>
                  <td className="py-3 pr-4">{vehicle.mileage.toLocaleString()}</td>
                  <td className="py-3 pr-4">{vehicle.status}</td>
                  <td className="py-3 pr-4 text-xs text-slate-400">
                    Service {vehicle.nextServiceDate ? dateValue(vehicle.nextServiceDate) : "—"}
                    <br />Insurance {vehicle.insuranceExpiry ? dateValue(vehicle.insuranceExpiry) : "—"}
                    <br />Roadworthy {vehicle.roadworthyExpiry ? dateValue(vehicle.roadworthyExpiry) : "—"}
                  </td>
                  <td className="py-3">
                    <details>
                      <summary className="cursor-pointer text-blue-300">Manage</summary>
                      <div className="mt-3 min-w-72 space-y-4 rounded-xl border border-slate-700 bg-slate-950 p-4">
                        {canManage && <form onSubmit={(event) => update(event, vehicle.id)} className="grid gap-2 sm:grid-cols-2">
                          <h3 className="sm:col-span-2 font-medium text-white">Edit vehicle</h3>
                          <input name="plateNumber" required defaultValue={vehicle.plateNumber} aria-label="Plate number" className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white" />
                          <input name="make" required defaultValue={vehicle.make} aria-label="Make" className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white" />
                          <input name="model" required defaultValue={vehicle.model} aria-label="Model" className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white" />
                          <input name="year" type="number" min="1900" defaultValue={vehicle.year ?? ""} placeholder="Year" aria-label="Year" className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white" />
                          <input name="mileage" type="number" min="0" required defaultValue={vehicle.mileage} aria-label="Mileage" className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white" />
                          <label className="text-xs text-slate-400">Insurance expiry<input name="insuranceExpiry" type="date" defaultValue={dateValue(vehicle.insuranceExpiry)} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-2 text-white" /></label>
                          <label className="text-xs text-slate-400">Roadworthy expiry<input name="roadworthyExpiry" type="date" defaultValue={dateValue(vehicle.roadworthyExpiry)} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-2 text-white" /></label>
                          <label className="text-xs text-slate-400 sm:col-span-2">Next service date<input name="nextServiceDate" type="date" defaultValue={dateValue(vehicle.nextServiceDate)} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-2 text-white" /></label>
                          <button disabled={updateVehicle.isPending} className="rounded-lg bg-blue-500 px-3 py-2 text-sm font-medium text-white disabled:opacity-60">Save vehicle</button>
                        </form>}
                        {canUse && vehicle.status === "AVAILABLE" && <form onSubmit={(event) => {
                          event.preventDefault();
                          const form = new FormData(event.currentTarget);
                          const element = event.currentTarget;
                          startTrip.mutate(
                            { id: vehicle.id, driverName: String(form.get("driverName") ?? "").trim(), purpose: String(form.get("purpose") ?? "").trim() },
                            { onSuccess: () => element.reset() },
                          );
                        }} className="grid gap-2 sm:grid-cols-2">
                          <h3 className="sm:col-span-2 font-medium text-white">Start vehicle trip</h3>
                          <input name="driverName" required placeholder="Driver name" className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white" />
                          <input name="purpose" required placeholder="Trip purpose" className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white" />
                          <button disabled={startTrip.isPending} className="rounded-lg bg-emerald-500 px-3 py-2 text-sm font-medium text-slate-950 disabled:opacity-60">Start trip</button>
                        </form>}
                        {vehicle.trips.map((trip) => <form key={trip.id} onSubmit={(event) => {
                          event.preventDefault();
                          const mileage = Number(new FormData(event.currentTarget).get("endMileage"));
                          endTrip.mutate({ id: trip.id, endMileage: mileage });
                        }} className="grid gap-2 border-t border-slate-800 pt-3 sm:grid-cols-2">
                          <p className="sm:col-span-2 text-sm text-slate-300">Active trip · {trip.driverName} · {trip.purpose} · started at {trip.startMileage.toLocaleString()}</p>
                          <input name="endMileage" type="number" min={trip.startMileage} required placeholder="Ending mileage" className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white" />
                          <button disabled={endTrip.isPending} className="rounded-lg border border-amber-500/50 px-3 py-2 text-sm text-amber-300 disabled:opacity-60">End trip</button>
                        </form>)}
                      </div>
                    </details>
                  </td>
                </tr>
              ))}
              {!vehicles.data?.length && <tr><td colSpan={6} className="py-8 text-center text-slate-400">No vehicles found for this branch.</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      {canManage && <form onSubmit={create} className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
        <h2 className="mb-4 text-lg font-semibold text-white">Add a vehicle</h2>
        <p className="mb-4 text-sm text-slate-400">New vehicles are assigned to your signed-in branch.</p>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <input name="plateNumber" required placeholder="Plate number" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white" />
          <input name="make" required placeholder="Make" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white" />
          <input name="model" required placeholder="Model" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white" />
          <input name="year" type="number" min="1900" placeholder="Year (optional)" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white" />
          <input name="mileage" type="number" min="0" required defaultValue="0" placeholder="Mileage" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white" />
          <label className="text-xs text-slate-400">Insurance expiry<input name="insuranceExpiry" type="date" className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white" /></label>
          <label className="text-xs text-slate-400">Roadworthy expiry<input name="roadworthyExpiry" type="date" className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white" /></label>
          <label className="text-xs text-slate-400">Next service date<input name="nextServiceDate" type="date" className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white" /></label>
        </div>
        <button type="submit" disabled={createVehicle.isPending || !user} className="mt-4 rounded-xl bg-blue-500 px-4 py-2 font-medium text-white disabled:opacity-60">
          {createVehicle.isPending ? "Saving..." : "Save vehicle"}
        </button>
      </form>}
    </DashboardShell>
  );
}
