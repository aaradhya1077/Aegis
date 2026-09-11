from __future__ import annotations

import os
from datetime import datetime
from typing import Generator
from sqlalchemy import create_engine, Column, String, Float, DateTime, ForeignKey, Text, Integer, JSON
from sqlalchemy.orm import sessionmaker, Session, declarative_base

# Database URL configuration
DATABASE_URL = os.environ.get("DATABASE_URL")
if DATABASE_URL:
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
else:
    db_path = os.environ.get("DATABASE_PATH") or os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "aegis_compliance.db"
    )
    DATABASE_URL = f"sqlite:///{db_path}"

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


# ── Authentication ────────────────────────────────────────────────────────────

class DBUser(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)  # e.g. REG-001, MINE-001
    name = Column(String, nullable=False)
    role = Column(String, nullable=False)  # regulator | mine_officer | admin
    hashed_password = Column(String, nullable=False)


# ── Mine Registry ─────────────────────────────────────────────────────────────

class DBMine(Base):
    __tablename__ = "mines"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    state = Column(String, nullable=False)
    district = Column(String, nullable=False)
    company = Column(String, nullable=False)           # e.g. "Coal India Limited"
    subsidiary = Column(String, nullable=False)         # e.g. "SECL", "WCL", "NCL"
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    worker_count = Column(Integer, nullable=False, default=0)
    mine_type = Column(String, nullable=False)          # opencast | underground | mixed
    overall_risk_score = Column(Float, default=50.0)    # 0 (safe) → 100 (critical)
    status = Column(String, default="active")           # active | suspended | closed
    created_at = Column(DateTime, default=datetime.utcnow)


# ── Regulatory Knowledge Graph ────────────────────────────────────────────────

class DBRegulation(Base):
    __tablename__ = "regulations"

    id = Column(String, primary_key=True, index=True)
    act_name = Column(String, nullable=False)           # e.g. "Coal Mines Regulations 2017"
    clause_number = Column(String, nullable=False)      # e.g. "Reg. 31"
    clause_text = Column(Text, nullable=False)          # Full clause text
    obligation_type = Column(String, nullable=False)    # safety | environmental | labor
    filing_type_required = Column(String, nullable=False)  # e.g. "Safety Management Plan"
    frequency_months = Column(Integer, nullable=True)   # How often filing is required (null = one-time)
    applies_when = Column(JSON, nullable=True)          # JSON conditions e.g. {"mine_type": "underground", "min_workers": 250}
    severity = Column(String, default="medium")         # low | medium | high | critical


# ── Filed Documents ───────────────────────────────────────────────────────────

class DBFiling(Base):
    __tablename__ = "filings"

    id = Column(String, primary_key=True, index=True)
    mine_id = Column(String, ForeignKey("mines.id"), nullable=False)
    regulation_id = Column(String, ForeignKey("regulations.id"), nullable=False)
    filing_type = Column(String, nullable=False)        # e.g. "Safety Management Plan"
    submitted_at = Column(DateTime, nullable=True)      # null = not yet submitted
    due_date = Column(DateTime, nullable=False)
    status = Column(String, nullable=False, default="pending")  # compliant | overdue | missing | flagged | pending
    extracted_text = Column(Text, nullable=True)        # OCR/NLP extracted content
    source_filename = Column(String, nullable=True)
    ocr_confidence = Column(Float, nullable=True)       # 0.0 → 1.0


# ── Compliance Check Results ──────────────────────────────────────────────────

class DBComplianceCheck(Base):
    __tablename__ = "compliance_checks"

    id = Column(String, primary_key=True, index=True)
    filing_id = Column(String, ForeignKey("filings.id"), nullable=False)
    regulation_id = Column(String, ForeignKey("regulations.id"), nullable=False)
    mine_id = Column(String, ForeignKey("mines.id"), nullable=False)
    score = Column(Float, nullable=False)               # 0.0 (non-compliant) → 1.0 (fully compliant)
    status = Column(String, nullable=False)              # passed | failed | needs_review | human_verified
    findings_json = Column(JSON, nullable=False)         # Clause-level matches/misses
    explanation = Column(Text, nullable=False)           # Plain-language explanation
    verified_by = Column(String, default="ai")           # ai | human
    checked_at = Column(DateTime, default=datetime.utcnow)


