import type {
  AccessPoint, AccessPointInput, Overview, Package, PackageInput, Payment,
  PortalSession, Session, TrafficPoint,
} from "../types";

const BASE = import.meta.env.VITE_API_URL ?? "";
const TOKEN_KEY = "wifi_admin_token";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

let onUnauthorized: () => void = () => {};
export const setUnauthorizedHandler = (fn: () => void) => { onUnauthorized = fn; };
export const getToken = () => sessionStorage.getItem(TOKEN_KEY);
export const clearToken = () => sessionStorage.removeItem(TOKEN_KEY);

async function request<T>(path: string, init: RequestInit = {}, admin = false): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = getToken();
  if (admin && token) headers.Authorization = `Bearer ${token}`;
  Object.assign(headers, init.headers);

  let res: Response;
  try {
    res = await fetch(BASE + path, { ...init, headers });
  } catch {
    throw new ApiError(0, "Can't reach the server. Check your connection and try again.");
  }
  if (!res.ok) {
    if (res.status === 401 && admin) { clearToken(); onUnauthorized(); }
    let detail = res.statusText;
    try {
      const body = await res.json();
      if (typeof body.detail === "string") detail = body.detail;
      else if (Array.isArray(body.detail)) detail = body.detail.map((d: { msg: string }) => d.msg).join(", ");
    } catch { /* keep statusText */ }
    throw new ApiError(res.status, detail);
  }
  return res.status === 204 ? (undefined as T) : res.json();
}

const json = (method: string, body?: unknown): RequestInit => ({ method, body: body ? JSON.stringify(body) : undefined });

export const errorMessage = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong");

/** The device MAC must come from the hotspot or an explicit development URL. */
declare global {
  interface Window { __HOTSPOT__?: { mac: string; ip: string; loginUrl: string; origUrl: string } }
}

/** Set by the MikroTik hotspot when this app is served as login.html. Unreplaced "$(mac)" means we're not behind a hotspot. */
export const hotspot = () => (window.__HOTSPOT__?.mac && !window.__HOTSPOT__.mac.startsWith("$(") ? window.__HOTSPOT__ : null);

export function getDeviceId(): string {
  const fromHotspot = hotspot()?.mac;
  if (fromHotspot) return fromHotspot;
  return new URLSearchParams(window.location.search).get("mac") ?? "";
}

export const api = {
  packages: () => request<Package[]>("/api/packages"),
  checkout: (b: { phone: string; package_id: number; mac: string }) =>
    request<{ payment_id: number; status: string; amount: number }>("/api/portal/checkout", json("POST", b)),
  paymentStatus: (id: number) => request<Payment>(`/api/portal/payments/${id}`),
  portalSession: (mac: string) => request<PortalSession>(`/api/portal/session?mac=${encodeURIComponent(mac)}`),

  admin: {
    async login(username: string, password: string) {
      const res = await request<{ access_token: string }>("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ username, password }).toString(),
      });
      sessionStorage.setItem(TOKEN_KEY, res.access_token);
    },
    overview: () => request<Overview>("/api/admin/overview", {}, true),
    traffic: (hours = 24) => request<TrafficPoint[]>(`/api/admin/traffic?hours=${hours}`, {}, true),
    packages: () => request<Package[]>("/api/admin/packages", {}, true),
    createPackage: (b: PackageInput) => request<Package>("/api/admin/packages", json("POST", b), true),
    updatePackage: (id: number, b: PackageInput) => request<Package>(`/api/admin/packages/${id}`, json("PUT", b), true),
    accessPoints: () => request<AccessPoint[]>("/api/admin/access-points", {}, true),
    createAccessPoint: (b: AccessPointInput) => request<AccessPoint>("/api/admin/access-points", json("POST", b), true),
    setApStatus: (id: number, status: "online" | "offline") =>
      request<AccessPoint>(`/api/admin/access-points/${id}/status`, json("PATCH", { status }), true),
    rebootAp: (id: number) => request<{ ok: boolean }>(`/api/admin/access-points/${id}/reboot`, json("POST"), true),
    deleteAp: (id: number) => request<void>(`/api/admin/access-points/${id}`, json("DELETE"), true),
    sessions: (activeOnly = false) => request<Session[]>(`/api/admin/sessions?active_only=${activeOnly}`, {}, true),
    disconnect: (id: number) => request<Session>(`/api/admin/sessions/${id}/disconnect`, json("POST"), true),
    payments: () => request<Payment[]>("/api/admin/payments", {}, true),
  },
};
