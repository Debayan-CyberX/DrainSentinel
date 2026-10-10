import json
import logging
from datetime import datetime, timezone
from typing import List, Optional
import httpx

from app.core.config import settings
from app.models.drain import Drain
from app.models.report import IncidentReportResponse
from app.models.intelligence import DrainIntelligence, DraftRecommendation

logger = logging.getLogger(__name__)


def _generate_deterministic_intelligence(
    drain: Drain, reports: List[IncidentReportResponse]
) -> DrainIntelligence:
    """
    Deterministic rule-based incident intelligence synthesizer.
    Guarantees 100% offline uptime, zero hallucination, and rigorous municipal logic.
    """
    now_str = datetime.now(timezone.utc).isoformat()
    silt = drain.telemetry.silt_level_percent
    water_cm = drain.telemetry.water_level_cm
    flow = drain.telemetry.flow_velocity_mps
    elev = drain.elevation_meters
    exposure = drain.exposure_tier
    risk = drain.risk_assessment
    total_score = risk.total_score if risk else int(round(silt))
    category = risk.category if risk else "Medium"

    # 1. Summarise multiple reports
    if not reports:
        summary = (
            f"No citizen or field blockage reports currently on record for asset {drain.id}. "
            f"Hydraulic telemetry reflects routine baseline monitoring at {drain.location.landmark}."
        )
    elif len(reports) == 1:
        r = reports[0]
        verified_tag = "verified field inspection" if not r.is_citizen else "unverified citizen submission"
        photo_tag = "with attached photo evidence" if r.photo_url else "without photographic verification"
        summary = (
            f"Single {verified_tag} ({r.id}) logged by {r.reporter_name} regarding {r.issue_type} "
            f"({r.severity} severity) {photo_tag}. Description: \"{r.description}\". "
            f"Asset telemetry indicates current silt at {silt:.1f}% and water level at {water_cm:.1f} cm."
        )
    else:
        issue_types = list({r.issue_type for r in reports})
        citizen_count = sum(1 for r in reports if r.is_citizen)
        official_count = len(reports) - citizen_count
        severities = [r.severity for r in reports]
        highest_sev = "critical" if "critical" in severities else ("high" if "high" in severities else "medium")
        earliest = min(r.created_at for r in reports)[:16].replace("T", " ")
        latest = max(r.created_at for r in reports)[:16].replace("T", " ")

        summary = (
            f"Cluster of {len(reports)} incident reports logged for asset {drain.id} between {earliest} and {latest} "
            f"({citizen_count} citizen submissions, {official_count} municipal field reports). "
            f"Primary reported concerns: {', '.join(issue_types)} with peak reported severity of '{highest_sev}'. "
            f"Corroborating reports indicate progressive hydraulic impedance near {drain.location.landmark}."
        )

    # 2. Explain structured risk factors
    factor_explanations: List[str] = []
    if risk and risk.factors:
        f = risk.factors
        factor_explanations.append(
            f"Blockage Severity ({f.blockage_severity.weight * 100:.0f}% weight): Silt bed measured at {silt:.1f}% "
            f"generates normalized score {f.blockage_severity.normalized_score} (contributing {f.blockage_severity.weighted_score} pts)."
        )
        factor_explanations.append(
            f"Rainfall & Elevation Vulnerability ({f.rainfall_risk.weight * 100:.0f}% weight): Asset invert at {elev:.1f}m AMSL "
            f"contributes {f.rainfall_risk.weighted_score} pts due to low-lying catchment sag vulnerability."
        )
        factor_explanations.append(
            f"Public Infrastructure Exposure ({f.exposure.weight * 100:.0f}% weight): Location classified under '{exposure}' "
            f"tier (contributing {f.exposure.weighted_score} pts)."
        )
        factor_explanations.append(
            f"Corroboration Confidence ({f.report_confidence.weight * 100:.0f}% weight): {len(reports)} active report(s) on file "
            f"provide a confidence factor of {f.report_confidence.normalized_score} (contributing {f.report_confidence.weighted_score} pts)."
        )
        factor_explanations.append(
            f"Telemetry Freshness ({f.data_freshness.weight * 100:.0f}% weight): Real-time acoustic telemetry contributes "
            f"{f.data_freshness.weighted_score} pts."
        )
    else:
        factor_explanations.append(
            f"Deterministic score driven primarily by acoustic silt measurement ({silt:.1f}%) and elevation ({elev:.1f}m AMSL)."
        )

    # 3. Identify missing or conflicting report information
    conflicts_and_gaps: List[str] = []

    # Check for missing photos
    reports_without_photo = [r.id for r in reports if not r.photo_url]
    if reports_without_photo:
        conflicts_and_gaps.append(
            f"Missing Evidence: {len(reports_without_photo)} of {len(reports)} incident report(s) lack photographic verification ({', '.join(reports_without_photo)})."
        )

    # Check for contradictory severity vs telemetry
    critical_or_high_citizen = [r for r in reports if r.is_citizen and r.severity in ("critical", "high")]
    if critical_or_high_citizen and silt < 40.0:
        conflicts_and_gaps.append(
            f"Conflicting Information: Citizen reports cite high/critical obstruction, yet subsurface acoustic sensor registers low silt ({silt:.1f}%). "
            f"Likely surface trash grate choking or sensor calibration variance; on-site visual audit required."
        )
    elif silt >= 80.0 and not reports:
        conflicts_and_gaps.append(
            f"Telemetry Anomaly: Acoustic sensor detects extreme silt accumulation ({silt:.1f}%), but no citizen reports are logged on 311. Proactive preventative flush recommended."
        )

    # Check for duplicate reports
    duplicate_reports = [r.id for r in reports if r.is_duplicate]
    if duplicate_reports:
        conflicts_and_gaps.append(
            f"Corroborating Duplicates: {len(duplicate_reports)} report(s) identified as geographical duplicate submissions ({', '.join(duplicate_reports)})."
        )

    # Check for unverified citizen reports
    unverified_reports = [r.id for r in reports if r.status == "unverified"]
    if unverified_reports:
        conflicts_and_gaps.append(
            f"Verification Pending: {len(unverified_reports)} citizen submission(s) remain unverified until physical inspection."
        )

    if not conflicts_and_gaps:
        conflicts_and_gaps.append(
            "Data Consistency: Telemetry readings and filed reports are consistent with no conflicting observations on record."
        )

    # 4. Draft inspection recommendation
    if total_score >= 80:
        priority = "P1 - Critical"
        urgency = "Immediate emergency response (within 2 hours)"
    elif total_score >= 60:
        priority = "P2 - High"
        urgency = "High priority dispatch (within 6 hours)"
    elif total_score >= 35:
        priority = "P3 - Standard"
        urgency = "Standard shift schedule (within 24 hours)"
    else:
        priority = "P4 - Routine"
        urgency = "Routine seasonal inspection"

    # Select crew specialty & equipment based on telemetry & issue patterns
    issue_text = " ".join(r.issue_type.lower() + " " + r.description.lower() for r in reports)
    if "collapse" in issue_text or "structural" in issue_text or "crack" in issue_text:
        suggested_crew = "BMC SWD Structural Civil Repair & Excavation Unit"
        equipment_needed = [
            "Trench shoring jacks",
            "Precast concrete slab replacements",
            "Hydraulic rapid-setting cement",
            "Mini-excavator",
        ]
        recommended_actions = [
            f"Dispatch civil engineers to inspect culvert chamber integrity at {drain.location.address}.",
            "Install temporary safety barricades around weakened drain pavement.",
            "Clear concrete debris to restore cross-sectional hydraulic flow.",
            "Record post-repair structural clearance photos.",
        ]
    elif silt >= 70.0 or "silt" in issue_text:
        suggested_crew = "BMC Monsoon High-Velocity Jet Vac Suction Squad"
        equipment_needed = [
            "Super Sucker Vacuum tanker truck",
            "High-pressure hydraulic jetting hose (250 bar)",
            "Closed-Circuit Television (CCTV) drain crawler camera",
            "Toxic gas detector (H2S, CH4)",
        ]
        recommended_actions = [
            f"Deploy suction tanker to {drain.location.address} to extract compacted silt bed.",
            "Perform high-pressure jetting upstream and downstream through box culvert section.",
            "Deploy CCTV inspection crawler to confirm zero residual obstruction.",
            "Log photographic proof to reset telemetry status to Verified.",
        ]
    elif "plastic" in issue_text or "trash" in issue_text or "debris" in issue_text:
        suggested_crew = "Ward Solid Waste & Drop Grate Clearance Squad"
        equipment_needed = [
            "Heavy-duty grate clearing rakes",
            "Catch-basin mechanical grabs",
            "Solid waste containment bags",
            "Replacement drop grate cast iron grills",
        ]
        recommended_actions = [
            f"Inspect surface inlet grates and curb openings at {drain.location.address}.",
            "Remove all plastic packaging, silt bags, and vegetable crate debris.",
            "Inspect water velocity response post-clearance.",
            "Upload photographic evidence of clear grates.",
        ]
    else:
        suggested_crew = "Ward Routine Drainage Inspection & Maintenance Team"
        equipment_needed = [
            "Silt depth dipstick rod",
            "Manhole cover magnetic lifter",
            "Handheld flow velocity meter",
            "Safety harness and PPE",
        ]
        recommended_actions = [
            f"Conduct visual inspection of manhole chamber at {drain.location.address}.",
            "Cross-verify acoustic silt reading against physical dipstick measurement.",
            "Check for illegal solid waste dumping or trade effluent discharge.",
            "Update maintenance task record in DrainSentinel portal.",
        ]

    draft_rec = DraftRecommendation(
        priority=priority,
        suggested_crew=suggested_crew,
        recommended_actions=recommended_actions,
        equipment_needed=equipment_needed,
        urgency=urgency,
    )

    return DrainIntelligence(
        drain_id=drain.id,
        drain_name=drain.name,
        generated_at=now_str,
        is_ai_generated=False,
        provider="Deterministic Rule-Based Intelligence Engine (Offline Mode)",
        summary=summary,
        risk_factor_explanation=factor_explanations,
        missing_or_conflicting_info=conflicts_and_gaps,
        draft_recommendation=draft_rec,
        human_approval_required=True,
        disclaimer=(
            "ADVISORY: Heuristic synthesis based on simulated municipal telemetry. "
            "Official crew dispatch requires human municipal operator review and authorization."
        ),
    )


