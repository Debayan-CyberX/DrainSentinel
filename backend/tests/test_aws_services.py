from fastapi.testclient import TestClient
from app.main import app, handler
from app.services.storage import storage_service
from app.services.notifications import notification_service

client = TestClient(app)


def test_photos_presign_upload_endpoint():
    """Verify photo upload presigning returns valid URL and key."""
    response = client.post(
        "/api/v1/photos/presign-upload",
        json={"filename": "culvert_blockage.jpg", "content_type": "image/jpeg"},
    )
    assert response.status_code == 201
    data = response.json()
    assert "upload_url" in data
    assert "file_key" in data
    assert data["file_key"].startswith("evidence/")
    assert data["file_key"].endswith(".jpg")
    assert data["content_type"] == "image/jpeg"
    assert data["expires_in_seconds"] == 900


def test_photos_presign_upload_invalid_mime_rejected():
    """Verify unsupported file formats (e.g. exe or pdf) are rejected."""
    response = client.post(
        "/api/v1/photos/presign-upload",
        json={"filename": "malware.exe", "content_type": "application/x-msdownload"},
    )
    assert response.status_code == 400
    assert "Unsupported file type" in response.json()["detail"]


def test_photos_presign_download_endpoint():
    """Verify presigned download URL generation for private evidence."""
    response = client.get(
        "/api/v1/photos/presign-download",
        params={"file_key": "evidence/2026/10/10/culvert.jpg"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "download_url" in data
    assert data["file_key"] == "evidence/2026/10/10/culvert.jpg"


def test_sns_notification_service_local_fallback():
    """Verify SNS notification service handles local dev mode gracefully."""
    success = notification_service.publish_alert(
        subject="TEST MONSOON ALERT",
        message="Simulated test message for unit tests",
        severity="HIGH",
    )
    assert success is True


def test_lambda_handler_event_invocation():
    """Verify AWS Lambda handler via Mangum handles an API Gateway v2 HTTP event."""
    event = {
        "version": "2.0",
        "routeKey": "GET /api/health",
        "rawPath": "/api/health",
        "rawQueryString": "",
        "headers": {
            "accept": "application/json",
            "host": "api.drainsentinel.mumbai.gov",
        },
        "requestContext": {
            "http": {
                "method": "GET",
                "path": "/api/health",
                "protocol": "HTTP/1.1",
                "sourceIp": "127.0.0.1",
                "userAgent": "pytest-lambda-test",
            },
            "stage": "$default",
        },
        "isBase64Encoded": False,
    }

    context = {}
    response = handler(event, context)
    assert response["statusCode"] == 200
    assert "status" in response["body"]
