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
  Droplets,
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-md flex justify-end">
      <div className="w-full max-w-lg bg-[#242720]/95 backdrop-blur-2xl h-full shadow-[0_0_80px_rgba(10,18,12,0.9)] flex flex-col justify-between border-l border-white/10 text-[#eef3e7] animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div>
          <div className="p-6 border-b border-white/10 flex items-start justify-between bg-[#1b1d19]/90">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="font-mono text-xs font-medium text-white bg-white/5 px-2.5 py-0.5 rounded-full border border-white/10">
                  {drain.id}
                </span>
                <RiskBadge category={drain.riskCategory || 'Low'} score={drain.riskScore} />
                <StatusBadge status={drain.status} />
              </div>
              <h2 className="text-base font-medium text-white leading-snug">
                {drain.name}
              </h2>
              <div className="flex items-center gap-1.5 text-xs text-[#a4aca0] mt-1 font-light">
                <MapPin className="w-3.5 h-3.5 text-[#86efac]" />
                <span>{drain.location.address}</span>
              </div>
              <div className="text-xs text-[#86efac] font-mono mt-1 font-normal">
                {drain.location.ward} &bull; {drain.location.landmark}
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full text-[#a4aca0] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(100vh-220px)] text-xs">
            {/* Risk Engine Explainability Card */}
            {risk && (
              <div className="p-4 rounded-2xl bg-[#1b1d19]/80 border border-white/10 shadow-lg space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-[#86efac]" />
                    <span className="font-mono text-xs text-white font-medium">
                      Vulnerability: {risk.total_score}/100 ({risk.category})
                    </span>
                  </div>
                  <span className="text-[10px] text-[#a4aca0] font-mono uppercase tracking-wider">
                    Catchment Analysis
                  </span>
                </div>

                <p className="text-xs text-[#d5dbc9] leading-relaxed font-light">
                  {risk.explanation}
                </p>

                {/* 5-factor table */}
                <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-[#a4aca0] block text-[10px]">Sediment Accumulation</span>
                    <span className="font-medium text-white">{risk.factors.blockage_severity.raw_value}%</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-[#a4aca0] block text-[10px]">Rainfall Surcharge</span>
                    <span className="font-medium text-white">{risk.factors.rainfall_risk.raw_value} mm/h</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-[#a4aca0] block text-[10px]">Urban Exposure</span>
                    <span className="font-medium text-white">{risk.factors.exposure.normalized_score} pts</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-[#a4aca0] block text-[10px]">Ground Observation</span>
                    <span className="font-medium text-white">{risk.factors.report_confidence.normalized_score} pts</span>
                  </div>
                </div>
              </div>
            )}

            {/* AI Recommendation Box */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#86efac]" />
                  <span className="font-mono text-xs text-white font-medium">
                    Recommended Stewardship Plan
                  </span>
                </div>
                {loadingIntelligence && (
                  <RefreshCw className="w-3.5 h-3.5 text-[#86efac] animate-spin" />
                )}
              </div>

              {intelligence?.draft_recommendation ? (
                <div className="p-4 rounded-2xl bg-gradient-to-b from-[#2d3029] to-[#1b1d19] border border-[#86efac]/30 space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-[#a4aca0]">Suggested Crew:</span>
                    <span className="font-medium text-[#86efac]">
                      {intelligence.draft_recommendation.suggested_crew}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-[#d5dbc9] font-light">
                    <span className="text-[#a4aca0] font-mono text-[11px] block">Recommended Actions:</span>
                    <ul className="list-disc list-inside space-y-1 text-slate-200">
                      {intelligence.draft_recommendation.recommended_actions.map((act, i) => (
                        <li key={i}>{act}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Human Approval Button */}
                  <div className="pt-2 border-t border-white/10">
                    {approvalSuccess ? (
                      <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-medium flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{approvalSuccess}</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={approvingRec || drain.status === 'Assigned' || drain.status === 'Inspected'}
                        onClick={handleApproveRecommendation}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 pill-button rounded-full text-xs font-medium cursor-pointer disabled:opacity-40"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[#23261f]" />
                        <span>
                          {approvingRec
                            ? 'Creating Care Order...'
                            : drain.status === 'Assigned' || drain.status === 'Inspected'
                            ? 'Care Order Already Assigned'
                            : 'Approve Plan & Dispatch Stewards'}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            {/* Silt Gauge & Capacity */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5 font-mono">
                <span className="text-[#d5dbc9]">
                  Sediment Accumulation
                </span>
                <span className="font-medium text-white">
                  {drain.telemetry.silt_level_percent}% Volume Occupied
                </span>
              </div>
              <div className="h-2.5 w-full bg-[#1b1d19] rounded-full overflow-hidden p-0.5 border border-white/10">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    drain.telemetry.silt_level_percent >= 80
                      ? 'bg-rose-500 shadow-[0_0_8px_#f43f5e]'
                      : drain.telemetry.silt_level_percent >= 60
                      ? 'bg-amber-400'
                      : drain.telemetry.silt_level_percent >= 35
                      ? 'bg-[#86efac]'
                      : 'bg-emerald-400'
                  }`}
                  style={{ width: `${drain.telemetry.silt_level_percent}%` }}
                />
              </div>
            </div>

            {/* Telemetry Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 font-mono">
              <div className="p-3.5 bg-[#1b1d19] rounded-xl border border-white/10">
                <div className="text-[#a4aca0] flex items-center gap-1.5 text-[10px] mb-1 uppercase">
                  <Layers className="w-3 h-3 text-[#86efac]" />
                  <span>Channel Dimensions</span>
                </div>
                <div className="font-medium text-white text-sm">
                  {drain.pipe_diameter_mm} mm
                </div>
                <div className="text-[11px] text-[#a4aca0] mt-0.5">{drain.drain_type}</div>
              </div>

              <div className="p-3.5 bg-[#1b1d19] rounded-xl border border-white/10">
                <div className="text-[#a4aca0] flex items-center gap-1.5 text-[10px] mb-1 uppercase">
                  <Activity className="w-3 h-3 text-[#86efac]" />
                  <span>Water Depth & Flow</span>
                </div>
                <div className="font-medium text-white text-sm">
                  {drain.telemetry.water_level_cm} cm
                </div>
                <div className="text-[11px] text-[#a4aca0] mt-0.5">
                  Flow: {drain.telemetry.flow_velocity_mps} m/s
                </div>
              </div>

              <div className="p-3.5 bg-[#1b1d19] rounded-xl border border-white/10">
                <div className="text-[#a4aca0] flex items-center gap-1.5 text-[10px] mb-1 uppercase">
                  <MapPin className="w-3 h-3 text-[#86efac]" />
                  <span>Elevation & Ground Sag</span>
                </div>
                <div className="font-medium text-white text-xs">
                  {drain.elevation_meters}m AMSL
                </div>
                <div className="text-[11px] text-[#a4aca0] mt-0.5">
                  Exposure: {drain.exposure_tier}
                </div>
              </div>

              <div className="p-3.5 bg-[#1b1d19] rounded-xl border border-white/10">
                <div className="text-[#a4aca0] flex items-center gap-1.5 text-[10px] mb-1 uppercase">
                  <Clock className="w-3 h-3 text-[#86efac]" />
                  <span>Catchment Zone</span>
                </div>
                <div className="font-medium text-white text-xs truncate">
                  {drain.catchment_zone}
                </div>
                <div className="text-[11px] text-[#a4aca0] mt-0.5">
                  Ground Notes: {drain.active_report_count}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-white/10 bg-[#1b1d19] space-y-3">
          <div className="text-xs font-mono uppercase tracking-wider text-[#a4aca0] flex items-center justify-between">
            <span>Stewardship Lifecycle</span>
            <span className="text-[#86efac] font-medium">{drain.status}</span>
          </div>

          {drain.status === 'Reported' && (
            <button
              disabled={isUpdating}
              onClick={() => handleTransition('Risk Assessed')}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 pill-button rounded-full text-xs font-medium cursor-pointer"
            >
              <span>Complete Assessment & Review Vulnerability</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {drain.status === 'Risk Assessed' && (
            <div className="space-y-2">
              <select
                value={selectedCrew}
                onChange={(e) => setSelectedCrew(e.target.value)}
                className="w-full bg-[#242720] border border-white/10 rounded-full p-2.5 text-xs text-white font-mono focus:outline-none"
              >
                <option value="BMC Monsoon Jet Vac Unit 4" className="bg-[#242720]">BMC Monsoon Jet Vac Unit 4</option>
                <option value="Ward F-North Desilting Squad" className="bg-[#242720]">Ward F-North Desilting Squad</option>
                <option value="Andheri Rapid Dewatering Squad" className="bg-[#242720]">Andheri Rapid Dewatering Squad</option>
                <option value="Central Railway Municipal Joint Unit" className="bg-[#242720]">Central Railway Municipal Joint Unit</option>
              </select>
              <button
                disabled={isUpdating}
                onClick={() => handleTransition('Assigned')}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 pill-button rounded-full text-xs font-medium cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Assign Catchment Field Stewards</span>
              </button>
            </div>
          )}

          {drain.status === 'Assigned' && (
            <button
              disabled={isUpdating}
              onClick={() => handleTransition('Inspected')}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 pill-button rounded-full text-xs font-medium cursor-pointer"
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Confirm Field Arrival & Inspection</span>
            </button>
          )}

          {drain.status === 'Inspected' && (
            <button
              disabled={isUpdating}
              onClick={() => handleTransition('Repair in Progress')}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-full text-xs font-medium cursor-pointer"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Commence Desilting & Channel Restoration</span>
            </button>
          )}

          {drain.status === 'Repair in Progress' && (
            <button
              disabled={isUpdating}
              onClick={() => handleTransition('Resolved')}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-full text-xs font-medium cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Mark Restored (Clear Flow Achieved)</span>
            </button>
          )}

          {drain.status === 'Resolved' && (
            <button
              disabled={isUpdating}
              onClick={() => handleTransition('Verified')}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-full text-xs font-medium cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verify CCTV & Photo Clearance</span>
            </button>
          )}

          {drain.status === 'Verified' && (
            <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-full text-center text-emerald-300 text-xs font-mono font-medium">
              Waterway verified free-flowing. Catchment capacity restored.
            </div>
          )}

          {drain.status === 'operational' && (
            <button
              disabled={isUpdating}
              onClick={() => handleTransition('Reported')}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-[#d5dbc9] border border-white/10 rounded-full text-xs font-mono cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-[#86efac]" />
              <span>Trigger New Care Dispatch</span>
            </button>
          )}

          {onOpenReportModal && (
            <button
              onClick={() => onOpenReportModal(drain)}
              className="w-full py-1 text-[#a4aca0] hover:text-[#86efac] text-xs font-normal text-center block cursor-pointer transition-colors"
            >
              Share Community Observation for this Waterway &rarr;
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
