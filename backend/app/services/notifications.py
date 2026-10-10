import json
from typing import Optional, Dict, Any

import boto3
from botocore.exceptions import ClientError

from app.core.config import settings
from app.core.logging import logger


class NotificationService:
    """
    Publishes high-priority alerts to Amazon SNS for municipal dispatch and citizen safety warnings.
    """

    def __init__(self):
        self.topic_arn = settings.SNS_ALERT_TOPIC_ARN
        self.region = settings.AWS_REGION
        client_kwargs: Dict[str, Any] = {"region_name": self.region}
        self._sns_client = boto3.client("sns", **client_kwargs)

    def publish_alert(
        self,
        subject: str,
        message: str,
        severity: str = "HIGH",
        attributes: Optional[Dict[str, str]] = None,
    ) -> bool:
        """
        Publishes an alert notification to the configured SNS Topic.
        """
        if not self.topic_arn:
            logger.info(
                f"[LOCAL/MOCK SNS ALERT] Subject: {subject} | Severity: {severity} | Message: {message[:100]}..."
            )
            return True

        try:
            msg_attrs = {
                "Severity": {"DataType": "String", "StringValue": severity},
                "Source": {"DataType": "String", "StringValue": "DrainSentinel"},
            }
            if attributes:
                for k, v in attributes.items():
                    msg_attrs[k] = {"DataType": "String", "StringValue": str(v)}

            response = self._sns_client.publish(
                TopicArn=self.topic_arn,
                Subject=subject[:100],  # SNS subject max length 100 chars
                Message=message,
                MessageAttributes=msg_attrs,
            )
            message_id = response.get("MessageId")
            logger.info(f"Published SNS alert '{subject}' (MessageId: {message_id})")
            return True
        except ClientError as e:
            logger.error(f"Failed to publish SNS alert: {e.response['Error']['Message']}")
            return False

    def notify_critical_incident(self, report_id: str, drain_id: Optional[str], issue_type: str, address: str):
        subject = f"CRITICAL INCIDENT: {issue_type} in {drain_id or 'Unmapped Area'}"
        message = (
            f"DrainSentinel Alert System\n\n"
            f"A critical blockage has been reported.\n"
            f"Report ID: {report_id}\n"
            f"Drain Asset: {drain_id or 'N/A'}\n"
            f"Issue: {issue_type}\n"
            f"Location: {address}\n\n"
            f"Immediate inspection unit dispatch recommended."
        )
        return self.publish_alert(
            subject=subject,
            message=message,
            severity="CRITICAL",
            attributes={"DrainId": drain_id or "NONE", "ReportId": report_id},
        )

    def notify_emergency_task(self, task_id: str, drain_id: str, title: str, crew: Optional[str]):
        subject = f"DISPATCH: Emergency Task {task_id} Assigned"
        message = (
            f"DrainSentinel Emergency Dispatch\n\n"
            f"Task: {title} ({task_id})\n"
            f"Target Asset: {drain_id}\n"
            f"Assigned Crew: {crew or 'Unassigned'}\n\n"
            f"Crew must respond in accordance with Standard Monsoon Protocol."
        )
        return self.publish_alert(
            subject=subject,
            message=message,
            severity="HIGH",
            attributes={"TaskId": task_id, "DrainId": drain_id},
        )


notification_service = NotificationService()
