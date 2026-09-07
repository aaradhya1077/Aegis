import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_healthcheck():
    """Verify system healthcheck endpoint."""
    response = client.get("/healthz")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "service" in data


def test_auth_login_success():
    """Verify regulator authentication with valid credentials."""
    response = client.post(
        "/api/v1/auth/login",
        json={"user_id": "REG-001", "password": "pass123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "accessToken" in data
    assert data["user"]["id"] == "REG-001"
    assert data["user"]["role"] == "regulator"


def test_auth_login_invalid():
    """Verify rejection of invalid credentials."""
    response = client.post(
        "/api/v1/auth/login",
        json={"user_id": "REG-001", "password": "wrongpassword"},
    )
    assert response.status_code == 401


def test_mines_list():
    """Verify retrieval of all registered Indian coal mines."""
    response = client.get("/api/v1/mines")
    assert response.status_code == 200
    data = response.json()
    assert "mines" in data
    assert data["total"] >= 30
    assert len(data["mines"]) >= 30


def test_compliance_dashboard():
    """Verify aggregated executive compliance dashboard telemetry."""
    response = client.get("/api/v1/compliance/dashboard")
    assert response.status_code == 200
    data = response.json()
    assert "total_mines" in data
    assert "compliant_percentage" in data
    assert "risk_distribution" in data
    assert data["total_mines"] >= 30
    assert data["compliant_percentage"] > 0


def test_audit_chain_verification():
    """Verify cryptographic SHA-256 Merkle blockchain continuity."""
    response = client.get("/api/v1/audit/verify")
    assert response.status_code == 200
    data = response.json()
    assert data["valid"] is True
    assert data["total_blocks"] >= 50
    assert "intact" in data.get("message", "").lower() or "verified" in data.get("message", "").lower()


def test_forecasts_alerts():
    """Verify predictive deadline and risk forecaster alerts."""
    response = client.get("/api/v1/forecasts/alerts?threshold=0.3")
    assert response.status_code == 200
    data = response.json()
    assert "alerts" in data
    assert "total" in data


def test_reports_summary():
    """Verify compliance reports generation summary endpoint."""
    response = client.get("/api/v1/reports/summary")
    assert response.status_code == 200
    data = response.json()
    assert "kpis" in data
    assert data["kpis"]["total_mines"] >= 30
    assert "top_at_risk_collieries" in data


def test_reports_export_csv():
    """Verify downloadable CSV compliance dossier generation."""
    response = client.get("/api/v1/reports/export-csv")
    assert response.status_code == 200
    assert "text/csv" in response.headers.get("content-type", "")
    content = response.text
    assert "Colliery Name" in content
    assert "Risk Score" in content


def test_filings_list():
    """Verify statutory filings repository query."""
    response = client.get("/api/v1/filings")
    assert response.status_code == 200
    data = response.json()
    assert "filings" in data
    assert data["total"] > 0


def test_human_review_workflow():
    """Verify regulator human review and override on compliance check."""
    # First, get a mine to locate a compliance check
    mines_resp = client.get("/api/v1/mines")
    mine_id = mines_resp.json()["mines"][0]["id"]

    checks_resp = client.get(f"/api/v1/compliance/checks/{mine_id}")
    assert checks_resp.status_code == 200
    checks = checks_resp.json()

    if checks:
        target_check = checks[0]
        review_resp = client.post(
            f"/api/v1/compliance/human-review/{target_check['id']}",
            json={"status": "passed", "notes": "Automated test verification by DGMS Officer"},
        )
        assert review_resp.status_code == 200
        review_data = review_resp.json()
        assert review_data["updated_status"] == "human_verified"
        assert review_data["verified_by"] == "human"


def test_contractors_summary():
    """Verify contractor and labor welfare telemetry."""
    response = client.get("/api/v1/contractors/welfare-summary")
    assert response.status_code == 200
    data = response.json()
    assert "total_contractor_firms" in data
    assert "average_safety_index" in data
