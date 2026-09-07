from __future__ import annotations

import re
from fastapi import APIRouter
from sqlalchemy.orm import Session

from app.database import SessionLocal, DBMine, DBFiling, DBRegulation, DBComplianceCheck
from app.models import ChatQueryRequest, ChatResponse
from app.knowledge_graph import build_knowledge_graph, query_graph

router = APIRouter(prefix="/api/v1/chat", tags=["chatbot"])

# ── Intent patterns for rule-based NLQ parsing ────────────────────────────────
INTENT_PATTERNS = [
    {
        "pattern": r"(?:which|what|list)\s+mines?\s+(?:in|from|at)\s+(\w+)\s+(?:have|has|with)\s+overdue",
        "intent": "overdue_by_state",
    },
    {
        "pattern": r"(?:which|what|list)\s+mines?\s+(?:have|has|with)\s+overdue\s+(\w+)",
        "intent": "overdue_by_type",
    },
    {
        "pattern": r"compliance\s+(?:status|score|trend)\s+(?:for|of)\s+(.+)",
        "intent": "mine_compliance",
    },
    {
        "pattern": r"(?:how many|count|total)\s+(?:mines?|filings?|violations?)",
        "intent": "count_query",
    },
    {
        "pattern": r"(?:what|which)\s+regulations?\s+(?:apply|applicable)\s+(?:to|for)\s+(.+)",
        "intent": "regulations_for_mine",
    },
    {
        "pattern": r"(?:risk|danger|critical)\s+(?:mines?|alerts?)",
        "intent": "high_risk_mines",
    },
    {
        "pattern": r"(?:explain|what is|describe)\s+(.+)",
        "intent": "explain_regulation",
    },
]


from app.rag_engine import rag_engine

@router.post("", response_model=ChatResponse)
def chat_query(payload: ChatQueryRequest) -> ChatResponse:
    """Natural-language Q&A over the compliance knowledge base with FAISS + Groq RAG.
    
    1. Direct DB lookup for operational queries (overdue by state/type, high risk counts).
    2. FAISS Vector Search + Groq LLaMA-3 generation for all statutory compliance queries.
    """
    db = SessionLocal()
    try:
        query_text = payload.query.lower().strip()
        sources: list[dict] = []

        # ── Fast operational database queries ─────────────────────────────
        for ip in INTENT_PATTERNS:
            match = re.search(ip["pattern"], query_text, re.IGNORECASE)
            if match:
                intent = ip["intent"]
                captured = match.group(1) if match.lastindex else ""

                if intent == "overdue_by_state":
                    answer, sources = _handle_overdue_by_state(db, captured)
                    return ChatResponse(answer=answer, sources=sources, confidence=0.92, engine="Operational Database Query")
                elif intent == "overdue_by_type":
                    answer, sources = _handle_overdue_by_type(db, captured)
                    return ChatResponse(answer=answer, sources=sources, confidence=0.92, engine="Operational Database Query")
                elif intent == "mine_compliance":
                    answer, sources = _handle_mine_compliance(db, captured)
                    return ChatResponse(answer=answer, sources=sources, confidence=0.90, engine="Operational Database Query")
                elif intent == "count_query":
                    answer, sources = _handle_count_query(db, query_text)
                    return ChatResponse(answer=answer, sources=sources, confidence=0.95, engine="Operational Database Query")
                elif intent == "high_risk_mines":
                    answer, sources = _handle_high_risk_mines(db)
                    return ChatResponse(answer=answer, sources=sources, confidence=0.92, engine="Operational Database Query")

        # ── High-Precision Statutory RAG (FAISS + Groq LLaMA-3) ───────────
        rag_result = rag_engine.query_with_rag(
            query=payload.query,
            groq_api_key=payload.groq_api_key,
            db=db,
        )
        return ChatResponse(
            answer=rag_result["answer"],
            sources=rag_result["sources"],
            confidence=rag_result["confidence"],
            engine=rag_result.get("engine", "FAISS + Groq RAG"),
        )

    finally:
        db.close()



