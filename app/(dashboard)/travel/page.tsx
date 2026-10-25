'use client';

import { FormEvent } from "react";
import { DashboardShell } from "../dashboard-shell";
import { ApiError } from "../../lib/api";
import { useApiList, useApiMutation } from "../../lib/use-api-data";
import { useSyncExternalStore } from "react";
import { getUserSnapshot, subscribeToAuthSession } from "../../lib/auth-session";

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
  accommodation: { id: string; city: string; status: string } | null;
}

interface CreateTravel {
  origin: string;
  destination: string;
  purpose: string;
  departureAt: string;
  returnAt?: string;
}

interface TravelDecision {
  id: string;
  status: "APPROVED" | "REJECTED";
}

export default function TravelPage() {
  const user = useSyncExternalStore(subscribeToAuthSession, getUserSnapshot, () => undefined);
  const requests = useApiList<TravelRequest>("travel", "travel-requests");
  const createRequest = useApiMutation<CreateTravel, TravelRequest>("travel", "travel-requests", "POST");
  const decide = useApiMutation<TravelDecision, TravelRequest>(
    "travel",
    ({ id }) => `travel-requests/${id}/decision`,
    "PATCH",
    ({ status }) => ({
      status,
      ...(status === "REJECTED" ? { rejectionReason: "Declined by approver" } : {}),
    }),
  );

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const element = event.currentTarget;
    const form = new FormData(element);
    const returnAt = String(form.get("returnAt") ?? "");
    createRequest.mutate(
      {
        origin: String(form.get("origin") ?? "").trim(),
        destination: String(form.get("destination") ?? "").trim(),
        purpose: String(form.get("purpose") ?? "").trim(),
        departureAt: new Date(String(form.get("departureAt"))).toISOString(),
        ...(returnAt ? { returnAt: new Date(returnAt).toISOString() } : {}),
      },
      { onSuccess: () => element.reset() },
    );
  }

  const canApprove = user?.role === "MANAGER" || user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
  const error = requests.error ?? createRequest.error ?? decide.error;

  return (
    <DashboardShell>
      <div className="mb-5">
        <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Mobility</div>
        <h2 className="mt-1 text-2xl font-semibold text-white">Travel requests</h2>
      </div>
      <form onSubmit={submit} className="mb-6 grid gap-3 rounded-2xl border border-slate-800 bg-slate-900/80 p-5 sm:grid-cols-2 xl:grid-cols-5">
        <input name="origin" required placeholder="Origin" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white" />
        <input name="destination" required placeholder="Destination" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white" />
        <input name="purpose" required placeholder="Purpose" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white" />
        <label className="text-xs text-slate-400">Departure<input name="departureAt" type="date" required className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white" /></label>
        <label className="text-xs text-slate-400">Return (optional)<input name="returnAt" type="date" className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white" /></label>
        <button disabled={createRequest.isPending} className="rounded-xl bg-violet-500 px-3 py-2 font-medium text-white disabled:opacity-60">
          {createRequest.isPending ? "Submitting..." : "Submit request"}
        </button>
      </form>
      {error && <p role="alert" className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">{error instanceof ApiError ? error.message : "Unable to complete the travel request."}</p>}
      {requests.isPending ? <p className="text-slate-400">Loading requests...</p> : (
        <div className="space-y-3">
          {(requests.data ?? []).map((request) => (
            <article key={request.id} className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/80 p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="font-medium text-white">{request.traveler.fullName} · {request.destination}</h3>
                <p className="mt-1 text-sm text-slate-400">{request.origin} · {request.purpose} · {new Date(request.departureAt).toLocaleDateString()}</p>
                {request.rejectionReason && <p className="mt-1 text-sm text-rose-300">Reason: {request.rejectionReason}</p>}
                {request.accommodation && <p className="mt-1 text-sm text-slate-400">Accommodation: {request.accommodation.city} · {request.accommodation.status}</p>}
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-300">{request.status}</span>
                {canApprove && request.traveler.id !== user?.id && request.status === "PENDING" && (
                  <>
                    <button onClick={() => decide.mutate({ id: request.id, status: "APPROVED" })} className="rounded-lg bg-emerald-500 px-3 py-1.5 text-sm font-medium text-slate-950">Approve</button>
                    <button onClick={() => decide.mutate({ id: request.id, status: "REJECTED" })} className="rounded-lg border border-rose-500/40 px-3 py-1.5 text-sm text-rose-300">Reject</button>
                  </>
                )}
              </div>
            </article>
          ))}
          {!requests.data?.length && <p className="text-slate-400">No travel requests found.</p>}
        </div>
      )}
    </DashboardShell>
  );
}
