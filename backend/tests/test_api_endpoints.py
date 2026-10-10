import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_get_drains_list_and_filters():
    # 1. Get all drains
    resp = client.get("/api/v1/drains")
    assert resp.status_code == 200
    drains = resp.json()
    assert len(drains) >= 25
    # Verify Mumbai coordinates
    for d in drains:
        assert 18.8 <= d["location"]["lat"] <= 19.3
        assert 72.7 <= d["location"]["lng"] <= 73.1
        assert "risk_assessment" in d

    # 2. Filter by ward
    resp_ward = client.get("/api/v1/drains?ward=F-North")
    assert resp_ward.status_code == 200
    ward_drains = resp_ward.json()
    assert len(ward_drains) > 0
    for d in ward_drains:
        assert "F-North" in d["location"]["ward"]

    # 3. Filter by search
    resp_search = client.get("/api/v1/drains?search=Hindmata")
    assert resp_search.status_code == 200
    search_drains = resp_search.json()
    assert len(search_drains) >= 1
    assert "Hindmata" in search_drains[0]["name"]


def test_get_single_drain_and_404():
    # Valid drain
    resp = client.get("/api/v1/drains/DS-MUM-101")
    assert resp.status_code == 200
    data = resp.json()
    assert data["id"] == "DS-MUM-101"
    assert "Hindmata" in data["name"]
    assert data["risk_assessment"]["total_score"] >= 70
    assert data["risk_assessment"]["category"] in ("High", "Critical")
    assert "factors" in data["risk_assessment"]

    # Non-existent drain
    resp_404 = client.get("/api/v1/drains/DS-MUM-999")
    assert resp_404.status_code == 404


def test_report_creation_and_duplicate_detection():
    # 1. Submit a valid citizen report
    report_payload = {
        "drain_id": "DS-MUM-103",
        "location": {
            "lat": 19.0305,
            "lng": 72.8574,
            "address": "Gandhi Market North Inflow",
            "ward": "Ward F-North",
        },
        "issue_type": "Plastic & Trash Choke",
        "severity": "high",
        "description": "Vegetable crate plastic films blocking storm drain inlet outside market.",
        "reporter_name": "Rohan M. (Shop Owner)",
        "is_citizen": True,
    }

    create_resp = client.post("/api/v1/reports", json=report_payload)
    assert create_resp.status_code == 201
    report_data = create_resp.json()
    assert report_data["id"].startswith("REP-MUM-")
    assert report_data["status"] == "unverified"  # Citizen reports start unverified
    assert report_data["is_duplicate"] is False
    first_report_id = report_data["id"]

    # 2. Submit a duplicate report within the same location threshold
    duplicate_payload = {
        "drain_id": "DS-MUM-103",
        "location": {
            "lat": 19.0306,
            "lng": 72.8575,
            "address": "Gandhi Market Inflow Curb",
            "ward": "Ward F-North",
        },
        "issue_type": "Plastic & Trash Choke",
        "severity": "high",
        "description": "Plastic choke still present, water pooling.",
        "reporter_name": "Second Commuter",
        "is_citizen": True,
    }

    dup_resp = client.post("/api/v1/reports", json=duplicate_payload)
    assert dup_resp.status_code == 201
    dup_data = dup_resp.json()
    assert dup_data["is_duplicate"] is True
    assert dup_data["duplicate_of"] == first_report_id


def test_get_reports_list():
    resp = client.get("/api/v1/reports")
    assert resp.status_code == 200
    reports = resp.json()
    assert len(reports) >= 3


def test_get_tasks_list():
    resp = client.get("/api/v1/tasks")
    assert resp.status_code == 200
    tasks = resp.json()
    assert len(tasks) >= 3
    # Check that tasks are ordered with highest risk first
    scores = [t["risk_score"] for t in tasks]
    assert scores == sorted(scores, reverse=True)


def test_end_to_end_report_to_priority_queue():
    """
    Demonstrate complete incident report to priority task lifecycle:
    1. Citizen submits critical blockage report with photo
    2. System generates report ID & tags unverified
    3. Auto-dispatches priority task in queue
    4. Drain risk is recalculated with the new report
    5. Officer reviews and updates task through workflow
    """
    # 1. Citizen files critical report at Malad Subway
    report_body = {
        "drain_id": "DS-MUM-111",
        "location": {
            "lat": 19.1865,
            "lng": 72.8488,
            "address": "Malad Subway, Anand Rd, Malad West",
            "ward": "Ward P-North (Malad)",
        },
        "issue_type": "Structural Wall Collapse",
        "severity": "critical",
        "description": "Culvert side wall collapsed after heavy truck traffic; channel blocked by concrete rubble.",
        "photo_url": "https://example.com/rubble-collapse.jpg",
        "reporter_name": "Local Resident Sunita D.",
        "is_citizen": True,
    }

    rep_res = client.post("/api/v1/reports", json=report_body)
    assert rep_res.status_code == 201
    rep_json = rep_res.json()
    assert rep_json["status"] == "unverified"
    assert rep_json["linked_task_id"] is not None

    task_id = rep_json["linked_task_id"]

    # 2. Check task exists in priority queue with P1 - Critical
    task_res = client.get(f"/api/v1/tasks")
    tasks = task_res.json()
    created_task = next(t for t in tasks if t["id"] == task_id)
    assert created_task["priority"] == "P1 - Critical"
    assert created_task["status"] == "Reported"

    # 3. Transition workflow to 'Risk Assessed'
    step1 = client.patch(f"/api/v1/tasks/{task_id}", json={"status": "Risk Assessed"})
    assert step1.status_code == 200

    # 4. Transition workflow to 'Assigned'
    step2 = client.patch(
        f"/api/v1/tasks/{task_id}",
        json={"status": "Assigned", "assigned_crew": "BMC Heavy Excavation Squad #2"},
    )
    assert step2.status_code == 200
    assert step2.json()["assigned_crew"] == "BMC Heavy Excavation Squad #2"
