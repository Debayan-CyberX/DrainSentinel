import React, { useState, useEffect } from 'react';
import {
  X,
  MapPin,
  Layers,
  Activity,
  AlertTriangle,
  Clock,
  Send,
  Wrench,
  FileCheck,
  ShieldAlert,
  ArrowRight,
  ShieldCheck,
  Check,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { Drain, TaskStatus, DrainIntelligence } from '../../types';
import { fetchDrainIntelligence, approveIntelligenceRecommendation } from '../../services/api';
import { RiskBadge } from '../common/RiskBadge';
import { StatusBadge } from '../common/StatusBadge';

interface DrainDetailModalProps {
  drain: Drain | null;
  onClose: () => void;
  onUpdateStatus: (drainId: string, newStatus: TaskStatus, crew?: string) => Promise<void>;
  onOpenReportModal?: (drain: Drain) => void;
}

export const DrainDetailModal: React.FC<DrainDetailModalProps> = ({
  drain,
  onClose,
  onUpdateStatus,
  onOpenReportModal,
}) => {
  const [selectedCrew, setSelectedCrew] = useState<string>('BMC Monsoon Jet Vac Unit 4');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [intelligence, setIntelligence] = useState<DrainIntelligence | null>(null);
  const [loadingIntelligence, setLoadingIntelligence] = useState<boolean>(false);
  const [approvingRec, setApprovingRec] = useState<boolean>(false);
  const [approvalSuccess, setApprovalSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (drain) {
      setApprovalSuccess(null);
      setLoadingIntelligence(true);
      fetchDrainIntelligence(drain.id)
        .then((data) => {
          setIntelligence(data);
          if (data.draft_recommendation?.suggested_crew) {
            setSelectedCrew(data.draft_recommendation.suggested_crew);
          }
        })
        .catch((err) => console.error('Failed to load intelligence:', err))
        .finally(() => setLoadingIntelligence(false));
    } else {
      setIntelligence(null);
    }
  }, [drain?.id]);

  const handleApproveRecommendation = async () => {
    if (!drain || !intelligence) return;
    setApprovingRec(true);
    try {
      const task = await approveIntelligenceRecommendation(
        drain.id,
        intelligence.draft_recommendation
      );
      setApprovalSuccess(`Work Order ${task.id} created & assigned to ${task.assigned_crew}!`);
      await onUpdateStatus(
        drain.id,
        'Assigned',
        intelligence.draft_recommendation.suggested_crew
      );
    } catch (err) {
      console.error('Failed to approve recommendation:', err);
    } finally {
      setApprovingRec(false);
    }
  };

  if (!drain) return null;

  const handleTransition = async (targetStatus: TaskStatus) => {
    setIsUpdating(true);
    try {
      await onUpdateStatus(drain.id, targetStatus, selectedCrew);
    } finally {
      setIsUpdating(false);
    }
  };

  const risk = drain.risk_assessment;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col justify-between border-l border-slate-200 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div>
          <div className="p-6 border-b border-slate-200/90 flex items-start justify-between bg-slate-50/70">
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="font-mono text-sm font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {drain.id}
                </span>
                <RiskBadge category={drain.riskCategory || 'Low'} score={drain.riskScore} />
                <StatusBadge status={drain.status} />
              </div>
              <h2 className="text-base font-bold text-slate-900 leading-snug">
                {drain.name}
              </h2>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{drain.location.address}</span>
              </div>
              <div className="text-[11px] text-teal-800 font-medium mt-0.5">
                {drain.location.ward} &bull; {drain.location.landmark}
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(100vh-220px)] text-xs">
            {/* Risk Engine Explainability Card */}
            {risk && (
              <div className="p-4 rounded-xl bg-slate-900 text-slate-100 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-teal-400" />
                    <span className="font-semibold text-xs text-white">
                      Explainable Risk Score: {risk.total_score}/100 ({risk.category})
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Deterministic Engine
                  </span>
                </div>

                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {risk.explanation}
                </p>

                {/* 5-Factor Score Matrix */}
                <div className="grid grid-cols-5 gap-1.5 pt-1 text-center font-mono">
                  <div className="p-1.5 rounded bg-slate-800/80 border border-slate-700/60">
                    <span className="text-[9px] text-slate-400 block font-sans">Blockage (30%)</span>
                    <span className="font-bold text-teal-300 text-xs">
                      {risk.factors.blockage_severity.normalized_score}
                    </span>
                  </div>
                  <div className="p-1.5 rounded bg-slate-800/80 border border-slate-700/60">
                    <span className="text-[9px] text-slate-400 block font-sans">Rain/Sag (25%)</span>
                    <span className="font-bold text-teal-300 text-xs">
                      {risk.factors.rainfall_risk.normalized_score}
                    </span>
                  </div>
                  <div className="p-1.5 rounded bg-slate-800/80 border border-slate-700/60">
                    <span className="text-[9px] text-slate-400 block font-sans">Exposure (20%)</span>
                    <span className="font-bold text-teal-300 text-xs">
                      {risk.factors.exposure.normalized_score}
                    </span>
                  </div>
                  <div className="p-1.5 rounded bg-slate-800/80 border border-slate-700/60">
                    <span className="text-[9px] text-slate-400 block font-sans">Confidence (15%)</span>
                    <span className="font-bold text-teal-300 text-xs">
                      {risk.factors.report_confidence.normalized_score}
                    </span>
                  </div>
                  <div className="p-1.5 rounded bg-slate-800/80 border border-slate-700/60">
                    <span className="text-[9px] text-slate-400 block font-sans">Freshness (10%)</span>
                    <span className="font-bold text-teal-300 text-xs">
                      {risk.factors.data_freshness.normalized_score}
                    </span>
                  </div>
                </div>

                <p className="text-[9px] text-slate-400 italic">
                  {risk.prototype_disclaimer}
                </p>
              </div>
            )}

            {/* AI Incident Intelligence Card */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50/80 via-white to-sky-50/80 border border-indigo-200/90 shadow-2xs space-y-3.5">
              <div className="flex items-center justify-between border-b border-indigo-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-md bg-indigo-600 text-white shadow-2xs">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-slate-900 tracking-tight flex items-center gap-1.5">
                      <span>AI Incident Intelligence</span>
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                        Advisory
                      </span>
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[10px]">
                  {loadingIntelligence ? (
                    <span className="inline-flex items-center gap-1 text-indigo-600 font-medium">
                      <RefreshCw className="w-3 h-3 animate-spin" /> Synthesizing...
                    </span>
                  ) : intelligence ? (
                    <span
                      className={`inline-flex items-center gap-1 font-mono font-medium px-2 py-0.5 rounded-full border ${
                        intelligence.is_ai_generated
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          intelligence.is_ai_generated ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                        }`}
                      />
                      {intelligence.is_ai_generated ? 'Gemini Flash' : 'Deterministic Engine'}
                    </span>
                  ) : null}
                </div>
              </div>

              {loadingIntelligence ? (
                <div className="py-6 text-center text-slate-400 text-xs">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-500" />
                  Consolidating incident reports and evaluating telemetry...
                </div>
              ) : intelligence ? (
                <div className="space-y-3">
                  {/* Synthesis Narrative */}
                  <div>
                    <span className="text-[11px] font-semibold text-slate-700 block mb-1">
                      Synthesized Incident Narrative
                    </span>
                    <p className="text-[11px] text-slate-600 leading-relaxed bg-white/80 p-2.5 rounded-lg border border-slate-200/70">
                      {intelligence.summary}
                    </p>
                  </div>

                  {/* Factor Drivers */}
                  {intelligence.risk_factor_explanation.length > 0 && (
                    <div>
                      <span className="text-[11px] font-semibold text-slate-700 block mb-1">
                        Mathematical Score Contributors
                      </span>
                      <ul className="space-y-1 text-[11px] text-slate-600">
                        {intelligence.risk_factor_explanation.map((factor, idx) => (
                          <li key={idx} className="flex items-start gap-1.5 bg-white/60 p-1.5 rounded border border-slate-100">
                            <span className="text-teal-600 font-bold text-xs mt-0.5">&bull;</span>
                            <span className="leading-snug">{factor}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Missing or Conflicting Info */}
                  {intelligence.missing_or_conflicting_info.length > 0 && (
                    <div className="p-2.5 rounded-lg bg-amber-50/90 border border-amber-200/90 space-y-1">
                      <div className="flex items-center gap-1.5 text-amber-900 font-bold text-[11px]">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>Audit Flags & Missing Evidence</span>
                      </div>
                      <ul className="space-y-0.5 text-[10px] text-amber-800">
                        {intelligence.missing_or_conflicting_info.map((flag, idx) => (
                          <li key={idx} className="leading-relaxed">
                            {flag}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Draft Recommendation */}
                  <div className="p-3 rounded-lg bg-white border border-indigo-200/80 shadow-2xs space-y-2.5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                      <div className="flex items-center gap-1.5">
                        <FileCheck className="w-3.5 h-3.5 text-indigo-600" />
                        <span className="font-bold text-[11px] text-slate-900">
                          Draft Inspection Recommendation
                        </span>
                      </div>
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-rose-50 text-rose-700 border border-rose-200">
                        {intelligence.draft_recommendation.priority}
                      </span>
                    </div>

                    <div className="text-[11px] space-y-1.5">
                      <div className="flex items-baseline justify-between text-slate-700">
                        <span className="font-semibold text-slate-500">Suggested Unit:</span>
                        <span className="font-medium text-slate-900">{intelligence.draft_recommendation.suggested_crew}</span>
                      </div>
                      <div className="flex items-baseline justify-between text-slate-700">
                        <span className="font-semibold text-slate-500">Urgency:</span>
                        <span className="font-medium text-indigo-700">{intelligence.draft_recommendation.urgency}</span>
                      </div>

                      {intelligence.draft_recommendation.recommended_actions.length > 0 && (
                        <div>
                          <span className="font-semibold text-slate-500 block mb-1">Recommended Actions:</span>
                          <ol className="list-decimal list-inside space-y-0.5 text-[10px] text-slate-600">
                            {intelligence.draft_recommendation.recommended_actions.map((act, i) => (
                              <li key={i}>{act}</li>
                            ))}
                          </ol>
                        </div>
                      )}

                      {intelligence.draft_recommendation.equipment_needed.length > 0 && (
                        <div>
                          <span className="font-semibold text-slate-500 block mb-1">Equipment Needed:</span>
                          <div className="flex flex-wrap gap-1">
                            {intelligence.draft_recommendation.equipment_needed.map((eq, i) => (
                              <span key={i} className="px-1.5 py-0.5 text-[9px] bg-slate-100 text-slate-700 rounded border border-slate-200">
                                {eq}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Human Approval Button */}
                    <div className="pt-2 border-t border-slate-100">
                      {approvalSuccess ? (
                        <div className="p-2 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{approvalSuccess}</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={approvingRec || drain.status === 'Assigned' || drain.status === 'Inspected'}
                          onClick={handleApproveRecommendation}
                          className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>
                            {approvingRec
                              ? 'Creating Work Order...'
                              : drain.status === 'Assigned' || drain.status === 'Inspected'
                              ? 'Work Order Already Assigned'
                              : 'Approve & Create Work Order'}
                          </span>
                        </button>
                      )}
                      <span className="text-[9px] text-slate-400 block text-center mt-1">
                        Requires human municipal operator authorization.
                      </span>
                    </div>
                  </div>

                  <p className="text-[9px] text-slate-400 italic">
                    {intelligence.disclaimer}
                  </p>
                </div>
              ) : (
                <div className="text-slate-400 text-center py-2 text-[11px]">
                  Intelligence summary unavailable for this drain.
                </div>
              )}
            </div>

            {/* Silt Gauge & Capacity */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-slate-700">
                  Current Silt & Sediment Buildup
                </span>
                <span className="font-mono font-bold text-slate-900">
                  {drain.telemetry.silt_level_percent}% Volume Occupied
                </span>
              </div>
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    drain.telemetry.silt_level_percent >= 80
                      ? 'bg-rose-600'
                      : drain.telemetry.silt_level_percent >= 60
                      ? 'bg-orange-500'
                      : drain.telemetry.silt_level_percent >= 35
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${drain.telemetry.silt_level_percent}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Threshold: Pipe cross-section critically choked when sediment exceeds 60%.
              </p>
            </div>

            {/* Telemetry Metrics Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <div className="text-slate-400 flex items-center gap-1.5 text-[11px] mb-1">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Conduit Size & Type</span>
                </div>
                <div className="font-mono font-semibold text-slate-800 text-sm">
                  {drain.pipe_diameter_mm} mm
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">{drain.drain_type}</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <div className="text-slate-400 flex items-center gap-1.5 text-[11px] mb-1">
                  <Activity className="w-3.5 h-3.5" />
                  <span>Sump Water Level</span>
                </div>
                <div className="font-mono font-semibold text-slate-800 text-sm">
                  {drain.telemetry.water_level_cm} cm
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Flow: {drain.telemetry.flow_velocity_mps} m/s
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <div className="text-slate-400 flex items-center gap-1.5 text-[11px] mb-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Elevation & Sag</span>
                </div>
                <div className="font-semibold text-slate-800 text-xs">
                  {drain.elevation_meters}m AMSL
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Exposure: {drain.exposure_tier}
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <div className="text-slate-400 flex items-center gap-1.5 text-[11px] mb-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Catchment & Reports</span>
                </div>
                <div className="font-semibold text-slate-800 text-xs truncate">
                  {drain.catchment_zone}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Active Reports: {drain.active_report_count}
                </div>
              </div>
            </div>

            {/* Historical Flooding & Predictive Headroom Card */}
            {drain.drainage_history && (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <Activity className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Drainage History & Hydraulic Headroom</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    drain.drainage_history.flood_events_past_3yr >= 8
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {drain.drainage_history.flood_events_past_3yr >= 8 ? 'Chronic Flood Sag' : 'Standard Invert'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 rounded-lg bg-white border border-slate-200/80">
                    <span className="text-[10px] text-slate-500 block">3-Yr Inundations</span>
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      {drain.drainage_history.flood_events_past_3yr}
                    </span>
                    <span className="text-[9px] text-slate-400 block">monsoon events</span>
                  </div>

                  <div className="p-2 rounded-lg bg-white border border-slate-200/80">
                    <span className="text-[10px] text-slate-500 block">Remaining Headroom</span>
                    <span className="font-mono font-bold text-teal-700 text-sm">
                      {Math.max(0, 100 - drain.telemetry.silt_level_percent).toFixed(1)}%
                    </span>
                    <span className="text-[9px] text-slate-400 block">hydraulic margin</span>
                  </div>

                  <div className="p-2 rounded-lg bg-white border border-slate-200/80">
                    <span className="text-[10px] text-slate-500 block">Last Desilted</span>
                    <span className="font-mono font-bold text-slate-800 text-xs">
                      {drain.drainage_history.days_since_desilting}d ago
                    </span>
                    <span className="text-[9px] text-slate-400 block">{drain.drainage_history.last_desilted_date}</span>
                  </div>
                </div>

                {drain.drainage_history.notable_flooding_hotspot_reason && (
                  <p className="text-[10px] text-slate-600 bg-white/80 p-2 rounded border border-slate-200/60 leading-relaxed">
                    <strong className="text-slate-800">Historical Engineering Factor:</strong> {drain.drainage_history.notable_flooding_hotspot_reason}
                  </p>
                )}
              </div>
            )}

            {/* Current Assignment / Crew */}
            {drain.assigned_crew && (
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between">
                <div>
                  <span className="font-semibold text-blue-900 block">
                    Assigned Field Crew:
                  </span>
                  <span className="text-blue-700">{drain.assigned_crew}</span>
                </div>
                <Wrench className="w-4 h-4 text-blue-500" />
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions: Inspection State Machine Transitions */}
        <div className="p-5 border-t border-slate-200 bg-slate-50/90 space-y-3">
          <div className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider flex items-center justify-between">
            <span>Inspection Lifecycle Progression</span>
            <span className="font-mono text-teal-700 font-bold">{drain.status}</span>
          </div>

          {drain.status === 'Reported' && (
            <div className="space-y-2">
              <button
                disabled={isUpdating}
                onClick={() => handleTransition('Risk Assessed')}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
              >
                <span>Complete Triage & Assess Risk</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {drain.status === 'Risk Assessed' && (
            <div className="space-y-2">
              <select
                value={selectedCrew}
                onChange={(e) => setSelectedCrew(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800"
              >
                <option value="BMC Monsoon Jet Vac Unit 4">BMC Monsoon Jet Vac Unit 4</option>
                <option value="Ward F-North Desilting Squad">Ward F-North Desilting Squad</option>
                <option value="Andheri Rapid Dewatering Squad">Andheri Rapid Dewatering Squad</option>
                <option value="Central Railway Municipal Joint Unit">Central Railway Municipal Joint Unit</option>
              </select>
              <button
                disabled={isUpdating}
                onClick={() => handleTransition('Assigned')}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Assign BMC Maintenance Crew</span>
              </button>
            </div>
          )}

          {drain.status === 'Assigned' && (
            <button
              disabled={isUpdating}
              onClick={() => handleTransition('Inspected')}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Confirm On-Site Inspection</span>
            </button>
          )}

          {drain.status === 'Inspected' && (
            <button
              disabled={isUpdating}
              onClick={() => handleTransition('Repair in Progress')}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Start Desilting & Repair Work</span>
            </button>
          )}

          {drain.status === 'Repair in Progress' && (
            <button
              disabled={isUpdating}
              onClick={() => handleTransition('Resolved')}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Mark Resolved (Desilting Completed)</span>
            </button>
          )}

          {drain.status === 'Resolved' && (
            <button
              disabled={isUpdating}
              onClick={() => handleTransition('Verified')}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verify CCTV Post-Clean Proof</span>
            </button>
          )}

          {drain.status === 'Verified' && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center text-emerald-800 text-xs font-semibold">
              Drain verified operational. Hydraulic capacity restored.
            </div>
          )}

          {drain.status === 'operational' && (
            <button
              disabled={isUpdating}
              onClick={() => handleTransition('Reported')}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>Trigger New Inspection Work Order</span>
            </button>
          )}

          {/* Quick Citizen Report Button */}
          {onOpenReportModal && (
            <button
              onClick={() => onOpenReportModal(drain)}
              className="w-full py-1.5 text-slate-500 hover:text-slate-800 text-[11px] underline text-center block"
            >
              File Citizen Blockage Report for this Drain
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
