'use client';

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { clearAuthSession, getTokenSnapshot, getUserSnapshot, subscribeToAuthSession } from "../lib/auth-session";
import { navItems } from "../lib/mock-data";
import { NotificationCenter } from "./notification-center";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const token = useSyncExternalStore(
    subscribeToAuthSession,
    getTokenSnapshot,
    () => undefined,
  );
  const user = useSyncExternalStore(
    subscribeToAuthSession,
    getUserSnapshot,
    () => undefined,
  );

  useEffect(() => {
    if (token === null) {
      router.replace("/login");
    }
  }, [router, token]);

  const items = navItems.filter((item) =>
    user ? item.roles.includes(user.role) : item.href === "/",
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-[1600px] gap-6 p-3 sm:p-4 lg:p-6">
        <aside className="hidden w-72 shrink-0 rounded-2xl border border-slate-800 bg-slate-900/80 p-5 lg:block">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20 text-lg font-bold text-blue-300">O</div>
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Ops</div>
              <div className="text-lg font-semibold text-white">Platform</div>
            </div>
          </div>

          <nav className="space-y-2">
            {items.map((item) => {
              const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    active
                      ? "bg-blue-500/15 text-blue-200 ring-1 ring-blue-500/40"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-10 rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Signed in</div>
            <div className="mt-3 font-semibold text-white">{user?.fullName ?? "Loading profile..."}</div>
            <div className="mt-1 text-sm text-blue-300">{user?.role?.replaceAll("_", " ")}</div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="mb-6 flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/80 p-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.22em] text-slate-400">Operations overview</div>
              <h1 className="mt-1 text-2xl font-semibold text-white">Daily operations dashboard</h1>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <button
                type="button"
                aria-expanded={mobileNavOpen}
                aria-controls="mobile-dashboard-navigation"
                onClick={() => setMobileNavOpen((open) => !open)}
                className="rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm font-medium text-slate-200 lg:hidden"
              >
                {mobileNavOpen ? "Close menu" : "Menu"}
              </button>
              <NotificationCenter userId={user?.id} enabled={Boolean(token)} />
              <span className="hidden text-sm text-slate-400 sm:inline">{user?.fullName}</span>
              <button
                onClick={() => {
                  clearAuthSession();
                  router.replace("/login");
                }}
                className="rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm font-medium text-slate-200"
              >
                Sign out
              </button>
            </div>
          </header>

          {mobileNavOpen && <nav
            id="mobile-dashboard-navigation"
            aria-label="Dashboard navigation"
            className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/95 p-3 lg:hidden"
          >
            <div className="grid gap-2 sm:grid-cols-2">
              {items.map((item) => {
                const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    onNavigate={() => setMobileNavOpen(false)}
                    className={`flex min-h-11 items-center rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                      active
                        ? "bg-blue-500/15 text-blue-200 ring-1 ring-blue-500/40"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </div>
            <div className="mt-3 border-t border-slate-800 px-3 pt-3 text-sm text-slate-400">
              <span className="font-medium text-white">{user?.fullName ?? "Loading profile..."}</span>
              {user?.role && <span className="ml-2 text-blue-300">{user.role.replaceAll("_", " ")}</span>}
            </div>
          </nav>}

          {token ? children : null}
        </div>
      </div>
    </div>
  );
}
