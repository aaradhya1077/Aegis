"""
Deadline / Compliance-Trend Forecasting

Tracks filing punctuality per mine over time and predicts which mines
are trending toward violations. Uses simple linear regression on
lateness-over-time — intentionally lightweight for hackathon compute budget.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timedelta
from typing import Any

from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import DBDeadlineForecast, DBFiling, DBMine, DBRegulation


def compute_filing_trends(mine_id: str, db: Session) -> list[dict[str, Any]]:
    """Analyze filing punctuality patterns for a mine.

    Returns a list of trend records per regulation, each with:
    - Average lateness (days)
    - Trend direction (improving / stable / deteriorating)
    - Predicted risk for next filing cycle
    """
    filings = (
        db.query(DBFiling)
        .filter(DBFiling.mine_id == mine_id)
        .filter(DBFiling.due_date.isnot(None))
        .order_by(DBFiling.due_date.asc())
        .all()
    )

    if not filings:
        return []

    # Group filings by regulation
    by_regulation: dict[str, list[DBFiling]] = {}
    for f in filings:
        by_regulation.setdefault(f.regulation_id, []).append(f)

    trends = []
    for reg_id, reg_filings in by_regulation.items():
        regulation = db.query(DBRegulation).filter(DBRegulation.id == reg_id).first()
        if not regulation:
            continue

        # Calculate lateness for each filing (positive = late, negative = early)
        lateness_values: list[float] = []
        for f in reg_filings:
            if f.submitted_at and f.due_date:
                delta = (f.submitted_at - f.due_date).days
                lateness_values.append(float(delta))
            elif f.due_date and not f.submitted_at:
                # Not submitted — treat as maximally late from today
                delta = (datetime.utcnow() - f.due_date).days
                lateness_values.append(max(float(delta), 30.0))

        if not lateness_values:
            continue

        # Simple linear regression: trend = slope of lateness over time
        n = len(lateness_values)
        avg_lateness = sum(lateness_values) / n

        if n >= 2:
            # Calculate slope using least squares
            x_mean = (n - 1) / 2.0
            y_mean = avg_lateness
            numerator = sum((i - x_mean) * (lateness_values[i] - y_mean) for i in range(n))
            denominator = sum((i - x_mean) ** 2 for i in range(n))
            slope = numerator / max(denominator, 0.001)
        else:
            slope = 0.0

        # Determine trend direction
        if slope > 2.0:
            trend_direction = "deteriorating"
        elif slope < -2.0:
            trend_direction = "improving"
        else:
            trend_direction = "stable"

        # Predict risk (0 to 1): based on average lateness + trend
        # Higher lateness + positive slope = higher predicted risk
        base_risk = min(max(avg_lateness / 30.0, 0.0), 1.0)  # Normalize to 0-1
        trend_factor = min(max(slope / 10.0, -0.3), 0.3)      # Trend adjustment
        predicted_risk = min(max(base_risk + trend_factor, 0.0), 1.0)

        # Confidence: higher with more data points
        confidence = min(n / 6.0, 1.0)  # Max confidence at 6+ data points

        # Days until next due date
        last_due = max(f.due_date for f in reg_filings if f.due_date)
        if regulation.frequency_months:
            next_due = last_due + timedelta(days=regulation.frequency_months * 30)
            days_until_due = max((next_due - datetime.utcnow()).days, 0)
        else:
            days_until_due = 0

        trend_record = {
            "regulation_id": reg_id,
            "regulation_clause": f"{regulation.clause_number} — {regulation.filing_type_required}",
            "act_name": regulation.act_name,
            "avg_lateness_days": round(avg_lateness, 1),
            "slope": round(slope, 2),
            "trend_direction": trend_direction,
            "predicted_risk": round(predicted_risk, 3),
            "confidence": round(confidence, 3),
            "days_until_due": days_until_due,
            "filing_count": n,
            "last_status": reg_filings[-1].status if reg_filings else "unknown",
        }
        trends.append(trend_record)

    return trends


def generate_forecasts(mine_id: str, db: Session) -> list[DBDeadlineForecast]:
    """Generate and persist deadline forecasts for a mine."""
    trends = compute_filing_trends(mine_id, db)

    forecasts = []
    for trend in trends:
        forecast = DBDeadlineForecast(
            id=str(uuid.uuid4()),
            mine_id=mine_id,
            regulation_id=trend["regulation_id"],
            predicted_risk=trend["predicted_risk"],
            trend_direction=trend["trend_direction"],
            days_until_due=trend["days_until_due"],
            confidence=trend["confidence"],
            computed_at=datetime.utcnow(),
        )
        db.add(forecast)
        forecasts.append(forecast)

    db.commit()
    return forecasts


def get_deteriorating_mines(db: Session, threshold: float = 0.6) -> list[dict[str, Any]]:
    """Find all mines trending toward violations.

    Returns mines where predicted risk exceeds the threshold
    and trend is deteriorating.
    """
    forecasts = (
        db.query(DBDeadlineForecast)
        .filter(DBDeadlineForecast.predicted_risk >= threshold)
        .filter(DBDeadlineForecast.trend_direction == "deteriorating")
        .all()
    )

    alerts = []
    for fc in forecasts:
        mine = db.query(DBMine).filter(DBMine.id == fc.mine_id).first()
        reg = db.query(DBRegulation).filter(DBRegulation.id == fc.regulation_id).first()

        alerts.append({
            "forecast_id": fc.id,
            "mine_id": fc.mine_id,
            "mine_name": mine.name if mine else "Unknown",
            "regulation_id": fc.regulation_id,
            "regulation_clause": f"{reg.clause_number} — {reg.filing_type_required}" if reg else "Unknown",
            "predicted_risk": fc.predicted_risk,
            "trend_direction": fc.trend_direction,
            "days_until_due": fc.days_until_due,
            "confidence": fc.confidence,
        })

    return sorted(alerts, key=lambda x: x["predicted_risk"], reverse=True)
