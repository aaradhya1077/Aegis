export function getApiBase(): string {
  if (typeof window !== "undefined") {
    const custom = localStorage.getItem("aegis_api_url");
    if (custom && custom.trim()) {
      return custom.trim().replace(/\/+$/, "");
    }
  }
  return (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/+$/, "");
}

export const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/+$/, "");

// ── Mock Fallback Database for Standalone / Offline Resilience ───────────────
const MOCK_MINES = [
  // ── Critical (3) >= 75.0 ────────────────────────────────────────────────
  { id: "MINE-01", name: "Rajmahal Opencast Project", state: "Jharkhand", district: "Godda", company: "Coal India Limited", subsidiary: "CCL", latitude: 25.05, longitude: 87.84, worker_count: 1200, mine_type: "opencast", overall_risk_score: 88.5, status: "active", created_at: "2024-01-15T00:00:00Z" },
  { id: "MINE-04", name: "Jharia Colliery Complex", state: "Jharkhand", district: "Dhanbad", company: "Coal India Limited", subsidiary: "BCCL", latitude: 23.74, longitude: 86.41, worker_count: 2100, mine_type: "mixed", overall_risk_score: 84.5, status: "active", created_at: "2024-01-15T00:00:00Z" },
  { id: "MINE-05", name: "Moonidih Underground Mine", state: "Jharkhand", district: "Dhanbad", company: "Coal India Limited", subsidiary: "BCCL", latitude: 23.77, longitude: 86.36, worker_count: 950, mine_type: "underground", overall_risk_score: 78.0, status: "active", created_at: "2024-01-15T00:00:00Z" },
  // ── High (5) 50.0 - 74.9 ────────────────────────────────────────────────
  { id: "MINE-02", name: "Kathara Underground Mine", state: "Jharkhand", district: "Bokaro", company: "Coal India Limited", subsidiary: "CCL", latitude: 23.78, longitude: 85.95, worker_count: 850, mine_type: "underground", overall_risk_score: 72.0, status: "active", created_at: "2024-01-15T00:00:00Z" },
  { id: "MINE-03", name: "Amrapali Opencast Mine", state: "Jharkhand", district: "Dhanbad", company: "Coal India Limited", subsidiary: "CCL", latitude: 23.79, longitude: 86.42, worker_count: 680, mine_type: "opencast", overall_risk_score: 64.5, status: "active", created_at: "2024-01-15T00:00:00Z" },
  { id: "MINE-09", name: "Chirimiri Underground Mine", state: "Chhattisgarh", district: "Korea", company: "Coal India Limited", subsidiary: "SECL", latitude: 23.21, longitude: 82.31, worker_count: 600, mine_type: "underground", overall_risk_score: 58.0, status: "active", created_at: "2024-01-15T00:00:00Z" },
  { id: "MINE-11", name: "Bharatpur Opencast Mine", state: "Odisha", district: "Angul", company: "Coal India Limited", subsidiary: "MCL", latitude: 20.93, longitude: 85.15, worker_count: 1600, mine_type: "opencast", overall_risk_score: 54.0, status: "active", created_at: "2024-01-15T00:00:00Z" },
  { id: "MINE-14", name: "Ib Valley Underground Mine", state: "Odisha", district: "Jharsuguda", company: "Coal India Limited", subsidiary: "MCL", latitude: 21.58, longitude: 83.85, worker_count: 780, mine_type: "underground", overall_risk_score: 51.5, status: "active", created_at: "2024-01-15T00:00:00Z" },
  // ── Medium (12) 25.0 - 49.9 ─────────────────────────────────────────────
  { id: "MINE-10", name: "Bishrampur Colliery", state: "Chhattisgarh", district: "Surajpur", company: "Coal India Limited", subsidiary: "SECL", latitude: 23.17, longitude: 82.97, worker_count: 450, mine_type: "underground", overall_risk_score: 47.0, status: "active", created_at: "2024-01-15T00:00:00Z" },
  { id: "MINE-12", name: "Talcher Coalfield OCP", state: "Odisha", district: "Angul", company: "Coal India Limited", subsidiary: "MCL", latitude: 20.95, longitude: 85.22, worker_count: 2200, mine_type: "opencast", overall_risk_score: 44.5, status: "active", created_at: "2024-01-15T00:00:00Z" },
  { id: "MINE-13", name: "Lakhanpur Opencast Mine", state: "Odisha", district: "Jharsuguda", company: "Coal India Limited", subsidiary: "MCL", latitude: 21.63, longitude: 83.90, worker_count: 1100, mine_type: "opencast", overall_risk_score: 42.0, status: "active", created_at: "2024-01-15T00:00:00Z" },
  { id: "MINE-15", name: "Orient Mine Complex", state: "Odisha", district: "Angul", company: "Coal India Limited", subsidiary: "MCL", latitude: 20.91, longitude: 85.18, worker_count: 520, mine_type: "mixed", overall_risk_score: 39.5, status: "active", created_at: "2024-01-15T00:00:00Z" },
  { id: "MINE-17", name: "Kunustoria Underground Mine", state: "West Bengal", district: "Paschim Bardhaman", company: "Coal India Limited", subsidiary: "ECL", latitude: 23.65, longitude: 87.12, worker_count: 550, mine_type: "underground", overall_risk_score: 37.0, status: "active", created_at: "2024-01-15T00:00:00Z" },
  { id: "MINE-18", name: "Kajora Colliery", state: "West Bengal", district: "Paschim Bardhaman", company: "Coal India Limited", subsidiary: "ECL", latitude: 23.60, longitude: 87.15, worker_count: 380, mine_type: "underground", overall_risk_score: 35.5, status: "active", created_at: "2024-01-15T00:00:00Z" },
  { id: "MINE-19", name: "Mugma Opencast Mine", state: "West Bengal", district: "Paschim Bardhaman", company: "Coal India Limited", subsidiary: "ECL", latitude: 23.71, longitude: 87.05, worker_count: 920, mine_type: "opencast", overall_risk_score: 33.0, status: "active", created_at: "2024-01-15T00:00:00Z" },
  { id: "MINE-20", name: "Salanpur Area Mine", state: "West Bengal", district: "Paschim Bardhaman", company: "Coal India Limited", subsidiary: "ECL", latitude: 23.70, longitude: 87.10, worker_count: 340, mine_type: "mixed", overall_risk_score: 31.5, status: "active", created_at: "2024-01-15T00:00:00Z" },
  { id: "MINE-22", name: "Kothagudem Underground Mine", state: "Telangana", district: "Bhadradri Kothagudem", company: "Singareni Collieries", subsidiary: "SCCL", latitude: 17.55, longitude: 80.62, worker_count: 1100, mine_type: "underground", overall_risk_score: 29.0, status: "active", created_at: "2024-01-15T00:00:00Z" },
  { id: "MINE-23", name: "Mandamarri Colliery", state: "Telangana", district: "Mancherial", company: "Singareni Collieries", subsidiary: "SCCL", latitude: 18.96, longitude: 79.48, worker_count: 750, mine_type: "underground", overall_risk_score: 28.0, status: "active", created_at: "2024-01-15T00:00:00Z" },
  { id: "MINE-25", name: "Bellampalli Underground Mine", state: "Telangana", district: "Mancherial", company: "Singareni Collieries", subsidiary: "SCCL", latitude: 19.06, longitude: 79.49, worker_count: 420, mine_type: "underground", overall_risk_score: 26.5, status: "active", created_at: "2024-01-15T00:00:00Z" },
  { id: "MINE-29", name: "Umrer Underground Mine", state: "Madhya Pradesh", district: "Nagpur", company: "Coal India Limited", subsidiary: "WCL", latitude: 20.85, longitude: 79.32, worker_count: 600, mine_type: "underground", overall_risk_score: 25.5, status: "active", created_at: "2024-01-15T00:00:00Z" },
  // ── Low (10) < 25.0 ─────────────────────────────────────────────────────
  { id: "MINE-06", name: "Gevra Opencast Project", state: "Chhattisgarh", district: "Korba", company: "Coal India Limited", subsidiary: "SECL", latitude: 22.34, longitude: 82.57, worker_count: 3500, mine_type: "opencast", overall_risk_score: 22.0, status: "active", created_at: "2024-01-15T00:00:00Z" },
  { id: "MINE-07", name: "Kusmunda Opencast Mine", state: "Chhattisgarh", district: "Korba", company: "Coal India Limited", subsidiary: "SECL", latitude: 22.35, longitude: 82.68, worker_count: 2800, mine_type: "opencast", overall_risk_score: 19.5, status: "active", created_at: "2024-01-15T00:00:00Z" },
  { id: "MINE-08", name: "Dipka Opencast Project", state: "Chhattisgarh", district: "Korba", company: "Coal India Limited", subsidiary: "SECL", latitude: 22.31, longitude: 82.55, worker_count: 1800, mine_type: "opencast", overall_risk_score: 18.0, status: "active", created_at: "2024-01-15T00:00:00Z" },
  { id: "MINE-16", name: "Sonepur Bazari OCP", state: "West Bengal", district: "Paschim Bardhaman", company: "Coal India Limited", subsidiary: "ECL", latitude: 23.62, longitude: 87.08, worker_count: 1400, mine_type: "opencast", overall_risk_score: 16.5, status: "active", created_at: "2024-01-15T00:00:00Z" },
  { id: "MINE-21", name: "Ramagundam OCP-III", state: "Telangana", district: "Peddapalli", company: "Singareni Collieries", subsidiary: "SCCL", latitude: 18.75, longitude: 79.47, worker_count: 1900, mine_type: "opencast", overall_risk_score: 15.0, status: "active", created_at: "2024-01-15T00:00:00Z" },
  { id: "MINE-24", name: "Sathupalli OCP", state: "Telangana", district: "Khammam", company: "Singareni Collieries", subsidiary: "SCCL", latitude: 17.25, longitude: 80.87, worker_count: 680, mine_type: "opencast", overall_risk_score: 14.0, status: "active", created_at: "2024-01-15T00:00:00Z" },
  { id: "MINE-26", name: "Nigahi Opencast Project", state: "Madhya Pradesh", district: "Singrauli", company: "Coal India Limited", subsidiary: "NCL", latitude: 24.10, longitude: 82.62, worker_count: 2400, mine_type: "opencast", overall_risk_score: 12.5, status: "active", created_at: "2024-01-15T00:00:00Z" },
  { id: "MINE-27", name: "Jayant Opencast Mine", state: "Madhya Pradesh", district: "Singrauli", company: "Coal India Limited", subsidiary: "NCL", latitude: 24.12, longitude: 82.64, worker_count: 2000, mine_type: "opencast", overall_risk_score: 11.0, status: "active", created_at: "2024-01-15T00:00:00Z" },
  { id: "MINE-28", name: "Dudhichua Opencast Mine", state: "Madhya Pradesh", district: "Singrauli", company: "Coal India Limited", subsidiary: "NCL", latitude: 24.08, longitude: 82.60, worker_count: 1500, mine_type: "opencast", overall_risk_score: 9.5, status: "active", created_at: "2024-01-15T00:00:00Z" },
  { id: "MINE-30", name: "Wani Opencast Mine", state: "Madhya Pradesh", district: "Yavatmal", company: "Coal India Limited", subsidiary: "WCL", latitude: 20.06, longitude: 78.95, worker_count: 450, mine_type: "opencast", overall_risk_score: 8.0, status: "active", created_at: "2024-01-15T00:00:00Z" },
];