def _handle_overdue_by_state(db: Session, state: str) -> tuple[str, list]:
    """Find mines with overdue filings in a specific state."""
    state = state.strip().title()

    overdue_filings = (
        db.query(DBFiling)
        .join(DBMine, DBFiling.mine_id == DBMine.id)
        .filter(DBMine.state == state)
        .filter(DBFiling.status == "overdue")
        .all()
    )

    if not overdue_filings:
        # Try partial match
        mines_in_state = db.query(DBMine).filter(DBMine.state.ilike(f"%{state}%")).all()
        if not mines_in_state:
            return f"No mines found in '{state}'. Available states: Jharkhand, Chhattisgarh, Odisha, West Bengal, Telangana, Madhya Pradesh.", []

        state = mines_in_state[0].state
        overdue_filings = (
            db.query(DBFiling)
            .join(DBMine, DBFiling.mine_id == DBMine.id)
            .filter(DBMine.state == state)
            .filter(DBFiling.status == "overdue")
            .all()
        )

    if not overdue_filings:
        return f"No overdue filings found for mines in {state}. All mines are currently compliant.", []

    # Group by mine
    mine_overdue: dict[str, list] = {}
    for f in overdue_filings:
        mine = db.query(DBMine).filter(DBMine.id == f.mine_id).first()
        mine_name = mine.name if mine else f.mine_id
        mine_overdue.setdefault(mine_name, []).append(f.filing_type)

    lines = [f"**Mines in {state} with overdue filings:**\n"]
    sources = []
    for mine_name, filing_types in mine_overdue.items():
        lines.append(f"• **{mine_name}**: {', '.join(set(filing_types))}")
        sources.append({"type": "mine", "name": mine_name, "overdue_count": len(filing_types)})

    lines.append(f"\n*Total: {len(overdue_filings)} overdue filings across {len(mine_overdue)} mines.*")

    return "\n".join(lines), sources


def _handle_overdue_by_type(db: Session, filing_type_keyword: str) -> tuple[str, list]:
    """Find overdue filings of a specific type."""
    overdue = (
        db.query(DBFiling)
        .filter(DBFiling.status == "overdue")
        .filter(DBFiling.filing_type.ilike(f"%{filing_type_keyword}%"))
        .all()
    )

    if not overdue:
        return f"No overdue filings found matching '{filing_type_keyword}'.", []

    lines = [f"**Overdue '{filing_type_keyword}' filings:**\n"]
    sources = []
    for f in overdue:
        mine = db.query(DBMine).filter(DBMine.id == f.mine_id).first()
        mine_name = mine.name if mine else f.mine_id
        lines.append(f"• **{mine_name}** — Due: {f.due_date.strftime('%Y-%m-%d') if f.due_date else 'N/A'}")
        sources.append({"type": "filing", "mine": mine_name, "filing_type": f.filing_type})

    return "\n".join(lines), sources


def _handle_mine_compliance(db: Session, mine_query: str) -> tuple[str, list]:
    """Get compliance status for a specific mine."""
    mine_query = mine_query.strip()
    mine = db.query(DBMine).filter(
        DBMine.name.ilike(f"%{mine_query}%")
    ).first()

    if not mine:
        return f"No mine found matching '{mine_query}'.", []

    filings = db.query(DBFiling).filter(DBFiling.mine_id == mine.id).all()
    checks = db.query(DBComplianceCheck).filter(DBComplianceCheck.mine_id == mine.id).all()

    passed = sum(1 for c in checks if c.status == "passed")
    failed = sum(1 for c in checks if c.status == "failed")
    overdue = sum(1 for f in filings if f.status == "overdue")

    answer = (
        f"**Compliance Status for {mine.name}:**\n\n"
        f"• **Risk Score**: {mine.overall_risk_score}/100\n"
        f"• **Total Filings**: {len(filings)}\n"
        f"• **Compliance Checks**: {len(checks)} ({passed} passed, {failed} failed)\n"
        f"• **Overdue Filings**: {overdue}\n"
        f"• **Mine Type**: {mine.mine_type}\n"
        f"• **Workers**: {mine.worker_count}\n"
        f"• **Location**: {mine.district}, {mine.state}"
    )

    sources = [{"type": "mine", "id": mine.id, "name": mine.name}]
    return answer, sources


def _handle_count_query(db: Session, query_text: str) -> tuple[str, list]:
    """Handle counting queries."""
    if "mine" in query_text:
        count = db.query(DBMine).filter(DBMine.status == "active").count()
        return f"There are **{count} active mines** currently being monitored.", []
    elif "filing" in query_text:
        count = db.query(DBFiling).count()
        overdue = db.query(DBFiling).filter(DBFiling.status == "overdue").count()
        return f"Total filings: **{count}** ({overdue} overdue).", []
    elif "violation" in query_text:
        failed = db.query(DBComplianceCheck).filter(DBComplianceCheck.status == "failed").count()
        return f"There are **{failed} active violations** (failed compliance checks).", []
    else:
        return "Could you specify what you'd like to count? (mines, filings, violations)", []


