"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { apiRequest } from "../lib/api";

interface Notification {
  id: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationInbox {
  items: Notification[];
  unreadCount: number;
}

export function NotificationCenter({
  userId,
  enabled,
}: {
  userId: string | undefined;
  enabled: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();
  const queryKey = ["notifications", userId];
  const notifications = useQuery({
    queryKey,
    queryFn: () => apiRequest<NotificationInbox>("notifications"),
    enabled: enabled && Boolean(userId),
    refetchInterval: 30_000,
  });
  const markRead = useMutation({
    mutationFn: (id: string) =>
      apiRequest<Notification>(`notifications/${id}/read`, { method: "PATCH" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });
  const markAllRead = useMutation({
    mutationFn: () =>
      apiRequest<{ count: number }>("notifications/read-all", { method: "PATCH" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });
  const unreadCount = notifications.data?.unreadCount ?? 0;

  return (
    <div className="relative">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-label={
          unreadCount > 0
            ? `Notifications, ${unreadCount} unread`
            : "Notifications"
        }
        onClick={() => setIsOpen((open) => !open)}
        className="relative rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm font-medium text-slate-200"
      >
        Notifications
        {unreadCount > 0 && (
          <span className="ml-2 rounded-full bg-blue-500 px-2 py-0.5 text-xs font-semibold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <section
          aria-label="Notification inbox"
          className="absolute right-0 z-20 mt-2 w-[min(24rem,calc(100vw-2rem))] rounded-2xl border border-slate-700 bg-slate-900 p-4 shadow-xl"
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="font-semibold text-white">Your notifications</h2>
            {unreadCount > 0 && (
              <button
                type="button"
                disabled={markAllRead.isPending}
                onClick={() => markAllRead.mutate()}
                className="text-xs font-medium text-blue-300 hover:text-blue-200 disabled:opacity-50"
              >
                Mark all as read
              </button>
            )}
          </div>

          {notifications.isPending && (
            <p className="py-4 text-sm text-slate-400">Loading notifications...</p>
          )}
          {notifications.isError && (
            <p role="alert" className="py-3 text-sm text-red-300">
              {notifications.error.message}
            </p>
          )}
          {markRead.isError && (
            <p role="alert" className="py-2 text-sm text-red-300">
              {markRead.error.message}
            </p>
          )}
          {markAllRead.isError && (
            <p role="alert" className="py-2 text-sm text-red-300">
              {markAllRead.error.message}
            </p>
          )}
          {notifications.data?.items.length === 0 && (
            <p className="py-4 text-sm text-slate-400">You’re all caught up.</p>
          )}

          <ul className="max-h-[min(60vh,28rem)] space-y-2 overflow-y-auto">
            {notifications.data?.items.map((notification) => (
              <li
                key={notification.id}
                className={`rounded-xl border p-3 ${
                  notification.isRead
                    ? "border-slate-800 bg-slate-950/50"
                    : "border-blue-500/30 bg-blue-500/10"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium text-white">
                    {notification.title}
                  </p>
                  {!notification.isRead && (
                    <button
                      type="button"
                      disabled={markRead.isPending}
                      onClick={() => markRead.mutate(notification.id)}
                      className="shrink-0 text-xs text-blue-300 hover:text-blue-200 disabled:opacity-50"
                    >
                      Mark read
                    </button>
                  )}
                </div>
                <p className="mt-1 text-sm text-slate-300">{notification.body}</p>
                <time
                  dateTime={notification.createdAt}
                  className="mt-2 block text-xs text-slate-500"
                >
                  {new Date(notification.createdAt).toLocaleString()}
                </time>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
