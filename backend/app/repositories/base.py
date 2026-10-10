from abc import ABC, abstractmethod
from typing import List, Optional
from app.models.drain import Drain, DrainFilterParams
from app.models.report import IncidentReportResponse, IncidentReportCreate
from app.models.task import InspectionTaskResponse, InspectionTaskCreate, InspectionTaskUpdate


class IDrainRepository(ABC):
    @abstractmethod
    def list_drains(self, filters: Optional[DrainFilterParams] = None) -> List[Drain]:
        pass

    @abstractmethod
    def get_drain(self, drain_id: str) -> Optional[Drain]:
        pass

    @abstractmethod
    def update_drain(self, drain: Drain) -> Drain:
        pass


class IReportRepository(ABC):
    @abstractmethod
    def list_reports(self, status: Optional[str] = None, drain_id: Optional[str] = None) -> List[IncidentReportResponse]:
        pass

    @abstractmethod
    def get_report(self, report_id: str) -> Optional[IncidentReportResponse]:
        pass

    @abstractmethod
    def create_report(self, report: IncidentReportResponse) -> IncidentReportResponse:
        pass

    @abstractmethod
    def update_report(self, report: IncidentReportResponse) -> IncidentReportResponse:
        pass


class ITaskRepository(ABC):
    @abstractmethod
    def list_tasks(self, status: Optional[str] = None, drain_id: Optional[str] = None) -> List[InspectionTaskResponse]:
        pass

    @abstractmethod
    def get_task(self, task_id: str) -> Optional[InspectionTaskResponse]:
        pass

    @abstractmethod
    def create_task(self, task: InspectionTaskResponse) -> InspectionTaskResponse:
        pass

    @abstractmethod
    def update_task(self, task_id: str, update_data: InspectionTaskUpdate) -> Optional[InspectionTaskResponse]:
        pass


class IAuditRepository(ABC):
    @abstractmethod
    def record_audit(self, entity_type: str, entity_id: str, action: str, details: dict, actor: str = "operator") -> None:
        pass

    @abstractmethod
    def list_audit_logs(self, entity_id: Optional[str] = None, limit: int = 50) -> List[dict]:
        pass
