from pydantic import BaseModel, Field
from typing import Optional, Dict, Any


class AuditRecord(BaseModel):
    id: str
    entity_type: str = Field(..., description="Entity affected: 'drain', 'report', 'task', 'system'")
    entity_id: str = Field(..., description="Identifier of the entity")
    action: str = Field(..., description="Action performed: 'CREATE', 'UPDATE', 'STATUS_CHANGE', 'APPROVE_DISPATCH'")
    timestamp: str = Field(..., description="ISO 8601 timestamp")
    actor: str = Field(default="operator", description="User or service performing the action")
    details: Dict[str, Any] = Field(default_factory=dict, description="Contextual payload or state diff")
