"""
Compliance Engine — NLP-based regulation matching, risk scoring, and verification.

This is the core AI logic that:
1. Analyzes filing text against regulation clauses (NLP matching)
2. Computes weighted risk scores per mine
3. Verifies that filings contain mandated evidence fields
"""

from __future__ import annotations

import hashlib
import json
import re
import uuid
from datetime import datetime
from typing import Any

from sqlalchemy.orm import Session

from app.database import (
    DBComplianceCheck,
    DBFiling,
    DBMine,
    DBRegulation,
    DBRiskScore,
)

# ── Weight configuration for risk scoring ─────────────────────────────────────
RISK_WEIGHTS = {
    "safety": 0.40,
    "environmental": 0.35,
    "labor": 0.25,
}

# ── Mandated evidence fields per filing type ──────────────────────────────────
# Maps filing types to keywords/phrases that MUST appear in the extracted text
EVIDENCE_FIELDS = {
    "Safety Management Plan": [
        "hazard identification", "risk assessment", "emergency procedures",
        "safety officer", "training schedule", "incident reporting",
        "fire prevention", "first aid", "rescue plan",
    ],
    "Environmental Clearance Compliance Report": [
        "air quality", "water discharge", "waste management",
        "green belt", "plantation", "monitoring station",
        "ambient noise", "dust suppression", "reclamation plan",
    ],
    "Annual Safety Report": [
        "accidents", "fatalities", "injuries", "near miss",
        "safety audit", "inspection findings", "corrective action",
        "compliance status", "training conducted",
    ],
    "Medical Examination Report": [
        "medical officer", "occupational health", "dust exposure",
        "hearing test", "lung function", "fitness certificate",
        "periodic examination",
    ],
    "Mine Closure Plan": [
        "rehabilitation", "land reclamation", "water treatment",
        "financial assurance", "post-closure monitoring",
        "stakeholder consultation",
    ],
    "Ventilation Plan": [
        "air flow", "ventilation shaft", "methane monitoring",
        "dust measurement", "ventilation officer",
        "fan capacity", "circuit diagram",
    ],
    "Strata Control Plan": [
        "roof support", "pillar design", "subsidence",
        "geotechnical assessment", "monitoring instrument",
        "support system",
    ],
    "Dust Suppression Report": [
        "dust level", "respirable dust", "sprinkler system",
        "water spray", "personal protective", "monitoring frequency",
    ],
    "Worker Welfare Report": [
        "wages", "working hours", "rest period", "canteen",
        "sanitation", "housing", "provident fund", "insurance",
    ],
    "Production & Development Report": [
        "production target", "output tonnage", "development footage",
        "equipment utilization", "shift pattern",
    ],
}


def analyze_filing(
    filing: DBFiling,
    regulation: DBRegulation,
    db: Session,
) -> DBComplianceCheck:
    """Analyze a filing's extracted text against a regulation clause.

    Uses keyword/phrase matching to determine compliance.
    Returns a ComplianceCheck with clause-level findings and explanation.
    """
    extracted_text = (filing.extracted_text or "").lower()
    clause_text = (regulation.clause_text or "").lower()

    findings: list[dict[str, Any]] = []
    total_fields = 0
    matched_fields = 0

    # ── Check filing timeliness ───────────────────────────────────────────
    timeliness_ok = True
    if filing.due_date and filing.submitted_at:
        if filing.submitted_at > filing.due_date:
            timeliness_ok = False
            findings.append({
                "field": "Submission Timeliness",
                "status": "failed",
                "detail": f"Filed {(filing.submitted_at - filing.due_date).days} days late (due: {filing.due_date.strftime('%Y-%m-%d')}, submitted: {filing.submitted_at.strftime('%Y-%m-%d')})",
            })
        else:
            findings.append({
                "field": "Submission Timeliness",
                "status": "passed",
                "detail": f"Filed on time ({filing.submitted_at.strftime('%Y-%m-%d')})",
            })
    elif filing.due_date and not filing.submitted_at:
        timeliness_ok = False
        findings.append({
            "field": "Submission Timeliness",
            "status": "failed",
            "detail": f"Filing not yet submitted (due: {filing.due_date.strftime('%Y-%m-%d')})",
        })

    # ── Check mandated evidence fields ────────────────────────────────────
    evidence_keys = EVIDENCE_FIELDS.get(filing.filing_type, [])
    total_fields = len(evidence_keys) + 1  # +1 for timeliness

    for field_keyword in evidence_keys:
        if field_keyword.lower() in extracted_text:
            matched_fields += 1
            findings.append({
                "field": field_keyword.title(),
                "status": "passed",
                "detail": f"Evidence found for '{field_keyword}' in document text",
            })
        else:
            findings.append({
                "field": field_keyword.title(),
                "status": "failed",
                "detail": f"No evidence found for required field '{field_keyword}'",
            })

    if timeliness_ok:
        matched_fields += 1

    # ── Check clause-specific keyword coverage ────────────────────────────
    clause_keywords = _extract_key_phrases(clause_text)
    clause_match_count = sum(1 for kw in clause_keywords if kw in extracted_text)
    clause_coverage = clause_match_count / max(len(clause_keywords), 1)

    # ── Compute compliance score ──────────────────────────────────────────
    field_score = matched_fields / max(total_fields, 1)
    overall_score = (field_score * 0.7) + (clause_coverage * 0.3)

    # ── Determine status ──────────────────────────────────────────────────
    if overall_score >= 0.8:
        check_status = "passed"
    elif overall_score >= 0.5:
        check_status = "needs_review"
    else:
        check_status = "failed"

    # ── Build explanation ─────────────────────────────────────────────────
    passed_count = sum(1 for f in findings if f["status"] == "passed")
    failed_count = sum(1 for f in findings if f["status"] == "failed")

    explanation = (
        f"Compliance check for {regulation.clause_number} ({regulation.act_name}): "
        f"{passed_count} of {len(findings)} required fields satisfied. "
        f"Clause keyword coverage: {clause_coverage:.0%}. "
    )
    if failed_count > 0:
        failed_fields = [f["field"] for f in findings if f["status"] == "failed"]
        explanation += f"Missing/incomplete: {', '.join(failed_fields[:5])}."
    else:
        explanation += "All mandated fields present."

    check = DBComplianceCheck(
        id=str(uuid.uuid4()),
        filing_id=filing.id,
        regulation_id=regulation.id,
        mine_id=filing.mine_id,
        score=round(overall_score, 3),
        status=check_status,
        findings_json=findings,
        explanation=explanation,
        verified_by="ai",
        checked_at=datetime.utcnow(),
    )

    db.add(check)
    db.commit()
    db.refresh(check)

    return check


