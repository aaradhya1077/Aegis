const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000";
const ACCESS_TOKEN_KEY = "dcrm.accessToken";
const USER_KEY = "dcrm.user";

export interface UserProfile {
  id: string;
  name: string;
  role: string;
}

export interface LoginResponse {
  accessToken: string;
  user: UserProfile;
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }

  const token = getStoredAccessToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    ...init,
    headers,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return (await res.json()) as T;
}

export async function login(stationId: string, password: string): Promise<LoginResponse> {
  const data = await apiFetch<LoginResponse>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ station_id: stationId, password }),
  });

  persistAuth(data);
  return data;
}

export function persistAuth(payload: LoginResponse): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACCESS_TOKEN_KEY, payload.accessToken);
  window.localStorage.setItem(USER_KEY, JSON.stringify(payload.user));
}

export function getStoredUser(): UserProfile | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(USER_KEY);
  return raw ? (JSON.parse(raw) as UserProfile) : null;
}

export function getStoredAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function clearAuth(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}

export interface DiagnosticsFeaturesResponse {
  features: string[];
}

export type DiagnosticsPayload = Record<string, number | string>;

export interface DiagnosticsResponse {
  diagnosis: string;
  confidence: number;
  secondary_diagnosis: string;
  probabilities: Record<string, number>;
  status: string;
}

export function getDiagnosticsFeatures() {
  return apiFetch<DiagnosticsFeaturesResponse>("/api/v1/diagnostics/features");
}

export function runDiagnostics(payload: DiagnosticsPayload) {
  return apiFetch<DiagnosticsResponse>("/api/v1/diagnostics/predict", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export interface PresignRequest {
  filename: string;
  contentType: string;
}

export interface PresignResponse {
  uploadUrl: string;
  key: string;
  bucket: string;
}

export function presignUpload(filename: string, contentType: string) {
  const body: PresignRequest = { filename, contentType };
  return apiFetch<PresignResponse>("/api/v1/uploads/presign", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export interface DeviceProfile {
  id: string;
  name: string;
  location: string;
  model: string;
  installedAt: string;
  lastTestedAt: string;
  healthScore: number;
  metadata?: Record<string, string>;
}

export interface DevicesResponse {
  devices: DeviceProfile[];
  total: number;
}

export function getDevices() {
  return apiFetch<DevicesResponse>("/api/v1/devices/");
}

export interface DiagnosticsSummaryResponse {
  globalHealth: number;
  activeAlerts: number;
  last24hDetections: number;
  modelVersion: string;
}

export function getDiagnosticsSummary() {
  return apiFetch<DiagnosticsSummaryResponse>("/api/v1/diagnostics/summary");
}
