// ─────────────────────────────────────────────────────────────
// API URL — picks the right base URL per environment
// Priority: NEXT_PUBLIC_API_URL (Vercel) > auto-detect > fallback
// ─────────────────────────────────────────────────────────────

const getApiUrl = (): string => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "http://localhost:3000/api";
    }
  }
  return "https://mothaqaf-backend.vercel.app/api";
};

const API_URL = getApiUrl();

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const getToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("mosaqaf_token");
};

const request = async <T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> => {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${endpoint}`, { ...options, headers });

  const contentType = res.headers.get("content-type");
  const isJson = contentType?.includes("application/json");
  const data = isJson ? await res.json() : null;

  if (!res.ok) {
    if (res.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("mosaqaf_token");
      localStorage.removeItem("mosaqaf_admin");
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    throw new ApiError(data?.message || "حدث خطأ", res.status);
  }

  return data as T;
};

export const api = {
  get: <T>(url: string) => request<T>(url, { method: "GET" }),

  post: <T>(url: string, body?: unknown) =>
    request<T>(url, {
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  put: <T>(url: string, body?: unknown) =>
    request<T>(url, {
      method: "PUT",
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  patch: <T>(url: string, body?: unknown) =>
    request<T>(url, {
      method: "PATCH",
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  delete: <T>(url: string) => request<T>(url, { method: "DELETE" }),
};

/**
 * Tell the website to clear cached data for a given tag.
 * Called after uploads/deletes so the public site updates immediately.
 *
 * Uses the dashboard's own /api/revalidate route (server-to-server),
 * so no CORS configuration is needed on the website.
 */
export const revalidateWebsite = async (
  tag: "hero" | "files" | "settings",
): Promise<void> => {
  try {
    const res = await fetch("/api/revalidate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tag }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      console.warn(
        `[revalidateWebsite] ${tag} failed (${res.status}):`,
        data?.message,
      );
    } else {
      console.log(`[revalidateWebsite] ${tag} revalidated ✓`);
    }
  } catch (err) {
    // Never break the dashboard if the website is down
    console.warn("[revalidateWebsite] Network error:", err);
  }
};

export { API_URL };
