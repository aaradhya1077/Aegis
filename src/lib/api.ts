const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options?.headers as Record<string, string>) || {}),
  };

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "API error");
  }

  return res.json();
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export async function login(userId: string, password: string) {
  const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ user_id: userId, password }),
  });
  if (!res.ok) throw new Error("Invalid credentials");
  return res.json();
}

// ── Dashboard ────────────────────────────────────────────────────────────────

export function fetchDashboard() {
  return apiFetch<{
    total_mines: number;
    compliant_percentage: number;
    overdue_filings: number;
    critical_alerts: number;
    total_filings: number;
    total_checks: number;
    risk_distribution: Record<string, number>;
    compliance_by_category: Record<string, number>;
  }>("/api/v1/compliance/dashboard");
}

// ── Mines ────────────────────────────────────────────────────────────────────

export function fetchMines(params?: Record<string, string>) {
  const qs = params
    ? "?" + new URLSearchParams(params).toString()
    : "";
  return apiFetch<{
    mines: Array<{
      id: string;
      name: string;
      state: string;
      subsidiary: string;
      mine_type: string;
      overall_risk_score: number;
      status: string;
    }>;
    total: number;
  }>(`/api/v1/mines${qs}`);
}

export function fetchMine(id: string) {
  return apiFetch<{
    id: string;
    name: string;
    state: string;
    district: string;
    company: string;
    subsidiary: string;
    latitude: number;
    longitude: number;
    worker_count: number;
    mine_type: string;
    overall_risk_score: number;
    status: string;
    created_at: string;
  }>(`/api/v1/mines/${id}`);
}

export function fetchMineBenchmarks() {
  return apiFetch<
    Array<{
      mine_id: string;
      mine_name: string;
      state: string;
      subsidiary: string;
      overall_risk_score: number;
      compliance_rate: number;
      overdue_count: number;
      rank: number;
    }>
  >("/api/v1/mines/benchmarks");
}

export function fetchRiskHistory(mineId: string, category = "overall") {
  return apiFetch<{
    mine_id: string;
    history: Array<{
      id: string;
      mine_id: string;
      score: number;
      category: string;
      computed_at: string;
      score_hash: string | null;
    }>;
  }>(`/api/v1/mines/${mineId}/risk-history?category=${category}`);
}

// ── Filings ──────────────────────────────────────────────────────────────────

export function fetchFilings(params?: Record<string, string>) {
  const qs = params
    ? "?" + new URLSearchParams(params).toString()
    : "";
  return apiFetch<{
    filings: Array<{
      id: string;
      mine_id: string;
      regulation_id: string;
      filing_type: string;
      submitted_at: string | null;
      due_date: string;
      status: string;
      source_filename: string | null;
      ocr_confidence: number | null;
    }>;
    total: number;
  }>(`/api/v1/filings${qs}`);
}

export async function uploadFiling(formData: FormData) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

  const headers: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(`${API_BASE}/api/v1/filings/upload`, {
    method: "POST",
    headers,
    credentials: "include",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Failed to upload statutory filing");
  }

  return res.json();
}

// ── Compliance ───────────────────────────────────────────────────────────────

export function fetchComplianceChecks(mineId: string) {
  return apiFetch<
    Array<{
      id: string;
      filing_id: string;
      regulation_id: string;
      mine_id: string;
      score: number;
      status: string;
      findings: Array<{
        field: string;
        status: string;
        detail: string;
      }>;
      explanation: string;
      verified_by: string;
      checked_at: string;
    }>
  >(`/api/v1/compliance/checks/${mineId}`);
}

