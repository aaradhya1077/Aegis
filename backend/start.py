import os
import sys
import uvicorn

if __name__ == "__main__":
    # Safely parse port from environment (Railway, Render, Fly, or local)
    raw_port = os.environ.get("PORT", "8000").strip()
    try:
        port = int(raw_port)
    except (ValueError, TypeError):
        port = 8000

    host = os.environ.get("HOST", "0.0.0.0").strip()

    print(f"[Aegis Backend] Launching FastAPI service on {host}:{port}...")

    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
        proxy_headers=True,
        forwarded_allow_ips="*",
        access_log=True,
    )
