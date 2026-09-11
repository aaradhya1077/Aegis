from __future__ import annotations

from fastapi import APIRouter

router = APIRouter(prefix="/api/v1/uploads", tags=["uploads"])


@router.post("/document")
async def upload_document() -> dict:
    """Placeholder — filing upload is handled via /api/v1/filings/upload."""
    return {
        "status": "info",
        "message": "Statutory filing upload is handled via /api/v1/filings/upload",
        "target_endpoint": "/api/v1/filings/upload",
    }