# ── Risk Scores (Time Series) ────────────────────────────────────────────────

class DBRiskScore(Base):
    __tablename__ = "risk_scores"

    id = Column(String, primary_key=True, index=True)
    mine_id = Column(String, ForeignKey("mines.id"), nullable=False)
    score = Column(Float, nullable=False)               # 0 → 100
    category = Column(String, nullable=False)            # safety | environmental | labor | overall
    computed_at = Column(DateTime, default=datetime.utcnow)
    score_hash = Column(String, nullable=True)           # SHA-256 audit trail


# ── Deadline Forecasts ────────────────────────────────────────────────────────

class DBDeadlineForecast(Base):
    __tablename__ = "deadline_forecasts"

    id = Column(String, primary_key=True, index=True)
    mine_id = Column(String, ForeignKey("mines.id"), nullable=False)
    regulation_id = Column(String, ForeignKey("regulations.id"), nullable=False)
    predicted_risk = Column(Float, nullable=False)      # 0.0 → 1.0
    trend_direction = Column(String, nullable=False)    # improving | stable | deteriorating
    days_until_due = Column(Integer, nullable=False)
    confidence = Column(Float, nullable=False)           # 0.0 → 1.0
    computed_at = Column(DateTime, default=datetime.utcnow)


# ── Field Inspections ─────────────────────────────────────────────────────────

class DBInspection(Base):
    __tablename__ = "inspections"

    id = Column(String, primary_key=True, index=True)
    mine_id = Column(String, ForeignKey("mines.id"), nullable=False)
    inspector_id = Column(String, nullable=False)        # e.g. REG-001, MINE-001
    inspector_name = Column(String, nullable=False)
    inspected_at = Column(DateTime, default=datetime.utcnow)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    area_inspected = Column(String, nullable=False)       # e.g. "Pit-3 Face", "Shaft-2", "Haul Road North"
    category = Column(String, nullable=False)             # safety | environmental | labor | electrical | ventilation
    status = Column(String, default="submitted")         # draft | submitted | verified | closed
    observations = Column(Text, nullable=False)
    evidence_image_url = Column(String, nullable=True)
    hazard_level = Column(String, default="low")          # low | medium | high | critical
    offline_synced = Column(Integer, default=0)          # 1 if created offline and synced later


# ── Violations & Statutory Non-Compliance ─────────────────────────────────────

