from __future__ import annotations

from typing import Any, Dict, Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from app.database import SessionLocal, DBMine
from app.xai import compute_shap_explanation, compute_global_importance, FEATURE_DEFINITIONS

router = APIRouter(prefix="/api/v1/xai", tags=["xai"])


class WhatIfSimulationRequest(BaseModel):
    mine_id: str
    methane_ch4_pct: Optional[float] = Field(None, description="Methane % (e.g. 0.35 to 2.5)")
    ventilation_airflow: Optional[float] = Field(None, description="Airflow m³/min (e.g. 80 to 350)")
    strata_convergence_rate: Optional[float] = Field(None, description="Strata convergence mm/day (e.g. 0.2 to 3.5)")
    water_sump_proximity: Optional[float] = Field(None, description="Distance from waterlogged workings in meters")
    lateness_slope: Optional[float] = Field(None, description="Statutory filing delay slope")
    overdue_filings_count: Optional[float] = Field(None, description="Number of overdue returns")
    unresolved_violations: Optional[float] = Field(None, description="Count of open violation notices")
    statutory_sirdar_ratio: Optional[float] = Field(None, description="Supervisory sirdar ratio (0.5 to 1.2)")
    contractor_safety_score: Optional[float] = Field(None, description="Contractor safety index % (60 to 100)")


@router.get("/explain/{mine_id}")
def get_mine_shap_explanation(mine_id: str) -> Dict[str, Any]:
    """Get exact SHAP local feature attribution and waterfall steps for a colliery."""
    db = SessionLocal()
    try:
        mine = db.query(DBMine).filter(DBMine.id == mine_id).first()
        if not mine:
            raise HTTPException(status_code=404, detail="Colliery not found in statutory register")
        return compute_shap_explanation(mine_id, db)
    finally:
        db.close()


@router.post("/what-if")
def simulate_what_if_scenario(payload: WhatIfSimulationRequest) -> Dict[str, Any]:
    """Simulate counterfactual statutory/engineering interventions and recalculate SHAP attributions."""
    db = SessionLocal()
    try:
        mine = db.query(DBMine).filter(DBMine.id == payload.mine_id).first()
        if not mine:
            raise HTTPException(status_code=404, detail="Colliery not found in statutory register")

        # Build custom feature map overriding specified values
        from app.xai import extract_mine_features
        base_features = extract_mine_features(payload.mine_id, db)

        for key, val in payload.model_dump(exclude_unset=True).items():
            if key != "mine_id" and val is not None:
                base_features[key] = float(val)

        return compute_shap_explanation(payload.mine_id, db, custom_features=base_features)
    finally:
        db.close()


@router.get("/global-importance")
def get_global_feature_importance() -> Dict[str, Any]:
    """Get sector-wide mean absolute SHAP feature importance across all Indian coal basins."""
    db = SessionLocal()
    try:
        return compute_global_importance(db)
    finally:
        db.close()
