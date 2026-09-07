from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import (
    SessionLocal,
    DBComplianceCheck,
    DBFiling,
    DBMine,
    DBRegulation,
)
from app.models import (
    ComplianceCheckResponse,
    ComplianceDashboardResponse,
    HumanReviewRequest,
)
from app.compliance_engine import verify_filing

router = APIRouter(prefix="/api/v1/compliance", tags=["compliance"])


@router.get("/dashboard", response_model=ComplianceDashboardResponse)
def compliance_dashboard() -> ComplianceDashboardResponse:
    """Aggregate compliance statistics across all mines."""
    db = SessionLocal()
    try:
        total_mines = db.query(DBMine).filter(DBMine.status == "active").count()
        total_filings = db.query(DBFiling).count()
        total_checks = db.query(DBComplianceCheck).count()

        # Overdue filings
        overdue = db.query(DBFiling).filter(DBFiling.status == "overdue").count()

        # Critical alerts: failed checks with high-severity regulations
        critical_checks = (
            db.query(DBComplianceCheck)
            .join(DBRegulation, DBComplianceCheck.regulation_id == DBRegulation.id)
            .filter(DBComplianceCheck.status == "failed")
            .filter(DBRegulation.severity.in_(["high", "critical"]))
            .count()
        )

        # Compliance percentage
        passed_checks = db.query(DBComplianceCheck).filter(
            DBComplianceCheck.status == "passed"
        ).count()
        compliant_pct = (passed_checks / max(total_checks, 1)) * 100.0

        # Risk distribution
        mines = db.query(DBMine).filter(DBMine.status == "active").all()
        risk_dist = {"low": 0, "medium": 0, "high": 0, "critical": 0}
        for m in mines:
            if m.overall_risk_score < 25:
                risk_dist["low"] += 1
            elif m.overall_risk_score < 50:
                risk_dist["medium"] += 1
            elif m.overall_risk_score < 75:
                risk_dist["high"] += 1
            else:
                risk_dist["critical"] += 1

        # Compliance by category — pre-fetch all regulations to avoid N+1 queries
        all_regulations = {r.id: r for r in db.query(DBRegulation).all()}
        category_stats: dict[str, dict[str, int]] = {}
        checks = db.query(DBComplianceCheck).all()
        for check in checks:
            reg = all_regulations.get(check.regulation_id)
            if reg:
                cat = reg.obligation_type
                if cat not in category_stats:
                    category_stats[cat] = {"passed": 0, "total": 0}
                category_stats[cat]["total"] += 1
                if check.status == "passed":
                    category_stats[cat]["passed"] += 1

        compliance_by_cat = {
            cat: round((stats["passed"] / max(stats["total"], 1)) * 100.0, 1)
            for cat, stats in category_stats.items()
        }

        return ComplianceDashboardResponse(
            total_mines=total_mines,
            compliant_percentage=round(compliant_pct, 1),
            overdue_filings=overdue,
            critical_alerts=critical_checks,
            total_filings=total_filings,
            total_checks=total_checks,
            risk_distribution=risk_dist,
            compliance_by_category=compliance_by_cat,
        )
    finally:
        db.close()


@router.get("/checks/{mine_id}")
def get_compliance_checks(mine_id: str) -> list[ComplianceCheckResponse]:
    """All compliance checks for a mine with clause-level explanations."""
    db = SessionLocal()
    try:
        checks = (
            db.query(DBComplianceCheck)
            .filter(DBComplianceCheck.mine_id == mine_id)
            .order_by(DBComplianceCheck.checked_at.desc())
            .all()
        )

        return [
            ComplianceCheckResponse(
                id=c.id,
                filing_id=c.filing_id,
                regulation_id=c.regulation_id,
                mine_id=c.mine_id,
                score=c.score,
                status=c.status,
                findings=c.findings_json if isinstance(c.findings_json, list) else [],
                explanation=c.explanation,
                verified_by=c.verified_by,
                checked_at=c.checked_at,
            )
            for c in checks
        ]
    finally:
        db.close()


@router.post("/verify/{filing_id}")
def trigger_verification(filing_id: str) -> dict:
    """Trigger verification layer on a filing — checks for substantive evidence."""
    db = SessionLocal()
    try:
        result = verify_filing(filing_id, db)
        if "error" in result:
            raise HTTPException(status_code=404, detail=result["error"])
        return result
    finally:
        db.close()


@router.post("/human-review/{check_id}")
def human_review(check_id: str, payload: HumanReviewRequest) -> dict:
    """Human-in-the-loop confirmation — update a compliance check after human review."""
    db = SessionLocal()
    try:
        check = db.query(DBComplianceCheck).filter(DBComplianceCheck.id == check_id).first()
        if not check:
            raise HTTPException(status_code=404, detail="Compliance check not found")

        check.status = "human_verified" if payload.status == "passed" else "failed"
        check.verified_by = "human"

        if payload.notes:
            check.explanation += f" | Human reviewer notes: {payload.notes}"

        db.commit()

        return {
            "check_id": check_id,
            "updated_status": check.status,
            "verified_by": "human",
            "message": "Compliance check updated with human review",
        }
    finally:
        db.close()