class DBViolation(Base):
    __tablename__ = "violations"

    id = Column(String, primary_key=True, index=True)
    inspection_id = Column(String, ForeignKey("inspections.id"), nullable=True)
    mine_id = Column(String, ForeignKey("mines.id"), nullable=False)
    clause_id = Column(String, ForeignKey("regulations.id"), nullable=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    severity = Column(String, nullable=False)            # low | medium | high | critical
    status = Column(String, default="open")              # open | capa_submitted | resolved | escalated
    penalty_inr = Column(Float, default=0.0)
    detected_at = Column(DateTime, default=datetime.utcnow)
    due_date = Column(DateTime, nullable=False)
    escalation_tier = Column(Integer, default=1)         # 1: Mine Manager, 2: Subsidiary GM, 3: DGMS Regional Inspector


# ── Corrective & Preventive Action (CAPA) ─────────────────────────────────────

class DBCapa(Base):
    __tablename__ = "capa_records"

    id = Column(String, primary_key=True, index=True)
    violation_id = Column(String, ForeignKey("violations.id"), nullable=False)
    proposed_action = Column(Text, nullable=False)
    action_taken_by = Column(String, nullable=False)
    evidence_document = Column(String, nullable=True)
    status = Column(String, default="pending_review")     # pending_review | approved | rejected | verified
    submitted_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
    verified_by = Column(String, nullable=True)


# ── Cryptographic Blockchain Audit Ledger ─────────────────────────────────────

class DBAuditBlock(Base):
    __tablename__ = "audit_blocks"

    index = Column(Integer, primary_key=True, autoincrement=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    action = Column(String, nullable=False)              # INSPECTION_SUBMITTED, VIOLATION_RESOLVED, etc.
    actor_id = Column(String, nullable=False)
    entity_id = Column(String, nullable=False)
    payload_hash = Column(String, nullable=False)        # SHA-256 of action data
    prev_hash = Column(String, nullable=False)
    block_hash = Column(String, nullable=False, unique=True)


# ── Contractors & Labor Welfare ───────────────────────────────────────────────

class DBContractor(Base):
    __tablename__ = "contractors"

    id = Column(String, primary_key=True, index=True)
    mine_id = Column(String, ForeignKey("mines.id"), nullable=False)
    company_name = Column(String, nullable=False)
    registration_no = Column(String, nullable=False)
    contact_person = Column(String, nullable=False)
    active_workers = Column(Integer, default=0)
    safety_rating = Column(Float, default=85.0)          # 0 → 100
    compliance_status = Column(String, default="compliant")  # compliant | review_required | blacklisted
    pme_valid_percent = Column(Float, default=95.0)      # Periodic Medical Examination %
    open_violations = Column(Integer, default=0)


# ── Blockchain Helpers ────────────────────────────────────────────────────────

import hashlib
import json

def calculate_block_hash(index: int, timestamp: datetime, action: str, actor_id: str, entity_id: str, payload_hash: str, prev_hash: str) -> str:
    payload = f"{index}:{timestamp.isoformat()}:{action}:{actor_id}:{entity_id}:{payload_hash}:{prev_hash}"
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()

def record_audit_block(db: Session, action: str, actor_id: str, entity_id: str, payload_data: dict) -> DBAuditBlock:
    last_block = db.query(DBAuditBlock).order_by(DBAuditBlock.index.desc()).first()
    new_index = (last_block.index + 1) if last_block else 0
    prev_hash = last_block.block_hash if last_block else "0" * 64
    
    payload_str = json.dumps(payload_data, sort_keys=True, default=str)
    payload_hash = hashlib.sha256(payload_str.encode("utf-8")).hexdigest()
    ts = datetime.utcnow()
    
    block_hash = calculate_block_hash(new_index, ts, action, actor_id, entity_id, payload_hash, prev_hash)
    
    block = DBAuditBlock(
        index=new_index,
        timestamp=ts,
        action=action,
        actor_id=actor_id,
        entity_id=entity_id,
        payload_hash=payload_hash,
        prev_hash=prev_hash,
        block_hash=block_hash,
    )
    db.add(block)
    db.commit()
    db.refresh(block)
    return block

def verify_audit_chain(db: Session) -> dict:
    blocks = db.query(DBAuditBlock).order_by(DBAuditBlock.index.asc()).all()
    if not blocks:
        return {"valid": True, "total_blocks": 0, "message": "Genesis chain ready"}
    
    for i in range(len(blocks)):
        block = blocks[i]
        expected_prev = "0" * 64 if i == 0 else blocks[i - 1].block_hash
        if block.prev_hash != expected_prev:
            return {
                "valid": False,
                "broken_at_block": block.index,
                "message": f"Broken chain at block #{block.index}: invalid previous hash.",
            }
        recomputed_hash = calculate_block_hash(
            block.index, block.timestamp, block.action, block.actor_id, block.entity_id, block.payload_hash, block.prev_hash
        )
        if block.block_hash != recomputed_hash:
            return {
                "valid": False,
                "broken_at_block": block.index,
                "message": f"Tampering detected at block #{block.index}: stored hash does not match computed hash.",
            }
            
    return {"valid": True, "total_blocks": len(blocks), "message": "Audit chain mathematically intact and tamper-proof."}


# ── Database Lifecycle ────────────────────────────────────────────────────────

def init_db() -> None:
    Base.metadata.create_all(bind=engine)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