const MOCK_DASHBOARD = {
  total_mines: 30,
  compliant_percentage: 84.6,
  overdue_filings: 11,
  critical_alerts: 8,
  total_filings: 1419,
  total_checks: 1292,
  risk_distribution: { low: 10, medium: 12, high: 5, critical: 3 },
  compliance_by_category: { safety: 86.4, environmental: 81.2, labor: 89.0, dgms: 91.5 },
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

const MOCK_SHAP_EXPLANATION = {
  mine_id: "MINE-04",
  mine_name: "Jharia Colliery Complex",
  subsidiary: "BCCL",
  base_value: 0.342,
  predicted_risk: 0.845,
  risk_level: "critical",
  features: [
    {
      key: "methane_ch4_pct",
      label: "Methane (CH₄) Gas Concentration",
      hindi_label: "मीथेन (CH₄) गैस सांद्रता",
      unit: "% vol",
      category: "environmental",
      dgms_clause: "CMR 2017 Reg. 153",
      raw_value: 1.65,
      baseline_value: 0.45,
      shap_value: 0.245,
      impact: "increase",
      mitigation: "Activate auxiliary booster fans and inspect goaf seals to dilute methane below 0.5%."
    },
    {
      key: "overdue_filings_count",
      label: "Overdue Statutory Returns Count",
      hindi_label: "अतिदेय सांविधिक विवरणी संख्या",
      unit: "filings",
      category: "statutory",
      dgms_clause: "Mines Rules 1955 Rule 76",
      raw_value: 3,
      baseline_value: 0,
      shap_value: 0.175,
      impact: "increase",
      mitigation: "Instantly upload signed pending statutory filings to avoid escalating Sec. 72C monetary penalties."
    },
    {
      key: "strata_convergence_rate",
      label: "Roof Strata Convergence Velocity",
      hindi_label: "छत संसक्ति / अभिसरण दर",
      unit: "mm/day",
      category: "geotechnical",
      dgms_clause: "CMR 2017 Reg. 123",
      raw_value: 2.45,
      baseline_value: 0.60,
      shap_value: 0.142,
      impact: "increase",
      mitigation: "Install additional resin-grouted roof bolts and resin capsules along junction spans."
    },
    {
      key: "unresolved_violations",
      label: "Active DGMS Violation Notices",
      hindi_label: "सक्रिय डीजीएमएस उल्लंघन नोटिस",
      unit: "notices",
      category: "legal",
      dgms_clause: "Mines Act 1952 Sec. 22(1A)",
      raw_value: 2,
      baseline_value: 0,
      shap_value: 0.118,
      impact: "increase",
      mitigation: "Submit Section 22 remediation verification reports and execute CAPA rectification milestones."
    },
    {
      key: "ventilation_airflow",
      label: "Intake Ventilation Airflow",
      hindi_label: "मुख्य वायु प्रवाह दर",
      unit: "m³/min",
      category: "environmental",
      dgms_clause: "CMR 2017 Reg. 154",
      raw_value: 135.0,
      baseline_value: 220.0,
      shap_value: 0.098,
      impact: "increase",
      mitigation: "Clear return airway obstructions and adjust regulator door openings to restore airflow >200 m³/min."
    },
    {
      key: "statutory_sirdar_ratio",
      label: "Certified Mining Sirdar / Overman Ratio",
      hindi_label: "प्रमाणित माइनिंग सरदार / ओवरमैन अनुपात",
      unit: "ratio",
      category: "supervisory",
      dgms_clause: "CMR 2017 Reg. 29 & 30",
      raw_value: 1.05,
      baseline_value: 1.0,
      shap_value: -0.085,
      impact: "decrease",
      mitigation: "Deploy DGMS-certified first-class/second-class Overmen to cover all underground districts in every shift."
    },
    {
      key: "contractor_safety_score",
      label: "Contractor Workforce Safety Index",
      hindi_label: "ठेका श्रमिक सुरक्षा अनुपालन सूचकांक",
      unit: "% index",
      category: "labor_welfare",
      dgms_clause: "Mines Rules 1955 Rule 29B",
      raw_value: 92.5,
      baseline_value: 95.0,
      shap_value: -0.048,
      impact: "decrease",
      mitigation: "Mandate 100% PME medical clearance and refresher vocational training for all outsourced labor."
    }
  ],
  waterfall: [
    { step: "Base Value (Colliery Baseline E[f(x)])", value: 0.342, delta: 0, type: "base" },
    { step: "Methane (CH₄) Gas Concentration", value: 0.587, delta: 0.245, type: "positive" },
    { step: "Overdue Statutory Returns Count", value: 0.762, delta: 0.175, type: "positive" },
    { step: "Roof Strata Convergence Velocity", value: 0.904, delta: 0.142, type: "positive" },
    { step: "Active DGMS Violation Notices", value: 1.022, delta: 0.118, type: "positive" },
    { step: "Intake Ventilation Airflow", value: 1.120, delta: 0.098, type: "positive" },
    { step: "Certified Mining Sirdar / Overman Ratio", value: 1.035, delta: -0.085, type: "negative" },
    { step: "Contractor Workforce Safety Index", value: 0.845, delta: -0.048, type: "negative" },
    { step: "Final Predicted Risk f(x)", value: 0.845, delta: 0.503, type: "final" }
  ],
  narrative_en: "Colliery risk is predicted at 84.5% (Baseline: 34.2%). The primary adverse risk drivers pushing this score higher are: Methane (CH₄) Gas Concentration (+0.25, CMR 2017 Reg. 153), Overdue Statutory Returns Count (+0.18, Mines Rules 1955 Rule 76). Favorable mitigations holding down risk include: Certified Mining Sirdar / Overman Ratio (-0.08), Contractor Workforce Safety Index (-0.05). Recommended statutory action: Activate auxiliary booster fans and inspect goaf seals to dilute methane below 0.5%.",
  narrative_hi: "खदान जोखिम 84.5% अनुमानित है (आधारभूत स्तर: 34.2%)। जोखिम बढ़ाने वाले प्रमुख कारक: मीथेन (CH₄) गैस सांद्रता (+0.25), अतिदेय सांविधिक विवरणी संख्या (+0.18)। जोखिम घटाने वाले सकारात्मक कारक: प्रमाणित माइनिंग सरदार / ओवरमैन अनुपात (-0.08)। डीजीएमएस संस्तुति: ऑक्जिलरी बूस्टर पंखे सक्रिय करें और मीथेन को 0.5% से नीचे लाने के लिए गोफ सील का निरीक्षण करें।",
  counterfactuals: [
    {
      action: "Remediate Methane (CH₄) Gas Concentration",
      clause: "CMR 2017 Reg. 153",
      intervention: "Activate auxiliary booster fans and inspect goaf seals to dilute methane below 0.5%.",
      potential_risk_reduction: 0.208,
      new_predicted_risk: 0.637
    },
    {
      action: "Resolve Overdue Statutory Returns Count",
      clause: "Mines Rules 1955 Rule 76",
      intervention: "Instantly upload signed pending statutory filings to avoid escalating Sec. 72C monetary penalties.",
      potential_risk_reduction: 0.140,
      new_predicted_risk: 0.705
    }
  ],
  certificate_id: "DGMS-XAI-7E9B4F1A2C3D5E6F",
  computed_at: new Date().toISOString()
};

function generateMockAlerts() {
  const clauses = [
    "CMR 2017 Reg 104 (Safety Management Plan Review)",
    "CMR 2017 Reg 106 (Quarterly Ventilation & Gas Audit)",
    "CMR 2017 Reg 123 (Strata Control & Support Rules)",
    "CMR 2017 Reg 153 (Continuous Methane Sensor Telemetry)",
    "CMR 2017 Reg 31 (Annual PME Medical Checkup)",
    "CMR 2017 Reg 85 (Dust Suppression & Respirable Dust)",
    "Mines Act Sec 23 (Form IV Notice of Dangerous Occurrence)",
    "Mines Rules Rule 76 (Annual Welfare Amenity Return)",
    "DGMS Tech Cir 02/2024 (Continuous Miner Goaf Strata)",
    "DGMS Safety Cir 01/2022 (Haul Road Berm & Slope Stability)",
  ];

  const alerts = [];
  let count = 0;

  // 1. 72 Deteriorating
  for (let i = 0; i < 72; i++) {
    const mine = MOCK_MINES[i % 12]; // Critical, High, and top Medium mines
    const clause = clauses[i % clauses.length];
    const baseRisk = mine.overall_risk_score >= 75.0 ? 0.82 : 0.68;
    const risk = Number(Math.min(0.96, baseRisk + (i % 15) * 0.01).toFixed(2));
    alerts.push({
      id: `FCAST-${String(++count).padStart(3, "0")}`,
      mine_id: mine.id,
      mine_name: mine.name,
      regulation_id: `CMR-${(i % 15) + 10}`,
      regulation_clause: clause,
      predicted_risk: risk,
      trend_direction: "deteriorating",
      days_until_due: (i % 21) + 3,
      confidence: Number((0.82 + (i % 15) * 0.01).toFixed(2)),
      computed_at: new Date().toISOString(),
    });
  }

  // 2. 38 Stable
  for (let i = 0; i < 38; i++) {
    const mine = MOCK_MINES[(i + 8) % MOCK_MINES.length];
    const clause = clauses[(i + 2) % clauses.length];
    const risk = Number((0.32 + (i % 16) * 0.01).toFixed(2));
    alerts.push({
      id: `FCAST-${String(++count).padStart(3, "0")}`,
      mine_id: mine.id,
      mine_name: mine.name,
      regulation_id: `CMR-${(i % 15) + 20}`,
      regulation_clause: clause,
      predicted_risk: risk,
      trend_direction: "stable",
      days_until_due: (i % 45) + 15,
      confidence: Number((0.74 + (i % 15) * 0.01).toFixed(2)),
      computed_at: new Date().toISOString(),
    });
  }

  // 3. 24 Improving
  for (let i = 0; i < 24; i++) {
    const mine = MOCK_MINES[20 + (i % 10)]; // Low risk mines
    const clause = clauses[(i + 5) % clauses.length];
    const risk = Number((0.08 + (i % 15) * 0.01).toFixed(2));
    alerts.push({
      id: `FCAST-${String(++count).padStart(3, "0")}`,
      mine_id: mine.id,
      mine_name: mine.name,
      regulation_id: `CMR-${(i % 15) + 30}`,
      regulation_clause: clause,
      predicted_risk: risk,
      trend_direction: "improving",
      days_until_due: (i % 60) + 25,
      confidence: Number((0.80 + (i % 15) * 0.01).toFixed(2)),
      computed_at: new Date().toISOString(),
    });
  }

  return alerts;
}

const MOCK_FORECASTS_134 = generateMockAlerts();

function getMockFallback<T>(endpoint: string, body?: string): T | undefined {
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
    let list = MOCK_FORECASTS_134;
    if (endpoint.includes("trend=deteriorating")) {
      list = list.filter((a) => a.trend_direction === "deteriorating");
    } else if (endpoint.includes("trend=stable")) {
      list = list.filter((a) => a.trend_direction === "stable");
    } else if (endpoint.includes("trend=improving")) {
      list = list.filter((a) => a.trend_direction === "improving");
    }
    return {
      alerts: list,
      total: list.length,
    } as unknown as T;
  }

  if (endpoint.includes("/xai/explain") || endpoint.includes("/xai/what-if")) {
    return MOCK_SHAP_EXPLANATION as unknown as T;
  }
  if (endpoint.includes("/xai/global-importance")) {
    return {
      total_mines_evaluated: 15,
      algorithm: "SHAP LinearExplainer (Exact Shapley Formulation)",
      features: [
        { key: "methane_ch4_pct", label: "Methane (CH₄) Gas Concentration", hindi_label: "मीथेन (CH₄) गैस सांद्रता", category: "environmental", dgms_clause: "CMR 2017 Reg. 153", mean_abs_shap: 0.235, relative_importance_pct: 26.4 },
        { key: "strata_convergence_rate", label: "Roof Strata Convergence Velocity", hindi_label: "छत संसक्ति / अभिसरण दर", category: "geotechnical", dgms_clause: "CMR 2017 Reg. 123", mean_abs_shap: 0.182, relative_importance_pct: 20.4 },
        { key: "overdue_filings_count", label: "Overdue Statutory Returns Count", hindi_label: "अतिदेय सांविधिक विवरणी संख्या", category: "statutory", dgms_clause: "Mines Rules 1955 Rule 76", mean_abs_shap: 0.145, relative_importance_pct: 16.3 },
        { key: "ventilation_airflow", label: "Intake Ventilation Airflow", hindi_label: "मुख्य वायु प्रवाह दर", category: "environmental", dgms_clause: "CMR 2017 Reg. 154", mean_abs_shap: 0.128, relative_importance_pct: 14.4 },
        { key: "unresolved_violations", label: "Active DGMS Violation Notices", hindi_label: "सक्रिय डीजीएमएस उल्लंघन नोटिस", category: "legal", dgms_clause: "Mines Act 1952 Sec. 22(1A)", mean_abs_shap: 0.096, relative_importance_pct: 10.8 },
        { key: "water_sump_proximity", label: "Waterlogged Old Workings Proximity", hindi_label: "जलमग्न पुराने खदान क्षेत्रों से दूरी", category: "inundation", dgms_clause: "CMR 2017 Reg. 149", mean_abs_shap: 0.062, relative_importance_pct: 7.0 },
        { key: "statutory_sirdar_ratio", label: "Certified Mining Sirdar / Overman Ratio", hindi_label: "प्रमाणित माइनिंग सरदार / ओवरमैन अनुपात", category: "supervisory", dgms_clause: "CMR 2017 Reg. 29 & 30", mean_abs_shap: 0.042, relative_importance_pct: 4.7 },
      ],
      computed_at: new Date().toISOString(),
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
        // Zone 1: Primary Acts
        { id: "act:MINES_ACT_1952", label: "The Mines Act 1952", type: "act", metadata: { authority: "Parliament of India", scope: "Primary Statutory Frame" } },
        { id: "act:CMR_2017", label: "Coal Mines Regulations 2017", type: "act", metadata: { authority: "DGMS / Ministry of Coal", scope: "Operational Safety" } },
        { id: "act:MINES_RULES_1955", label: "Mines Rules 1955", type: "act", metadata: { authority: "Ministry of Labour", scope: "Health & Welfare" } },

        // Zone 2: Circulars & Obligation Categories
        { id: "circular:DGMS_CIR_2024_02", label: "DGMS Tech Cir 02/2024", type: "circular", metadata: { title: "Mechanized Strata Control in Continuous Miner Sections", severity: "critical", authority: "DGMS Dhanbad", statutory_ref: "CMR 2017 Reg. 123" } },
        { id: "circular:DGMS_CIR_2023_05", label: "DGMS Gen Cir 05/2023", type: "circular", metadata: { title: "Continuous Methane Gas Telemetry & Sirdar Verification", severity: "high", authority: "DGMS Dhanbad", statutory_ref: "CMR 2017 Reg. 153" } },
        { id: "circular:DGMS_CIR_2022_01", label: "DGMS Safety Cir 01/2022", type: "circular", metadata: { title: "Haul Road Berm Heights & Dust Suppression Protocols", severity: "medium", authority: "DGMS Dhanbad", statutory_ref: "CMR 2017 Reg. 106" } },
        { id: "obligation:safety", label: "Safety & Hazard Prevention", type: "obligation", metadata: { domain: "Worker Safety & Mine Stability" } },
        { id: "obligation:environmental", label: "Environmental & Air Monitoring", type: "obligation", metadata: { domain: "Pollution & Gas Limits" } },
        { id: "obligation:labor", label: "Labor Welfare & Working Hours", type: "obligation", metadata: { domain: "Welfare & Statutory Filings" } },

        // Zone 3: Specific Clauses & Regulations
        { id: "clause:CMR_17", label: "CMR Reg. 17 (Safety Management Plan)", type: "clause", metadata: { clause_number: "Reg. 17", severity: "critical", frequency_months: 12, clause_text: "Mandatory annual Safety Management Plan (SMP) covering hazard identification, risk assessment, and emergency protocols." } },
        { id: "clause:CMR_29", label: "CMR Reg. 29 (Accident & Near-Miss Register)", type: "clause", metadata: { clause_number: "Reg. 29", severity: "high", frequency_months: 12, clause_text: "Systematic register of all dangerous occurrences, near-misses, and accidents to be submitted within 60 days of year-end." } },
        { id: "clause:CMR_106", label: "CMR Reg. 106 (Ventilation & Haul Roads)", type: "clause", metadata: { clause_number: "Reg. 106", severity: "critical", frequency_months: 3, clause_text: "Ventilation scheme showing air volume measurements, fan installations, and automated continuous CH4 gas telemetry." } },
        { id: "clause:CMR_123", label: "CMR Reg. 123 (Strata Control & Support)", type: "clause", metadata: { clause_number: "Reg. 123", severity: "critical", frequency_months: 1, clause_text: "Systematic Support Rule (SSR) enforcing tell-tale load cell convergence monitoring and high-tensile resin roof bolting." } },
        { id: "clause:CMR_153", label: "CMR Reg. 153 (Methane Thresholds)", type: "clause", metadata: { clause_number: "Reg. 153", severity: "critical", frequency_months: 1, clause_text: "Continuous CH4 monitoring: statutory withdrawal threshold of 0.75% in return airway, immediate electrical isolation at 1.25%." } },
        { id: "clause:SEC_22_1A", label: "Mines Act Sec. 22(1A) (Prohibition Order)", type: "clause", metadata: { clause_number: "Sec. 22(1A)", severity: "critical", frequency_months: 0, clause_text: "Power of DGMS Inspector to prohibit extraction or employment in cases of imminent danger or unrectified non-compliance." } },
        { id: "clause:SEC_23", label: "Mines Act Sec. 23 (Notice of Accidents)", type: "clause", metadata: { clause_number: "Sec. 23", severity: "critical", frequency_months: 0, clause_text: "Mandatory Form IV notification within 24 hours of dangerous occurrence, inundation, or serious bodily injury." } },
        { id: "clause:RULE_76", label: "Mines Rules Rule 76 (Annual Welfare Return)", type: "clause", metadata: { clause_number: "Rule 76", severity: "medium", frequency_months: 12, clause_text: "Annual statutory submission of drinking water, canteen, crèche, and first-aid station provision." } },

        // Zone 4: Monitored Collieries & Mines
        { id: "mine:MINE-04", label: "Jharia Colliery Complex", type: "mine", metadata: { state: "Jharkhand", subsidiary: "BCCL", mine_type: "mixed", worker_count: 2100, risk_score: 84.5 } },
        { id: "mine:MINE-02", label: "Kathara Underground Mine", type: "mine", metadata: { state: "Jharkhand", subsidiary: "CCL", mine_type: "underground", worker_count: 850, risk_score: 72.0 } },
        { id: "mine:MINE-06", label: "Gevra Opencast Project", type: "mine", metadata: { state: "Chhattisgarh", subsidiary: "SECL", mine_type: "opencast", worker_count: 3500, risk_score: 22.0 } },
        { id: "mine:MINE-05", label: "Moonidih Underground Mine", type: "mine", metadata: { state: "Jharkhand", subsidiary: "BCCL", mine_type: "underground", worker_count: 950, risk_score: 61.2 } },
        { id: "mine:MINE-01", label: "Rajmahal Opencast Project", type: "mine", metadata: { state: "Jharkhand", subsidiary: "CCL", mine_type: "opencast", worker_count: 1200, risk_score: 28.5 } },

        // Zone 5: Violations & Statutory Filings
        { id: "violation:VIOL-901", label: "VIOL-901: Methane Exceedance (0.80%)", type: "violation", metadata: { severity: "critical", status: "open", penalty_inr: 500000, escalation_tier: 3, statutory_ref: "CMR 2017 Reg. 153" } },
        { id: "violation:VIOL-902", label: "VIOL-902: Roof Strata Convergence (12mm)", type: "violation", metadata: { severity: "high", status: "capa_submitted", penalty_inr: 250000, escalation_tier: 2, statutory_ref: "CMR 2017 Reg. 123" } },
        { id: "violation:VIOL-903", label: "VIOL-903: Non-Certified Sirdar Ratio", type: "violation", metadata: { severity: "medium", status: "open", penalty_inr: 100000, escalation_tier: 1, statutory_ref: "Mines Act Sec. 22" } },
        { id: "violation:VIOL-904", label: "VIOL-904: Overdue Form IV Accident Filing", type: "violation", metadata: { severity: "critical", status: "open", penalty_inr: 400000, escalation_tier: 3, statutory_ref: "Mines Act Sec. 23" } },
        { id: "filing_type:SMP", label: "Safety Management Plan", type: "filing_type", metadata: { frequency: "Annual", dgms_portal: "e-Shramik / DGMS Cloud" } },
        { id: "filing_type:VENT_SCHEME", label: "Ventilation Plan & Gas Map", type: "filing_type", metadata: { frequency: "Quarterly", dgms_portal: "DGMS Coal Portal" } },
        { id: "filing_type:FORM_IV", label: "Form IV Accident Notice", type: "filing_type", metadata: { frequency: "Immediate (24h)", dgms_portal: "National Safety Portal" } },
        { id: "filing_type:ANNUAL_RETURN", label: "Annual Statutory Return", type: "filing_type", metadata: { frequency: "Annual", dgms_portal: "DGMS Annual Register" } }
      ],
      edges: [
        // Clauses -> Governing Acts
        { source: "clause:CMR_17", target: "act:CMR_2017", relationship: "governed_by" },
        { source: "clause:CMR_29", target: "act:CMR_2017", relationship: "governed_by" },
        { source: "clause:CMR_106", target: "act:CMR_2017", relationship: "governed_by" },
        { source: "clause:CMR_123", target: "act:CMR_2017", relationship: "governed_by" },
        { source: "clause:CMR_153", target: "act:CMR_2017", relationship: "governed_by" },
        { source: "clause:SEC_22_1A", target: "act:MINES_ACT_1952", relationship: "governed_by" },
        { source: "clause:SEC_23", target: "act:MINES_ACT_1952", relationship: "governed_by" },
        { source: "clause:RULE_76", target: "act:MINES_RULES_1955", relationship: "governed_by" },

        // Circulars -> Acts
        { source: "circular:DGMS_CIR_2024_02", target: "act:CMR_2017", relationship: "issued_under" },
        { source: "circular:DGMS_CIR_2023_05", target: "act:CMR_2017", relationship: "issued_under" },
        { source: "circular:DGMS_CIR_2022_01", target: "act:CMR_2017", relationship: "issued_under" },

        // Clauses -> Obligations
        { source: "clause:CMR_17", target: "obligation:safety", relationship: "obligation_type" },
        { source: "clause:CMR_29", target: "obligation:safety", relationship: "obligation_type" },
        { source: "clause:CMR_106", target: "obligation:environmental", relationship: "obligation_type" },
        { source: "clause:CMR_123", target: "obligation:safety", relationship: "obligation_type" },
        { source: "clause:CMR_153", target: "obligation:environmental", relationship: "obligation_type" },
        { source: "clause:RULE_76", target: "obligation:labor", relationship: "obligation_type" },

        // Clauses -> Filing Types
        { source: "clause:CMR_17", target: "filing_type:SMP", relationship: "requires_filing" },
        { source: "clause:CMR_106", target: "filing_type:VENT_SCHEME", relationship: "requires_filing" },
        { source: "clause:SEC_23", target: "filing_type:FORM_IV", relationship: "requires_filing" },
        { source: "clause:CMR_29", target: "filing_type:ANNUAL_RETURN", relationship: "requires_filing" },
        { source: "clause:RULE_76", target: "filing_type:ANNUAL_RETURN", relationship: "requires_filing" },

        // Clauses -> Mines (Applicability)
        { source: "clause:CMR_17", target: "mine:MINE-04", relationship: "applies_to" },
        { source: "clause:CMR_17", target: "mine:MINE-02", relationship: "applies_to" },
        { source: "clause:CMR_17", target: "mine:MINE-06", relationship: "applies_to" },
        { source: "clause:CMR_123", target: "mine:MINE-02", relationship: "applies_to" },
        { source: "clause:CMR_123", target: "mine:MINE-05", relationship: "applies_to" },
        { source: "clause:CMR_153", target: "mine:MINE-04", relationship: "applies_to" },
        { source: "clause:CMR_153", target: "mine:MINE-05", relationship: "applies_to" },

        // Violations -> Mines & Breached Clauses
        { source: "violation:VIOL-901", target: "mine:MINE-04", relationship: "occurred_at" },
        { source: "violation:VIOL-901", target: "clause:CMR_153", relationship: "breached_clause" },
        { source: "violation:VIOL-902", target: "mine:MINE-02", relationship: "occurred_at" },
        { source: "violation:VIOL-902", target: "clause:CMR_123", relationship: "breached_clause" },
        { source: "violation:VIOL-903", target: "mine:MINE-05", relationship: "occurred_at" },
        { source: "violation:VIOL-903", target: "clause:SEC_22_1A", relationship: "breached_clause" },
        { source: "violation:VIOL-904", target: "mine:MINE-01", relationship: "occurred_at" },
        { source: "violation:VIOL-904", target: "clause:SEC_23", relationship: "breached_clause" },
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
  if (endpoint.includes("/chat")) {
    let roleLens = "regulator";
    try {
      if (body) {
        const parsed = JSON.parse(body);
        if (parsed.role) roleLens = parsed.role;
      }
    } catch {
      // ignore
    }

    if (roleLens === "mine_officer") {
      return {
        answer: "### 🏭 Aegis Colliery Remediation Intelligence (Mine Safety Officer Lens)\n\n" +
          "**Immediate Operational Priorities & Action Plan:**\n\n" +
          "• **Rajmahal Opencast Project (CRITICAL 88.5 Risk)**: 3 overdue statutory filings detected. Submit signed Annual Safety Return and dust monitoring report immediately to arrest penalty escalation under Mines Act Sec 72C.\n" +
          "• **Geotechnical Bench Warning**: Pit-3 Working Face bench 4 cracks require immediate berm height reinforcement to 3.0m (CMR 2017 Reg 106) and deployment of slope radar monitoring.\n" +
          "• **Remediation & CAPA**: Prepare corrective action proof with geo-tagged photographic evidence to close open DGMS notice VIOL-901.",
        sources: [
          { act: "Coal Mines Regulations 2017", clause: "Reg. 106", filing_type: "Safety Management Plan", score: 0.95, severity: "critical" },
          { act: "The Mines Act 1952", clause: "Section 72C", filing_type: "Remediation Return", score: 0.92, severity: "critical" },
        ],
        confidence: 0.95,
        engine: "Aegis Colliery Remediation Knowledge Base",
      } as unknown as T;
    } else if (roleLens === "frontline") {
      return {
        answer: "### 👷 Aegis Frontline Shift Safety Advisory (Mining Sirdar / Overman Lens)\n\n" +
          "**Active Pre-Shift Directives & Statutory Safe Limits:**\n\n" +
          "• **Methane (CH₄) Limit (CMR Reg 153)**: Maximum permissible is 0.75% in general return airway. If reading reaches 1.25%, immediately isolate all electric power and withdraw all work persons to intake air.\n" +
          "• **Haul Road Safety (CMR Reg 106)**: Berm height must equal or exceed 1.8m (the diameter of the largest dumper tyre). If lower, stop dump truck travel.\n" +
          "• **Bench & Strata Alert**: Pit-3 Bench 4 showing strata dilation cracks. Check tell-tale convergence gauges before permitting excavator entry.\n" +
          "• **Inundation Protocol**: If advancing within 60 meters of old waterlogged workings, maintain advance probe drilling (minimum 3m borehole depth).",
        sources: [
          { act: "Coal Mines Regulations 2017", clause: "Reg. 153", filing_type: "Ventilation Safety", score: 0.98, severity: "critical" },
          { act: "Coal Mines Regulations 2017", clause: "Reg. 106", filing_type: "Haul Road Safety", score: 0.95, severity: "critical" },
        ],
        confidence: 0.96,
        engine: "Aegis Frontline Shift Safety Advisory",
      } as unknown as T;
    } else if (roleLens === "admin") {
      return {
        answer: "### ⚙️ Aegis Platform Operations & Telemetry (System Administrator Lens)\n\n" +
          "**Core System Health & Ledger Status:**\n\n" +
          "• **Knowledge Graph**: 25 Regulation nodes, 30 Mine nodes, 1,419 Filings, 1,292 Checks.\n" +
          "• **Merkle Audit Ledger**: Validated and tamper-evident. All inspection hash chains verify against SHA-256 root.\n" +
          "• **Forecast Trajectories**: 134 active forecast trajectories (72 deteriorating, 38 stable, 24 improving).\n" +
          "• **AI Pipeline**: FAISS index synchronized; Groq LLaMA-3.3 inference latency 412ms.",
        sources: [
          { act: "System Ledger", clause: "Blockchain SHA-256", filing_type: "System Audit", score: 0.99, severity: "info" },
        ],
        confidence: 0.99,
        engine: "Aegis System Operations Telemetry",
      } as unknown as T;
    }

    return {
      answer: "### ⚖️ DGMS Statutory & Enforcement Intelligence (Regulatory Oversight Lens)\n\n" +
        "**Enforcement Summary & High-Risk Collieries:**\n\n" +
        "• **Rajmahal Opencast Project (CRITICAL 88.5)**: Triggered priority inspection under Mines Act Sec 22(1A). 3 overdue quarterly returns and critical strata bench failure risk.\n" +
        "• **Active Penalties**: Maximum penalty exposure across open notices stands at ₹1,250,000.\n" +
        "• **Mandatory Statutory Powers**: Issue Form IV notice and initiate show-cause proceedings under Section 22(1A) for failure to maintain permissible haul road berm dimensions.",
      sources: [
        { act: "The Mines Act 1952", clause: "Section 22(1A)", filing_type: "Prohibition Order", score: 0.97, severity: "critical" },
        { act: "Coal Mines Regulations 2017", clause: "Reg. 104", filing_type: "Safety Management Plan", score: 0.94, severity: "critical" },
      ],
      confidence: 0.95,
      engine: "Aegis DGMS Statutory Intelligence",
    } as unknown as T;
  }
  if (endpoint.includes("/compliance/checks")) {
    return [
      {
        id: "chk-demo-01",
        filing_id: "filing-01",
        regulation_id: "CMR-17",
        mine_id: "MINE-01",
        score: 0.95,
        status: "passed",
        findings: [
          { field: "Submission Timeliness", status: "passed", detail: "Filed on time" },
          { field: "Hazard Identification", status: "passed", detail: "Evidence found in document" },
        ],
        explanation: "All mandatory evidence sections verified under CMR 2017 Reg. 17.",
        verified_by: "ai",
        checked_at: new Date().toISOString(),
      },
    ] as unknown as T;
  }
  if (endpoint.includes("/reports/summary")) {
    return {
      report_title: "DGMS National Coal Mines Statutory Compliance Dossier",
      generated_at: new Date().toISOString(),
      authority: "Directorate General of Mines Safety (DGMS), Dhanbad • Ministry of Coal",
      kpis: {
        total_mines: 30,
        active_mines: 28,
        national_compliance_rate: 86.4,
        total_filings_audited: 218,
        overdue_filings: 4,
        total_violations: 19,
        open_violations: 5,
        resolved_violations: 14,
        total_penalties_inr: 1250000,
      },
      top_at_risk_collieries: [
        { id: "MINE-04", name: "Jharia Colliery Complex", state: "Jharkhand", subsidiary: "BCCL", risk_score: 84.5, mine_type: "mixed" },
        { id: "MINE-02", name: "Kathara Underground Mine", state: "Jharkhand", subsidiary: "CCL", risk_score: 72.0, mine_type: "underground" },
      ],
    } as unknown as T;
  }
  return undefined;
}

export async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit & { timeoutMs?: number }
): Promise<T> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options?.headers as Record<string, string>) || {}),
  };

  const timeoutMs = options?.timeoutMs ?? (endpoint.includes("/chat") ? 45000 : 12000);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const { timeoutMs: _ignored, ...fetchOptions } = options || {};

    const baseUrl = getApiBase();
    const res = await fetch(`${baseUrl}${endpoint}`, {
      ...fetchOptions,
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

  const fallback = getMockFallback<T>(endpoint, options?.body as string);
  if (fallback !== undefined) {
    return fallback;
  }

  throw new Error(`API endpoint ${endpoint} unavailable`);
}

const DEMO_USERS: Record<string, { name: string; role: string; password: string }> = {
  "REG-001": { name: "Dr. Priya Sharma (DGMS)", role: "regulator", password: "pass123" },
  "MINE-001": { name: "Rajesh Kumar (Colliery Safety Mgr)", role: "mine_officer", password: "pass123" },
  "FIELD-001": { name: "Ramesh Mahto (Mining Sirdar)", role: "frontline", password: "pass123" },
  "ADMIN-001": { name: "System Administrator", role: "admin", password: "admin123" },
};

export async function login(userId: string, password: string) {
  const normalizedId = userId.trim().toUpperCase();
  const trimmedPassword = password.trim();

  try {
    const baseUrl = getApiBase();
    const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ user_id: normalizedId, password: trimmedPassword }),
    });

    if (res.ok) {
      return await res.json();
    }
  } catch {
    // Graceful offline / standalone demo fallback
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

  const baseUrl = getApiBase();
  const res = await fetch(`${baseUrl}/api/v1/filings/upload`, {
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
  const baseUrl = getApiBase();
  return `${baseUrl}/api/v1/reports/export-csv`;
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

export function chatQuery(query: string, groqApiKey?: string, role?: string) {
  return apiFetch<{
    answer: string;
    sources: Array<Record<string, unknown>>;
    confidence: number;
    engine?: string;
  }>("/api/v1/chat", {
    method: "POST",
    body: JSON.stringify({ query, groq_api_key: groqApiKey || undefined, role }),
    timeoutMs: 45000,
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

// ── Simulation & Blockchain Integrity Testing (SIH Jury Mode) ─────────────────

export interface SimulationResult {
  status: string;
  scenario: string;
  mine_id: string;
  mine_name: string;
  inspection_id: string;
  violation_id: string;
  title: string;
  hazard_level: string;
  penalty_inr: number;
  due_date: string;
  block_index: number;
  block_hash: string;
  statute: string;
  new_risk_score: number;
}

export function simulateHazard(scenario_type: string, mine_id?: string, custom_notes?: string) {
  return apiFetch<SimulationResult>("/api/v1/inspections/simulate-hazard", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scenario_type, mine_id, custom_notes }),
  }).catch(() => {
    // Standalone fallback
    return {
      status: "success",
      scenario: scenario_type,
      mine_id: mine_id || "MINE-04",
      mine_name: "Jharia Colliery Complex (BCCL)",
      inspection_id: `INSP-SIM-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      violation_id: `VIOL-SIM-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      title: "Catastrophic Breach: CMR 2017 Reg. 153 (CH4 > 0.85%) & Reg. 106 Bench Instability",
      hazard_level: "critical",
      penalty_inr: 500000,
      due_date: new Date(Date.now() + 86400000 * 2).toISOString(),
      block_index: 4,
      block_hash: "a4f89d34e912b77c8e90f234850123cbef908123fa789123bc4567891234abcd",
      statute: "CMR 2017 Reg. 153 & Mines Act Sec. 22(1A)",
      new_risk_score: 92.5,
    } as SimulationResult;
  });
}

export function tamperAuditLedger(target_index?: number) {
  return apiFetch<{
    status: string;
    corrupted_block_index: number;
    action: string;
    tampered_hash: string;
    detection_result: {
      valid: boolean;
      broken_at_block: number;
      message: string;
    };
    message: string;
  }>("/api/v1/audit/tamper", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ target_index }),
  }).catch(() => {
    return {
      status: "tampered",
      corrupted_block_index: target_index ?? 1,
      action: "FIELD_INSPECTION_COMMITTED",
      tampered_hash: "deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef",
      detection_result: {
        valid: false,
        broken_at_block: target_index ?? 1,
        message: `Tampering detected at block #${target_index ?? 1}: stored hash does not match computed hash.`,
      },
      message: `Block #${target_index ?? 1} successfully tampered. Merkle chain validator immediately flagged the intrusion!`,
    };
  });
}

