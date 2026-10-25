import { getTokenSnapshot } from "./auth-session";
import { clearAuthSession } from "./auth-session";

const baseUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api")
  .replace(/\/+$/, "");

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiRequest<T>(
  path: string,
  options: {
    method?: "GET" | "POST" | "PATCH" | "DELETE";
    body?: unknown;
    authenticated?: boolean;
  } = {},
): Promise<T> {
  const headers = new Headers({ Accept: "application/json" });
  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  if (options.authenticated !== false) {
    const token = getTokenSnapshot();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/${path.replace(/^\/+/, "")}`, {
      method: options.method ?? "GET",
      headers,
      ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
    });
  } catch {
    throw new ApiError(
      `Could not reach the API at ${baseUrl}. Check that the API server is running.`,
      0,
    );
  }

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const payload: unknown = await response.json();
      if (typeof payload === "object" && payload !== null && "message" in payload) {
        const detail = payload.message;
        message = Array.isArray(detail) ? detail.join(", ") : String(detail);
      }
    } catch {
      message = response.statusText || message;
    }
    if (response.status === 401 && options.authenticated !== false) {
      clearAuthSession();
    }
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}
