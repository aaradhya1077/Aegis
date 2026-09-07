from __future__ import annotations

import uuid
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import (
    get_db,
    DBInspection,
    DBViolation,
    DBCapa,
    DBMine,
    DBRegulation,
    record_audit_block,
)

router = APIRouter(prefix="/api/v1/inspections", tags=["inspections"])


# ── Pydantic Schemas ──────────────────────────────────────────────────────────

class InspectionCreate(BaseModel):
    mine_id: str
    inspector_id: str
    inspector_name: str
    latitude: float
    longitude: float
    area_inspected: str
    category: str = "safety"
    hazard_level: str = "low"
    observations: str
    evidence_image_url: Optional[str] = None
    offline_synced: int = 0


class CapaCreate(BaseModel):
    proposed_action: str
    action_taken_by: str
    evidence_document: Optional[str] = None


class ViolationResolve(BaseModel):
    verified_by: str
    notes: Optional[str] = None


# ── Inspection Endpoints ──────────────────────────────────────────────────────

@router.get("")
def list_inspections(
    mine_id: Optional[str] = None,
    category: Optional[str] = None,
    hazard_level: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(DBInspection)
    if mine_id:
        query = query.filter(DBInspection.mine_id == mine_id)
    if category:
        query = query.filter(DBInspection.category == category)
    if hazard_level:
        query = query.filter(DBInspection.hazard_level == hazard_level)

    inspections = query.order_by(DBInspection.inspected_at.desc()).all()

    # Join with mine name
    results = []
    for insp in inspections:
        mine = db.query(DBMine).filter(DBMine.id == insp.mine_id).first()
        results.append({
            "id": insp.id,
            "mine_id": insp.mine_id,
            "mine_name": mine.name if mine else insp.mine_id,
            "subsidiary": mine.subsidiary if mine else "",
            "state": mine.state if mine else "",
            "inspector_id": insp.inspector_id,
            "inspector_name": insp.inspector_name,
            "inspected_at": insp.inspected_at.isoformat() if insp.inspected_at else None,
            "latitude": insp.latitude,
            "longitude": insp.longitude,
            "area_inspected": insp.area_inspected,
            "category": insp.category,
            "status": insp.status,
            "observations": insp.observations,
            "evidence_image_url": insp.evidence_image_url,
            "hazard_level": insp.hazard_level,
            "offline_synced": insp.offline_synced,
        })
    return {"inspections": results, "total": len(results)}


@router.post("")
def create_inspection(payload: InspectionCreate, db: Session = Depends(get_db)):
    mine = db.query(DBMine).filter(DBMine.id == payload.mine_id).first()
    if not mine:
        raise HTTPException(status_code=404, detail="Mine not found")

    inspection_id = f"INSP-{uuid.uuid4().hex[:8].upper()}"
    ts = datetime.utcnow()

    inspection = DBInspection(
        id=inspection_id,
        mine_id=payload.mine_id,
        inspector_id=payload.inspector_id,
        inspector_name=payload.inspector_name,
        inspected_at=ts,
        latitude=payload.latitude,
        longitude=payload.longitude,
        area_inspected=payload.area_inspected,
        category=payload.category,
        status="submitted",
        observations=payload.observations,
        evidence_image_url=payload.evidence_image_url,
        hazard_level=payload.hazard_level,
        offline_synced=payload.offline_synced,
    )
    db.add(inspection)
    db.commit()

    # Record in cryptographic blockchain audit log
    record_audit_block(
        db=db,
        action="INSPECTION_SUBMITTED",
        actor_id=payload.inspector_id,
        entity_id=inspection_id,
        payload_data={
            "mine_id": payload.mine_id,
            "area": payload.area_inspected,
            "hazard_level": payload.hazard_level,
            "category": payload.category,
            "lat": payload.latitude,
            "lng": payload.longitude,
        },
    )

    # Auto-generate Violation and CAPA prompt if high/critical hazard detected
    violation_id = None
    if payload.hazard_level in ["high", "critical"]:
        violation_id = f"VIOL-{uuid.uuid4().hex[:8].upper()}"
        days = 3 if payload.hazard_level == "critical" else 7
        penalty = 250000.0 if payload.hazard_level == "critical" else 100000.0

        violation = DBViolation(
            id=violation_id,
            inspection_id=inspection_id,
            mine_id=payload.mine_id,
            title=f"Critical Non-Compliance at {payload.area_inspected}",
            description=payload.observations,
            severity=payload.hazard_level,
            status="open",
            penalty_inr=penalty,
            detected_at=ts,
            due_date=ts + timedelta(days=days),
            escalation_tier=2 if payload.hazard_level == "critical" else 1,
        )
        db.add(violation)
        db.commit()

        record_audit_block(
            db=db,
            action="VIOLATION_AUTO_FLAGGED",
            actor_id="SYSTEM_RULES_ENGINE",
            entity_id=violation_id,
            payload_data={
                "inspection_id": inspection_id,
                "severity": payload.hazard_level,
                "penalty_inr": penalty,
                "due_date": (ts + timedelta(days=days)).isoformat(),
            },
        )

    return {
        "status": "success",
        "inspection_id": inspection_id,
        "violation_flagged": violation_id is not None,
        "violation_id": violation_id,
    }


# ── Violations & CAPA Endpoints ───────────────────────────────────────────────

@router.get("/violations")
def list_violations(
    mine_id: Optional[str] = None,
    status: Optional[str] = None,
    severity: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(DBViolation)
    if mine_id:
        query = query.filter(DBViolation.mine_id == mine_id)
    if status:
        query = query.filter(DBViolation.status == status)
    if severity:
        query = query.filter(DBViolation.severity == severity)

    violations = query.order_by(DBViolation.detected_at.desc()).all()
    results = []
    for v in violations:
        mine = db.query(DBMine).filter(DBMine.id == v.mine_id).first()
        capa = db.query(DBCapa).filter(DBCapa.violation_id == v.id).first()
        results.append({
            "id": v.id,
            "inspection_id": v.inspection_id,
            "mine_id": v.mine_id,
            "mine_name": mine.name if mine else v.mine_id,
            "subsidiary": mine.subsidiary if mine else "",
            "state": mine.state if mine else "",
            "title": v.title,
            "description": v.description,
            "severity": v.severity,
            "status": v.status,
            "penalty_inr": v.penalty_inr,
            "detected_at": v.detected_at.isoformat() if v.detected_at else None,
            "due_date": v.due_date.isoformat() if v.due_date else None,
            "escalation_tier": v.escalation_tier,
            "capa": {
                "id": capa.id,
                "proposed_action": capa.proposed_action,
                "action_taken_by": capa.action_taken_by,
                "status": capa.status,
                "submitted_at": capa.submitted_at.isoformat() if capa.submitted_at else None,
            } if capa else None,
        })
    return {"violations": results, "total": len(results)}


@router.post("/violations/{violation_id}/capa")
def submit_capa(
    violation_id: str,
    payload: CapaCreate,
    db: Session = Depends(get_db),
):
    violation = db.query(DBViolation).filter(DBViolation.id == violation_id).first()
    if not violation:
        raise HTTPException(status_code=404, detail="Violation not found")

    capa_id = f"CAPA-{uuid.uuid4().hex[:8].upper()}"
    capa = DBCapa(
        id=capa_id,
        violation_id=violation_id,
        proposed_action=payload.proposed_action,
        action_taken_by=payload.action_taken_by,
        evidence_document=payload.evidence_document,
        status="pending_review",
        submitted_at=datetime.utcnow(),
    )
    db.add(capa)
    violation.status = "capa_submitted"
    db.commit()

    record_audit_block(
        db=db,
        action="CAPA_SUBMITTED",
        actor_id=payload.action_taken_by,
        entity_id=capa_id,
        payload_data={
            "violation_id": violation_id,
            "proposed_action": payload.proposed_action,
        },
    )

    return {"status": "success", "capa_id": capa_id, "violation_status": violation.status}


@router.post("/violations/{violation_id}/resolve")
def resolve_violation(
    violation_id: str,
    payload: ViolationResolve,
    db: Session = Depends(get_db),
):
    violation = db.query(DBViolation).filter(DBViolation.id == violation_id).first()
    if not violation:
        raise HTTPException(status_code=404, detail="Violation not found")

    violation.status = "resolved"
    capa = db.query(DBCapa).filter(DBCapa.violation_id == violation_id).first()
    if capa:
        capa.status = "verified"
        capa.resolved_at = datetime.utcnow()
        capa.verified_by = payload.verified_by

    db.commit()

    record_audit_block(
        db=db,
        action="VIOLATION_RESOLVED",
        actor_id=payload.verified_by,
        entity_id=violation_id,
        payload_data={
            "notes": payload.notes,
            "resolved_at": datetime.utcnow().isoformat(),
        },
    )

    return {"status": "success", "message": f"Violation {violation_id} successfully closed and verified in audit ledger."}


# ── Inspection Statistics ─────────────────────────────────────────────────────

@router.get("/stats")
def get_inspection_stats(db: Session = Depends(get_db)):
    total_inspections = db.query(DBInspection).count()
    critical_inspections = db.query(DBInspection).filter(DBInspection.hazard_level == "critical").count()
    high_inspections = db.query(DBInspection).filter(DBInspection.hazard_level == "high").count()
    
    total_violations = db.query(DBViolation).count()
    open_violations = db.query(DBViolation).filter(DBViolation.status == "open").count()
    resolved_violations = db.query(DBViolation).filter(DBViolation.status == "resolved").count()
    capa_pending = db.query(DBCapa).filter(DBCapa.status == "pending_review").count()

    total_penalty = sum(v.penalty_inr for v in db.query(DBViolation).filter(DBViolation.status != "resolved").all())

    return {
        "total_inspections": total_inspections,
        "critical_hazards": critical_inspections,
        "high_hazards": high_inspections,
        "total_violations": total_violations,
        "open_violations": open_violations,
        "resolved_violations": resolved_violations,
        "capa_pending_review": capa_pending,
        "total_penalty_exposure_inr": total_penalty,
    }
