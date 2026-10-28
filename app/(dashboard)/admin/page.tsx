"use client";

import { FormEvent, useSyncExternalStore } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DashboardShell } from "../dashboard-shell";
import { ApiError, apiRequest } from "../../lib/api";
import { getUserSnapshot, subscribeToAuthSession } from "../../lib/auth-session";
import type { Role } from "../../lib/mock-data";

interface Branch {
  id: string;
  name: string;
  city: string | null;
  address?: string | null;
}

interface UserRecord {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  isActive: boolean;
  branchId: string;
  branch: { id: string; name: string };
}

const roles: Role[] = ["ADMIN", "MANAGER", "STAFF", "SECURITY"];

function errorMessage(error: Error) {
  return error instanceof ApiError ? error.message : "Something went wrong.";
}

export default function AdminPage() {
  const actor = useSyncExternalStore(
    subscribeToAuthSession,
    getUserSnapshot,
    () => undefined,
  );
  const queryClient = useQueryClient();
  const canAssignAdmin = actor?.role === "SUPER_ADMIN";
  const branches = useQuery({
    queryKey: ["branches"],
    queryFn: () => apiRequest<Branch[]>("branches"),
  });
  const users = useQuery({
    queryKey: ["users"],
    queryFn: () => apiRequest<UserRecord[]>("users"),
  });
  const createBranch = useMutation({
    mutationFn: (input: { name: string; city?: string; address?: string }) =>
      apiRequest<Branch>("branches", { method: "POST", body: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["branches"] }),
  });
  const updateBranch = useMutation({
    mutationFn: ({
      id,
      name,
      city,
      address,
    }: {
      id: string;
      name: string;
      city: string;
      address: string;
    }) =>
      apiRequest<Branch>(`branches/${id}`, {
        method: "PATCH",
        body: { name, city, address },
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["branches"] }),
  });
  const createUser = useMutation({
    mutationFn: (input: {
      email: string;
      fullName: string;
      role: Role;
      branchId: string;
      password: string;
    }) => apiRequest<UserRecord>("users", { method: "POST", body: input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });
  const updateUser = useMutation({
    mutationFn: ({
      id,
      role,
      branchId,
      isActive,
    }: {
      id: string;
      role: Role;
      branchId: string;
      isActive: boolean;
    }) =>
      apiRequest<UserRecord>(`users/${id}`, {
        method: "PATCH",
        body: { role, branchId, isActive },
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });

  function handleCreateBranch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    createBranch.mutate(
      {
        name: String(form.get("branchName") ?? "").trim(),
        city: String(form.get("branchCity") ?? "").trim(),
        address: String(form.get("branchAddress") ?? "").trim(),
      },
      { onSuccess: () => formElement.reset() },
    );
  }

  function handleCreateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    createUser.mutate(
      {
        email: String(form.get("email") ?? "").trim(),
        fullName: String(form.get("fullName") ?? "").trim(),
        role: String(form.get("role") ?? "STAFF") as Role,
        branchId: String(form.get("branchId") ?? ""),
        password: String(form.get("password") ?? ""),
      },
      { onSuccess: () => formElement.reset() },
    );
  }

  if (actor && actor.role !== "ADMIN" && actor.role !== "SUPER_ADMIN") {
    return (
      <DashboardShell>
        <p role="alert" className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-red-200">
          You do not have permission to manage users or branches.
        </p>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="mb-6">
        <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Administration</div>
        <h2 className="mt-1 text-2xl font-semibold text-white">Users and branches</h2>
        <p className="mt-2 text-sm text-slate-400">
          Manage staff access and the branches they belong to.
        </p>
      </div>

      <section className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
        <h3 className="mb-4 text-lg font-semibold text-white">Branches</h3>
        {branches.isPending && <p className="text-sm text-slate-400">Loading branches...</p>}
        {branches.isError && <p role="alert" className="mb-3 text-sm text-red-300">{errorMessage(branches.error)}</p>}
        <div className="space-y-3">
          {branches.data?.map((branch) => (
            <form
              key={branch.id}
              className="grid gap-2 sm:grid-cols-[1fr_1fr_2fr_auto]"
              onSubmit={(event) => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                updateBranch.mutate({
                  id: branch.id,
                  name: String(form.get("name") ?? "").trim(),
                  city: String(form.get("city") ?? "").trim(),
                  address: String(form.get("address") ?? "").trim(),
                });
              }}
            >
              <input name="name" aria-label={`${branch.name} branch name`} required defaultValue={branch.name} className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
              <input name="city" aria-label={`${branch.name} city`} defaultValue={branch.city ?? ""} placeholder="City" className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
              <input name="address" aria-label={`${branch.name} address`} defaultValue={branch.address ?? ""} placeholder="Address" className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
              <button type="submit" disabled={updateBranch.isPending} className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 disabled:opacity-50">Save</button>
            </form>
          ))}
          {!branches.isPending && branches.data?.length === 0 && (
            <p className="text-sm text-slate-400">No branches yet.</p>
          )}
        </div>
        <form onSubmit={handleCreateBranch} className="mt-5 grid gap-3 border-t border-slate-800 pt-5 sm:grid-cols-2">
          <input name="branchName" required maxLength={120} placeholder="Branch name" className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
          <input name="branchCity" maxLength={120} placeholder="City (optional)" className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
          <input name="branchAddress" maxLength={255} placeholder="Address (optional)" className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white sm:col-span-2" />
          {createBranch.isError && <p role="alert" className="text-sm text-red-300 sm:col-span-2">{errorMessage(createBranch.error)}</p>}
          <button type="submit" disabled={createBranch.isPending} className="w-fit rounded-xl bg-blue-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
            {createBranch.isPending ? "Adding..." : "Add branch"}
          </button>
        </form>
        {updateBranch.isError && <p role="alert" className="mt-3 text-sm text-red-300">{errorMessage(updateBranch.error)}</p>}
      </section>

      <section className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
        <h3 className="mb-1 text-lg font-semibold text-white">Add a user</h3>
        <p className="mb-4 text-sm text-slate-400">
          Share the temporary password securely. Do not send it through chat or email.
        </p>
        {branches.data?.length ? (
          <form onSubmit={handleCreateUser} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <input name="fullName" required minLength={2} placeholder="Full name" className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
            <input name="email" type="email" required placeholder="Email" className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" />
            <select name="role" defaultValue="STAFF" className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white">
              {canAssignAdmin && <option value="ADMIN">Administrator</option>}
              {roles.filter((role) => role !== "ADMIN").map((role) => (
                <option key={role} value={role}>{role.charAt(0) + role.slice(1).toLowerCase()}</option>
              ))}
            </select>
            <select name="branchId" required defaultValue="" className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white">
              <option value="" disabled>Select branch</option>
              {branches.data.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
            </select>
            <input name="password" type="password" required minLength={12} autoComplete="new-password" placeholder="Temporary password (12+ characters)" className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white xl:col-span-2" />
            {createUser.isError && <p role="alert" className="text-sm text-red-300 sm:col-span-2 xl:col-span-3">{errorMessage(createUser.error)}</p>}
            <button type="submit" disabled={createUser.isPending} className="w-fit rounded-xl bg-blue-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
              {createUser.isPending ? "Creating..." : "Create user"}
            </button>
          </form>
        ) : (
          <p className="text-sm text-slate-400">Create a branch before adding users.</p>
        )}
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
        <h3 className="mb-4 text-lg font-semibold text-white">User accounts</h3>
        {users.isPending && <p className="text-sm text-slate-400">Loading users...</p>}
        {users.isError && <p role="alert" className="mb-3 text-sm text-red-300">{errorMessage(users.error)}</p>}
        {updateUser.isError && <p role="alert" className="mb-3 text-sm text-red-300">{errorMessage(updateUser.error)}</p>}
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-slate-400">
              <tr>
                <th className="pb-3 pr-4 font-medium">User</th>
                <th className="pb-3 pr-4 font-medium">Role</th>
                <th className="pb-3 pr-4 font-medium">Branch</th>
                <th className="pb-3 pr-4 font-medium">Status</th>
                <th className="pb-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.data?.map((user) => {
                const canManageAccount =
                  user.id !== actor?.id &&
                  (actor?.role === "SUPER_ADMIN" ||
                    (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN"));
                return (
                  <tr key={user.id} className="border-t border-slate-800 text-slate-200">
                    <td className="py-3 pr-4">
                      <div className="font-medium">{user.fullName}</div>
                      <div className="text-xs text-slate-400">{user.email}</div>
                    </td>
                    <td className="py-3 pr-4">
                      {canManageAccount ? (
                        <select
                          aria-label={`${user.fullName} role`}
                          defaultValue={user.role}
                          onChange={(event) => updateUser.mutate({
                            id: user.id,
                            role: event.target.value as Role,
                            branchId: user.branchId,
                            isActive: user.isActive,
                          })}
                          className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-white"
                        >
                          {canAssignAdmin && <option value="ADMIN">ADMIN</option>}
                          {roles.filter((role) => role !== "ADMIN").map((role) => <option key={role} value={role}>{role}</option>)}
                          {user.role === "SUPER_ADMIN" && <option value="SUPER_ADMIN">SUPER_ADMIN</option>}
                        </select>
                      ) : user.role}
                    </td>
                    <td className="py-3 pr-4">
                      {canManageAccount ? (
                        <select
                          aria-label={`${user.fullName} branch`}
                          defaultValue={user.branchId}
                          onChange={(event) => updateUser.mutate({
                            id: user.id,
                            role: user.role,
                            branchId: event.target.value,
                            isActive: user.isActive,
                          })}
                          className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-white"
                        >
                          {branches.data?.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
                        </select>
                      ) : user.branch.name}
                    </td>
                    <td className="py-3 pr-4">{user.isActive ? "Active" : "Inactive"}</td>
                    <td className="py-3">
                      {canManageAccount && user.id !== actor?.id && (
                        <button
                          type="button"
                          disabled={updateUser.isPending}
                          onClick={() => updateUser.mutate({
                            id: user.id,
                            role: user.role,
                            branchId: user.branchId,
                            isActive: !user.isActive,
                          })}
                          className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-200 disabled:opacity-50"
                        >
                          {user.isActive ? "Deactivate" : "Reactivate"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </DashboardShell>
  );
}