export function submitHumanReview(
  checkId: string,
  data: { status: string; notes?: string }
) {
  return apiFetch<{
    check_id: string;
    updated_status: string;
    verified_by: string;
    message: string;
  }>(`/api/v1/compliance/human-review/${checkId}`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ── Reports ──────────────────────────────────────────────────────────────────

export function fetchReportsSummary() {
  return apiFetch<any>("/api/v1/reports/summary");
}

export function getReportsCsvUrl() {
  return `${API_BASE}/api/v1/reports/export-csv`;
}

// ── Regulations ──────────────────────────────────────────────────────────────

export function fetchRegulations() {
  return apiFetch<
    Array<{
      id: string;
      act_name: string;
      clause_number: string;
      clause_text: string;
      obligation_type: string;
      filing_type_required: string;
      frequency_months: number | null;
      severity: string;
    }>
  >("/api/v1/regulations");
}

export function fetchRegulationGraph() {
  return apiFetch<{
    nodes: Array<{
      id: string;
      label: string;
      type: string;
      metadata: Record<string, unknown> | null;
    }>;
    edges: Array<{
      source: string;
      target: string;
      relationship: string;
    }>;
  }>("/api/v1/regulations/graph");
}

// ── Forecasts ────────────────────────────────────────────────────────────────

export function fetchForecastAlerts(threshold = 0.5) {
  return apiFetch<{
    alerts: Array<{
      id: string;
      mine_id: string;
      mine_name: string | null;
      regulation_id: string;
      regulation_clause: string | null;
      predicted_risk: number;
      trend_direction: string;
      days_until_due: number;
      confidence: number;
    }>;
    total: number;
  }>(`/api/v1/forecasts/alerts?threshold=${threshold}`);
}

export function fetchMineForecasts(mineId: string) {
  return apiFetch<
    Array<{
      id: string;
      mine_id: string;
      mine_name: string | null;
      regulation_id: string;
      regulation_clause: string | null;
      predicted_risk: number;
      trend_direction: string;
      days_until_due: number;
      confidence: number;
      computed_at: string | null;
    }>
  >(`/api/v1/forecasts/${mineId}`);
}

// ── Chatbot (FAISS + Groq RAG) ──────────────────────────────────────────────

export function chatQuery(query: string, groqApiKey?: string) {
  return apiFetch<{
    answer: string;
    sources: Array<Record<string, unknown>>;
    confidence: number;
    engine?: string;
  }>("/api/v1/chat", {
    method: "POST",
    body: JSON.stringify({ query, groq_api_key: groqApiKey || undefined }),
  });
}

// ── Field Inspections ────────────────────────────────────────────────────────

export interface InspectionRecord {
  id: string;
  mine_id: string;
  mine_name: string;
  subsidiary: string;
  state: string;
  inspector_id: string;
  inspector_name: string;
  inspected_at: string;
  latitude: number;
  longitude: number;
  area_inspected: string;
  category: string;
  status: string;
  observations: string;
  evidence_image_url: string | null;
  hazard_level: string;
  offline_synced: number;
}

export function fetchInspections(params?: { mine_id?: string; category?: string; hazard_level?: string }) {
  const q = new URLSearchParams(params as Record<string, string>).toString();
  return apiFetch<{ inspections: InspectionRecord[]; total: number }>(`/api/v1/inspections${q ? `?${q}` : ""}`);
}

export function createInspection(data: {
  mine_id: string;
  inspector_id: string;
  inspector_name: string;
  latitude: number;
  longitude: number;
  area_inspected: string;
  category: string;
  hazard_level: string;
  observations: string;
  evidence_image_url?: string;
  offline_synced?: number;
}) {
  return apiFetch<{ status: string; inspection_id: string; violation_flagged: boolean; violation_id: string | null }>(
    "/api/v1/inspections",
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
}

export function fetchInspectionStats() {
  return apiFetch<{
    total_inspections: number;
    critical_hazards: number;
    high_hazards: number;
    total_violations: number;
    open_violations: number;
    resolved_violations: number;
    capa_pending_review: number;
    total_penalty_exposure_inr: number;
  }>("/api/v1/inspections/stats");
}

// ── Violations & CAPA ────────────────────────────────────────────────────────

export interface ViolationRecord {
  id: string;
  inspection_id: string | null;
  mine_id: string;
  mine_name: string;
  subsidiary: string;
  state: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  penalty_inr: number;
  detected_at: string;
  due_date: string;
  escalation_tier: number;
  capa?: {
    id: string;
    proposed_action: string;
    action_taken_by: string;
    status: string;
    submitted_at: string;
  } | null;
}

export function fetchViolations(params?: { mine_id?: string; status?: string; severity?: string }) {
  const q = new URLSearchParams(params as Record<string, string>).toString();
  return apiFetch<{ violations: ViolationRecord[]; total: number }>(`/api/v1/inspections/violations${q ? `?${q}` : ""}`);
}

export function submitCapa(violationId: string, data: { proposed_action: string; action_taken_by: string; evidence_document?: string }) {
  return apiFetch<{ status: string; capa_id: string; violation_status: string }>(
    `/api/v1/inspections/violations/${violationId}/capa`,
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
}

export function resolveViolation(violationId: string, data: { verified_by: string; notes?: string }) {
  return apiFetch<{ status: string; message: string }>(`/api/v1/inspections/violations/${violationId}/resolve`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ── Blockchain Audit Trail ───────────────────────────────────────────────────

export interface AuditBlock {
  index: number;
  timestamp: string;
  action: string;
  actor_id: string;
  entity_id: string;
  payload_hash: string;
  prev_hash: string;
  block_hash: string;
}

export function fetchAuditBlocks(limit = 50) {
  return apiFetch<{ blocks: AuditBlock[]; total_fetched: number }>(`/api/v1/audit/blocks?limit=${limit}`);
}

export function verifyAuditChain() {
  return apiFetch<{
    valid: boolean;
    total_blocks: number;
    message: string;
    genesis_hash: string | null;
    latest_hash: string | null;
    broken_at_block?: number;
    verified_at: string;
  }>("/api/v1/audit/verify");
}

// ── Contractors & Labor Welfare ───────────────────────────────────────────────

export interface ContractorRecord {
  id: string;
  mine_id: string;
  mine_name: string;
  subsidiary: string;
  company_name: string;
  registration_no: string;
  contact_person: string;
  active_workers: number;
  safety_rating: number;
  compliance_status: string;
  pme_valid_percent: number;
  open_violations: number;
}

export function fetchContractors() {
  return apiFetch<{ contractors: ContractorRecord[]; total: number }>("/api/v1/contractors");
}

export function fetchWelfareSummary() {
  return apiFetch<{
    total_contractor_firms: number;
    total_contract_workforce: number;
    average_safety_index: number;
    average_pme_compliance_percent: number;
    distribution: {
      compliant: number;
      review_required: number;
      blacklisted: number;
    };
    form_iv_statutory_status: string;
  }>("/api/v1/contractors/welfare-summary");
}

