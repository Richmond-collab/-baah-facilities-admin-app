'use client';

import { FormEvent } from "react";
import { DashboardShell } from "../dashboard-shell";
import { ApiError } from "../../lib/api";
import { getUserSnapshot, subscribeToAuthSession } from "../../lib/auth-session";
import { useApiList, useApiMutation } from "../../lib/use-api-data";
import { useSyncExternalStore } from "react";

interface StaffEvent {
  id: string;
  title: string;
  description: string | null;
  type: string;
  eventDate: string;
  branchId: string;
  remindDaysBefore: number;
}

interface CreateEvent {
  title: string;
  description?: string;
  type: string;
  eventDate: string;
  remindDaysBefore: number;
}

export default function EventsPage() {
  const user = useSyncExternalStore(subscribeToAuthSession, getUserSnapshot, () => undefined);
  const events = useApiList<StaffEvent>("events", "events");
  const createEvent = useApiMutation<CreateEvent, StaffEvent>("events", "events", "POST");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const element = event.currentTarget;
    const form = new FormData(element);
    const description = String(form.get("description") ?? "").trim();
    createEvent.mutate(
      {
        title: String(form.get("title") ?? "").trim(),
        type: String(form.get("type") ?? "").trim(),
        eventDate: new Date(String(form.get("eventDate"))).toISOString(),
        remindDaysBefore: Number(form.get("remindDaysBefore") ?? 1),
        ...(description ? { description } : {}),
      },
      { onSuccess: () => element.reset() },
    );
  }

  const error = events.error ?? createEvent.error;

  return (
    <DashboardShell>
      <div className="mb-5">
        <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Calendar</div>
        <h2 className="mt-1 text-2xl font-semibold text-white">Events</h2>
      </div>
      {(user?.role === "ADMIN" || user?.role === "MANAGER" || user?.role === "SUPER_ADMIN") && <form onSubmit={submit} className="mb-6 grid gap-3 rounded-2xl border border-slate-800 bg-slate-900/80 p-5 sm:grid-cols-2 xl:grid-cols-5">
        <input name="title" required placeholder="Event title" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white" />
        <input name="type" required placeholder="Type (meeting, event...)" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white" />
        <input name="description" placeholder="Description (optional)" className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white" />
        <input name="eventDate" type="datetime-local" required className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white" />
        <label className="text-xs text-slate-400">Reminder days before<input name="remindDaysBefore" type="number" min="0" defaultValue="1" className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white" /></label>
        <button disabled={createEvent.isPending} className="rounded-xl bg-sky-500 px-3 py-2 font-medium text-slate-950 disabled:opacity-60">
          {createEvent.isPending ? "Saving..." : "Create event"}
        </button>
      </form>}
      {error && <p role="alert" className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">{error instanceof ApiError ? error.message : "Unable to complete the event request."}</p>}
      {events.isPending ? <p className="text-slate-400">Loading events...</p> : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {(events.data ?? []).map((event) => (
            <article key={event.id} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-medium text-white">{event.title}</h3>
                <span className="rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-300">{event.type}</span>
              </div>
              <p className="mt-3 text-sm text-slate-400">{new Date(event.eventDate).toLocaleString()}</p>
              {event.description && <p className="mt-2 text-sm text-slate-400">{event.description}</p>}
            </article>
          ))}
          {!events.data?.length && <p className="text-slate-400">No events found.</p>}
        </div>
      )}
    </DashboardShell>
  );
}
