import React, { useState } from 'react';
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
} from 'lucide-react';
import { Drain, TaskStatus } from '../../types';
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
