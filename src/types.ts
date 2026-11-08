export interface Package {
  id: number;
  name: string;
  description: string;
  price: number;
  duration_minutes: number;
  data_cap_mb: number | null;
  speed_mbps: number;
  popular: boolean;
  active: boolean;
}
export type PackageInput = Omit<Package, "id">;

export interface PortalSession {
  active: boolean;
  package_name: string | null;
  expires_at: string | null;
  remaining_seconds: number;
  bytes_used: number;
  data_cap_bytes: number | null;
  speed_mbps: number | null;
}

export interface Payment {
  id: number;
  phone: string;
  amount: number;
  status: "pending" | "success" | "failed";
  package_name: string;
  device_mac: string;
  provider_ref: string | null;
  created_at: string;
}

export interface AccessPoint {
  id: number;
  name: string;
  location: string;
  mac: string;
  ip: string;
  interface: string;
  status: "online" | "offline";
  clients: number;
  max_clients: number;
  last_seen: string | null;
  traffic_24h: number;
}
export interface AccessPointInput {
  name: string;
  location: string;
  mac: string;
  ip: string;
  interface: string;
  max_clients: number;
}

export interface Session {
  id: number;
  device_mac: string;
  phone: string;
  package_name: string;
  ap_name: string | null;
  started_at: string;
  expires_at: string;
  bytes_used: number;
  data_cap_bytes: number | null;
  violations: number;
  status: "active" | "expired" | "disconnected";
}

export interface Overview {
  revenue_today: number;
  active_sessions: number;
  pending_payments: number;
  aps_online: number;
  aps_total: number;
  traffic_24h: number;
  revenue_7d: { date: string; amount: number }[];
}
export interface TrafficPoint {
  t: string;
  rx: number;
  tx: number;
}
