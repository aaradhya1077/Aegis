from __future__ import annotations

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, ConfigDict


# ── Authentication ────────────────────────────────────────────────────────────

class User(BaseModel):
    id: str = Field(..., description="User identifier (e.g. REG-001)")
    name: str
    role: str  # regulator | mine_officer | admin


class LoginRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    user_id: str
    password: str


class TokenResponse(BaseModel):
    accessToken: str
    user: User


class RefreshResponse(BaseModel):
    accessToken: str


# ── Mine ──────────────────────────────────────────────────────────────────────

class MineResponse(BaseModel):
    id: str
    name: str
    state: str
    district: str
    company: str
    subsidiary: str
    latitude: float
    longitude: float
    worker_count: int
    mine_type: str
    overall_risk_score: float
    status: str
    created_at: datetime


class MineSummary(BaseModel):
    id: str
    name: str
    state: str
    subsidiary: str
    mine_type: str
    overall_risk_score: float
    status: str


class MinesListResponse(BaseModel):
    mines: list[MineSummary]
    total: int


class MineBenchmark(BaseModel):
    mine_id: str
    mine_name: str
    state: str
    subsidiary: str
    overall_risk_score: float
    compliance_rate: float
    overdue_count: int
    rank: int


# ── Regulation ────────────────────────────────────────────────────────────────

class RegulationResponse(BaseModel):
    id: str
    act_name: str
    clause_number: str
    clause_text: str
    obligation_type: str
    filing_type_required: str
    frequency_months: int | None
    applies_when: dict | None
    severity: str


class RegulationGraphNode(BaseModel):
    id: str
    label: str
    type: str  # act | clause | obligation | filing_type
    metadata: dict | None = None


class RegulationGraphEdge(BaseModel):
    source: str
    target: str
    relationship: str


class RegulationGraphResponse(BaseModel):
    nodes: list[RegulationGraphNode]
    edges: list[RegulationGraphEdge]


# ── Filing ────────────────────────────────────────────────────────────────────

class FilingUploadRequest(BaseModel):
    mine_id: str
    regulation_id: str
    filing_type: str
    filename: str


class FilingResponse(BaseModel):
    id: str
    mine_id: str
    regulation_id: str
    filing_type: str
    submitted_at: datetime | None
    due_date: datetime
    status: str
    extracted_text: str | None
    source_filename: str | None
    ocr_confidence: float | None


class FilingsListResponse(BaseModel):
    filings: list[FilingResponse]
    total: int


# ── Compliance Check ─────────────────────────────────────────────────────────

class ComplianceCheckResponse(BaseModel):
    id: str
    filing_id: str
    regulation_id: str
    mine_id: str
    score: float
    status: str
    findings: list[dict]  # Clause-level findings
    explanation: str
    verified_by: str
    checked_at: datetime


class ComplianceDashboardResponse(BaseModel):
    total_mines: int
    compliant_percentage: float
    overdue_filings: int
    critical_alerts: int
    total_filings: int
    total_checks: int
    risk_distribution: dict  # {"low": N, "medium": N, "high": N, "critical": N}
    compliance_by_category: dict  # {"safety": %, "environmental": %, "labor": %}


class HumanReviewRequest(BaseModel):
    status: str  # passed | failed
    notes: str | None = None


# ── Risk Score ────────────────────────────────────────────────────────────────

class RiskScoreResponse(BaseModel):
    id: str
    mine_id: str
    score: float
    category: str
    computed_at: datetime
    score_hash: str | None


class RiskHistoryResponse(BaseModel):
    mine_id: str
    history: list[RiskScoreResponse]


# ── Forecast ──────────────────────────────────────────────────────────────────

class ForecastResponse(BaseModel):
    id: str
    mine_id: str
    mine_name: str | None = None
    regulation_id: str
    regulation_clause: str | None = None
    predicted_risk: float
    trend_direction: str
    days_until_due: int
    confidence: float
    computed_at: datetime | None = None


class ForecastAlertsResponse(BaseModel):
    alerts: list[ForecastResponse]
    total: int


# ── Chatbot ───────────────────────────────────────────────────────────────────

class ChatQueryRequest(BaseModel):
    query: str
    context: str | None = None  # Optional conversation context
    groq_api_key: str | None = None  # Optional Groq API Key passed from client
    role: str | None = None  # Role lens: regulator | mine_officer | frontline | admin


class ChatResponse(BaseModel):
    answer: str
    sources: list[dict]  # Referenced regulations/mines/filings
    confidence: float
    engine: str | None = "FAISS + Groq RAG"



# ── Dashboard Summary ─────────────────────────────────────────────────────────

class SummaryResponse(BaseModel):
    total_mines: int
    compliant_percentage: float
    critical_alerts: int
    overdue_filings: int