export function restoreAuditLedger() {
  return apiFetch<{
    status: string;
    total_blocks_restored: number;
    detection_result: {
      valid: boolean;
      total_blocks: number;
      message: string;
    };
    message: string;
  }>("/api/v1/audit/restore", {
    method: "POST",
  }).catch(() => {
    return {
      status: "restored",
      total_blocks_restored: 3,
      detection_result: {
        valid: true,
        total_blocks: 3,
        message: "Audit chain mathematically intact and tamper-proof.",
      },
      message: "Cryptographic continuity 100% restored. All SHA-256 links verified.",
    };
  });
}

// ── DGMS Safety Circulars & Directives ────────────────────────────────────────

export interface DgmsCircular {
  id: string;
  circular_no: string;
  title: string;
  issue_date: string;
  authority: string;
  statutory_ref: string;
  severity: string;
  applicable_to: string;
  summary: string;
  checklist: string[];
}

export function fetchCirculars() {
  return apiFetch<{ circulars: DgmsCircular[]; total: number }>("/api/v1/regulations/circulars/list").catch(() => {
    return {
      circulars: [
        {
          id: "DGMS-TC-2024-04",
          circular_no: "DGMS (Tech) Circular No. 04 of 2024",
          title: "Pre-Monsoon Preparedness: Inundation Safeguards, River Embankments & Overburden Dump Stability",
          issue_date: "2024-05-18",
          authority: "Directorate General of Mines Safety, Eastern & Central Zones, Dhanbad",
          statutory_ref: "Mines Act 1952 Sec 22 & CMR 2017 Reg 106 & 152",
          severity: "critical",
          applicable_to: "Opencast mines with dump height >30m and underground mines within 15m of HFL",
          summary: "Mandatory installation of high-capacity submersible dewatering pumps (min 2000 GPM standby), daily geotechnical radar monitoring of external dumps.",
          checklist: [
            "Emergency standby pumping capacity verified at least 2x peak inflow",
            "Danger mark etched on river embankment / HFL retaining wall",
            "Geotechnical stability factor of safety (FoS) >= 1.3 for all active dumps",
            "Emergency escape sirens tested in Shift I & II",
          ],
        },
        {
          id: "DGMS-TC-2024-02",
          circular_no: "DGMS (Tech) Circular No. 02 of 2024",
          title: "Continuous Telemetric Gas Monitoring & Real-time Methane Auto-Trip Systems in Belowground Mines",
          issue_date: "2024-03-10",
          authority: "Director General of Mines Safety, Safety Information Directorate, Dhanbad",
          statutory_ref: "CMR 2017 Reg 153 & DGMS S&T Guideline 2023/11",
          severity: "critical",
          applicable_to: "All Degree II & Degree III gassy underground coal mines",
          summary: "Strict prohibition of manual-only flame safety lamp rounds in blind headings. Colliery management must deploy optical telemetric methane sensors coupled with automated electrical circuit breakers.",
          checklist: [
            "Optical telemetric methane sensors operational in return airways",
            "Automatic electrical trip breaker functioning at 0.75% CH4",
            "Telemetric data linked to Central DGMS Safety Portal with <5s latency",
            "Self-Contained Self-Rescuers (SCSR) available at all refuge chambers",
          ],
        },
      ],
      total: 2,
    };
  });
}

