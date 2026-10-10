import threading
from typing import List, Optional, Dict
from datetime import datetime, timezone
from app.models.drain import Drain, DrainLocation, DrainTelemetry, DrainFilterParams, DrainageHistory
from app.models.report import IncidentReportResponse, IncidentReportCreate
from app.models.task import InspectionTaskResponse, InspectionTaskCreate, InspectionTaskUpdate, VALID_TRANSITIONS, TaskStatus
from app.models.risk import RiskAssessment
from app.services.risk_engine import calculate_risk
from app.repositories.base import IDrainRepository, IReportRepository, ITaskRepository


class MemoryDataStore(IDrainRepository, IReportRepository, ITaskRepository):
    """
    Thread-safe in-memory data store for Mumbai storm-drain network.
    Designed with a modular interface for immediate drop-in replacement
    with Amazon DynamoDB for serverless cloud deployment.
    """

    def __init__(self):
        self._lock = threading.Lock()
        self._drains: Dict[str, Drain] = {}
        self._reports: Dict[str, IncidentReportResponse] = {}
        self._tasks: Dict[str, InspectionTaskResponse] = {}
        self._seed_mumbai_data()

    def _seed_mumbai_data(self):
        """Seed 25 realistic storm-drain assets located across Mumbai flood-prone hotspots."""
        raw_drains = [
            {
                "id": "DS-MUM-101",
                "name": "Hindmata Junction Sump Chamber",
                "lat": 19.0142,
                "lng": 72.8423,
                "address": "Dr. Babasaheb Ambedkar Rd, Hindmata, Dadar East",
                "landmark": "Near Hindmata Cinema flyover low-point",
                "ward": "Ward F-South (Parel)",
                "catchment": "Central Mumbai Lowlands",
                "drain_type": "Box Culvert",
                "pipe_diameter_mm": 1200,
                "elevation": 6.2,
                "exposure": "Critical Transit",
                "silt": 88.0,
                "water_cm": 64.0,
                "velocity": 0.18,
                "status": "Reported",
            },
            {
                "id": "DS-MUM-102",
                "name": "Milan Subway Underpass Drain",
                "lat": 19.0886,
                "lng": 72.8437,
                "address": "Milan Subway Underpass, Santacruz West",
                "landmark": "Railway subway low sag connecting SV Road to WEH",
                "ward": "Ward K-East (Vile Parle)",
                "catchment": "Western Suburbs Railway Basin",
                "drain_type": "Drop Grate",
                "pipe_diameter_mm": 900,
                "elevation": 4.8,
                "exposure": "Critical Transit",
                "silt": 91.0,
                "water_cm": 72.0,
                "velocity": 0.12,
                "status": "Assigned",
                "crew": "BMC Monsoon Jet Vac Unit 4",
            },
            {
                "id": "DS-MUM-103",
                "name": "Gandhi Market / King's Circle Basin",
                "lat": 19.0305,
                "lng": 72.8574,
                "address": "Dr. Ambedkar Rd & Lal Bahadur Shastri Marg, Matunga",
                "landmark": "Opposite King's Circle Garden / Gandhi Market",
                "ward": "Ward F-North (Matunga)",
                "catchment": "Sion-Matunga Depression",
                "drain_type": "Box Culvert",
                "pipe_diameter_mm": 1000,
                "elevation": 5.5,
                "exposure": "Critical Transit",
                "silt": 84.0,
                "water_cm": 58.0,
                "velocity": 0.22,
                "status": "Inspected",
                "crew": "Ward F-North Stormwater Team",
            },
            {
                "id": "DS-MUM-104",
                "name": "Andheri Subway Culvert West",
                "lat": 19.1197,
                "lng": 72.8466,
                "address": "Andheri Subway, Swami Vivekananda Rd, Andheri West",
                "landmark": "Subway portal between Andheri East & West",
                "ward": "Ward K-West (Andheri)",
                "catchment": "Mogra Nullah Basin",
                "drain_type": "Box Culvert",
                "pipe_diameter_mm": 900,
                "elevation": 5.1,
                "exposure": "Critical Transit",
                "silt": 82.0,
                "water_cm": 54.0,
                "velocity": 0.24,
                "status": "Repair in Progress",
                "crew": "Andheri Rapid Dewatering Squad",
            },
            {
                "id": "DS-MUM-105",
                "name": "Kurla Kamani LBS Marg Inflow",
                "lat": 19.0688,
                "lng": 72.8795,
                "address": "Lal Bahadur Shastri Marg, Kamani, Kurla West",
                "landmark": "Near Phoenix Marketcity Mithi outfall channel",
                "ward": "Ward L (Kurla)",
                "catchment": "Mithi River Middle Reach",
                "drain_type": "Curb Inlet",
                "pipe_diameter_mm": 750,
                "elevation": 7.1,
                "exposure": "Dense Residential",
                "silt": 89.0,
                "water_cm": 66.0,
                "velocity": 0.15,
                "status": "Reported",
            },
            {
                "id": "DS-MUM-106",
                "name": "Dadar TT Circle Drop Inlet",
                "lat": 19.0195,
                "lng": 72.8458,
                "address": "Dadar TT Circle, Khodadad Circle, Dadar East",
                "landmark": "Near Swami Narayan Temple crossing",
                "ward": "Ward F-North (Dadar)",
                "catchment": "Central Core Interceptor",
                "drain_type": "Drop Grate",
                "pipe_diameter_mm": 600,
                "elevation": 11.2,
                "exposure": "High Density Commercial",
                "silt": 64.0,
                "water_cm": 38.0,
                "velocity": 0.58,
                "status": "operational",
            },
            {
                "id": "DS-MUM-107",
                "name": "Sion Circle Pratiksha Nagar Drain",
                "lat": 19.0392,
                "lng": 72.8621,
                "address": "Sion Circle, Opp. Sion Hospital, Sion East",
                "landmark": "Sion Hospital emergency corridor",
                "ward": "Ward F-North (Sion)",
                "catchment": "Sion-Kurla Link Basin",
                "drain_type": "Box Culvert",
                "pipe_diameter_mm": 800,
                "elevation": 6.9,
                "exposure": "Hospital Arterial",
                "silt": 76.0,
                "water_cm": 49.0,
                "velocity": 0.35,
                "status": "Risk Assessed",
            },
            {
                "id": "DS-MUM-108",
                "name": "BKC Connector Mithi Channel",
                "lat": 19.0657,
                "lng": 72.8640,
                "address": "Bandra Kurla Complex G Block, Bandra East",
                "landmark": "Mithi River embankment behind ICICI towers",
                "ward": "Ward H-East (Bandra)",
                "catchment": "BKC Reclamation Basin",
                "drain_type": "Box Culvert",
                "pipe_diameter_mm": 1200,
                "elevation": 8.5,
                "exposure": "High Density Commercial",
                "silt": 45.0,
                "water_cm": 28.0,
                "velocity": 0.92,
                "status": "operational",
            },
            {
                "id": "DS-MUM-109",
                "name": "Lower Parel Senapati Bapat Collector",
                "lat": 19.0016,
                "lng": 72.8291,
                "address": "Senapati Bapat Marg, Lower Parel",
                "landmark": "Near Phoenix Mills entrance",
                "ward": "Ward G-South (Lower Parel)",
                "catchment": "Worli-Parel Basin",
                "drain_type": "Curb Inlet",
                "pipe_diameter_mm": 600,
                "elevation": 10.4,
                "exposure": "High Density Commercial",
                "silt": 68.0,
                "water_cm": 42.0,
                "velocity": 0.48,
                "status": "Reported",
            },
            {
                "id": "DS-MUM-110",
                "name": "Dharavi 90 Feet Road Culvert",
                "lat": 19.0435,
                "lng": 72.8542,
                "address": "90 Feet Rd, Kumbharwada, Dharavi",
                "landmark": "Kumbharwada junction Mithi storm link",
                "ward": "Ward G-North (Dharavi)",
                "catchment": "Mithi Lower Reach",
                "drain_type": "Box Culvert",
                "pipe_diameter_mm": 900,
                "elevation": 6.0,
                "exposure": "Dense Residential",
                "silt": 79.0,
                "water_cm": 52.0,
                "velocity": 0.31,
                "status": "Assigned",
                "crew": "Ward G-North Desilting Team",
            },
            {
                "id": "DS-MUM-111",
                "name": "Malad Subway Drop Grate",
                "lat": 19.1865,
                "lng": 72.8488,
                "address": "Malad Subway, Anand Rd, Malad West",
                "landmark": "Subway dip under Western Railway tracks",
                "ward": "Ward P-North (Malad)",
                "catchment": "Poinsur River Tributary",
                "drain_type": "Drop Grate",
                "pipe_diameter_mm": 750,
                "elevation": 5.8,
                "exposure": "Critical Transit",
                "silt": 86.0,
                "water_cm": 61.0,
                "velocity": 0.20,
                "status": "Reported",
            },
            {
                "id": "DS-MUM-112",
                "name": "Worli Naka Coastal Storm Outfall",
                "lat": 19.0169,
                "lng": 72.8188,
                "address": "Dr. Annie Besant Rd, Worli Naka",
                "landmark": "Near Worli Sea Face promenade interceptor",
                "ward": "Ward G-South (Worli)",
                "catchment": "Worli Coastal Outfall",
                "drain_type": "Tidal Outfall",
                "pipe_diameter_mm": 1000,
                "elevation": 9.2,
                "exposure": "Standard",
                "silt": 38.0,
                "water_cm": 24.0,
                "velocity": 1.10,
                "status": "operational",
            },
            {
                "id": "DS-MUM-113",
                "name": "Goregaon WEH Highway Culvert",
                "lat": 19.1553,
                "lng": 72.8582,
                "address": "Western Express Highway, Goregaon East",
                "landmark": "Near Hub Mall junction median culvert",
                "ward": "Ward P-South (Goregaon)",
                "catchment": "Oshiwara River Catchment",
                "drain_type": "Box Culvert",
                "pipe_diameter_mm": 800,
                "elevation": 14.5,
                "exposure": "Critical Transit",
                "silt": 58.0,
                "water_cm": 36.0,
                "velocity": 0.65,
                "status": "operational",
            },
            {
                "id": "DS-MUM-114",
                "name": "Chembur Postal Colony Collector",
                "lat": 19.0561,
                "lng": 72.8982,
                "address": "Postal Colony Rd, Chembur West",
                "landmark": "Near Chembur railway station south side",
                "ward": "Ward M-West (Chembur)",
                "catchment": "Eastern Suburbs Storm Basin",
                "drain_type": "Curb Inlet",
                "pipe_diameter_mm": 600,
                "elevation": 8.8,
                "exposure": "Dense Residential",
                "silt": 62.0,
                "water_cm": 39.0,
                "velocity": 0.54,
                "status": "operational",
            },
            {
                "id": "DS-MUM-115",
                "name": "Marine Drive Sea Wall Sluice",
                "lat": 18.9438,
                "lng": 72.8231,
                "address": "Netaji Subhash Chandra Bose Rd, Marine Drive",
                "landmark": "Arabian Sea promenade floodgate 2",
                "ward": "Ward A (Churchgate)",
                "catchment": "South Mumbai Coastal",
                "drain_type": "Tidal Outfall",
                "pipe_diameter_mm": 1200,
                "elevation": 5.0,
                "exposure": "Standard",
                "silt": 22.0,
                "water_cm": 15.0,
                "velocity": 1.45,
                "status": "Verified",
            },
            {
                "id": "DS-MUM-116",
                "name": "Haji Ali Bay Discharge Basin",
                "lat": 18.9778,
                "lng": 72.8122,
                "address": "Lala Lajpatrai Marg, Haji Ali, Mahalaxmi",
                "landmark": "Haji Ali Dargah bay road low weir",
                "ward": "Ward D (Malabar Hill)",
                "catchment": "Mahalaxmi Basin",
                "drain_type": "Tidal Outfall",
                "pipe_diameter_mm": 900,
                "elevation": 4.5,
                "exposure": "Standard",
                "silt": 48.0,
                "water_cm": 31.0,
                "velocity": 0.82,
                "status": "operational",
            },
            {
                "id": "DS-MUM-117",
                "name": "Sakinaka Junction Drain Box",
                "lat": 19.1025,
                "lng": 72.8872,
                "address": "Andheri-Ghatkopar Link Rd, Sakinaka",
                "landmark": "Near Sakinaka Metro Station pillar 42",
                "ward": "Ward L (Sakinaka)",
                "catchment": "Mithi Upper Tributary",
                "drain_type": "Box Culvert",
                "pipe_diameter_mm": 700,
                "elevation": 12.0,
                "exposure": "Dense Residential",
                "silt": 71.0,
                "water_cm": 46.0,
                "velocity": 0.42,
                "status": "Reported",
            },
            {
                "id": "DS-MUM-118",
                "name": "Ghatkopar Station West Drop Grate",
                "lat": 19.0864,
                "lng": 72.9081,
                "address": "LBS Marg & Hirachand Desai Rd, Ghatkopar West",
                "landmark": "Near Ghatkopar West auto stand",
                "ward": "Ward N (Ghatkopar)",
                "catchment": "Eastern Suburban Interceptor",
                "drain_type": "Drop Grate",
                "pipe_diameter_mm": 600,
                "elevation": 13.5,
                "exposure": "High Density Commercial",
                "silt": 35.0,
                "water_cm": 21.0,
                "velocity": 1.05,
                "status": "operational",
            },
            {
                "id": "DS-MUM-119",
                "name": "Mahim Causeway Culvert Gate",
                "lat": 19.0475,
                "lng": 72.8420,
                "address": "Mahim Causeway, Mahim West",
                "landmark": "Connecting Mahim & Bandra over Mithi estuary",
                "ward": "Ward G-North (Mahim)",
                "catchment": "Mithi Estuary Outfall",
                "drain_type": "Tidal Outfall",
                "pipe_diameter_mm": 1200,
                "elevation": 6.1,
                "exposure": "Critical Transit",
                "silt": 52.0,
                "water_cm": 34.0,
                "velocity": 0.88,
                "status": "operational",
            },
            {
                "id": "DS-MUM-120",
                "name": "Vidyavihar Railway Culvert",
                "lat": 19.0792,
                "lng": 72.8970,
                "address": "Vidyavihar Station East Road",
                "landmark": "Culvert under Central Railway slow tracks",
                "ward": "Ward N (Vidyavihar)",
                "catchment": "Central Railway Corridor",
                "drain_type": "Box Culvert",
                "pipe_diameter_mm": 750,
                "elevation": 9.4,
                "exposure": "Critical Transit",
                "silt": 77.0,
                "water_cm": 50.0,
                "velocity": 0.36,
                "status": "Assigned",
                "crew": "Central Railway Municipal Joint Unit",
            },
            {
                "id": "DS-MUM-121",
                "name": "Charni Road East Box Drain",
                "lat": 18.9515,
                "lng": 72.8190,
                "address": "Raja Ram Mohan Roy Rd, Girgaon",
                "landmark": "Near Charni Road Railway Station Footbridge",
                "ward": "Ward C (Girgaon)",
                "catchment": "South Central Basin",
                "drain_type": "Curb Inlet",
                "pipe_diameter_mm": 500,
                "elevation": 8.0,
                "exposure": "Standard",
                "silt": 31.0,
                "water_cm": 18.0,
                "velocity": 1.15,
                "status": "operational",
            },
            {
                "id": "DS-MUM-122",
                "name": "Byculla S Bridge Inflow Sump",
                "lat": 18.9782,
                "lng": 72.8335,
                "address": "Dr. Babasaheb Ambedkar Rd, Byculla East",
                "landmark": "Near Byculla Station S Bridge dip",
                "ward": "Ward E (Byculla)",
                "catchment": "Dr. Ambedkar Road Basin",
                "drain_type": "Drop Grate",
                "pipe_diameter_mm": 600,
                "elevation": 10.1,
                "exposure": "Hospital Arterial",
                "silt": 65.0,
                "water_cm": 41.0,
                "velocity": 0.52,
                "status": "Reported",
            },
            {
                "id": "DS-MUM-123",
                "name": "Govandi Deonar Channel Drain",
                "lat": 19.0543,
                "lng": 72.9195,
                "address": "Govandi Station Rd, Deonar",
                "landmark": "Near Deonar municipal abattoir channel",
                "ward": "Ward M-East (Govandi)",
                "catchment": "Thane Creek Western Basin",
                "drain_type": "Box Culvert",
                "pipe_diameter_mm": 800,
                "elevation": 7.5,
                "exposure": "Dense Residential",
                "silt": 73.0,
                "water_cm": 47.0,
                "velocity": 0.40,
                "status": "Reported",
            },
            {
                "id": "DS-MUM-124",
                "name": "Santacruz Vakola Nullah Inflow",
                "lat": 19.0768,
                "lng": 72.8512,
                "address": "Nehru Rd & Vakola Bridge, Santacruz East",
                "landmark": "Vakola Nullah confluence weir",
                "ward": "Ward H-East (Santacruz)",
                "catchment": "Vakola Nullah Basin",
                "drain_type": "Box Culvert",
                "pipe_diameter_mm": 900,
                "elevation": 8.0,
                "exposure": "Dense Residential",
                "silt": 69.0,
                "water_cm": 44.0,
                "velocity": 0.46,
                "status": "Reported",
            },
            {
                "id": "DS-MUM-125",
                "name": "Prabhadevi Century Bazaar Drain",
                "lat": 19.0112,
                "lng": 72.8256,
                "address": "Pandurang Budhkar Marg, Prabhadevi",
                "landmark": "Near Century Bazaar bus stop",
                "ward": "Ward G-South (Prabhadevi)",
                "catchment": "Lower Parel Industrial Basin",
                "drain_type": "Curb Inlet",
                "pipe_diameter_mm": 500,
                "elevation": 11.0,
                "exposure": "Standard",
                "silt": 29.0,
                "water_cm": 17.0,
                "velocity": 1.20,
                "status": "Resolved",
            },
        ]

        now_str = datetime.now(timezone.utc).isoformat()

        for item in raw_drains:
            telemetry = DrainTelemetry(
                silt_level_percent=item["silt"],
                water_level_cm=item["water_cm"],
                flow_velocity_mps=item["velocity"],
                sensor_health="online",
                last_updated=now_str,
            )
            location = DrainLocation(
                lat=item["lat"],
                lng=item["lng"],
                address=item["address"],
                landmark=item["landmark"],
                ward=item["ward"],
            )

            # Compute initial explainable risk score
            assessment = calculate_risk(
                silt_level_percent=item["silt"],
                rainfall_rate_mm_h=0.0,
                elevation_meters=item["elevation"],
                exposure_tier=item["exposure"],
                active_reports_count=0,
                has_verified_report=False,
                hours_since_update=1.0,
            )

            # Derive realistic historical drainage data for Mumbai hotspots
            elev = item["elevation"]
            silt = item["silt"]
            is_chronic = item["id"] in (
                "DS-MUM-101", "DS-MUM-102", "DS-MUM-103", "DS-MUM-104",
                "DS-MUM-105", "DS-MUM-108", "DS-MUM-111", "DS-MUM-114"
            )

            if is_chronic:
                flood_events = 14 if item["id"] in ("DS-MUM-101", "DS-MUM-102") else 9
                vuln_idx = 0.96 if item["id"] == "DS-MUM-102" else (0.92 if item["id"] == "DS-MUM-101" else 0.84)
                reason = "Natural topographic depression subject to reverse tidal backflow" if elev <= 6.0 else "Corridor bottleneck with high runoff velocity"
                trend = "Escalating Vulnerability" if silt >= 80 else "Stable"
                days_since = 155 if silt >= 80 else 85
            else:
                flood_events = 2 if elev < 9.0 else 0
                vuln_idx = 0.40 if elev < 9.0 else 0.15
                reason = "Nominal suburban drainage gradient"
                trend = "Stable"
                days_since = 45

            history = DrainageHistory(
                flood_events_past_3yr=flood_events,
                chronic_vulnerability_index=vuln_idx,
                last_desilted_date="2026-04-10" if days_since > 100 else "2026-07-20",
                days_since_desilting=days_since,
                historical_silt_accumulation_rate_cm_month=4.8 if is_chronic else 2.1,
                trend=trend,
                notable_flooding_hotspot_reason=reason,
            )

            drain = Drain(
                id=item["id"],
                name=item["name"],
                location=location,
                catchment_zone=item["catchment"],
                drain_type=item["drain_type"],
                pipe_diameter_mm=item["pipe_diameter_mm"],
                elevation_meters=item["elevation"],
                exposure_tier=item["exposure"],
                telemetry=telemetry,
                status=item["status"],
                active_report_count=0,
                has_verified_report=False,
                risk_assessment=assessment,
                assigned_crew=item.get("crew"),
                drainage_history=history,
            )
            self._drains[drain.id] = drain

        # Seed initial Mumbai incident reports
        seed_reports = [
            IncidentReportResponse(
                id="REP-MUM-801",
                drain_id="DS-MUM-101",
                location={"lat": 19.0142, "lng": 72.8423, "address": "Hindmata Flyover low sag", "ward": "Ward F-South (Parel)"},
                issue_type="Silt Accumulation",
                severity="critical",
                description="Dense black silt and construction slurry filling the culvert chamber after overnight road resurfacing.",
                photo_url="https://images.unsplash.com/photo-1541888946425-d0fbb1861593?auto=format&fit=crop&w=400&q=80",
                reporter_name="Amitabh S. (Commuter)",
                status="triaged",
                is_citizen=True,
                is_duplicate=False,
                created_at="2026-10-10T06:15:00Z",
                linked_task_id="TSK-MUM-1001",
            ),
            IncidentReportResponse(
                id="REP-MUM-802",
                drain_id="DS-MUM-102",
                location={"lat": 19.0886, "lng": 72.8437, "address": "Milan Subway West Ramp", "ward": "Ward K-East (Vile Parle)"},
                issue_type="Water Stagnation / Sag",
                severity="critical",
                description="Water accumulation reaching 1.5 ft in subway dip; intake grates choked by plastic bags.",
                photo_url=None,
                reporter_name="Santacruz Traffic Police Ward #4",
                status="triaged",
                is_citizen=False,
                is_duplicate=False,
                created_at="2026-10-10T07:30:00Z",
                linked_task_id="TSK-MUM-1002",
            ),
            IncidentReportResponse(
                id="REP-MUM-803",
                drain_id="DS-MUM-105",
                location={"lat": 19.0688, "lng": 72.8795, "address": "Kurla LBS Marg near Kamani", "ward": "Ward L (Kurla)"},
                issue_type="Plastic & Trash Choke",
                severity="high",
                description="Garbage bags and thermocol packing material blocking stormwater curb drop entrance.",
                photo_url=None,
                reporter_name="Citizen via WhatsApp BMC Helpline",
                status="unverified",
                is_citizen=True,
                is_duplicate=False,
                created_at="2026-10-10T08:10:00Z",
            ),
        ]

        for r in seed_reports:
            self._reports[r.id] = r
            if r.drain_id in self._drains:
                self._drains[r.drain_id].active_report_count += 1
                # Recalculate drain risk with the active report
                d = self._drains[r.drain_id]
                d.risk_assessment = calculate_risk(
                    silt_level_percent=d.telemetry.silt_level_percent,
                    rainfall_rate_mm_h=0.0,
                    elevation_meters=d.elevation_meters,
                    exposure_tier=d.exposure_tier,
                    active_reports_count=d.active_report_count,
                    has_verified_report=d.has_verified_report,
                )

        # Seed initial inspection tasks
        seed_tasks = [
            InspectionTaskResponse(
                id="TSK-MUM-1001",
                drain_id="DS-MUM-101",
                report_id="REP-MUM-801",
                title="Emergency Desilting: Hindmata Flyover Sump",
                issue_description="Dense black silt & construction slurry choking 88% of intake capacity.",
                risk_score=92,
                risk_category="Critical",
                priority="P1 - Critical",
                status="Reported",
                assigned_crew="Unassigned",
                created_at="2026-10-10T06:20:00Z",
                updated_at="2026-10-10T06:20:00Z",
                due_date="2026-10-10T16:00:00Z",
                notes="High-pressure jet vac truck needed. Station pumps on standby.",
                verification_photo_url=None,
            ),
            InspectionTaskResponse(
                id="TSK-MUM-1002",
                drain_id="DS-MUM-102",
                report_id="REP-MUM-802",
                title="Subway Dewatering & Grate Clearance: Milan Subway",
                issue_description="Severe underpass waterlogging; intake grates choked by plastic.",
                risk_score=94,
                risk_category="Critical",
                priority="P1 - Critical",
                status="Assigned",
                assigned_crew="BMC Monsoon Jet Vac Unit 4",
                created_at="2026-10-10T07:35:00Z",
                updated_at="2026-10-10T07:45:00Z",
                due_date="2026-10-10T14:00:00Z",
                notes="Traffic diversion active. Crew dispatched with 250 HP submersible pumps.",
                verification_photo_url=None,
            ),
            InspectionTaskResponse(
                id="TSK-MUM-1003",
                drain_id="DS-MUM-104",
                report_id=None,
                title="Mogra Nullah Lateral Flushing: Andheri Subway West",
                issue_description="Compacted silt bed causing 82% obstruction on westbound ingress.",
                risk_score=85,
                risk_category="Critical",
                priority="P1 - Critical",
                status="Repair in Progress",
                assigned_crew="Andheri Rapid Dewatering Squad",
                created_at="2026-10-09T18:00:00Z",
                updated_at="2026-10-10T08:00:00Z",
                due_date="2026-10-10T12:00:00Z",
                notes="Hydro-auger deployed. Silt removal in progress.",
                verification_photo_url=None,
            ),
        ]

        for t in seed_tasks:
            self._tasks[t.id] = t

    # IDrainRepository implementation
    def list_drains(self, filters: Optional[DrainFilterParams] = None) -> List[Drain]:
        with self._lock:
            result = list(self._drains.values())

            if filters:
                if filters.ward:
                    result = [d for d in result if filters.ward.lower() in d.location.ward.lower()]
                if filters.risk_category:
                    result = [d for d in result if d.risk_assessment and d.risk_assessment.category == filters.risk_category]
                if filters.status:
                    result = [d for d in result if d.status.lower() == filters.status.lower()]
                if filters.search:
                    q = filters.search.lower()
                    result = [
                        d for d in result
                        if q in d.id.lower() or q in d.name.lower() or q in d.location.address.lower() or q in d.location.landmark.lower()
                    ]

            return result

    def get_drain(self, drain_id: str) -> Optional[Drain]:
        with self._lock:
            return self._drains.get(drain_id)

    def update_drain(self, drain: Drain) -> Drain:
        with self._lock:
            self._drains[drain.id] = drain
            return drain

    # IReportRepository implementation
    def list_reports(self, status: Optional[str] = None, drain_id: Optional[str] = None) -> List[IncidentReportResponse]:
        with self._lock:
            result = list(self._reports.values())
            if status:
                result = [r for r in result if r.status.lower() == status.lower()]
            if drain_id:
                result = [r for r in result if r.drain_id == drain_id]
            # Order newest first
            return sorted(result, key=lambda r: r.created_at, reverse=True)

    def get_report(self, report_id: str) -> Optional[IncidentReportResponse]:
        with self._lock:
            return self._reports.get(report_id)

    def create_report(self, report: IncidentReportResponse) -> IncidentReportResponse:
        with self._lock:
            self._reports[report.id] = report
            return report

    def update_report(self, report: IncidentReportResponse) -> IncidentReportResponse:
        with self._lock:
            self._reports[report.id] = report
            return report

    # ITaskRepository implementation
    def list_tasks(self, status: Optional[str] = None, drain_id: Optional[str] = None) -> List[InspectionTaskResponse]:
        with self._lock:
            result = list(self._tasks.values())
            if status:
                result = [t for t in result if t.status.lower() == status.lower()]
            if drain_id:
                result = [t for t in result if t.drain_id == drain_id]
            # Order by risk score descending
            return sorted(result, key=lambda t: t.risk_score, reverse=True)

    def get_task(self, task_id: str) -> Optional[InspectionTaskResponse]:
        with self._lock:
            return self._tasks.get(task_id)

    def create_task(self, task: InspectionTaskResponse) -> InspectionTaskResponse:
        with self._lock:
            self._tasks[task.id] = task
            return task

    def update_task(self, task_id: str, update_data: InspectionTaskUpdate) -> Optional[InspectionTaskResponse]:
        with self._lock:
            task = self._tasks.get(task_id)
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
            self._tasks[task_id] = updated

            # If task status updated, sync with the drain's status
            drain = self._drains.get(task.drain_id)
            if drain:
                drain.status = new_status
                if new_crew:
                    drain.assigned_crew = new_crew

                # If resolved or verified, simulate silt clearing
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
                self._drains[drain.id] = drain

            return updated


# Global singleton instance for memory persistence during process lifetime
store = MemoryDataStore()
