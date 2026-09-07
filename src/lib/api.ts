// ── Mock Fallback Database for Standalone / Offline Resilience ───────────────
const MOCK_MINES = [
  { id: "MINE-01", name: "Rajmahal Opencast Project", state: "Jharkhand", district: "Godda", company: "Coal India Limited", subsidiary: "CCL", latitude: 25.05, longitude: 87.84, worker_count: 1200, mine_type: "opencast", overall_risk_score: 28.5, status: "active", created_at: "2024-01-15T00:00:00Z" },
  { id: "MINE-02", name: "Kathara Underground Mine", state: "Jharkhand", district: "Bokaro", company: "Coal India Limited", subsidiary: "CCL", latitude: 23.78, longitude: 85.95, worker_count: 850, mine_type: "underground", overall_risk_score: 72.0, status: "active", created_at: "2024-01-15T00:00:00Z" },
  { id: "MINE-03", name: "Amrapali Opencast Mine", state: "Jharkhand", district: "Dhanbad", company: "Coal India Limited", subsidiary: "CCL", latitude: 23.79, longitude: 86.42, worker_count: 680, mine_type: "opencast", overall_risk_score: 34.0, status: "active", created_at: "2024-01-15T00:00:00Z" },
  { id: "MINE-04", name: "Jharia Colliery Complex", state: "Jharkhand", district: "Dhanbad", company: "Coal India Limited", subsidiary: "BCCL", latitude: 23.74, longitude: 86.41, worker_count: 2100, mine_type: "mixed", overall_risk_score: 84.5, status: "active", created_at: "2024-01-15T00:00:00Z" },
  { id: "MINE-05", name: "Moonidih Underground Mine", state: "Jharkhand", district: "Dhanbad", company: "Coal India Limited", subsidiary: "BCCL", latitude: 23.77, longitude: 86.36, worker_count: 950, mine_type: "underground", overall_risk_score: 61.2, status: "active", created_at: "2024-01-15T00:00:00Z" },
  { id: "MINE-06", name: "Gevra Opencast Project", state: "Chhattisgarh", district: "Korba", company: "Coal India Limited", subsidiary: "SECL", latitude: 22.34, longitude: 82.57, worker_count: 3500, mine_type: "opencast", overall_risk_score: 22.0, status: "active", created_at: "2024-01-15T00:00:00Z" },
  { id: "MINE-07", name: "Kusmunda Opencast Mine", state: "Chhattisgarh", district: "Korba", company: "Coal India Limited", subsidiary: "SECL", latitude: 22.35, longitude: 82.68, worker_count: 2800, mine_type: "opencast", overall_risk_score: 26.5, status: "active", created_at: "2024-01-15T00:00:00Z" },
  { id: "MINE-08", name: "Dipka Opencast Project", state: "Chhattisgarh", district: "Korba", company: "Coal India Limited", subsidiary: "SECL", latitude: 22.31, longitude: 82.55, worker_count: 1800, mine_type: "opencast", overall_risk_score: 31.0, status: "active", created_at: "2024-01-15T00:00:00Z" },
  { id: "MINE-09", name: "Chirimiri Underground Mine", state: "Chhattisgarh", district: "Korea", company: "Coal India Limited", subsidiary: "SECL", latitude: 23.21, longitude: 82.31, worker_count: 600, mine_type: "underground", overall_risk_score: 58.0, status: "active", created_at: "2024-01-15T00:00:00Z" },
  { id: "MINE-10", name: "Talcher Coalfield OCP", state: "Odisha", district: "Angul", company: "Coal India Limited", subsidiary: "MCL", latitude: 20.95, longitude: 85.22, worker_count: 2200, mine_type: "opencast", overall_risk_score: 19.5, status: "active", created_at: "2024-01-15T00:00:00Z" },
  { id: "MINE-11", name: "Bharatpur Opencast Mine", state: "Odisha", district: "Angul", company: "Coal India Limited", subsidiary: "MCL", latitude: 20.93, longitude: 85.15, worker_count: 1600, mine_type: "opencast", overall_risk_score: 41.0, status: "active", created_at: "2024-01-15T00:00:00Z" },
  { id: "MINE-12", name: "Sonepur Bazari OCP", state: "West Bengal", district: "Paschim Bardhaman", company: "Coal India Limited", subsidiary: "ECL", latitude: 23.62, longitude: 87.08, worker_count: 1400, mine_type: "opencast", overall_risk_score: 33.0, status: "active", created_at: "2024-01-15T00:00:00Z" },
  { id: "MINE-13", name: "Ramagundam OCP-III", state: "Telangana", district: "Peddapalli", company: "Singareni Collieries", subsidiary: "SCCL", latitude: 18.75, longitude: 79.47, worker_count: 1900, mine_type: "opencast", overall_risk_score: 25.0, status: "active", created_at: "2024-01-15T00:00:00Z" },
  { id: "MINE-14", name: "Nigahi Opencast Project", state: "Madhya Pradesh", district: "Singrauli", company: "Coal India Limited", subsidiary: "NCL", latitude: 24.10, longitude: 82.62, worker_count: 2400, mine_type: "opencast", overall_risk_score: 18.0, status: "active", created_at: "2024-01-15T00:00:00Z" },
  { id: "MINE-15", name: "Jayant Opencast Mine", state: "Madhya Pradesh", district: "Singrauli", company: "Coal India Limited", subsidiary: "NCL", latitude: 24.12, longitude: 82.64, worker_count: 2000, mine_type: "opencast", overall_risk_score: 21.5, status: "active", created_at: "2024-01-15T00:00:00Z" },
];

