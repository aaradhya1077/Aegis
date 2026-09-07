from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import SessionLocal, DBRegulation
from app.models import RegulationResponse, RegulationGraphResponse
from app.knowledge_graph import build_knowledge_graph, get_graph_visualization_data

router = APIRouter(prefix="/api/v1/regulations", tags=["regulations"])


@router.get("", response_model=list[RegulationResponse])
def list_regulations(
    obligation_type: str | None = Query(None),
    act_name: str | None = Query(None),
    severity: str | None = Query(None),
) -> list[RegulationResponse]:
    """List all regulations in the knowledge graph."""
    db = SessionLocal()
    try:
        query = db.query(DBRegulation)

        if obligation_type:
            query = query.filter(DBRegulation.obligation_type == obligation_type)
        if act_name:
            query = query.filter(DBRegulation.act_name == act_name)
        if severity:
            query = query.filter(DBRegulation.severity == severity)

        regulations = query.all()

        return [
            RegulationResponse(
                id=r.id,
                act_name=r.act_name,
                clause_number=r.clause_number,
                clause_text=r.clause_text,
                obligation_type=r.obligation_type,
                filing_type_required=r.filing_type_required,
                frequency_months=r.frequency_months,
                applies_when=r.applies_when,
                severity=r.severity,
            )
            for r in regulations
        ]
    finally:
        db.close()


@router.get("/graph", response_model=RegulationGraphResponse)
def get_regulation_graph() -> RegulationGraphResponse:
    """Return knowledge graph data (nodes + edges) for frontend visualization."""
    db = SessionLocal()
    try:
        G = build_knowledge_graph(db)
        data = get_graph_visualization_data(G)

        return RegulationGraphResponse(
            nodes=[
                {"id": n["id"], "label": n["label"], "type": n["type"], "metadata": n.get("metadata")}
                for n in data["nodes"]
            ],
            edges=[
                {"source": e["source"], "target": e["target"], "relationship": e["relationship"]}
                for e in data["edges"]
            ],
        )
    finally:
        db.close()


@router.get("/{regulation_id}", response_model=RegulationResponse)
def get_regulation(regulation_id: str) -> RegulationResponse:
    """Clause detail with linked obligations."""
    db = SessionLocal()
    try:
        reg = db.query(DBRegulation).filter(DBRegulation.id == regulation_id).first()
        if not reg:
            raise HTTPException(status_code=404, detail="Regulation not found")

        return RegulationResponse(
            id=reg.id,
            act_name=reg.act_name,
            clause_number=reg.clause_number,
            clause_text=reg.clause_text,
            obligation_type=reg.obligation_type,
            filing_type_required=reg.filing_type_required,
            frequency_months=reg.frequency_months,
            applies_when=reg.applies_when,
            severity=reg.severity,
        )
    finally:
        db.close()