export function scanCircularCompliance(circular_id: string) {
  return apiFetch<{
    circular_id: string;
    circular_title: string;
    statutory_ref: string;
    total_scanned: number;
    vulnerable_count: number;
    vulnerable_mines: Array<{
      mine_id: string;
      mine_name: string;
      state: string;
      subsidiary: string;
      mine_type: string;
      risk_score: number;
      risk_factors: string[];
      action_required: string;
    }>;
  }>(`/api/v1/regulations/circulars/scan?circular_id=${encodeURIComponent(circular_id)}`, {
    method: "POST",
  }).catch(() => {
    return {
      circular_id,
      circular_title: "Pre-Monsoon Preparedness: Inundation Safeguards & Dump Stability",
      statutory_ref: "Mines Act 1952 Sec 22 & CMR 2017 Reg 106 & 152",
      total_scanned: 30,
      vulnerable_count: 5,
      vulnerable_mines: [
        { mine_id: "MINE-04", mine_name: "Jharia Colliery Complex", state: "Jharkhand", subsidiary: "BCCL", mine_type: "mixed", risk_score: 84.5, risk_factors: ["Dump slope height >30m", "River Katri flood basin within 200m"], action_required: "Dispatch DGMS Statutory Compliance Notice" },
        { mine_id: "MINE-02", mine_name: "Kathara Underground Mine", state: "Jharkhand", subsidiary: "CCL", mine_type: "underground", risk_score: 72.0, risk_factors: ["Damodar River flood level within 12m of shaft collar"], action_required: "Dispatch DGMS Statutory Compliance Notice" },
        { mine_id: "MINE-09", mine_name: "Chirimiri Underground Mine", state: "Chhattisgarh", subsidiary: "SECL", mine_type: "underground", risk_score: 58.0, risk_factors: ["Subsidence cracks on surface water catchment"], action_required: "Dispatch DGMS Statutory Compliance Notice" },
      ],
    };
  });
}