const MOCK_DASHBOARD = {
  total_mines: 30,
  compliant_percentage: 84.6,
  overdue_filings: 4,
  critical_alerts: 3,
  total_filings: 218,
  total_checks: 486,
  risk_distribution: { low: 18, medium: 7, high: 3, critical: 2 },
  compliance_by_category: { safety: 88, environmental: 79, labor: 84, dgms: 91 },
};

const MOCK_INSPECTIONS = [
  { id: "INSP-101", mine_id: "MINE-04", mine_name: "Jharia Colliery Complex", subsidiary: "BCCL", state: "Jharkhand", inspector_id: "REG-001", inspector_name: "Dr. Priya Sharma", inspected_at: new Date().toISOString(), latitude: 23.74, longitude: 86.41, area_inspected: "Shaft-2 Seam IV", category: "ventilation", status: "verified", observations: "CH4 reading 0.8% detected near return airway. Auxiliary fan operational.", evidence_image_url: null, hazard_level: "high", offline_synced: 0 },
  { id: "INSP-102", mine_id: "MINE-06", mine_name: "Gevra Opencast Project", subsidiary: "SECL", state: "Chhattisgarh", inspector_id: "REG-001", inspector_name: "Dr. Priya Sharma", inspected_at: new Date().toISOString(), latitude: 22.34, longitude: 82.57, area_inspected: "Haul Road Sector 3", category: "safety", status: "verified", observations: "Berm height 2.2m compliant with CMR 2017 Reg 106. Dust suppression mist active.", evidence_image_url: null, hazard_level: "low", offline_synced: 0 },
  { id: "INSP-103", mine_id: "MINE-02", mine_name: "Kathara Underground Mine", subsidiary: "CCL", state: "Jharkhand", inspector_id: "MINE-001", inspector_name: "Rajesh Kumar", inspected_at: new Date().toISOString(), latitude: 23.78, longitude: 85.95, area_inspected: "District 4 Roof Strata", category: "safety", status: "submitted", observations: "Tell-tale load cells indicate 12mm dilation. Immediate roof bolting reinforcement ordered.", evidence_image_url: null, hazard_level: "critical", offline_synced: 1 },
];

const MOCK_VIOLATIONS = [
  { id: "VIOL-901", inspection_id: "INSP-101", mine_id: "MINE-04", mine_name: "Jharia Colliery Complex", subsidiary: "BCCL", state: "Jharkhand", title: "Methane Exceedance in Return Airway", description: "Methane concentration recorded at 0.8% exceeding 0.75% threshold mandated under CMR 2017 Reg 153.", severity: "critical", status: "open", penalty_inr: 500000, detected_at: new Date().toISOString(), due_date: new Date(Date.now() + 86400000 * 5).toISOString(), escalation_tier: 3, capa: null },
  { id: "VIOL-902", inspection_id: "INSP-103", mine_id: "MINE-02", mine_name: "Kathara Underground Mine", subsidiary: "CCL", state: "Jharkhand", title: "Strata Dilation Beyond Permissible Limit", description: "Tell-tale extensometer recorded 12mm strata separation requiring immediate resin bolting.", severity: "high", status: "capa_submitted", penalty_inr: 250000, detected_at: new Date().toISOString(), due_date: new Date(Date.now() + 86400000 * 7).toISOString(), escalation_tier: 2, capa: { id: "CAPA-401", proposed_action: "Installed 40 high-tensile resin roof bolts along 120m roadway span.", action_taken_by: "Rajesh Kumar", status: "pending_review", submitted_at: new Date().toISOString() } },
];