def _call_gemini_api(
    drain: Drain,
    reports: List[IncidentReportResponse],
    api_key: str,
    model_name: str,
) -> Optional[DrainIntelligence]:
    """
    Call Google Gemini API (Free Tier) with strictly bounded context.
    Falls back gracefully to None if any error, timeout, or rate-limit occurs.
    """
    now_str = datetime.now(timezone.utc).isoformat()
    risk = drain.risk_assessment

    # Prepare ground-truth context payload
    reports_payload = [
        {
            "id": r.id,
            "created_at": r.created_at,
            "is_citizen": r.is_citizen,
            "reporter_name": r.reporter_name,
            "issue_type": r.issue_type,
            "severity": r.severity,
            "description": r.description,
            "has_photo": bool(r.photo_url),
            "is_duplicate": r.is_duplicate,
            "status": r.status,
        }
        for r in reports
    ]

    context_payload = {
        "drain": {
            "id": drain.id,
            "name": drain.name,
            "ward": drain.location.ward,
            "address": drain.location.address,
            "landmark": drain.location.landmark,
            "elevation_meters": drain.elevation_meters,
            "exposure_tier": drain.exposure_tier,
            "catchment": drain.catchment,
            "pipe_diameter_mm": drain.pipe_diameter_mm,
            "telemetry": {
                "silt_level_percent": drain.telemetry.silt_level_percent,
                "water_level_cm": drain.telemetry.water_level_cm,
                "flow_velocity_mps": drain.telemetry.flow_velocity_mps,
                "status": drain.status,
            },
            "deterministic_risk_assessment": {
                "total_score": risk.total_score if risk else None,
                "category": risk.category if risk else None,
                "explanation": risk.explanation if risk else None,
            },
        },
        "reports": reports_payload,
    }

    system_instruction = (
        "You are an AI incident intelligence assistant for DrainSentinel, a municipal stormwater management platform. "
        "Your task is to synthesize incident reports and sensor data to assist municipal public works operators. "
        "STRICT CONSTRAINTS:\n"
        "1. DO NOT invent rainfall measurements, field inspections, structural damage, or verifications not provided.\n"
        "2. Keep the deterministic risk score strictly separate; do not alter or recalculate the numerical score.\n"
        "3. Synthesize multiple reports chronologically and identify common themes.\n"
        "4. Identify any missing evidence (e.g. missing photos) or conflicting data (e.g. citizen reports critical choke but sensor shows low silt).\n"
        "5. Draft an actionable inspection recommendation specifying crew type, equipment, and urgency.\n"
        "6. Clearly acknowledge this is simulated municipal data and advisory only; human operator approval is mandatory.\n"
        "7. Respond ONLY with valid JSON matching the specified schema."
    )

    prompt = (
        f"Synthesize the following storm drain incident data into structured JSON:\n\n"
        f"{json.dumps(context_payload, indent=2)}\n\n"
        f"Required JSON Structure:\n"
        "{\n"
        '  "summary": "Synthesized operational narrative consolidating all reports and telemetry",\n'
        '  "risk_factor_explanation": ["Explanation of factor 1", "Explanation of factor 2"],\n'
        '  "missing_or_conflicting_info": ["Conflict or missing item 1", "Conflict or missing item 2"],\n'
        '  "draft_recommendation": {\n'
        '    "priority": "P1 - Critical | P2 - High | P3 - Standard | P4 - Routine",\n'
        '    "suggested_crew": "Specific crew name",\n'
        '    "recommended_actions": ["Action 1", "Action 2"],\n'
        '    "equipment_needed": ["Tool 1", "Tool 2"],\n'
        '    "urgency": "Specific time window"\n'
        "  }\n"
        "}"
    )

    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"

    body = {
        "contents": [{"parts": [{"text": f"{system_instruction}\n\n{prompt}"}]}],
        "generationConfig": {
            "temperature": 0.2,
            "responseMimeType": "application/json",
        },
    }

    try:
        with httpx.Client(timeout=8.0) as client:
            resp = client.post(url, json=body)
            if resp.status_code != 200:
                logger.warning(
                    "Gemini API returned status %d: %s. Falling back to deterministic engine.",
                    resp.status_code,
                    resp.text[:200],
                )
                return None

            result = resp.json()
            candidates = result.get("candidates", [])
            if not candidates:
                return None

            text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
            data = json.loads(text)

            draft_raw = data.get("draft_recommendation", {})
            draft_rec = DraftRecommendation(
                priority=draft_raw.get("priority", "P2 - High"),
                suggested_crew=draft_raw.get("suggested_crew", "Ward Stormwater Maintenance Squad"),
                recommended_actions=draft_raw.get("recommended_actions", []),
                equipment_needed=draft_raw.get("equipment_needed", []),
                urgency=draft_raw.get("urgency", "Within 24 hours"),
            )

            return DrainIntelligence(
                drain_id=drain.id,
                drain_name=drain.name,
                generated_at=now_str,
                is_ai_generated=True,
                provider=f"Google Gemini ({model_name}) Free Tier",
                summary=data.get("summary", ""),
                risk_factor_explanation=data.get("risk_factor_explanation", []),
                missing_or_conflicting_info=data.get("missing_or_conflicting_info", []),
                draft_recommendation=draft_rec,
                human_approval_required=True,
                disclaimer=(
                    "ADVISORY: AI synthesis powered by Google Gemini. "
                    "Official crew dispatch requires human municipal operator review and authorization."
                ),
            )
    except Exception as exc:
        logger.warning(
            "Gemini API call failed (%s). Falling back to deterministic intelligence.",
            exc,
        )
        return None


def generate_drain_intelligence(
    drain: Drain,
    reports: List[IncidentReportResponse],
    api_key: Optional[str] = None,
) -> DrainIntelligence:
    """
    Main entry point for generating AI-assisted incident intelligence.
    Checks for Gemini API key; if present, attempts live generation.
    Otherwise or on any failure, defaults seamlessly to deterministic rule-based synthesis.
    """
    active_key = api_key or settings.GEMINI_API_KEY

    if active_key:
        ai_result = _call_gemini_api(
            drain=drain,
            reports=reports,
            api_key=active_key,
            model_name=settings.AI_MODEL,
        )
        if ai_result:
            return ai_result

    # Deterministic fallback guaranteed to always succeed
    return _generate_deterministic_intelligence(drain, reports)
