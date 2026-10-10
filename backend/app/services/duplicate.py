import math
from typing import List, Optional, Tuple
from app.models.report import IncidentReportResponse, IncidentReportCreate
from app.models.drain import Drain


def haversine_distance_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great circle distance between two points in meters."""
    R = 6371000.0  # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (
        math.sin(delta_phi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c


def find_closest_drain(
    lat: float, lng: float, drains: List[Drain], max_distance_meters: float = 350.0
) -> Optional[Drain]:
    """Find the closest storm-drain asset to the given coordinates within threshold."""
    closest_drain: Optional[Drain] = None
    min_dist = float("inf")

    for drain in drains:
        dist = haversine_distance_meters(
            lat, lng, drain.location.lat, drain.location.lng
        )
        if dist < min_dist and dist <= max_distance_meters:
            min_dist = dist
            closest_drain = drain

    return closest_drain


def check_for_duplicate(
    new_report: IncidentReportCreate,
    existing_reports: List[IncidentReportResponse],
    duplicate_distance_threshold: float = 120.0,
) -> Tuple[bool, Optional[str]]:
    """
    Checks if a newly filed report is likely a duplicate of a recent active report.
    Returns (is_duplicate: bool, duplicate_of_report_id: Optional[str]).
    """
    for existing in existing_reports:
        # Ignore already dismissed or resolved reports
        if existing.status == "dismissed":
            continue

        # Check if matching drain ID
        if new_report.drain_id and existing.drain_id == new_report.drain_id:
            return True, existing.id

        # Check geographic proximity
        dist = haversine_distance_meters(
            new_report.location.lat,
            new_report.location.lng,
            existing.location.lat,
            existing.location.lng,
        )
        if dist <= duplicate_distance_threshold:
            return True, existing.id

    return False, None
