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


DGMS_CIRCULARS = [
    {
        "id": "DGMS-TC-2024-04",
        "circular_no": "DGMS (Tech) Circular No. 04 of 2024",
        "title": "Pre-Monsoon Preparedness: Inundation Safeguards, River Embankments & Overburden Dump Stability",
        "issue_date": "2024-05-18",
        "authority": "Directorate General of Mines Safety, Eastern & Central Zones, Dhanbad",
        "statutory_ref": "Mines Act 1952 Sec 22 & CMR 2017 Reg 106 & 152",
        "severity": "critical",
        "applicable_to": "Opencast mines with dump height >30m and underground mines within 15m of HFL (Highest Flood Level)",
        "summary": "Mandatory installation of high-capacity submersible dewatering pumps (min 2000 GPM standby), daily geotechnical radar monitoring of external dumps, and clearing drainage diversion channels prior to June 15.",
        "checklist": [
            "Emergency standby pumping capacity verified at least 2x peak inflow",
            "Danger mark etched on river embankment / HFL retaining wall",
            "Geotechnical stability factor of safety (FoS) >= 1.3 for all active dumps",
            "Emergency escape sirens tested in Shift I & II",
        ],
    },
    {
        "id": "DGMS-TC-2024-02",
        "circular_no": "DGMS (Tech) Circular No. 02 of 2024",
        "title": "Continuous Telemetric Gas Monitoring & Real-time Methane Auto-Trip Systems in Belowground Mines",
        "issue_date": "2024-03-10",
        "authority": "Director General of Mines Safety, Safety Information Directorate, Dhanbad",
        "statutory_ref": "CMR 2017 Reg 153 & DGMS S&T Guideline 2023/11",
        "severity": "critical",
        "applicable_to": "All Degree II & Degree III gassy underground coal mines",
        "summary": "Strict prohibition of manual-only flame safety lamp rounds in blind headings. Colliery management must deploy optical telemetric methane sensors coupled with automated electrical circuit breakers calibrated to trip at 0.75% CH4.",
        "checklist": [
            "Optical telemetric methane sensors operational in return airways",
            "Automatic electrical trip breaker functioning at 0.75% CH4",
            "Telemetric data linked to Central DGMS Safety Portal with <5s latency",
            "Self-Contained Self-Rescuers (SCSR) available at all refuge chambers",
        ],
    },
    {
        "id": "DGMS-TC-2025-01",
        "circular_no": "DGMS (Welfare) Circular No. 01 of 2025",
        "title": "Comprehensive Occupational Health Surveillance, PME Parity & Respirable Dust Standards",
        "issue_date": "2025-01-22",
        "authority": "DGMS Occupational Health Division, Dhanbad",
        "statutory_ref": "Mines Rules 1955 Rule 29B & 48, CMR 2017 Reg 143",
        "severity": "high",
        "applicable_to": "All registered collieries deploying contract workforce",
        "summary": "Equal medical welfare entitlement for regular and contractual miners. Zero worker deployment without valid Initial Medical Examination (Form O). High-efficiency water mist suppression mandatory at crusher hoppers and coal handling plants (CHP).",
        "checklist": [
            "100% PME compliance for contract workers updated in Form B",
            "Personal respirable dust samplers deployed at mechanized transfer points",
            "Audiometric and spirometry records archived in digital health repository",
            "Drinking water filtration plants operational at pitheads",
        ],
    },
    {
        "id": "DGMS-TC-2023-09",
        "circular_no": "DGMS (Tech) Circular No. 09 of 2023",
        "title": "Strata Control & Support System Instrumentation in Mechanized Depillaring Districts",
        "issue_date": "2023-11-14",
        "authority": "DGMS Strata Control Cell, Dhanbad",
        "statutory_ref": "CMR 2017 Reg 111 & Reg 123",
        "severity": "high",
        "applicable_to": "Underground continuous miner & bord-and-pillar depillaring operations",
        "summary": "Deployment of continuous remote tell-tale extensometers and load cells to detect bed separation and roof convergence ahead of extraction lines.",
        "checklist": [
            "Remote dual-height tell-tale extensometers installed at 15m intervals",
            "Strata control support plan (SCAMP) approved by Regional Inspector",
            "Resin capsule quality tested and certified batch-wise",
            "Auto-warning beacon triggered on >10mm roof dilation",
        ],
    },
]


@router.get("/circulars/list")
def list_dgms_circulars():
    """Retrieve indexed DGMS Technical Circulars."""
    return {"circulars": DGMS_CIRCULARS, "total": len(DGMS_CIRCULARS)}


@router.post("/circulars/scan")
def scan_mines_for_circular(circular_id: str):
    """Cross-reference all 30 collieries against a specific circular to identify vulnerable mines."""
    from app.database import DBMine
    db = SessionLocal()
    try:
        mines = db.query(DBMine).all()
        target_cir = next((c for c in DGMS_CIRCULARS if c["id"] == circular_id), DGMS_CIRCULARS[0])

        vulnerable_mines = []
        for m in mines:
            is_vuln = False
            risk_factors = []

            if "inundation" in target_cir["title"].lower():
                if m.overall_risk_score > 40 or m.mine_type in ["opencast", "mixed"]:
                    is_vuln = True
                    risk_factors.append("Active opencast dump slope / monsoon flood exposure")
            elif "methane" in target_cir["title"].lower():
                if m.mine_type in ["underground", "mixed"]:
                    is_vuln = True
                    risk_factors.append("Belowground gassy seam requiring telemetric auto-trippers")
            elif "health" in target_cir["title"].lower() or "welfare" in target_cir["title"].lower():
                if m.worker_count > 1000:
                    is_vuln = True
                    risk_factors.append("Large contract workforce requiring Form O medical audit")
            else:
                if m.overall_risk_score > 60:
                    is_vuln = True
                    risk_factors.append("Elevated statutory risk score requiring strata audit")

            if is_vuln:
                vulnerable_mines.append({
                    "mine_id": m.id,
                    "mine_name": m.name,
                    "state": m.state,
                    "subsidiary": m.subsidiary,
                    "mine_type": m.mine_type,
                    "risk_score": m.overall_risk_score,
                    "risk_factors": risk_factors,
                    "action_required": "Dispatch DGMS Statutory Compliance Notice",
                })

        # Sort by highest risk score
        vulnerable_mines.sort(key=lambda x: x["risk_score"], reverse=True)

        return {
            "circular_id": target_cir["id"],
            "circular_title": target_cir["title"],
            "statutory_ref": target_cir["statutory_ref"],
            "total_scanned": len(mines),
            "vulnerable_count": len(vulnerable_mines),
            "vulnerable_mines": vulnerable_mines,
        }
    finally:
        db.close()

