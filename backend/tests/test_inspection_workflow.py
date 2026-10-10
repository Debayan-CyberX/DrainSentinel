import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.repositories.memory_store import store

client = TestClient(app)


def test_full_inspection_state_machine_progression():
    """
    Test valid state workflow:
    Reported -> Risk Assessed -> Assigned -> Inspected -> Repair in Progress -> Resolved -> Verified
    """
    # 1. Create a task in 'Reported' status
    create_payload = {
        "drain_id": "DS-MUM-106",
        "title": "Clear Dadar TT Drop Grate",
        "issue_description": "Accumulation of dry debris at intersection curb.",
        "notes": "Scheduled pre-monsoon inspection.",
    }
    create_resp = client.post("/api/v1/tasks", json=create_payload)
    assert create_resp.status_code == 201
    task_id = create_resp.json()["id"]
    assert create_resp.json()["status"] == "Reported"

    # 2. Reported -> Risk Assessed
    step1 = client.patch(f"/api/v1/tasks/{task_id}", json={"status": "Risk Assessed"})
    assert step1.status_code == 200
    assert step1.json()["status"] == "Risk Assessed"

    # 3. Risk Assessed -> Assigned
    step2 = client.patch(
        f"/api/v1/tasks/{task_id}",
        json={"status": "Assigned", "assigned_crew": "Ward F-North Jetting Unit"},
    )
    assert step2.status_code == 200
    assert step2.json()["status"] == "Assigned"
    assert step2.json()["assigned_crew"] == "Ward F-North Jetting Unit"

    # 4. Assigned -> Inspected
    step3 = client.patch(
        f"/api/v1/tasks/{task_id}",
        json={"status": "Inspected", "notes": "On-site assessment confirmed silt bed."},
    )
    assert step3.status_code == 200
    assert step3.json()["status"] == "Inspected"

    # 5. Inspected -> Repair in Progress
    step4 = client.patch(f"/api/v1/tasks/{task_id}", json={"status": "Repair in Progress"})
    assert step4.status_code == 200
    assert step4.json()["status"] == "Repair in Progress"

    # 6. Repair in Progress -> Resolved
    step5 = client.patch(f"/api/v1/tasks/{task_id}", json={"status": "Resolved"})
    assert step5.status_code == 200
    assert step5.json()["status"] == "Resolved"

    # 7. Resolved -> Verified
    step6 = client.patch(
        f"/api/v1/tasks/{task_id}",
        json={
            "status": "Verified",
            "verification_photo_url": "https://example.com/verified-proof.jpg",
        },
    )
    assert step6.status_code == 200
    assert step6.json()["status"] == "Verified"
    assert step6.json()["verification_photo_url"] == "https://example.com/verified-proof.jpg"

    # Verify that the drain asset telemetry was updated to nominal upon resolution
    drain_resp = client.get("/api/v1/drains/DS-MUM-106")
    assert drain_resp.status_code == 200
    assert drain_resp.json()["telemetry"]["silt_level_percent"] == 18.0
    assert drain_resp.json()["status"] == "Verified"


def test_invalid_state_transition_rejected():
    """
    Test that invalid state skips (e.g. Reported -> Resolved) are rejected with HTTP 400.
    """
    create_payload = {
        "drain_id": "DS-MUM-108",
        "title": "Invalid Transition Test",
        "issue_description": "Testing rejection of illegal state transition.",
    }
    create_resp = client.post("/api/v1/tasks", json=create_payload)
    task_id = create_resp.json()["id"]

    # Try illegal jump: Reported -> Resolved
    bad_resp = client.patch(f"/api/v1/tasks/{task_id}", json={"status": "Resolved"})
    assert bad_resp.status_code == 400
    detail = bad_resp.json()["detail"]
    assert "Invalid state transition from 'Reported' to 'Resolved'" in detail
    assert "Allowed next states" in detail


def test_nonexistent_task_update_404():
    resp = client.patch("/api/v1/tasks/NONEXISTENT-999", json={"status": "Assigned"})
    assert resp.status_code == 404
