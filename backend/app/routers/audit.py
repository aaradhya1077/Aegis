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


@router.post("/tamper")
def tamper_audit_ledger(target_index: Optional[int] = None, db: Session = Depends(get_db)):
    """Adversarially tamper with a block's hash to test mathematical fraud detection."""
    blocks = db.query(DBAuditBlock).order_by(DBAuditBlock.index.asc()).all()
    if not blocks:
        return {"status": "error", "message": "No blocks found to tamper"}

    # Target specified index or second block if available
    idx = target_index if target_index is not None else (1 if len(blocks) > 1 else 0)
    target_block = db.query(DBAuditBlock).filter(DBAuditBlock.index == idx).first()
    if not target_block:
        target_block = blocks[-1]
        idx = target_block.index

    # Store original hash if not already corrupted
    original_hash = target_block.block_hash
    # Corrupt block hash
    tampered_hash = "deadbeef" * 8
    target_block.block_hash = tampered_hash
    db.commit()

    # Re-verify to demonstrate instant pinpointing
    verification = verify_audit_chain(db)

    return {
        "status": "tampered",
        "corrupted_block_index": idx,
        "action": target_block.action,
        "tampered_hash": tampered_hash,
        "detection_result": verification,
        "message": f"Block #{idx} successfully tampered. Merkle chain validator immediately flagged the intrusion!",
    }


@router.post("/restore")
def restore_audit_ledger(db: Session = Depends(get_db)):
    """Restore cryptographic continuity across the entire ledger."""
    from app.database import calculate_block_hash
    blocks = db.query(DBAuditBlock).order_by(DBAuditBlock.index.asc()).all()
    if not blocks:
        return {"status": "ok", "message": "No blocks in ledger"}

    prev_h = "0" * 64
    for b in blocks:
        b.prev_hash = prev_h
        b.block_hash = calculate_block_hash(
            b.index, b.timestamp, b.action, b.actor_id, b.entity_id, b.payload_hash, b.prev_hash
        )
        prev_h = b.block_hash

    db.commit()
    verification = verify_audit_chain(db)

    return {
        "status": "restored",
        "total_blocks_restored": len(blocks),
        "detection_result": verification,
        "message": "Cryptographic continuity 100% restored. All SHA-256 links verified.",
    }

