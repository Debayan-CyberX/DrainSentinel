from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel, Field

from app.services.storage import storage_service, PresignedUploadResponse, ALLOWED_CONTENT_TYPES

router = APIRouter(prefix="/photos", tags=["Photos & Storage"])


class PresignRequest(BaseModel):
    filename: str = Field(..., description="Original photo filename e.g. 'drain_choke.jpg'")
    content_type: str = Field(..., description="MIME type e.g. 'image/jpeg', 'image/png'")


class PresignDownloadResponse(BaseModel):
    download_url: str
    file_key: str
    expires_in_seconds: int = 3600


@router.post(
    "/presign-upload",
    response_model=PresignedUploadResponse,
    status_code=status.HTTP_201_CREATED,
)
def get_presigned_upload_url(request: PresignRequest) -> PresignedUploadResponse:
    """
    Request a secure, short-lived presigned S3 upload URL.
    Enables clients to upload photos directly to private S3 without passing bytes through API Gateway.
    """
    try:
        return storage_service.generate_presigned_upload_url(
            filename=request.filename,
            content_type=request.content_type,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unable to generate upload URL: {str(e)}",
        )


@router.get("/presign-download", response_model=PresignDownloadResponse)
def get_presigned_download_url(
    file_key: str = Query(..., description="S3 object key e.g. 'evidence/2026/10/10/abc123.jpg'"),
) -> PresignDownloadResponse:
    """
    Generate a temporary signed URL for viewing or downloading private photo evidence.
    """
    try:
        url = storage_service.generate_presigned_download_url(file_key=file_key)
        return PresignDownloadResponse(download_url=url, file_key=file_key)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unable to generate download URL: {str(e)}",
        )
