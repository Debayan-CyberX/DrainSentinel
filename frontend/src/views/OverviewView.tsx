import React from 'react';
import {
  ShieldAlert,
  Droplets,
  ClipboardList,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { Drain, ActivityLog, WeatherScenario } from '../types';
import { MetricCard } from '../components/layout/MetricCard';
import { DrainMap } from '../components/map/DrainMap';
import { InspectionQueue } from '../components/inspections/InspectionQueue';
import { RecentActivity } from '../components/activity/RecentActivity';

interface OverviewViewProps {
  drains: Drain[];
  activities: ActivityLog[];
  selectedDrain: Drain | null;
  onSelectDrain: (drain: Drain) => void;
  currentWeather: WeatherScenario;
  onNavigateToInspections: () => void;
  onOpenReportModal: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  drains,
  activities,
  selectedDrain,
  onSelectDrain,
  currentWeather,
  onNavigateToInspections,
  onOpenReportModal,
}) => {
  // Metrics calculation
  const totalMonitored = drains.length;
  const highRiskCount = drains.filter((d) => {
    const cat = (d.riskCategory || d.risk_assessment?.category || 'Low').toString().toLowerCase();
    return cat === 'high' || cat === 'critical';
  }).length;

  const openInspections = drains.filter((d) => {
    const s = d.status.toLowerCase();
    return s === 'reported' || s === 'risk_assessed' || s === 'assigned' || s === 'inspected' || s === 'repair_in_progress';
  }).length;

  const awaitingVerification = drains.filter((d) => {
    const s = d.status.toLowerCase();
    return s === 'resolved' || s === 'awaiting_verification';
  }).length;

  return (
    <div className="space-y-6">
      {/* Monsoon Stress Notice Banner (if non-dry scenario is active) */}
      {currentWeather.id !== 'dry' && (
        <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-200/90 flex items-center justify-between gap-3 text-xs text-sky-900 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <span className="p-1 rounded-md bg-sky-100 text-sky-700 font-bold font-mono text-[11px]">
              MONSOON SCENARIO
            </span>
            <span className="font-semibold text-sky-950">
              {currentWeather.name} ({currentWeather.intensity})
            </span>
            <span className="text-sky-700 hidden sm:inline">
              &bull; Runoff surcharge risk elevated across Mumbai lowlands (Hindmata, Milan Subway, Kurla).
            </span>
          </div>
          <span className="text-[11px] font-mono font-semibold text-sky-800">
            {currentWeather.rainfallRateMmH} mm/h
          </span>
        </div>
      )}

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Monitored Drains"
          value={totalMonitored}
          subtitle="Mumbai acoustic & depth sensors"
          icon={Droplets}
          badge="100% Online"
          badgeVariant="success"
        />

        <MetricCard
          title="High-Risk Drains"
          value={highRiskCount}
          subtitle="Score ≥ 60 (High or Critical)"
          icon={ShieldAlert}
          badge={highRiskCount > 0 ? `${highRiskCount} Urgent` : 'Nominal'}
          badgeVariant={highRiskCount > 0 ? 'danger' : 'neutral'}
        />

        <MetricCard
          title="Open Inspections"
          value={openInspections}
          subtitle="Reported, assigned or in-repair"
          icon={ClipboardList}
          badge={`${openInspections} Active`}
          badgeVariant="warning"
          onClick={onNavigateToInspections}
        />

        <MetricCard
          title="Awaiting Verification"
          value={awaitingVerification}
          subtitle="Desilting complete; pending audit"
          icon={CheckCircle2}
          badge={awaitingVerification > 0 ? `${awaitingVerification} Ready` : '0'}
          badgeVariant={awaitingVerification > 0 ? 'warning' : 'neutral'}
        />
      </div>

      {/* Main Grid: Interactive Map & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                Mumbai Metropolitan Catchment GIS Map
              </h2>
              <span className="text-xs text-slate-500">
                Click pins to inspect sump telemetry & transition workflow states
              </span>
            </div>
            <button
              onClick={onOpenReportModal}
              className="text-xs font-semibold text-rose-600 hover:text-rose-800 flex items-center gap-1"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Report Blockage</span>
            </button>
          </div>
          <DrainMap
            drains={drains}
            selectedDrain={selectedDrain}
            onSelectDrain={onSelectDrain}
            className="h-[440px]"
          />
        </div>

        {/* Activity Feed */}
        <div className="lg:col-span-1">
          <RecentActivity
            activities={activities}
            onSelectDrainId={(id) => {
              const target = drains.find((d) => d.id === id);
              if (target) onSelectDrain(target);
            }}
          />
        </div>
      </div>

      {/* Prioritised Inspection Queue Table */}
      <div>
        <InspectionQueue
          drains={drains}
          onSelectDrain={onSelectDrain}
          selectedDrainId={selectedDrain?.id}
          onOpenReportModal={onOpenReportModal}
        />
      </div>
    </div>
  );
};
