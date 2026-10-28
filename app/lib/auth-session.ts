export interface AuthUser {
  id: string;
  fullName: string;
  role: "SUPER_ADMIN" | "ADMIN" | "MANAGER" | "STAFF" | "SECURITY";
  branchId: string;
}

const tokenKey = "ops-token";
const userKey = "ops-user";
const changeEvent = "ops-auth-changed";
let cachedUserValue: string | null | undefined;
let cachedUserSnapshot: AuthUser | null | undefined;

function isAuthUser(value: unknown): value is AuthUser {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const user = value as Record<string, unknown>;
  return (
    typeof user.id === "string" &&
    typeof user.fullName === "string" &&
    typeof user.branchId === "string" &&
    ["SUPER_ADMIN", "ADMIN", "MANAGER", "STAFF", "SECURITY"].includes(
      String(user.role),
    )
  );
}

export function getTokenSnapshot(): string | null | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }
  return window.localStorage.getItem(tokenKey);
}

export function getUserSnapshot(): AuthUser | null | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }
  const value = window.localStorage.getItem(userKey);
  if (value === cachedUserValue) {
    return cachedUserSnapshot;
  }
  cachedUserValue = value;
  if (!value) {
    cachedUserSnapshot = null;
    return cachedUserSnapshot;
  }
  try {
    const user: unknown = JSON.parse(value);
    if (isAuthUser(user)) {
      cachedUserSnapshot = user;
      return cachedUserSnapshot;
    }
    console.error("Stored user session has an invalid shape");
    cachedUserSnapshot = null;
    return cachedUserSnapshot;
  } catch (error) {
    console.error("Stored user session is invalid", error);
    cachedUserSnapshot = null;
    return cachedUserSnapshot;
  }
}

export function subscribeToAuthSession(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(changeEvent, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(changeEvent, callback);
  };
}

export function saveAuthSession(token: string, user: AuthUser) {
  window.localStorage.setItem(tokenKey, token);
  window.localStorage.setItem(userKey, JSON.stringify(user));
  window.dispatchEvent(new Event(changeEvent));
}

export function clearAuthSession() {
  window.localStorage.removeItem(tokenKey);
  window.localStorage.removeItem(userKey);
  window.dispatchEvent(new Event(changeEvent));
}
