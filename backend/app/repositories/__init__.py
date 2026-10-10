from app.core.config import settings
from app.repositories.base import (
    IDrainRepository,
    IReportRepository,
    ITaskRepository,
    IAuditRepository,
)
from app.repositories.memory_store import store as memory_store


def get_store():
    """
    Returns the configured data store instance based on settings.STORAGE_BACKEND.
    - 'memory': Thread-safe in-memory store (Local dev & test suite)
    - 'dynamodb': AWS DynamoDB store for serverless Lambda execution
    """
    if settings.STORAGE_BACKEND.lower() == "dynamodb":
        from app.repositories.dynamo_store import DynamoDBDataStore
        return DynamoDBDataStore()
    return memory_store


# Default store instance
store = get_store()

__all__ = [
    "get_store",
    "store",
    "IDrainRepository",
    "IReportRepository",
    "ITaskRepository",
    "IAuditRepository",
]
