"""
Regulatory Knowledge Graph — networkx-based regulation structure.

Encodes Indian coal mining regulations as an explicit graph:
- Nodes: Acts, Clauses, Obligation Types, Filing Types, Mines
- Edges: requires_filing, applies_to, governed_by
"""

from __future__ import annotations

import json
from typing import Any

import networkx as nx
from sqlalchemy.orm import Session

from app.database import DBRegulation, DBMine


def build_knowledge_graph(db: Session) -> nx.DiGraph:
    """Build a directed graph from regulation and mine records."""
    G = nx.DiGraph()

    regulations = db.query(DBRegulation).all()
    mines = db.query(DBMine).all()

    # ── Add Act-level nodes ───────────────────────────────────────────────
    act_names = set()
    for reg in regulations:
        act_names.add(reg.act_name)

    for act in act_names:
        G.add_node(
            f"act:{act}",
            label=act,
            type="act",
            metadata={}
        )

    # ── Add Obligation Type nodes ─────────────────────────────────────────
    obligation_types = {"safety", "environmental", "labor"}
    for ot in obligation_types:
        G.add_node(
            f"obligation:{ot}",
            label=ot.title(),
            type="obligation",
            metadata={}
        )

    # ── Add Filing Type nodes ─────────────────────────────────────────────
    filing_types = set()
    for reg in regulations:
        filing_types.add(reg.filing_type_required)

    for ft in filing_types:
        G.add_node(
            f"filing_type:{ft}",
            label=ft,
            type="filing_type",
            metadata={}
        )

    # ── Add Clause nodes + edges ──────────────────────────────────────────
    for reg in regulations:
        clause_id = f"clause:{reg.id}"
        G.add_node(
            clause_id,
            label=f"{reg.clause_number} — {reg.filing_type_required}",
            type="clause",
            metadata={
                "clause_number": reg.clause_number,
                "clause_text": reg.clause_text,
                "severity": reg.severity,
                "frequency_months": reg.frequency_months,
                "applies_when": reg.applies_when,
            }
        )

        # Clause → Act (governed_by)
        G.add_edge(clause_id, f"act:{reg.act_name}", relationship="governed_by")

        # Clause → Obligation Type
        G.add_edge(clause_id, f"obligation:{reg.obligation_type}", relationship="obligation_type")

        # Clause → Filing Type (requires_filing)
        G.add_edge(clause_id, f"filing_type:{reg.filing_type_required}", relationship="requires_filing")

    # ── Add Mine nodes + applicable regulation edges ──────────────────────
    for mine in mines:
        mine_node = f"mine:{mine.id}"
        G.add_node(
            mine_node,
            label=mine.name,
            type="mine",
            metadata={
                "state": mine.state,
                "mine_type": mine.mine_type,
                "worker_count": mine.worker_count,
                "subsidiary": mine.subsidiary,
            }
        )

        # Check which regulations apply to this mine
        for reg in regulations:
            if _regulation_applies_to_mine(reg, mine):
                G.add_edge(
                    f"clause:{reg.id}",
                    mine_node,
                    relationship="applies_to"
                )

    # ── Add Circular nodes ────────────────────────────────────────────────
    try:
        from app.routers.regulations import DGMS_CIRCULARS
        for circ in DGMS_CIRCULARS:
            circ_node = f"circular:{circ['id']}"
            G.add_node(
                circ_node,
                label=circ["circular_no"],
                type="circular",
                metadata={
                    "title": circ["title"],
                    "severity": circ["severity"],
                    "authority": circ["authority"],
                    "statutory_ref": circ["statutory_ref"],
                    "summary": circ["summary"],
                }
            )
            # Link to acts
            for act in act_names:
                if "Mines Act" in act:
                    G.add_edge(circ_node, f"act:{act}", relationship="issued_under")
    except Exception as e:
        pass

    # ── Add Violation nodes ───────────────────────────────────────────────
    try:
        from app.database import DBViolation
        violations = db.query(DBViolation).all()
        for viol in violations:
            viol_node = f"violation:{viol.id}"
            G.add_node(
                viol_node,
                label=viol.title,
                type="violation",
                metadata={
                    "severity": viol.severity,
                    "status": viol.status,
                    "penalty_inr": viol.penalty_inr,
                    "escalation_tier": viol.escalation_tier,
                }
            )
            G.add_edge(viol_node, f"mine:{viol.mine_id}", relationship="occurred_at")
            if viol.clause_id:
                G.add_edge(viol_node, f"clause:{viol.clause_id}", relationship="breached_clause")
    except Exception as e:
        pass

    return G


