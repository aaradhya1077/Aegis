from __future__ import annotations

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import init_db, SessionLocal, DBMine
from .routers import auth, mines, filings, compliance, regulations, chatbot, forecasts, uploads, reports, inspections, audit, contractors, xai


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialise DB tables on first start; seed demo data if DB is empty."""
    init_db()
    db = SessionLocal()
    try:
        if db.query(DBMine).count() == 0:
            from .seed import seed
            seed()
    finally:
        db.close()
    yield


app = FastAPI(
    title="Aegis-Compliance API",
    description="AI-Powered Regulatory Compliance Engine for Indian Coal Mines",
    version="2.0.0",
    lifespan=lifespan,
)

import os

cors_origins_env = os.environ.get("ALLOWED_ORIGINS") or os.environ.get("CORS_ORIGINS", "")
if cors_origins_env:
    allowed_origins = [o.strip() for o in cors_origins_env.split(",") if o.strip()]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    # Default to permissive regex matching any http/https origin for seamless deployment
    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=r"^https?://.*",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# ── Register Routers ──────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(mines.router)
app.include_router(filings.router)
app.include_router(compliance.router)
app.include_router(regulations.router)
app.include_router(chatbot.router)
app.include_router(forecasts.router)
app.include_router(uploads.router)
app.include_router(reports.router)
app.include_router(inspections.router)
app.include_router(audit.router)
app.include_router(contractors.router)
app.include_router(xai.router)



@app.get("/healthz")
async def healthcheck() -> dict[str, str]:
    return {"status": "ok", "service": "aegis-compliance"}