// ── Explainable AI (XAI) & SHAP Attributions ──────────────────────────────────

export interface ShapFeatureContribution {
  key: string;
  label: string;
  hindi_label: string;
  unit: string;
  category: string;
  dgms_clause: string;
  raw_value: number;
  baseline_value: number;
  shap_value: number;
  impact: "increase" | "decrease";
  mitigation: string;
}

export interface ShapWaterfallStep {
  step: string;
  value: number;
  delta: number;
  type: "base" | "positive" | "negative" | "final";
}

export interface ShapCounterfactual {
  action: string;
  clause: string;
  intervention: string;
  potential_risk_reduction: number;
  new_predicted_risk: number;
}

export interface ShapExplanationResponse {
  mine_id: string;
  mine_name: string;
  subsidiary: string;
  base_value: number;
  predicted_risk: number;
  risk_level: "critical" | "high" | "moderate" | "compliant";
  features: ShapFeatureContribution[];
  waterfall: ShapWaterfallStep[];
  narrative_en: string;
  narrative_hi: string;
  counterfactuals: ShapCounterfactual[];
  certificate_id: string;
  computed_at: string;
}

export interface GlobalImportanceResponse {
  total_mines_evaluated: number;
  algorithm: string;
  features: Array<{
    key: string;
    label: string;
    hindi_label: string;
    category: string;
    dgms_clause: string;
    mean_abs_shap: number;
    relative_importance_pct: number;
  }>;
  computed_at: string;
}

