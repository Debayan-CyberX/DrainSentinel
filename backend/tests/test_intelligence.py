import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.repositories.memory_store import store
from app.services.intelligence import generate_drain_intelligence

client = TestClient(app)


def test_intelligence_deterministic_fallback():
    """Verify that intelligence generation succeeds with deterministic fallback when no LLM key is present."""
    resp = client.get("/api/v1/drains/DS-MUM-101/intelligence")
    assert resp.status_code == 200
    data = resp.json()

    assert data["drain_id"] == "DS-MUM-101"
    assert "Hindmata" in data["drain_name"]
    assert "simulated municipal" in data["disclaimer"].lower()
    assert "summary" in data and len(data["summary"]) > 20
    assert len(data["risk_factor_explanation"]) >= 3
    assert len(data["missing_or_conflicting_info"]) >= 1

    # Verify draft recommendation
    rec = data["draft_recommendation"]
    assert rec["priority"] in ("P1 - Critical", "P2 - High", "P3 - Standard", "P4 - Routine")
    assert len(rec["suggested_crew"]) > 0
    assert len(rec["recommended_actions"]) >= 2
    assert len(rec["equipment_needed"]) >= 2


def test_intelligence_multi_report_synthesis():
    """Submit multiple citizen reports for a drain and verify the synthesized narrative consolidates them."""
    drain_id = "DS-MUM-102"  # Milan Subway
    report1 = {
        "drain_id": drain_id,
        "location": {"lat": 19.0886, "lng": 72.8437, "address": "Milan Subway West", "ward": "Ward K-East"},
        "issue_type": "Plastic & Trash Choke",
        "severity": "high",
        "description": "Bags and bottles clogging Milan Subway intake drop grate.",
        "reporter_name": "Citizen Amit S.",
        "is_citizen": True,
    }
    report2 = {
        "drain_id": drain_id,
        "location": {"lat": 19.0887, "lng": 72.8438, "address": "Milan Subway Central", "ward": "Ward K-East"},
        "issue_type": "Silt Accumulation",
        "severity": "critical",
        "description": "Heavy black silt slurry overflowing onto car lanes under rail bridge.",
        "reporter_name": "Citizen Priya K.",
        "is_citizen": True,
    }

    client.post("/api/v1/reports", json=report1)
    client.post("/api/v1/reports", json=report2)

    resp = client.get(f"/api/v1/drains/{drain_id}/intelligence")
    assert resp.status_code == 200
    data = resp.json()

    # Narrative must mention multiple reports and issue types
    summary = data["summary"]
    assert "incident reports logged for asset DS-MUM-102" in summary
    assert "Plastic & Trash Choke" in summary or "Silt Accumulation" in summary


def test_intelligence_identifies_missing_photos_and_conflicts():
    """Verify that reports missing photos and conflicting observations are explicitly flagged."""
    drain_id = "DS-MUM-105"
    drain = store.get_drain(drain_id)
    # Drain 105 has moderate silt (nominal)
    drain.telemetry.silt_level_percent = 25.0
    store.update_drain(drain)

    # Submit a critical report without photo
    report_no_photo = {
        "drain_id": drain_id,
        "location": {"lat": drain.location.lat, "lng": drain.location.lng, "address": drain.location.address, "ward": drain.location.ward},
        "issue_type": "Severe Waterlogging Choke",
        "severity": "critical",
        "description": "Massive choke reported by local shopkeeper without photo.",
        "reporter_name": "Shopkeeper Suresh",
        "is_citizen": True,
        "photo_url": None,
    }
    client.post("/api/v1/reports", json=report_no_photo)

    resp = client.get(f"/api/v1/drains/{drain_id}/intelligence")
    assert resp.status_code == 200
    data = resp.json()

    conflicts = " ".join(data["missing_or_conflicting_info"])
    # Should flag missing photo
    assert "Missing Evidence" in conflicts or "lack photographic verification" in conflicts
    # Should flag conflict between citizen 'critical' and acoustic sensor low silt (25%)
    assert "Conflicting Information" in conflicts or "sensor registers low silt" in conflicts


def test_human_approval_creates_work_order():
    """Verify that human operator approval creates an assigned inspection task."""
    drain_id = "DS-MUM-104"
    intel_resp = client.get(f"/api/v1/drains/{drain_id}/intelligence")
    assert intel_resp.status_code == 200
    draft_rec = intel_resp.json()["draft_recommendation"]

    # Human operator reviews and approves recommendation
    approve_resp = client.post(
        f"/api/v1/drains/{drain_id}/intelligence/approve",
        json=draft_rec,
    )
    assert approve_resp.status_code == 201
    task = approve_resp.json()

    assert task["drain_id"] == drain_id
    assert task["status"] == "Assigned"
    assert task["assigned_crew"] == draft_rec["suggested_crew"]
    assert task["priority"] == draft_rec["priority"]
    assert "Authorized by Municipal Operator" in task["notes"]

    # Drain asset status should reflect assigned state
    drain = store.get_drain(drain_id)
    assert drain.status == "Assigned"


def test_deterministic_risk_unaltered_by_intelligence():
    """Verify that calling the intelligence endpoint does not alter the mathematical risk score."""
    drain_id = "DS-MUM-101"
    drain_before = store.get_drain(drain_id)
    score_before = drain_before.risk_assessment.total_score

    # Call intelligence endpoint multiple times
    client.get(f"/api/v1/drains/{drain_id}/intelligence")
    client.get(f"/api/v1/drains/{drain_id}/intelligence")

    drain_after = store.get_drain(drain_id)
    assert drain_after.risk_assessment.total_score == score_before


def test_nonexistent_drain_intelligence_404():
    resp = client.get("/api/v1/drains/DS-NONEXISTENT/intelligence")
    assert resp.status_code == 404
