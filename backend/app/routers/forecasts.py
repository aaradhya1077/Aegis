from datetime import datetime
from fastapi import APIRouter, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import SessionLocal, DBDeadlineForecast, DBMine, DBRegulation
from app.models import ForecastResponse, ForecastAlertsResponse
from app.forecasting import generate_forecasts, get_deteriorating_mines

router = APIRouter(prefix="/api/v1/forecasts", tags=["forecasts"])


@router.get("/alerts", response_model=ForecastAlertsResponse)
def forecast_alerts(threshold: float = Query(0.5)) -> ForecastAlertsResponse:
    """All mines trending toward violations."""
    db = SessionLocal()
    try:
        alerts = get_deteriorating_mines(db, threshold=threshold)

        items = [
            ForecastResponse(
                id=a["forecast_id"],
                mine_id=a["mine_id"],
                mine_name=a["mine_name"],
                regulation_id=a["regulation_id"],
                regulation_clause=a["regulation_clause"],
                predicted_risk=a["predicted_risk"],
                trend_direction=a["trend_direction"],
                days_until_due=a["days_until_due"],
                confidence=a["confidence"],
                computed_at=datetime.utcnow(),
            )
            for a in alerts
        ]

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
