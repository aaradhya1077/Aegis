from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import SessionLocal, DBDeadlineForecast, DBMine, DBRegulation
from app.models import ForecastResponse, ForecastAlertsResponse
from app.forecasting import generate_forecasts, get_deteriorating_mines

router = APIRouter(prefix="/api/v1/forecasts", tags=["forecasts"])


@router.get("/alerts", response_model=ForecastAlertsResponse)
def forecast_alerts(
    threshold: float = Query(0.0),
    trend: str | None = Query(None),
) -> ForecastAlertsResponse:
    """All monitored statutory deadline forecasts across mines."""
    db = SessionLocal()
    try:
        query = db.query(DBDeadlineForecast)
        if threshold > 0.0:
            query = query.filter(DBDeadlineForecast.predicted_risk >= threshold)
        if trend:
            query = query.filter(DBDeadlineForecast.trend_direction == trend)

        forecasts = query.order_by(DBDeadlineForecast.predicted_risk.desc()).all()

        items = []
        for fc in forecasts:
            mine = db.query(DBMine).filter(DBMine.id == fc.mine_id).first()
            reg = db.query(DBRegulation).filter(DBRegulation.id == fc.regulation_id).first()
            clause_str = f"{reg.clause_number} ({reg.filing_type_required})" if reg else fc.regulation_id

            items.append(
                ForecastResponse(
                    id=fc.id,
                    mine_id=fc.mine_id,
                    mine_name=mine.name if mine else fc.mine_id,
                    regulation_id=fc.regulation_id,
                    regulation_clause=clause_str,
                    predicted_risk=fc.predicted_risk,
                    trend_direction=fc.trend_direction,
                    days_until_due=fc.days_until_due,
                    confidence=fc.confidence,
                    computed_at=fc.computed_at or datetime.now(timezone.utc),
                )
            )

        return ForecastAlertsResponse(alerts=items, total=len(items))
    finally:
        db.close()


@router.get("/{mine_id}")
def mine_forecasts(mine_id: str) -> list[ForecastResponse]:
    """Deadline trend predictions for a specific mine."""
    db = SessionLocal()
    try:
        mine = db.query(DBMine).filter(DBMine.id == mine_id).first()
        if not mine:
            raise HTTPException(status_code=404, detail="Mine not found")

        # Get existing forecasts
        forecasts = (
            db.query(DBDeadlineForecast)
            .filter(DBDeadlineForecast.mine_id == mine_id)
            .order_by(DBDeadlineForecast.predicted_risk.desc())
            .all()
        )

        if not forecasts:
            # Generate fresh forecasts
            forecasts = generate_forecasts(mine_id, db)

        items = []
        for fc in forecasts:
            reg = db.query(DBRegulation).filter(DBRegulation.id == fc.regulation_id).first()
            items.append(
                ForecastResponse(
                    id=fc.id,
                    mine_id=fc.mine_id,
                    mine_name=mine.name,
                    regulation_id=fc.regulation_id,
                    regulation_clause=f"{reg.clause_number} — {reg.filing_type_required}" if reg else None,
                    predicted_risk=fc.predicted_risk,
                    trend_direction=fc.trend_direction,
                    days_until_due=fc.days_until_due,
                    confidence=fc.confidence,
                    computed_at=fc.computed_at,
                )
            )

        return items
    finally:
        db.close()