def _handle_regulations_for_mine(db: Session, mine_query: str) -> tuple[str, list]:
    """Find applicable regulations for a mine."""
    mine = db.query(DBMine).filter(DBMine.name.ilike(f"%{mine_query.strip()}%")).first()
    if not mine:
        return f"No mine found matching '{mine_query}'.", []

    G = build_knowledge_graph(db)
    regs = query_graph(G, "regulations_for_mine", mine_id=mine.id)

    if not regs:
        return f"No specific regulations found for {mine.name}.", []

    lines = [f"**Regulations applicable to {mine.name}:**\n"]
    sources = []
    for r in regs[:15]:
        lines.append(f"• {r.get('label', 'Unknown')}")
        sources.append({"type": "regulation", "id": r.get("regulation_id")})

    return "\n".join(lines), sources


def _handle_high_risk_mines(db: Session) -> tuple[str, list]:
    """List mines with high risk scores."""
    mines = (
        db.query(DBMine)
        .filter(DBMine.status == "active")
        .filter(DBMine.overall_risk_score >= 60)
        .order_by(DBMine.overall_risk_score.desc())
        .all()
    )

    if not mines:
        return "No high-risk mines detected. All mines are within acceptable risk levels.", []

    lines = ["**High-Risk Mines (Risk Score ≥ 60):**\n"]
    sources = []
    for m in mines[:10]:
        risk_label = "🔴 Critical" if m.overall_risk_score >= 75 else "🟠 High"
        lines.append(f"• {risk_label} **{m.name}** ({m.state}) — Score: {m.overall_risk_score}")
        sources.append({"type": "mine", "id": m.id, "name": m.name, "risk": m.overall_risk_score})

    return "\n".join(lines), sources


def _handle_explain_regulation(db: Session, regulation_query: str) -> tuple[str, list]:
    """Explain a regulation or clause."""
    reg = db.query(DBRegulation).filter(
        DBRegulation.clause_number.ilike(f"%{regulation_query.strip()}%")
    ).first()

    if not reg:
        reg = db.query(DBRegulation).filter(
            DBRegulation.filing_type_required.ilike(f"%{regulation_query.strip()}%")
        ).first()

    if not reg:
        return f"No regulation found matching '{regulation_query}'.", []

    answer = (
        f"**{reg.clause_number} — {reg.act_name}**\n\n"
        f"{reg.clause_text}\n\n"
        f"• **Obligation Type**: {reg.obligation_type}\n"
        f"• **Required Filing**: {reg.filing_type_required}\n"
        f"• **Frequency**: Every {reg.frequency_months} months\n"
        f"• **Severity**: {reg.severity}"
    )

    sources = [{"type": "regulation", "id": reg.id, "act": reg.act_name}]
    return answer, sources


def _handle_general_query(db: Session, query_text: str) -> tuple[str, list]:
    """Fallback handler for unrecognized queries."""
    # Try to find relevant information by keyword matching
    keywords = query_text.split()

    # Search mines
    for kw in keywords:
        if len(kw) > 3:
            mine = db.query(DBMine).filter(DBMine.name.ilike(f"%{kw}%")).first()
            if mine:
                return _handle_mine_compliance(db, mine.name)

            reg = db.query(DBRegulation).filter(
                DBRegulation.filing_type_required.ilike(f"%{kw}%")
            ).first()
            if reg:
                return _handle_explain_regulation(db, reg.clause_number)

    return (
        "I can help you with:\n\n"
        "• **Mine compliance**: *\"compliance status for [mine name]\"*\n"
        "• **Overdue filings**: *\"which mines in Jharkhand have overdue filings\"*\n"
        "• **Risk alerts**: *\"show high risk mines\"*\n"
        "• **Regulations**: *\"what regulations apply to [mine name]\"*\n"
        "• **Counts**: *\"how many mines are being monitored\"*\n"
        "• **Explanations**: *\"explain Safety Management Plan\"*\n\n"
        "Try rephrasing your question using one of these patterns.",
        []
    )
