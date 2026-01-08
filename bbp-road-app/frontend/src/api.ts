export type User = {
  id: number;
  username: string;
  created_at?: string;
};

export type Segment = {
  id: number;
  user_id: number;
  start_lat: number;
  start_lon: number;
  end_lat: number;
  end_lon: number;
  status: string;
  obstacle?: string | null;
  created_at?: string;
};

export type Report = {
  id: number;
  segment_id: number;
  note: string | null;
  confirmed: boolean;
  created_at?: string;
};

export type Trip = {
  id: number;
  user_id: number;
  from_lat: number;
  from_lon: number;
  to_lat: number;
  to_lon: number;
  distance_m: number;
  duration_s: number;
  geometry?: { type: string; coordinates: [number, number][] };
};

export type Aggregate = {
  segment_id: number;
  reports_total: number;
  reports_confirmed: number;
};

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://127.0.0.1:8000/api";

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, init);
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const msg = typeof data === "string" ? data : res.statusText;
    throw new Error(msg || `HTTP ${res.status}`);
  }
  return data as T;
}

export async function createOrGetUser(username: string): Promise<User> {
  return request<User>("/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username }),
  });
}

export async function listSegments(): Promise<Segment[]> {
  return request<Segment[]>("/segments");
}

export async function createSegment(payload: { user_id: number; status: string; obstacle?: string | null }): Promise<Segment> {
  return request<Segment>("/segments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}
export async function createSegmentWithCoords(payload: {
  user_id: number;
  start_lat: number;
  start_lon: number;
  end_lat: number;
  end_lon: number;
  status: string;
  obstacle?: string | null;
}): Promise<Segment> {
  return request<Segment>("/segments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function listReports(segmentId: number): Promise<Report[]> {
  return request<Report[]>(`/segments/${segmentId}/reports`);
}

export async function createReport(segmentId: number, payload: { note: string | null }): Promise<Report> {
  return request<Report>(`/segments/${segmentId}/reports`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function confirmReport(reportId: number): Promise<Report> {
  return request<Report>(`/reports/${reportId}/confirm`, { method: "POST" });
}

export async function aggregateSegment(segmentId: number): Promise<Aggregate> {
  return request<Aggregate>(`/segments/${segmentId}/aggregate`);
}

export async function createTrip(payload: {
  user_id: number;
  from_lat: number;
  from_lon: number;
  to_lat: number;
  to_lon: number;
  use_osrm?: boolean;
}): Promise<Trip> {
  const useOsrm = payload.use_osrm ? "?use_osrm=true" : "";
  return request<Trip>(`/trips${useOsrm}` as const, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: payload.user_id,
      from_lat: payload.from_lat,
      from_lon: payload.from_lon,
      to_lat: payload.to_lat,
      to_lon: payload.to_lon,
    }),
  });
}

// ---- Trip History ----
export async function listTrips(userId?: number): Promise<Trip[]> {
  const query = userId !== undefined ? `?user_id=${userId}` : "";
  return request<Trip[]>(`/trips${query}`);
}

export async function getTrip(tripId: number): Promise<Trip> {
  return request<Trip>(`/trips/${tripId}`);
}

export async function deleteTrip(tripId: number): Promise<{ ok: boolean; deleted: number }> {
  return request<{ ok: boolean; deleted: number }>(`/trips/${tripId}`, { method: "DELETE" });
}

// ---- Auto-detection ----
export type DetectionResult = {
  segment_id: number;
  current_status: string;
  detected_status: string;
  confidence: number;
  recommendation: string;
};

export async function autoDetectSegment(segmentId: number): Promise<DetectionResult> {
  return request<DetectionResult>(`/segments/${segmentId}/auto-detect`, { method: "POST" });
}

export async function applyDetection(segmentId: number, newStatus: string): Promise<any> {
  return request<any>(`/segments/${segmentId}/apply-detection?new_status=${newStatus}`, { method: "POST" });
}

export async function batchConfirmReports(reportIds: number[]): Promise<any[]> {
  return request<any[]>(`/reports/batch-confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(reportIds),
  });
}

export async function autoConfirmReports(segmentId: number, threshold?: number): Promise<any> {
  const query = threshold !== undefined ? `?threshold=${threshold}` : "";
  return request<any>(`/segments/${segmentId}/auto-confirm-reports${query}`, { method: "POST" });
}

// ---- Settings ----
export type UserSettings = {
  user_id: number;
  auto_detect_enabled: boolean;
  auto_confirm_threshold: number;
  default_map_zoom: number;
  preferred_route_mode: string;
  notifications_enabled: boolean;
  dark_mode: boolean;
  language: string;
  updated_at?: string;
};

export async function getUserSettings(userId: number): Promise<UserSettings> {
  return request<UserSettings>(`/users/${userId}/settings`);
}

export async function updateUserSettings(userId: number, settings: Partial<UserSettings>): Promise<UserSettings> {
  return request<UserSettings>(`/users/${userId}/settings`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  });
}

// ---- Stats ----
export type Stats = {
  users: number;
  segments: number;
  reports: { total: number; confirmed: number };
  trips: number;
  total_distance_km: number;
  segment_status_counts: Record<string, number>;
};

export async function getStats(): Promise<Stats> {
  return request<Stats>(`/stats`);
}
