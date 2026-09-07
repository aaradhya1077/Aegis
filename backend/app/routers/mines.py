from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import SessionLocal, DBMine, DBFiling, DBComplianceCheck, DBRiskScore
from app.models import MineResponse, MineSummary, MinesListResponse, MineBenchmark, RiskHistoryResponse, RiskScoreResponse
from app.compliance_engine import compute_risk_score

router = APIRouter(prefix="/api/v1/mines", tags=["mines"])


@router.get("", response_model=MinesListResponse)
def list_mines(
    state: str | None = Query(None),
    subsidiary: str | None = Query(None),
    risk_level: str | None = Query(None),  # low | medium | high | critical
    mine_type: str | None = Query(None),
) -> MinesListResponse:
    """List all mines with current risk scores, filterable."""
    db = SessionLocal()
    try:
        query = db.query(DBMine)

        if state:
            query = query.filter(DBMine.state == state)
        if subsidiary:
            query = query.filter(DBMine.subsidiary == subsidiary)
        if mine_type:
            query = query.filter(DBMine.mine_type == mine_type)

        mines = query.all()

        # Filter by risk level
        if risk_level:
            ranges = {
                "low": (0, 25),
                "medium": (25, 50),
                "high": (50, 75),
                "critical": (75, 100),
            }
            lo, hi = ranges.get(risk_level, (0, 100))
            mines = [m for m in mines if lo <= m.overall_risk_score < hi]

        summaries = [
            MineSummary(
                id=m.id,
                name=m.name,
                state=m.state,
                subsidiary=m.subsidiary,
                mine_type=m.mine_type,
                overall_risk_score=m.overall_risk_score,
                status=m.status,
            )
            for m in mines
        ]

        return MinesListResponse(mines=summaries, total=len(summaries))
    finally:
        db.close()


@router.get("/benchmarks")
def mine_benchmarks() -> list[MineBenchmark]:
    """Multi-mine comparison rankings by compliance health."""
    db = SessionLocal()
    try:
        mines = db.query(DBMine).filter(DBMine.status == "active").all()

        benchmarks = []
        for mine in mines:
            # Count filings
            total_filings = db.query(DBFiling).filter(DBFiling.mine_id == mine.id).count()
            overdue = db.query(DBFiling).filter(
                DBFiling.mine_id == mine.id,
                DBFiling.status == "overdue",
            ).count()

            # Compliance rate
            checks = db.query(DBComplianceCheck).filter(DBComplianceCheck.mine_id == mine.id).all()
            passed = sum(1 for c in checks if c.status == "passed")
            compliance_rate = (passed / max(len(checks), 1)) * 100.0

            benchmarks.append(MineBenchmark(
                mine_id=mine.id,
                mine_name=mine.name,
                state=mine.state,
                subsidiary=mine.subsidiary,
                overall_risk_score=mine.overall_risk_score,
                compliance_rate=round(compliance_rate, 1),
                overdue_count=overdue,
                rank=0,  # Will be set after sorting
            ))

        # Sort by risk score (lower = better) and assign ranks
        benchmarks.sort(key=lambda b: b.overall_risk_score)
        for i, b in enumerate(benchmarks):
            b.rank = i + 1

        return benchmarks
    finally:
        db.close()


@router.get("/{mine_id}", response_model=MineResponse)
def get_mine(mine_id: str) -> MineResponse:
    """Get detailed mine information."""
    db = SessionLocal()
    try:
        mine = db.query(DBMine).filter(DBMine.id == mine_id).first()
        if not mine:
            raise HTTPException(status_code=404, detail="Mine not found")

        return MineResponse(
            id=mine.id,
            name=mine.name,
            state=mine.state,
            district=mine.district,
            company=mine.company,
            subsidiary=mine.subsidiary,
            latitude=mine.latitude,
            longitude=mine.longitude,
            worker_count=mine.worker_count,
            mine_type=mine.mine_type,
            overall_risk_score=mine.overall_risk_score,
            status=mine.status,
            created_at=mine.created_at,
        )
    finally:
        db.close()


@router.get("/{mine_id}/risk-history", response_model=RiskHistoryResponse)
def get_risk_history(mine_id: str, category: str = Query("overall")) -> RiskHistoryResponse:
    """Time-series risk scores for a mine."""
    db = SessionLocal()
    try:
        scores = (
            db.query(DBRiskScore)
            .filter(DBRiskScore.mine_id == mine_id, DBRiskScore.category == category)
            .order_by(DBRiskScore.computed_at.asc())
            .all()
        )

        history = [
            RiskScoreResponse(
                id=s.id,
                mine_id=s.mine_id,
                score=s.score,
                category=s.category,
                computed_at=s.computed_at,
                score_hash=s.score_hash,
            )
            for s in scores
        ]

        return RiskHistoryResponse(mine_id=mine_id, history=history)
    finally:
        db.close()