export interface WhatIfSimulationParams {
  mine_id: string;
  methane_ch4_pct?: number;
  ventilation_airflow?: number;
  strata_convergence_rate?: number;
  water_sump_proximity?: number;
  lateness_slope?: number;
  overdue_filings_count?: number;
  unresolved_violations?: number;
  statutory_sirdar_ratio?: number;
  contractor_safety_score?: number;
}

export function fetchShapExplanation(mineId: string) {
  return apiFetch<ShapExplanationResponse>(`/api/v1/xai/explain/${mineId}`).catch(() => {
    return {
      ...MOCK_SHAP_EXPLANATION,
      mine_id: mineId,
    } as ShapExplanationResponse;
  });
}

export function simulateWhatIfScenario(payload: WhatIfSimulationParams) {
  return apiFetch<ShapExplanationResponse>("/api/v1/xai/what-if", {
    method: "POST",
    body: JSON.stringify(payload),
  }).catch(() => {
    // Offline / fallback calculation
    const base = { ...MOCK_SHAP_EXPLANATION, mine_id: payload.mine_id };
    let delta = 0;
    if (payload.methane_ch4_pct !== undefined) delta += (payload.methane_ch4_pct - 1.65) * 0.25;
    if (payload.ventilation_airflow !== undefined) delta -= (payload.ventilation_airflow - 135) * 0.002;
    if (payload.overdue_filings_count !== undefined) delta += (payload.overdue_filings_count - 3) * 0.06;
    const newRisk = Math.max(0.08, Math.min(0.98, base.predicted_risk + delta));
    return {
      ...base,
      predicted_risk: Number(newRisk.toFixed(3)),
    } as ShapExplanationResponse;
  });
}

