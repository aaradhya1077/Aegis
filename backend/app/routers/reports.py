from __future__ import annotations

import csv
import io
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database import (
    get_db,
    DBMine,
    DBFiling,
    DBComplianceCheck,
    DBViolation,
    DBInspection,
    DBContractor,
)

router = APIRouter(prefix="/api/v1/reports", tags=["reports"])


@router.get("")
@router.get("/summary")
def get_reports_summary(db: Session = Depends(get_db)) -> dict:
    """Comprehensive statutory compliance and risk summary report across all Indian coal mines."""
    total_mines = db.query(DBMine).count()
    active_mines = db.query(DBMine).filter(DBMine.status == "active").count()
    total_filings = db.query(DBFiling).count()
    total_checks = db.query(DBComplianceCheck).count()
    passed_checks = db.query(DBComplianceCheck).filter(DBComplianceCheck.status == "passed").count()
    overdue_filings = db.query(DBFiling).filter(DBFiling.status == "overdue").count()

    # Violations & penalties
    violations = db.query(DBViolation).all()
    total_violations = len(violations)
    open_violations = sum(1 for v in violations if v.status == "open")
    resolved_violations = sum(1 for v in violations if v.status == "resolved")
    total_penalties_inr = sum(v.penalty_inr or 0.0 for v in violations)

    # Top risk mines
    top_risk_mines = (
        db.query(DBMine)
        .order_by(DBMine.overall_risk_score.desc())
        .limit(5)
        .all()
    )

    national_compliance_rate = round((passed_checks / max(total_checks, 1)) * 100.0, 1)

    return {
        "report_title": "DGMS National Coal Mines Statutory Compliance Dossier",
        "generated_at": datetime.utcnow().isoformat(),
        "authority": "Directorate General of Mines Safety (DGMS), Dhanbad • Ministry of Coal",
        "kpis": {
            "total_mines": total_mines,
            "active_mines": active_mines,
            "national_compliance_rate": national_compliance_rate,
            "total_filings_audited": total_filings,
            "overdue_filings": overdue_filings,
            "total_violations": total_violations,
            "open_violations": open_violations,
            "resolved_violations": resolved_violations,
            "total_penalties_inr": total_penalties_inr,
        },
        "top_at_risk_collieries": [
            {
                "id": m.id,
                "name": m.name,
                "state": m.state,
                "subsidiary": m.subsidiary,
                "risk_score": m.overall_risk_score,
                "mine_type": m.mine_type,
            }
            for m in top_risk_mines
        ],
    }


@router.get("/export-csv")
def export_mines_compliance_csv(db: Session = Depends(get_db)):
    """Export nationwide colliery compliance database as downloadable CSV."""
    mines = db.query(DBMine).order_by(DBMine.overall_risk_score.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)

    # CSV Header
    writer.writerow([
        "Mine ID",
        "Colliery Name",
        "State",
        "District",
        "Subsidiary",
        "Mine Type",
        "Workforce",
        "Risk Score (0-100)",
        "Statutory Status",
        "Overdue Filings",
        "Latitude",
        "Longitude",
    ])

    for m in mines:
        overdue_count = db.query(DBFiling).filter(
            DBFiling.mine_id == m.id,
            DBFiling.status == "overdue",
        ).count()

        writer.writerow([
            m.id,
            m.name,
            m.state,
            m.district,
            m.subsidiary,
            m.mine_type,
            m.worker_count,
            round(m.overall_risk_score, 1),
            m.status,
            overdue_count,
            m.latitude,
            m.longitude,
        ])

    output.seek(0)
    filename = f"DGMS_Colliery_Compliance_Report_{datetime.utcnow().strftime('%Y%m%d')}.csv"

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/mine/{mine_id}")
def get_mine_detailed_report(mine_id: str, db: Session = Depends(get_db)):
    """Generate comprehensive single-colliery statutory compliance audit report."""
    mine = db.query(DBMine).filter(DBMine.id == mine_id).first()
    if not mine:
        raise HTTPException(status_code=404, detail="Colliery not found")

    filings = db.query(DBFiling).filter(DBFiling.mine_id == mine_id).all()
    checks = db.query(DBComplianceCheck).filter(DBComplianceCheck.mine_id == mine_id).all()
    violations = db.query(DBViolation).filter(DBViolation.mine_id == mine_id).all()
    inspections = db.query(DBInspection).filter(DBInspection.mine_id == mine_id).all()
    contractors = db.query(DBContractor).filter(DBContractor.mine_id == mine_id).all()

    passed_checks = sum(1 for c in checks if c.status == "passed")
    compliance_rate = round((passed_checks / max(len(checks), 1)) * 100.0, 1)

    return {
        "colliery": {
            "id": mine.id,
            "name": mine.name,
            "state": mine.state,
            "district": mine.district,
            "subsidiary": mine.subsidiary,
            "mine_type": mine.mine_type,
            "worker_count": mine.worker_count,
            "overall_risk_score": mine.overall_risk_score,
            "compliance_rate": compliance_rate,
        },
        "audit_metrics": {
            "total_filings": len(filings),
            "overdue_filings": sum(1 for f in filings if f.status == "overdue"),
            "compliance_checks_conducted": len(checks),
            "inspections_logged": len(inspections),
            "violations_detected": len(violations),
            "open_violations": sum(1 for v in violations if v.status == "open"),
            "total_penalty_exposure_inr": sum(v.penalty_inr or 0.0 for v in violations),
            "contractor_firms_onboarded": len(contractors),
        },
        "recent_violations": [
            {
                "id": v.id,
                "title": v.title,
                "severity": v.severity,
                "status": v.status,
                "penalty_inr": v.penalty_inr,
                "due_date": v.due_date.isoformat() if v.due_date else None,
            }
            for v in violations[:10]
        ],
    }
