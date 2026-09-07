from __future__ import annotations

from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db, DBAuditBlock, verify_audit_chain, record_audit_block

router = APIRouter(prefix="/api/v1/audit", tags=["audit"])


@router.get("/blocks")
def get_audit_blocks(
    limit: int = Query(50, ge=1, le=200),
    action: Optional[str] = None,
    actor_id: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Retrieve cryptographic audit ledger blocks."""
    query = db.query(DBAuditBlock)
    if action:
        query = query.filter(DBAuditBlock.action == action)
    if actor_id:
        query = query.filter(DBAuditBlock.actor_id == actor_id)

    blocks = query.order_by(DBAuditBlock.index.desc()).limit(limit).all()

    return {
        "blocks": [
            {
                "index": b.index,
                "timestamp": b.timestamp.isoformat() if b.timestamp else None,
                "action": b.action,
                "actor_id": b.actor_id,
                "entity_id": b.entity_id,
                "payload_hash": b.payload_hash,
                "prev_hash": b.prev_hash,
                "block_hash": b.block_hash,
            }
            for b in blocks
        ],
        "total_fetched": len(blocks),
    }


@router.get("/verify")
def verify_audit_ledger(db: Session = Depends(get_db)):
    """Mathematically verify the SHA-256 hash continuity of the audit chain."""
    result = verify_audit_chain(db)
    
    first_block = db.query(DBAuditBlock).order_by(DBAuditBlock.index.asc()).first()
    latest_block = db.query(DBAuditBlock).order_by(DBAuditBlock.index.desc()).first()

    return {
        **result,
        "genesis_hash": first_block.block_hash if first_block else None,
        "latest_hash": latest_block.block_hash if latest_block else None,
        "verified_at": "real-time",
    }