def _regulation_applies_to_mine(reg: DBRegulation, mine: DBMine) -> bool:
    """Check if a regulation's conditions match a mine's properties."""
    if not reg.applies_when:
        return True  # No conditions = applies universally

    conditions = reg.applies_when if isinstance(reg.applies_when, dict) else {}

    if "mine_type" in conditions:
        if mine.mine_type != conditions["mine_type"] and conditions["mine_type"] != "all":
            return False

    if "min_workers" in conditions:
        if mine.worker_count < conditions["min_workers"]:
            return False

    if "max_workers" in conditions:
        if mine.worker_count > conditions["max_workers"]:
            return False

    return True


def get_applicable_regulations(db: Session, mine_id: str) -> list[DBRegulation]:
    """Get all regulations that apply to a specific mine."""
    mine = db.query(DBMine).filter(DBMine.id == mine_id).first()
    if not mine:
        return []

    regulations = db.query(DBRegulation).all()
    return [reg for reg in regulations if _regulation_applies_to_mine(reg, mine)]


def get_graph_visualization_data(G: nx.DiGraph) -> dict[str, Any]:
    """Convert graph to JSON-serializable format for frontend visualization."""
    nodes = []
    for node_id, data in G.nodes(data=True):
        nodes.append({
            "id": node_id,
            "label": data.get("label", node_id),
            "type": data.get("type", "unknown"),
            "metadata": data.get("metadata", {}),
        })

    edges = []
    for source, target, data in G.edges(data=True):
        edges.append({
            "source": source,
            "target": target,
            "relationship": data.get("relationship", "related"),
        })

    return {"nodes": nodes, "edges": edges}


def query_graph(G: nx.DiGraph, query_type: str, **kwargs) -> list[dict]:
    """Query the knowledge graph for specific information.
    
    Supports:
    - "mines_by_regulation": Find mines affected by a regulation
    - "regulations_for_mine": Find regulations applicable to a mine
    - "overdue_obligations": Find all obligations of a specific type
    """
    results = []

    if query_type == "mines_by_regulation":
        clause_id = kwargs.get("regulation_id")
        if clause_id:
            node_key = f"clause:{clause_id}"
            if G.has_node(node_key):
                for _, target, data in G.edges(node_key, data=True):
                    if data.get("relationship") == "applies_to" and G.nodes[target].get("type") == "mine":
                        results.append({
                            "mine_id": target.replace("mine:", ""),
                            "mine_name": G.nodes[target].get("label", ""),
                            **G.nodes[target].get("metadata", {}),
                        })

    elif query_type == "regulations_for_mine":
        mine_id = kwargs.get("mine_id")
        if mine_id:
            mine_key = f"mine:{mine_id}"
            if G.has_node(mine_key):
                for source, target, data in G.in_edges(mine_key, data=True):
                    if data.get("relationship") == "applies_to":
                        results.append({
                            "regulation_id": source.replace("clause:", ""),
                            "label": G.nodes[source].get("label", ""),
                            **G.nodes[source].get("metadata", {}),
                        })

    elif query_type == "by_obligation_type":
        ob_type = kwargs.get("obligation_type", "safety")
        ob_key = f"obligation:{ob_type}"
        if G.has_node(ob_key):
            for source, _, data in G.in_edges(ob_key, data=True):
                if data.get("relationship") == "obligation_type":
                    results.append({
                        "regulation_id": source.replace("clause:", ""),
                        "label": G.nodes[source].get("label", ""),
                        **G.nodes[source].get("metadata", {}),
                    })

    return results
