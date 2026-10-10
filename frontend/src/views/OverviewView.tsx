import React from 'react';
import {
  ShieldAlert,
  Droplets,
  ClipboardList,
  CheckCircle2,
  AlertTriangle,
  CloudRain,
  Radio,
  Waves,
  Sparkles,
  ArrowRight,
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
  onNavigateToSylva?: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  drains,
  activities,
  selectedDrain,
  onSelectDrain,
  currentWeather,
  onNavigateToInspections,
  onOpenReportModal,
  onNavigateToSylva,
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
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Hero Viewport Spacer — reveals the persistent 3D world and iframe hero stage */}
      <div className="w-full h-[calc(100vh-140px)] min-h-[560px] max-h-[820px] flex flex-col justify-end items-center pb-8 pointer-events-none">
        <button
          type="button"
          onClick={() => {
            const el = document.getElementById('telemetry-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          className="pointer-events-auto group px-5 py-2.5 rounded-full bg-[#1b1e18]/70 hover:bg-[#1b1e18]/90 border border-white/15 hover:border-[#86efac]/40 text-xs tracking-wider uppercase font-mono text-[#d5dbc9] hover:text-[#86efac] transition-all duration-300 backdrop-blur-md shadow-[0_8px_30px_rgba(0,0,0,0.35)] flex items-center gap-2.5 cursor-pointer"
        >
          <span>Explore Catchment Telemetry</span>
          <span className="text-[#86efac] group-hover:translate-y-0.5 transition-transform duration-300">↓</span>
        </button>
      </div>

      {/* Operational Catchment Telemetry Section */}
      <div id="telemetry-section" className="space-y-8 pt-2">
        {/* Monsoon Inundation Advisory Banner */}
        {currentWeather.id !== 'dry' && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-[#383b34]/95 via-[#2d3029]/95 to-[#242720]/95 border border-[#86efac]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-[0_0_24px_rgba(74,222,128,0.12)]">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-[#86efac] shadow-[0_0_8px_#86efac] animate-pulse" />
              <span className="font-mono text-[11px] tracking-wider uppercase text-[#86efac] font-semibold">
                MONSOON INUNDATION ADVISORY
              </span>
              <span className="text-[#d5dbc9] font-light hidden md:inline">
                &bull; Runoff surcharge risk elevated across Mumbai lowlands (Hindmata, Milan Subway, Kurla, Dharavi).
              </span>
            </div>
            <span className="font-mono text-xs text-[#86efac] font-semibold">
              {currentWeather.rainfallRateMmH} mm/h Live Inflow Rate
            </span>
          </div>
        )}

        {/* 4 Metric Cards in Sylva Living Green Styling */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Monitored Watercourses"
            value={totalMonitored}
            subtitle="25 urban nullahs, creeks, and coastal outfalls"
            icon={Droplets}
            badge="100% Online"
            badgeVariant="success"
          />

          <MetricCard
            title="Vulnerable Choke Points"
            value={highRiskCount}
            subtitle="Channels requiring active attention"
            icon={ShieldAlert}
            badge={highRiskCount > 0 ? `${highRiskCount} Urgent` : 'Nominal'}
            badgeVariant={highRiskCount > 0 ? 'danger' : 'neutral'}
          />

          <MetricCard
            title="Field Stewardship Orders"
            value={openInspections}
            subtitle="Active desilting and channel clearing"
            icon={ClipboardList}
            badge={`${openInspections} Active`}
            badgeVariant="warning"
            onClick={onNavigateToInspections}
          />

          <MetricCard
            title="Awaiting Verification"
            value={awaitingVerification}
            subtitle="Channel cleared; awaiting visual proof"
            icon={CheckCircle2}
            badge={awaitingVerification > 0 ? `${awaitingVerification} Ready` : '0'}
            badgeVariant={awaitingVerification > 0 ? 'warning' : 'neutral'}
          />
        </div>

        {/* Main Grid: Interactive GIS Map & System Activity Feed */}
        <div id="gis-map-section" className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#86efac] shadow-[0_0_8px_#86efac]" />
              <h2 className="text-xs uppercase font-mono tracking-wider text-[#d5dbc9] font-medium">
                Mumbai Catchment Observatories & Flow Map
              </h2>
            </div>
            <button
              onClick={onOpenReportModal}
              className="text-xs font-medium text-[#86efac] hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>+ Share Observation</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <DrainMap
                drains={drains}
                selectedDrain={selectedDrain}
                onSelectDrain={onSelectDrain}
                className="h-[480px]"
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
    </div>
  );
};
