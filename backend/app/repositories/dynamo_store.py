import json
import logging
from decimal import Decimal
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any

import boto3
from boto3.dynamodb.conditions import Key, Attr
from botocore.exceptions import ClientError

from app.core.config import settings
from app.core.logging import logger
from app.models.drain import Drain, DrainFilterParams
from app.models.report import IncidentReportResponse
from app.models.task import InspectionTaskResponse, InspectionTaskUpdate
from app.models.risk import RiskAssessment
from app.services.risk_engine import calculate_risk
from app.repositories.base import (
    IDrainRepository,
    IReportRepository,
    ITaskRepository,
    IAuditRepository,
)


def _float_to_decimal(obj: Any) -> Any:
    """Recursively converts float values to Decimal for DynamoDB storage."""
    if isinstance(obj, float):
        return Decimal(str(obj))
    elif isinstance(obj, dict):
        return {k: _float_to_decimal(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [_float_to_decimal(i) for i in obj]
    return obj


def _decimal_to_float(obj: Any) -> Any:
    """Recursively converts Decimal values back to float/int for Pydantic parsing."""
    if isinstance(obj, Decimal):
        if obj % 1 == 0:
            return int(obj)
        return float(obj)
    elif isinstance(obj, dict):
        return {k: _decimal_to_float(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [_decimal_to_float(i) for i in obj]
    return obj


class DynamoDBDataStore(IDrainRepository, IReportRepository, ITaskRepository, IAuditRepository):
    """
    Production-ready Amazon DynamoDB implementation for DrainSentinel.
    Provides persistence across Lambda invocations with pay-per-request scaling.
    """

    def __init__(self):
        client_kwargs: Dict[str, Any] = {"region_name": settings.AWS_REGION}
        if settings.DYNAMODB_ENDPOINT_URL:
            client_kwargs["endpoint_url"] = settings.DYNAMODB_ENDPOINT_URL

        self.dynamodb = boto3.resource("dynamodb", **client_kwargs)
        self.drains_table = self.dynamodb.Table(settings.DYNAMODB_TABLE_DRAINS)
        self.reports_table = self.dynamodb.Table(settings.DYNAMODB_TABLE_REPORTS)
        self.tasks_table = self.dynamodb.Table(settings.DYNAMODB_TABLE_TASKS)
        self.audit_table = self.dynamodb.Table(settings.DYNAMODB_TABLE_AUDIT)

    # ==========================
    # IDrainRepository
    # ==========================
    def list_drains(self, filters: Optional[DrainFilterParams] = None) -> List[Drain]:
        try:
            response = self.drains_table.scan()
            items = response.get("Items", [])

            # Handle pagination if dataset grows beyond 1MB
            while "LastEvaluatedKey" in response:
                response = self.drains_table.scan(ExclusiveStartKey=response["LastEvaluatedKey"])
                items.extend(response.get("Items", []))

            drains = [Drain.model_validate(_decimal_to_float(item)) for item in items]

            if filters:
                if filters.ward:
                    drains = [d for d in drains if filters.ward.lower() in d.location.ward.lower()]
                if filters.risk_category:
                    drains = [d for d in drains if d.risk_assessment and d.risk_assessment.category == filters.risk_category]
                if filters.status:
                    drains = [d for d in drains if d.status.lower() == filters.status.lower()]
                if filters.search:
                    q = filters.search.lower()
                    drains = [
                        d for d in drains
                        if q in d.id.lower() or q in d.name.lower() or q in d.location.address.lower() or q in d.location.landmark.lower()
                    ]

            return drains
        except ClientError as e:
            logger.error(f"DynamoDB list_drains failed: {e.response['Error']['Message']}")
            return []

    def get_drain(self, drain_id: str) -> Optional[Drain]:
        try:
            response = self.drains_table.get_item(Key={"id": drain_id})
            item = response.get("Item")
            if not item:
                return None
            return Drain.model_validate(_decimal_to_float(item))
        except ClientError as e:
            logger.error(f"DynamoDB get_drain failed for '{drain_id}': {e.response['Error']['Message']}")
            return None

    def update_drain(self, drain: Drain) -> Drain:
        try:
            item = _float_to_decimal(drain.model_dump())
            self.drains_table.put_item(Item=item)
            return drain
        except ClientError as e:
            logger.error(f"DynamoDB update_drain failed for '{drain.id}': {e.response['Error']['Message']}")
            raise

    # ==========================
    # IReportRepository
    # ==========================
    def list_reports(self, status: Optional[str] = None, drain_id: Optional[str] = None) -> List[IncidentReportResponse]:
        try:
            scan_kwargs: Dict[str, Any] = {}
            filter_exp = []

            if status:
                filter_exp.append(Attr("status").eq(status))
            if drain_id:
                filter_exp.append(Attr("drain_id").eq(drain_id))

            if filter_exp:
                combined_filter = filter_exp[0]
                for f in filter_exp[1:]:
                    combined_filter = combined_filter & f
                scan_kwargs["FilterExpression"] = combined_filter

            response = self.reports_table.scan(**scan_kwargs)
            items = response.get("Items", [])
            reports = [IncidentReportResponse.model_validate(_decimal_to_float(item)) for item in items]
            return sorted(reports, key=lambda r: r.created_at, reverse=True)
        except ClientError as e:
            logger.error(f"DynamoDB list_reports failed: {e.response['Error']['Message']}")
            return []

    def get_report(self, report_id: str) -> Optional[IncidentReportResponse]:
        try:
            response = self.reports_table.get_item(Key={"id": report_id})
            item = response.get("Item")
            if not item:
                return None
            return IncidentReportResponse.model_validate(_decimal_to_float(item))
        except ClientError as e:
            logger.error(f"DynamoDB get_report failed: {e.response['Error']['Message']}")
            return None

    def create_report(self, report: IncidentReportResponse) -> IncidentReportResponse:
        try:
            item = _float_to_decimal(report.model_dump())
            self.reports_table.put_item(Item=item)
            self.record_audit(
                entity_type="report",
                entity_id=report.id,
                action="CREATE",
                details={"drain_id": report.drain_id, "severity": report.severity, "issue_type": report.issue_type},
                actor=report.reporter_name or "citizen",
            )
            return report
        except ClientError as e:
            logger.error(f"DynamoDB create_report failed: {e.response['Error']['Message']}")
            raise

    def update_report(self, report: IncidentReportResponse) -> IncidentReportResponse:
        try:
            item = _float_to_decimal(report.model_dump())
            self.reports_table.put_item(Item=item)
            self.record_audit(
                entity_type="report",
                entity_id=report.id,
                action="UPDATE",
                details={"status": report.status, "linked_task_id": report.linked_task_id},
                actor="operator",
            )
            return report
        except ClientError as e:
            logger.error(f"DynamoDB update_report failed: {e.response['Error']['Message']}")
            raise

    # ==========================
    # ITaskRepository
    # ==========================
    def list_tasks(self, status: Optional[str] = None, drain_id: Optional[str] = None) -> List[InspectionTaskResponse]:
        try:
            scan_kwargs: Dict[str, Any] = {}
            filter_exp = []

            if status:
                filter_exp.append(Attr("status").eq(status))
            if drain_id:
                filter_exp.append(Attr("drain_id").eq(drain_id))

            if filter_exp:
                combined_filter = filter_exp[0]
                for f in filter_exp[1:]:
                    combined_filter = combined_filter & f
                scan_kwargs["FilterExpression"] = combined_filter

            response = self.tasks_table.scan(**scan_kwargs)
            items = response.get("Items", [])
            tasks = [InspectionTaskResponse.model_validate(_decimal_to_float(item)) for item in items]
            return sorted(tasks, key=lambda t: t.risk_score, reverse=True)
        except ClientError as e:
            logger.error(f"DynamoDB list_tasks failed: {e.response['Error']['Message']}")
            return []

    def get_task(self, task_id: str) -> Optional[InspectionTaskResponse]:
        try:
            response = self.tasks_table.get_item(Key={"id": task_id})
            item = response.get("Item")
            if not item:
                return None
            return InspectionTaskResponse.model_validate(_decimal_to_float(item))
        except ClientError as e:
            logger.error(f"DynamoDB get_task failed: {e.response['Error']['Message']}")
            return None

    def create_task(self, task: InspectionTaskResponse) -> InspectionTaskResponse:
        try:
            item = _float_to_decimal(task.model_dump())
            self.tasks_table.put_item(Item=item)
            self.record_audit(
                entity_type="task",
                entity_id=task.id,
                action="CREATE",
                details={"drain_id": task.drain_id, "priority": task.priority, "status": task.status},
                actor="system",
            )
            return task
        except ClientError as e:
            logger.error(f"DynamoDB create_task failed: {e.response['Error']['Message']}")
            raise

    def update_task(self, task_id: str, update_data: InspectionTaskUpdate) -> Optional[InspectionTaskResponse]:
        try:
            task = self.get_task(task_id)
            if not task:
                return None

            now_str = datetime.now(timezone.utc).isoformat()
            new_status = update_data.status or task.status
            new_crew = update_data.assigned_crew if update_data.assigned_crew is not None else task.assigned_crew
            new_priority = update_data.priority or task.priority
            new_notes = update_data.notes if update_data.notes is not None else task.notes
            new_photo = update_data.verification_photo_url or task.verification_photo_url

            updated = InspectionTaskResponse(
                id=task.id,
                drain_id=task.drain_id,
                report_id=task.report_id,
                title=task.title,
                issue_description=task.issue_description,
                risk_score=task.risk_score,
                risk_category=task.risk_category,
                priority=new_priority,
                status=new_status,
                assigned_crew=new_crew,
                created_at=task.created_at,
                updated_at=now_str,
                due_date=task.due_date,
                notes=new_notes,
                verification_photo_url=new_photo,
            )

            self.tasks_table.put_item(Item=_float_to_decimal(updated.model_dump()))

            # Sync drain status with task status
            drain = self.get_drain(task.drain_id)
            if drain:
                drain.status = new_status
                if new_crew:
                    drain.assigned_crew = new_crew

                if new_status in ("Resolved", "Verified"):
                    drain.telemetry.silt_level_percent = 18.0
                    drain.has_verified_report = True
                    drain.risk_assessment = calculate_risk(
                        silt_level_percent=18.0,
                        rainfall_rate_mm_h=0.0,
                        elevation_meters=drain.elevation_meters,
                        exposure_tier=drain.exposure_tier,
                        active_reports_count=0,
                        has_verified_report=True,
                    )
                self.update_drain(drain)

            self.record_audit(
                entity_type="task",
                entity_id=task_id,
                action="STATUS_CHANGE" if update_data.status else "UPDATE",
                details={"new_status": new_status, "assigned_crew": new_crew},
                actor="operator",
            )

            return updated
        except ClientError as e:
            logger.error(f"DynamoDB update_task failed: {e.response['Error']['Message']}")
            raise

    # ==========================
    # IAuditRepository
    # ==========================
    def record_audit(self, entity_type: str, entity_id: str, action: str, details: dict, actor: str = "operator") -> None:
        try:
            timestamp = datetime.now(timezone.utc).isoformat()
            audit_id = f"AUD-{entity_type[:3].upper()}-{int(datetime.now(timezone.utc).timestamp() * 1000)}"
            item = {
                "id": audit_id,
                "entity_type": entity_type,
                "entity_id": entity_id,
                "action": action,
                "timestamp": timestamp,
                "actor": actor,
                "details": _float_to_decimal(details),
            }
            self.audit_table.put_item(Item=item)
        except ClientError as e:
            logger.warning(f"DynamoDB record_audit non-fatal failure: {e.response['Error']['Message']}")

    def list_audit_logs(self, entity_id: Optional[str] = None, limit: int = 50) -> List[dict]:
        try:
            scan_kwargs: Dict[str, Any] = {"Limit": limit}
            if entity_id:
                scan_kwargs["FilterExpression"] = Attr("entity_id").eq(entity_id)

            response = self.audit_table.scan(**scan_kwargs)
            items = [_decimal_to_float(item) for item in response.get("Items", [])]
            return sorted(items, key=lambda x: x.get("timestamp", ""), reverse=True)
        except ClientError as e:
            logger.error(f"DynamoDB list_audit_logs failed: {e.response['Error']['Message']}")
            return []