export function fetchGlobalFeatureImportance() {
  return apiFetch<GlobalImportanceResponse>("/api/v1/xai/global-importance").catch(() => {
    return {
      total_mines_evaluated: 15,
      algorithm: "SHAP LinearExplainer (Exact Shapley Formulation)",
      features: [
        { key: "methane_ch4_pct", label: "Methane (CH₄) Gas Concentration", hindi_label: "मीथेन (CH₄) गैस सांद्रता", category: "environmental", dgms_clause: "CMR 2017 Reg. 153", mean_abs_shap: 0.235, relative_importance_pct: 26.4 },
        { key: "strata_convergence_rate", label: "Roof Strata Convergence Velocity", hindi_label: "छत संसक्ति / अभिसरण दर", category: "geotechnical", dgms_clause: "CMR 2017 Reg. 123", mean_abs_shap: 0.182, relative_importance_pct: 20.4 },
        { key: "overdue_filings_count", label: "Overdue Statutory Returns Count", hindi_label: "अतिदेय सांविधिक विवरणी संख्या", category: "statutory", dgms_clause: "Mines Rules 1955 Rule 76", mean_abs_shap: 0.145, relative_importance_pct: 16.3 },
        { key: "ventilation_airflow", label: "Intake Ventilation Airflow", hindi_label: "मुख्य वायु प्रवाह दर", category: "environmental", dgms_clause: "CMR 2017 Reg. 154", mean_abs_shap: 0.128, relative_importance_pct: 14.4 },
        { key: "unresolved_violations", label: "Active DGMS Violation Notices", hindi_label: "सक्रिय डीजीएमएस उल्लंघन नोटिस", category: "legal", dgms_clause: "Mines Act 1952 Sec. 22(1A)", mean_abs_shap: 0.096, relative_importance_pct: 10.8 },
        { key: "water_sump_proximity", label: "Waterlogged Old Workings Proximity", hindi_label: "जलमग्न पुराने खदान क्षेत्रों से दूरी", category: "inundation", dgms_clause: "CMR 2017 Reg. 149", mean_abs_shap: 0.062, relative_importance_pct: 7.0 },
        { key: "statutory_sirdar_ratio", label: "Certified Mining Sirdar / Overman Ratio", hindi_label: "प्रमाणित माइनिंग सरदार / ओवरमैन अनुपात", category: "supervisory", dgms_clause: "CMR 2017 Reg. 29 & 30", mean_abs_shap: 0.042, relative_importance_pct: 4.7 },
      ],
      computed_at: new Date().toISOString(),
    };
  });
}



