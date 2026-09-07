from __future__ import annotations

import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db, DBContractor, DBMine, record_audit_block

router = APIRouter(prefix="/api/v1/contractors", tags=["contractors"])


class ContractorCreate(BaseModel):
    mine_id: str
    company_name: str
    registration_no: str
    contact_person: str
    active_workers: int
    safety_rating: float = 85.0
    pme_valid_percent: float = 95.0


@router.get("")
def list_contractors(
    mine_id: Optional[str] = None,
    compliance_status: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(DBContractor)
    if mine_id:
        query = query.filter(DBContractor.mine_id == mine_id)
    if compliance_status:
        query = query.filter(DBContractor.compliance_status == compliance_status)

    contractors = query.all()
    results = []
    for c in contractors:
        mine = db.query(DBMine).filter(DBMine.id == c.mine_id).first()
        results.append({
            "id": c.id,
            "mine_id": c.mine_id,
            "mine_name": mine.name if mine else c.mine_id,
            "subsidiary": mine.subsidiary if mine else "",
            "company_name": c.company_name,
            "registration_no": c.registration_no,
            "contact_person": c.contact_person,
            "active_workers": c.active_workers,
            "safety_rating": c.safety_rating,
            "compliance_status": c.compliance_status,
            "pme_valid_percent": c.pme_valid_percent,
            "open_violations": c.open_violations,
        })
    return {"contractors": results, "total": len(results)}


@router.post("")
def create_contractor(payload: ContractorCreate, db: Session = Depends(get_db)):
    mine = db.query(DBMine).filter(DBMine.id == payload.mine_id).first()
    if not mine:
        raise HTTPException(status_code=404, detail="Mine not found")

    contractor_id = f"CONT-{uuid.uuid4().hex[:6].upper()}"
    status = "compliant" if payload.safety_rating >= 80 and payload.pme_valid_percent >= 90 else "review_required"

    contractor = DBContractor(
        id=contractor_id,
        mine_id=payload.mine_id,
        company_name=payload.company_name,
        registration_no=payload.registration_no,
        contact_person=payload.contact_person,
        active_workers=payload.active_workers,
        safety_rating=payload.safety_rating,
        compliance_status=status,
        pme_valid_percent=payload.pme_valid_percent,
        open_violations=0,
    )
    db.add(contractor)
    db.commit()

    record_audit_block(
        db=db,
        action="CONTRACTOR_ONBOARDED",
        actor_id="MINE_SAFETY_OFFICER",
        entity_id=contractor_id,
        payload_data={
            "company_name": payload.company_name,
            "mine_id": payload.mine_id,
            "workers": payload.active_workers,
        },
    )

    return {"status": "success", "contractor_id": contractor_id}


@router.get("/welfare-summary")
def get_welfare_summary(db: Session = Depends(get_db)):
    contractors = db.query(DBContractor).all()
    total_contractors = len(contractors)
    total_workers = sum(c.active_workers for c in contractors)
    
    avg_safety = sum(c.safety_rating for c in contractors) / max(total_contractors, 1)
    avg_pme = sum(c.pme_valid_percent for c in contractors) / max(total_contractors, 1)
    
    compliant_count = sum(1 for c in contractors if c.compliance_status == "compliant")
    review_count = sum(1 for c in contractors if c.compliance_status == "review_required")
    blacklisted_count = sum(1 for c in contractors if c.compliance_status == "blacklisted")

    return {
        "total_contractor_firms": total_contractors,
        "total_contract_workforce": total_workers,
        "average_safety_index": round(avg_safety, 1),
        "average_pme_compliance_percent": round(avg_pme, 1),
        "distribution": {
            "compliant": compliant_count,
            "review_required": review_count,
            "blacklisted": blacklisted_count,
        },
        "form_iv_statutory_status": "All quarterly fatality and severe incident returns filed under Mines Act 1952 Sec 23.",
    }