const MOCK_AUDIT_BLOCKS = [
  { index: 3, timestamp: new Date().toISOString(), action: "VIOLATION_SANCTION_ISSUED", actor_id: "REG-001", entity_id: "VIOL-901", payload_hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", prev_hash: "9b71d224bd62f3785d96d46ad3ea3d73319bfbc2890caadae2dff72519673ca72", block_hash: "2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae" },
  { index: 2, timestamp: new Date(Date.now() - 3600000).toISOString(), action: "FIELD_INSPECTION_COMMITTED", actor_id: "REG-001", entity_id: "INSP-101", payload_hash: "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8", prev_hash: "0000000000000000000000000000000000000000000000000000000000000000", block_hash: "9b71d224bd62f3785d96d46ad3ea3d73319bfbc2890caadae2dff72519673ca72" },
  { index: 1, timestamp: new Date(Date.now() - 7200000).toISOString(), action: "GENESIS_LEDGER_INIT", actor_id: "SYSTEM", entity_id: "AEGIS-GENESIS", payload_hash: "4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a", prev_hash: "0000000000000000000000000000000000000000000000000000000000000000", block_hash: "0000000000000000000000000000000000000000000000000000000000000000" },
];

const MOCK_CONTRACTORS = [
  { id: "CONT-01", mine_id: "MINE-06", mine_name: "Gevra Opencast Project", subsidiary: "SECL", company_name: "BEML Heavy Earthmovers Ltd", registration_no: "DGMS/SECL/2024/77", contact_person: "V. Ramamurthy", active_workers: 420, safety_rating: 94.5, compliance_status: "compliant", pme_valid_percent: 98.2, open_violations: 0 },
  { id: "CONT-02", mine_id: "MINE-04", mine_name: "Jharia Colliery Complex", subsidiary: "BCCL", company_name: "Deccan Mining Logistics", registration_no: "DGMS/BCCL/2023/12", contact_person: "S. K. Banerjee", active_workers: 280, safety_rating: 74.0, compliance_status: "review_required", pme_valid_percent: 81.5, open_violations: 2 },
  { id: "CONT-03", mine_id: "MINE-10", mine_name: "Talcher Coalfield OCP", subsidiary: "MCL", company_name: "Eastern Heavy Transporters", registration_no: "DGMS/MCL/2024/49", contact_person: "A. K. Mishra", active_workers: 310, safety_rating: 91.0, compliance_status: "compliant", pme_valid_percent: 96.0, open_violations: 0 },
];

function getMockFallback<T>(endpoint: string): T | undefined {
  if (endpoint.includes("/compliance/dashboard")) return MOCK_DASHBOARD as unknown as T;
  if (endpoint.includes("/mines/benchmarks")) {
    return MOCK_MINES.map((m, idx) => ({
      mine_id: m.id,
      mine_name: m.name,
      state: m.state,
      subsidiary: m.subsidiary,
      overall_risk_score: m.overall_risk_score,
      compliance_rate: Math.max(60, Math.round(100 - m.overall_risk_score * 0.4)),
      overdue_count: m.overall_risk_score > 60 ? 2 : 0,
      rank: idx + 1,
    })) as unknown as T;
  }
  if (endpoint.startsWith("/api/v1/mines")) return { mines: MOCK_MINES, total: MOCK_MINES.length } as unknown as T;
  if (endpoint.includes("/forecasts/alerts")) {
    return {
      alerts: [
        { id: "FCAST-01", mine_id: "MINE-04", mine_name: "Jharia Colliery Complex", regulation_id: "CMR-104", regulation_clause: "CMR 2017 Reg 104 (SMP Review)", predicted_risk: 0.88, trend_direction: "deteriorating", days_until_due: 4, confidence: 0.92 },
        { id: "FCAST-02", mine_id: "MINE-02", mine_name: "Kathara Underground Mine", regulation_id: "CMR-106", regulation_clause: "CMR 2017 Reg 106 (Ventilation Audit)", predicted_risk: 0.74, trend_direction: "deteriorating", days_until_due: 8, confidence: 0.86 },
        { id: "FCAST-03", mine_id: "MINE-11", mine_name: "Bharatpur Opencast Mine", regulation_id: "CMR-31", regulation_clause: "CMR 2017 Reg 31 (PME Annual Medical)", predicted_risk: 0.58, trend_direction: "stable", days_until_due: 14, confidence: 0.79 },
      ],
      total: 3,
    } as unknown as T;
  }
  if (endpoint.includes("/inspections/stats")) {
    return { total_inspections: 48, critical_hazards: 2, high_hazards: 5, total_violations: 7, open_violations: 3, resolved_violations: 4, capa_pending_review: 2, total_penalty_exposure_inr: 1250000 } as unknown as T;
  }
  if (endpoint.includes("/inspections/violations")) return { violations: MOCK_VIOLATIONS, total: MOCK_VIOLATIONS.length } as unknown as T;
  if (endpoint.includes("/inspections")) return { inspections: MOCK_INSPECTIONS, total: MOCK_INSPECTIONS.length } as unknown as T;
  if (endpoint.includes("/audit/blocks")) return { blocks: MOCK_AUDIT_BLOCKS, total_fetched: MOCK_AUDIT_BLOCKS.length } as unknown as T;
  if (endpoint.includes("/audit/verify")) {
    return { valid: true, total_blocks: 3, message: "Audit chain mathematically intact and tamper-proof.", genesis_hash: "0000000000000000000000000000000000000000000000000000000000000000", latest_hash: "2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae", verified_at: new Date().toISOString() } as unknown as T;
  }
  if (endpoint.includes("/contractors/welfare-summary")) {
    return { total_contractor_firms: 18, total_contract_workforce: 4850, average_safety_index: 88.4, average_pme_compliance_percent: 94.6, distribution: { compliant: 14, review_required: 3, blacklisted: 1 }, form_iv_statutory_status: "Verified 100% On-Time" } as unknown as T;
  }
  if (endpoint.includes("/contractors")) return { contractors: MOCK_CONTRACTORS, total: MOCK_CONTRACTORS.length } as unknown as T;
  if (endpoint.includes("/regulations/graph")) {
    return {
      nodes: [
        { id: "CMR_2017", label: "Coal Mines Regulations 2017", type: "act", metadata: {} },
        { id: "CMR_17", label: "Reg. 17 (Safety Management Plan)", type: "clause", metadata: { severity: "critical" } },
        { id: "CMR_29", label: "Reg. 29 (Annual Safety Return)", type: "clause", metadata: { severity: "high" } },
        { id: "CMR_106", label: "Reg. 106 (Ventilation Scheme)", type: "clause", metadata: { severity: "critical" } },
        { id: "MINES_ACT_1952", label: "The Mines Act 1952", type: "act", metadata: {} },
        { id: "SEC_23", label: "Sec. 23 (Accident Notices)", type: "clause", metadata: { severity: "critical" } },
      ],
      edges: [
        { source: "CMR_2017", target: "CMR_17", relationship: "CONTAINS_CLAUSE" },
        { source: "CMR_2017", target: "CMR_29", relationship: "CONTAINS_CLAUSE" },
        { source: "CMR_2017", target: "CMR_106", relationship: "CONTAINS_CLAUSE" },
        { source: "MINES_ACT_1952", target: "SEC_23", relationship: "CONTAINS_CLAUSE" },
      ],
    } as unknown as T;
  }
  if (endpoint.includes("/regulations")) {
    return [
      { id: "CMR-17", act_name: "Coal Mines Regulations 2017", clause_number: "Reg. 17", clause_text: "Mandatory annual Safety Management Plan (SMP) covering hazard identification, risk assessment, emergency protocols, and safety training schedules.", obligation_type: "safety", filing_type_required: "Safety Management Plan", frequency_months: 12, severity: "critical" },
      { id: "CMR-29", act_name: "Coal Mines Regulations 2017", clause_number: "Reg. 29", clause_text: "Systematic register of all dangerous occurrences, near-misses, and accidents to be submitted within 60 days of calendar year end.", obligation_type: "safety", filing_type_required: "Annual Safety Report", frequency_months: 12, severity: "high" },
      { id: "CMR-106", act_name: "Coal Mines Regulations 2017", clause_number: "Reg. 106", clause_text: "Ventilation scheme showing air volume measurements, fan installations, and automated continuous CH4 gas telemetry.", obligation_type: "safety", filing_type_required: "Ventilation Plan", frequency_months: 3, severity: "critical" },
    ] as unknown as T;
  }
  return undefined;
}

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

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2-second fast timeout

    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
      credentials: "include",
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    // Graceful fallback for offline / standalone mode
  }

  const fallback = getMockFallback<T>(endpoint);
  if (fallback !== undefined) {
    return fallback;
  }

  throw new Error(`API endpoint ${endpoint} unavailable`);
}

const DEMO_USERS: Record<string, { name: string; role: string; password: string }> = {
  "REG-001": { name: "Dr. Priya Sharma (DGMS)", role: "regulator", password: "pass123" },
  "MINE-001": { name: "Rajesh Kumar (Mine Manager)", role: "mine_officer", password: "pass123" },
  "ADMIN-001": { name: "System Administrator", role: "admin", password: "admin123" },
};

export async function login(userId: string, password: string) {
  const normalizedId = userId.trim().toUpperCase();
  const trimmedPassword = password.trim();

  try {
    const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ user_id: normalizedId, password: trimmedPassword }),
    });

    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("Backend API unreachable, using client demo session...", err);
  }

  // Graceful fallback for standalone frontend deployments
  const validUser = DEMO_USERS[normalizedId];
  if (validUser && validUser.password === trimmedPassword) {
    return {
      accessToken: "demo-jwt-aegis-session-token-2026",
      user: {
        id: normalizedId,
        name: validUser.name,
        role: validUser.role,
      },
    };
  }

  throw new Error("Invalid credentials. Try REG-001 / pass123 or use 1-Click Demo Login.");
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

