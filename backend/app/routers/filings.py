from __future__ import annotations

import uuid
from datetime import datetime

from fastapi import APIRouter, HTTPException, Query, UploadFile, File, Form
from sqlalchemy.orm import Session

from app.database import SessionLocal, DBFiling, DBRegulation
from app.models import FilingResponse, FilingsListResponse
from app.compliance_engine import analyze_filing

router = APIRouter(prefix="/api/v1/filings", tags=["filings"])

# Simulated OCR extraction — for the hackathon, we generate synthetic extracted text
# In production this would use Tesseract/Google Vision/Azure Form Recognizer
SAMPLE_EXTRACTED_TEXTS = {
    "Safety Management Plan": (
        "Safety Management Plan for FY 2025-26. "
        "Hazard Identification: All potential hazards have been identified including roof fall, "
        "gas emission, and electrical hazards. Risk Assessment: Comprehensive risk assessment "
        "conducted by certified safety officer Mr. R. Kumar on 15-Mar-2025. "
        "Emergency Procedures: Evacuation routes mapped, emergency assembly points designated. "
        "Safety Officer: Mr. R. Kumar (DGMS First Class). "
        "Training Schedule: Monthly safety training sessions for all workers. "
        "Incident Reporting: All incidents to be reported within 2 hours via DGMS portal. "
        "Fire Prevention: Fire hydrants installed at 50m intervals. "
        "First Aid: 3 first aid stations with trained paramedics. "
        "Rescue Plan: Mine rescue team of 12 trained members on standby."
    ),
    "Environmental Clearance Compliance Report": (
        "Environmental Clearance Compliance Report — Half-Yearly Submission. "
        "Air Quality: PM10 levels at 85 µg/m³ (within limit of 100 µg/m³). "
        "Water Discharge: Treated mine water discharge meets BIS standards. "
        "Waste Management: Overburden dumps managed as per approved plan. "
        "Green Belt: 15 hectares of green belt developed, 8,000 saplings planted. "
        "Plantation: Survival rate of 78% achieved in afforestation area. "
        "Monitoring Station: 4 ambient air quality monitoring stations operational. "
        "Ambient Noise: Day-time noise at 52 dB(A), night-time at 43 dB(A). "
        "Dust Suppression: Water sprinklers operational on all haul roads. "
        "Reclamation Plan: Progressive mine closure plan updated."
    ),
    "Annual Safety Report": (
        "Annual Safety Report for the year 2024-25. "
        "Accidents: 2 reportable accidents during the year. "
        "Fatalities: Zero fatalities reported. "
        "Injuries: 5 minor injuries, all treated on-site. "
        "Near Miss: 28 near-miss incidents recorded and investigated. "
        "Safety Audit: External safety audit conducted by M/s SafetyFirst Consultants. "
        "Inspection Findings: 12 observations from DGMS inspection, 10 closed. "
        "Corrective Action: All major corrective actions completed within deadline. "
        "Compliance Status: 94% compliance with safety regulations. "
        "Training Conducted: 48 safety training sessions, 1,200 man-hours."
    ),
}


@router.post("/upload", response_model=FilingResponse)
async def upload_filing(
    mine_id: str = Form(...),
    regulation_id: str = Form(...),
    filing_type: str = Form(...),
    file: UploadFile = File(None),
) -> FilingResponse:
    """Upload a filing document, trigger OCR extraction and compliance analysis."""
    db = SessionLocal()
    try:
        # Verify mine and regulation exist
        from app.database import DBMine
        mine = db.query(DBMine).filter(DBMine.id == mine_id).first()
        if not mine:
            raise HTTPException(status_code=404, detail="Mine not found")

        regulation = db.query(DBRegulation).filter(DBRegulation.id == regulation_id).first()
        if not regulation:
            raise HTTPException(status_code=404, detail="Regulation not found")

        # Simulate OCR extraction
        extracted_text = SAMPLE_EXTRACTED_TEXTS.get(
            filing_type,
            f"Extracted content for {filing_type}. This document covers compliance requirements."
        )
        ocr_confidence = 0.92

        filename = file.filename if file else f"{filing_type.lower().replace(' ', '_')}.pdf"

        filing = DBFiling(
            id=str(uuid.uuid4()),
            mine_id=mine_id,
            regulation_id=regulation_id,
            filing_type=filing_type,
            submitted_at=datetime.utcnow(),
            due_date=datetime.utcnow(),  # In production, compute from regulation frequency
            status="pending",
            extracted_text=extracted_text,
            source_filename=filename,
            ocr_confidence=ocr_confidence,
        )
        db.add(filing)
        db.commit()
        db.refresh(filing)

        # Run compliance analysis
        check = analyze_filing(filing, regulation, db)

        # Update filing status based on check
        filing.status = "compliant" if check.status == "passed" else "flagged"
        db.commit()

        return FilingResponse(
            id=filing.id,
            mine_id=filing.mine_id,
            regulation_id=filing.regulation_id,
            filing_type=filing.filing_type,
            submitted_at=filing.submitted_at,
            due_date=filing.due_date,
            status=filing.status,
            extracted_text=filing.extracted_text,
            source_filename=filing.source_filename,
            ocr_confidence=filing.ocr_confidence,
        )
    finally:
        db.close()


@router.get("", response_model=FilingsListResponse)
def list_filings(
    mine_id: str | None = Query(None),
    status: str | None = Query(None),
    filing_type: str | None = Query(None),
) -> FilingsListResponse:
    """List filings with optional filters."""
    db = SessionLocal()
    try:
        query = db.query(DBFiling)

        if mine_id:
            query = query.filter(DBFiling.mine_id == mine_id)
        if status:
            query = query.filter(DBFiling.status == status)
        if filing_type:
            query = query.filter(DBFiling.filing_type == filing_type)

        filings = query.order_by(DBFiling.due_date.desc()).all()

        items = [
            FilingResponse(
                id=f.id,
                mine_id=f.mine_id,
                regulation_id=f.regulation_id,
                filing_type=f.filing_type,
                submitted_at=f.submitted_at,
                due_date=f.due_date,
                status=f.status,
                extracted_text=f.extracted_text,
                source_filename=f.source_filename,
                ocr_confidence=f.ocr_confidence,
            )
            for f in filings
        ]

        return FilingsListResponse(filings=items, total=len(items))
    finally:
        db.close()


@router.get("/{filing_id}", response_model=FilingResponse)
def get_filing(filing_id: str) -> FilingResponse:
    """Get filing detail with extracted text."""
    db = SessionLocal()
    try:
        filing = db.query(DBFiling).filter(DBFiling.id == filing_id).first()
        if not filing:
            raise HTTPException(status_code=404, detail="Filing not found")

        return FilingResponse(
            id=filing.id,
            mine_id=filing.mine_id,
            regulation_id=filing.regulation_id,
            filing_type=filing.filing_type,
            submitted_at=filing.submitted_at,
            due_date=filing.due_date,
            status=filing.status,
            extracted_text=filing.extracted_text,
            source_filename=filing.source_filename,
            ocr_confidence=filing.ocr_confidence,
        )
    finally:
        db.close()
