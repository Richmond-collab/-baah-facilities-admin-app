'use client';

import { FormEvent, useState, useSyncExternalStore } from "react";
import { DashboardShell } from "../dashboard-shell";
import { ApiError } from "../../lib/api";
import { useApiList, useApiMutation } from "../../lib/use-api-data";
import { getUserSnapshot, subscribeToAuthSession } from "../../lib/auth-session";

interface Accommodation {
  id: string;
  hotelName: string | null;
  city: string;
  checkIn: string;
  checkOut: string;
  status: string;
  notes: string | null;
}

interface TravelRequest {
  id: string;
  origin: string;
  destination: string;
  purpose: string;
  departureAt: string;
  returnAt: string | null;
  status: string;
  rejectionReason: string | null;
  traveler: { id: string; fullName: string };
  accommodation: Accommodation | null;
}

interface CreateTravel {
  origin: string;
  destination: string;
  purpose: string;
  departureAt: string;
  returnAt?: string;
  accommodation?: {
    hotelName?: string;
    city: string;
    checkIn: string;
    checkOut: string;
    notes?: string;
  };
}

interface TravelDecision {
  id: string;
  status: "APPROVED" | "REJECTED";
}

interface AccommodationDecision {
  id: string;
  status: "APPROVED" | "REJECTED";
}

function apiError(error: unknown) {
  return error instanceof ApiError ? error.message : "Unable to complete the travel request.";
}

