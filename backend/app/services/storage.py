import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any

import boto3
from botocore.exceptions import ClientError
from pydantic import BaseModel, Field

from app.core.config import settings
from app.core.logging import logger

ALLOWED_CONTENT_TYPES = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/heic": "heic",
}
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB limit


class PresignedUploadResponse(BaseModel):
    upload_url: str = Field(..., description="Presigned S3 PUT URL for direct client upload")
    file_key: str = Field(..., description="Key path stored in S3")
    expires_in_seconds: int = Field(default=900, description="Validity period in seconds")
    content_type: str


class S3StorageService:
    """
    Manages private Amazon S3 object storage for citizen evidence & verification photos.
    Enforces private-bucket design via short-lived presigned URLs.
    """

    def __init__(self):
        client_kwargs: Dict[str, Any] = {"region_name": settings.AWS_REGION}
        if settings.S3_ENDPOINT_URL:
            client_kwargs["endpoint_url"] = settings.S3_ENDPOINT_URL
        self._s3_client = boto3.client("s3", **client_kwargs)
        self.bucket_name = settings.S3_PHOTO_BUCKET

    def generate_presigned_upload_url(
        self, filename: str, content_type: str, expires_in: int = 900
    ) -> PresignedUploadResponse:
        """
        Generates a presigned S3 PUT URL allowing the client to upload photo directly to S3.
        """
        if content_type.lower() not in ALLOWED_CONTENT_TYPES:
            raise ValueError(
                f"Unsupported file type '{content_type}'. Allowed types: {list(ALLOWED_CONTENT_TYPES.keys())}"
            )

        ext = ALLOWED_CONTENT_TYPES[content_type.lower()]
        unique_id = uuid.uuid4().hex[:12]
        date_prefix = datetime.now(timezone.utc).strftime("%Y/%m/%d")
        file_key = f"evidence/{date_prefix}/{unique_id}.{ext}"

        # If S3 bucket not configured (e.g. offline local dev mode), return mock URL
        if not self.bucket_name:
            mock_url = f"http://127.0.0.1:8000/api/v1/photos/mock-upload/{file_key}"
            logger.info(f"Local dev mode: generated mock upload URL for key {file_key}")
            return PresignedUploadResponse(
                upload_url=mock_url,
                file_key=file_key,
                expires_in_seconds=expires_in,
                content_type=content_type,
            )

        try:
            presigned_url = self._s3_client.generate_presigned_url(
                ClientMethod="put_object",
                Params={
                    "Bucket": self.bucket_name,
                    "Key": file_key,
                    "ContentType": content_type,
                },
                ExpiresIn=expires_in,
            )
            logger.info(f"Generated S3 presigned upload URL for key: {file_key}")
            return PresignedUploadResponse(
                upload_url=presigned_url,
                file_key=file_key,
                expires_in_seconds=expires_in,
                content_type=content_type,
            )
        except ClientError as e:
            logger.error(f"Failed to generate presigned upload URL: {e.response['Error']['Message']}")
            raise

    def generate_presigned_download_url(self, file_key: str, expires_in: int = 3600) -> str:
        """
        Generates a temporary signed GET URL to view/download a private photo.
        """
        if not self.bucket_name:
            return f"https://images.unsplash.com/photo-1541888946425-d0fbb1861593?auto=format&fit=crop&w=600&q=80"

        try:
            return self._s3_client.generate_presigned_url(
                ClientMethod="get_object",
                Params={"Bucket": self.bucket_name, "Key": file_key},
                ExpiresIn=expires_in,
            )
        except ClientError as e:
            logger.error(f"Failed to generate presigned download URL for {file_key}: {e.response['Error']['Message']}")
            raise


storage_service = S3StorageService()