def compute_risk_score(mine_id: str, db: Session) -> dict[str, float]:
    """Compute weighted risk scores for a mine across all categories.

    Returns dict with category scores + overall score.
    Also persists scores to the risk_scores table with SHA-256 audit hash.
    """
    checks = db.query(DBComplianceCheck).filter(
        DBComplianceCheck.mine_id == mine_id
    ).all()

    if not checks:
        return {"safety": 50.0, "environmental": 50.0, "labor": 50.0, "overall": 50.0}

    # Group checks by obligation type via their regulation
    category_scores: dict[str, list[float]] = {"safety": [], "environmental": [], "labor": []}

    for check in checks:
        reg = db.query(DBRegulation).filter(DBRegulation.id == check.regulation_id).first()
        if reg and reg.obligation_type in category_scores:
            # Convert compliance score (0-1 = good) to risk score (0-100 = bad)
            risk = (1.0 - check.score) * 100.0
            category_scores[reg.obligation_type].append(risk)

    # Average per category
    result: dict[str, float] = {}
    for cat, scores in category_scores.items():
        result[cat] = round(sum(scores) / max(len(scores), 1), 1)

    # Weighted overall
    overall = sum(result.get(cat, 50.0) * weight for cat, weight in RISK_WEIGHTS.items())
    result["overall"] = round(overall, 1)

    # Persist scores
    for category, score in result.items():
        score_data = f"{mine_id}:{category}:{score}:{datetime.utcnow().isoformat()}"
        score_hash = hashlib.sha256(score_data.encode()).hexdigest()

        risk_record = DBRiskScore(
            id=str(uuid.uuid4()),
            mine_id=mine_id,
            score=score,
            category=category,
            computed_at=datetime.utcnow(),
            score_hash=score_hash,
        )
        db.add(risk_record)

    # Update mine's overall risk score
    mine = db.query(DBMine).filter(DBMine.id == mine_id).first()
    if mine:
        mine.overall_risk_score = result["overall"]

    db.commit()

    return result


def verify_filing(filing_id: str, db: Session) -> dict[str, Any]:
    """Verification Layer — cross-check if a filing has actual evidence.

    Goes beyond "does the filing exist" to check "does the filing
    contain the mandated content fields with valid data."
    """
    filing = db.query(DBFiling).filter(DBFiling.id == filing_id).first()
    if not filing:
        return {"error": "Filing not found"}

    regulation = db.query(DBRegulation).filter(
        DBRegulation.id == filing.regulation_id
    ).first()
    if not regulation:
        return {"error": "Regulation not found"}

    text = (filing.extracted_text or "").lower()
    evidence_keys = EVIDENCE_FIELDS.get(filing.filing_type, [])

    verification_results = []
    for field in evidence_keys:
        present = field.lower() in text
        # Additional check: is it just mentioned or does it have substance?
        if present:
            # Look for the field keyword in context — does it appear near
            # numbers, dates, or descriptive text?
            pattern = rf"{re.escape(field.lower())}\s*[:\-]?\s*\S+"
            has_substance = bool(re.search(pattern, text))
        else:
            has_substance = False

        verification_results.append({
            "field": field,
            "present": present,
            "has_substance": has_substance,
            "verdict": "verified" if has_substance else ("mentioned_only" if present else "missing"),
        })

    verified_count = sum(1 for r in verification_results if r["verdict"] == "verified")
    total = max(len(verification_results), 1)

    return {
        "filing_id": filing_id,
        "regulation_id": regulation.id,
        "verification_score": round(verified_count / total, 3),
        "results": verification_results,
        "summary": f"{verified_count}/{total} fields verified with substantive evidence",
    }


def _extract_key_phrases(text: str) -> list[str]:
    """Extract key regulatory phrases from clause text for matching."""
    # Remove common stop words and extract meaningful phrases
    stop_words = {
        "the", "a", "an", "in", "of", "to", "for", "and", "or", "is", "are",
        "was", "were", "be", "been", "being", "have", "has", "had", "do", "does",
        "did", "will", "would", "could", "should", "may", "might", "shall", "can",
        "this", "that", "these", "those", "with", "by", "from", "at", "on", "as",
        "it", "its", "they", "them", "their", "he", "she", "his", "her", "not",
        "but", "if", "so", "than", "too", "very", "just", "about", "each", "every",
        "all", "any", "such", "no", "nor", "only", "own", "same", "into", "under",
        "over", "between", "through", "during", "before", "after", "above", "below",
    }

    words = re.findall(r'\b[a-z]{3,}\b', text)
    return [w for w in words if w not in stop_words][:30]  # Top 30 keywords