export default function TravelPage() {
  const user = useSyncExternalStore(subscribeToAuthSession, getUserSnapshot, () => undefined);
  const [includeAccommodation, setIncludeAccommodation] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const requests = useApiList<TravelRequest>("travel", "travel-requests");
  const createRequest = useApiMutation<CreateTravel, TravelRequest>("travel", "travel-requests", "POST");
  const decide = useApiMutation<TravelDecision, TravelRequest>(
    "travel",
    ({ id }) => `travel-requests/${id}/decision`,
    "PATCH",
    ({ status }) => ({ status }),
  );
  const decideAccommodation = useApiMutation<AccommodationDecision, Accommodation>(
    "travel",
    ({ id }) => `travel-requests/accommodation/${id}/decision`,
    "PATCH",
    ({ status }) => ({ status }),
  );

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const element = event.currentTarget;
    const form = new FormData(element);
    const value = (key: string) => String(form.get(key) ?? "").trim();
    const returnAt = value("returnAt");
    const city = value("accommodationCity");
    const checkIn = value("checkIn");
    const checkOut = value("checkOut");
    if (includeAccommodation && (!city || !checkIn || !checkOut)) {
      setValidationError("Enter the accommodation city and both check-in and check-out dates.");
      return;
    }
    if (includeAccommodation && new Date(checkOut) < new Date(checkIn)) {
      setValidationError("Accommodation check-out must be on or after check-in.");
      return;
    }
    setValidationError(null);
    createRequest.mutate({
      origin: value("origin"),
      destination: value("destination"),
      purpose: value("purpose"),
      departureAt: new Date(value("departureAt")).toISOString(),
      ...(returnAt ? { returnAt: new Date(returnAt).toISOString() } : {}),
      ...(includeAccommodation ? {
        accommodation: {
          city,
          checkIn: new Date(checkIn).toISOString(),
          checkOut: new Date(checkOut).toISOString(),
          ...(value("hotelName") ? { hotelName: value("hotelName") } : {}),
          ...(value("accommodationNotes") ? { notes: value("accommodationNotes") } : {}),
        },
      } : {}),
    }, { onSuccess: () => { element.reset(); setIncludeAccommodation(false); } });
  }

  const canApprove = ["MANAGER", "ADMIN", "SUPER_ADMIN"].includes(user?.role ?? "");
  const errors = [requests.error, createRequest.error, decide.error, decideAccommodation.error].filter(Boolean);

  return (
    <DashboardShell>
      <div className="mb-5">
        <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Mobility</div>
        <h2 className="mt-1 text-2xl font-semibold text-white">Travel requests</h2>
      </div>
      {(validationError || errors.length > 0) && <p role="alert" className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
        {validationError ?? apiError(errors[0])}
      </p>}
      <form onSubmit={submit} className="mb-6 grid gap-3 rounded-2xl border border-slate-800 bg-slate-900/80 p-5 sm:grid-cols-2 xl:grid-cols-5">
        <input name="origin" required placeholder="Origin" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white" />
        <input name="destination" required placeholder="Destination" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white" />
        <input name="purpose" required placeholder="Purpose" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white" />
        <label className="text-xs text-slate-400">Departure<input name="departureAt" type="date" required className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white" /></label>
        <label className="text-xs text-slate-400">Return (optional)<input name="returnAt" type="date" className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white" /></label>
        <fieldset className="rounded-xl border border-slate-700 p-3 sm:col-span-2 xl:col-span-5">
          <label className="flex items-center gap-2 text-sm text-white">
            <input type="checkbox" checked={includeAccommodation} onChange={(event) => setIncludeAccommodation(event.target.checked)} />
            Request accommodation
          </label>
          {includeAccommodation && <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <input name="accommodationCity" required placeholder="Accommodation city" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white" />
            <input name="hotelName" placeholder="Hotel (optional)" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white" />
            <label className="text-xs text-slate-400">Check-in<input name="checkIn" type="date" required className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white" /></label>
            <label className="text-xs text-slate-400">Check-out<input name="checkOut" type="date" required className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white" /></label>
            <input name="accommodationNotes" placeholder="Accommodation notes (optional)" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white sm:col-span-2 xl:col-span-4" />
          </div>}
        </fieldset>
        <button disabled={createRequest.isPending} className="rounded-xl bg-violet-500 px-3 py-2 font-medium text-white disabled:opacity-60">
          {createRequest.isPending ? "Submitting..." : "Submit request"}
        </button>
      </form>

      {requests.isPending ? <p className="text-slate-400">Loading requests...</p> : (
        <div className="space-y-3">
          {(requests.data ?? []).map((request) => (
            <article key={request.id} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <h3 className="font-medium text-white">{request.traveler.fullName} · {request.destination}</h3>
                  <p className="mt-1 text-sm text-slate-400">{request.origin} · {request.purpose} · Departs {new Date(request.departureAt).toLocaleDateString()}{request.returnAt ? ` · Returns ${new Date(request.returnAt).toLocaleDateString()}` : ""}</p>
                  {request.rejectionReason && <p className="mt-1 text-sm text-rose-300">Reason: {request.rejectionReason}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-300">{request.status}</span>
                  {canApprove && request.traveler.id !== user?.id && request.status === "PENDING" && <>
                    <button onClick={() => decide.mutate({ id: request.id, status: "APPROVED" })} className="rounded-lg bg-emerald-500 px-3 py-1.5 text-sm font-medium text-slate-950">Approve</button>
                    <button onClick={() => decide.mutate({ id: request.id, status: "REJECTED" })} className="rounded-lg border border-rose-500/40 px-3 py-1.5 text-sm text-rose-300">Reject</button>
                  </>}
                </div>
              </div>
              {request.accommodation && <div className="mt-4 rounded-xl border border-slate-700 bg-slate-950/60 p-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h4 className="font-medium text-white">Accommodation · {request.accommodation.city}</h4>
                    {request.accommodation.hotelName && <p className="mt-1 text-sm text-slate-300">{request.accommodation.hotelName}</p>}
                    <p className="mt-1 text-sm text-slate-400">{new Date(request.accommodation.checkIn).toLocaleDateString()} – {new Date(request.accommodation.checkOut).toLocaleDateString()}</p>
                    {request.accommodation.notes && <p className="mt-1 text-sm text-slate-400">{request.accommodation.notes}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-300">{request.accommodation.status}</span>
                    {canApprove && request.traveler.id !== user?.id && request.accommodation.status === "PENDING" && <>
                      <button disabled={request.status !== "APPROVED"} title={request.status !== "APPROVED" ? "Approve the travel request first" : undefined} onClick={() => decideAccommodation.mutate({ id: request.accommodation!.id, status: "APPROVED" })} className="rounded-lg bg-emerald-500 px-3 py-1.5 text-sm font-medium text-slate-950 disabled:cursor-not-allowed disabled:opacity-40">Approve</button>
                      <button onClick={() => decideAccommodation.mutate({ id: request.accommodation!.id, status: "REJECTED" })} className="rounded-lg border border-rose-500/40 px-3 py-1.5 text-sm text-rose-300">Reject</button>
                    </>}
                  </div>
                </div>
                {canApprove && request.accommodation.status === "PENDING" && request.status !== "APPROVED" && <p className="mt-2 text-xs text-amber-300">Approve the travel request before approving accommodation.</p>}
              </div>}
            </article>
          ))}
          {!requests.data?.length && <p className="text-slate-400">No travel requests found.</p>}
        </div>
      )}
    </DashboardShell>
  );
}
