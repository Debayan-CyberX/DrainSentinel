import React, { useState, useMemo } from 'react';
import { Search, ArrowUpDown, ChevronRight, Waves } from 'lucide-react';
import { Drain } from '../../types';
import { RiskBadge } from '../common/RiskBadge';
import { StatusBadge } from '../common/StatusBadge';
import { EmptyState } from '../common/EmptyState';

interface InspectionQueueProps {
  drains: Drain[];
  onSelectDrain: (drain: Drain) => void;
  selectedDrainId?: string;
  onOpenReportModal?: () => void;
}

export const InspectionQueue: React.FC<InspectionQueueProps> = ({
  drains,
  onSelectDrain,
  selectedDrainId,
  onOpenReportModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'score' | 'id'>('score');

  // Filter and sort drains
  const filteredDrains = useMemo(() => {
    return drains
      .filter((drain) => {
        const query = searchQuery.trim().toLowerCase();
        const category = (drain.riskCategory || drain.risk_assessment?.category || 'low').toString().toLowerCase();
        const status = drain.status.toLowerCase();

        const matchesSearch =
          query === '' ||
          drain.id.toLowerCase().includes(query) ||
          drain.name.toLowerCase().includes(query) ||
          drain.location.address.toLowerCase().includes(query) ||
          drain.location.landmark.toLowerCase().includes(query) ||
          drain.location.ward.toLowerCase().includes(query);

        const matchesRisk =
          riskFilter === 'ALL' || category === riskFilter.toLowerCase();

        const matchesStatus =
          statusFilter === 'ALL' || status === statusFilter.toLowerCase().replace(/\s+/g, '_');

        return matchesSearch && matchesRisk && matchesStatus;
      })
      .sort((a, b) => {
        const scoreA = a.riskScore ?? a.risk_assessment?.total_score ?? 0;
        const scoreB = b.riskScore ?? b.risk_assessment?.total_score ?? 0;
        if (sortBy === 'score') {
          return scoreB - scoreA;
        }
        return a.id.localeCompare(b.id);
      });
  }, [drains, searchQuery, riskFilter, statusFilter, sortBy]);

  return (
    <div className="nature-card rounded-2xl border border-white/10 shadow-[0_20px_50px_rgba(16,22,17,0.6)] overflow-hidden flex flex-col">
      {/* Header & Filter Controls */}
      <div className="p-5 border-b border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-[#86efac] shadow-[0_0_8px_#86efac]" />
              <span className="text-[11px] font-mono tracking-wider uppercase text-[#86efac] font-medium">
                Living Catchment Ledger
              </span>
            </div>
            <h2 className="text-base font-medium text-white tracking-wide">
              The Priority Waterway Ledger
            </h2>
            <p className="text-xs text-[#a4aca0] font-light mt-0.5">
              Channels and outfalls arranged by urgency &bull; weighing sediment accumulation, rainfall depth, and urban vulnerability
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {onOpenReportModal && (
              <button
                onClick={onOpenReportModal}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium pill-button rounded-full cursor-pointer"
              >
                <span>+ Share Observation</span>
              </button>
            )}

            <button
              onClick={() => setSortBy((prev) => (prev === 'score' ? 'id' : 'score'))}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-[#d5dbc9] bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-colors cursor-pointer"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-[#86efac]" />
              <span>Sort: {sortBy === 'score' ? 'Vulnerability' : 'Channel ID'}</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 pt-1">
          {/* Search Input */}
          <div className="sm:col-span-6 relative">
            <Search className="w-3.5 h-3.5 text-[#a4aca0] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search channel ID, ward (e.g. F-North), street, or landmark..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#242720] border border-white/10 text-[#eef3e7] text-xs pl-8 pr-3 py-2 rounded-full focus:outline-none focus:border-[#86efac]/50 placeholder-[#7c8177] font-light"
            />
          </div>

          {/* Risk Filter */}
          <div className="sm:col-span-3">
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="w-full bg-[#242720] border border-white/10 text-[#d5dbc9] text-xs py-2 px-3 rounded-full focus:outline-none focus:border-[#86efac]/50 cursor-pointer"
            >
              <option value="ALL" className="bg-[#2d3029]">All Vulnerability Tiers</option>
              <option value="critical" className="bg-[#2d3029]">Critical (80–100)</option>
              <option value="high" className="bg-[#2d3029]">High Watch (60–79)</option>
              <option value="medium" className="bg-[#2d3029]">Moderate (35–59)</option>
              <option value="low" className="bg-[#2d3029]">Nominal Flow (0–34)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="sm:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-[#242720] border border-white/10 text-[#d5dbc9] text-xs py-2 px-3 rounded-full focus:outline-none focus:border-[#86efac]/50 cursor-pointer"
            >
              <option value="ALL" className="bg-[#2d3029]">All Lifecycle States</option>
              <option value="reported" className="bg-[#2d3029]">Reported</option>
              <option value="risk_assessed" className="bg-[#2d3029]">Assessed</option>
              <option value="assigned" className="bg-[#2d3029]">Assigned</option>
              <option value="inspected" className="bg-[#2d3029]">Inspected</option>
              <option value="repair_in_progress" className="bg-[#2d3029]">Restoration</option>
              <option value="resolved" className="bg-[#2d3029]">Resolved</option>
              <option value="verified" className="bg-[#2d3029]">Verified</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto flex-1">
        {filteredDrains.length === 0 ? (
          <EmptyState
            title="No matching waterways found"
            description="Adjust your search criteria or reset filters to display monitored waterways."
            actionText="Reset Filters"
            onAction={() => {
              setSearchQuery('');
              setRiskFilter('ALL');
              setStatusFilter('ALL');
            }}
          />
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-[#242720]/80 text-[#a4aca0] border-b border-white/10 text-[11px] font-mono uppercase tracking-wider select-none">
              <tr>
                <th className="py-3 px-4">Channel ID</th>
                <th className="py-3 px-4">Waterway / Ward</th>
                <th className="py-3 px-4 text-center">Score</th>
                <th className="py-3 px-4">Vulnerability</th>
                <th className="py-3 px-4">Sediment</th>
                <th className="py-3 px-4">Stewardship State</th>
                <th className="py-3 px-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredDrains.map((drain) => {
                const isSelected = selectedDrainId === drain.id;
                const score = drain.riskScore ?? drain.risk_assessment?.total_score ?? 0;
                const silt = drain.siltLevelPercent ?? drain.telemetry.silt_level_percent;
                const category = drain.riskCategory || drain.risk_assessment?.category || 'Low';

                return (
                  <tr
                    key={drain.id}
                    onClick={() => onSelectDrain(drain)}
                    className={`cursor-pointer transition-colors duration-150 ${
                      isSelected
                        ? 'bg-[#86efac]/10 border-l-2 border-[#86efac]'
                        : 'hover:bg-white/5 bg-transparent'
                    }`}
                  >
                    {/* Drain ID */}
                    <td className="py-3.5 px-4 font-mono font-medium text-white whitespace-nowrap">
                      {drain.id}
                    </td>

                    {/* Location */}
                    <td className="py-3.5 px-4">
                      <div className="font-normal text-white line-clamp-1">
                        {drain.name}
                      </div>
                      <div className="text-[11px] text-[#a4aca0] line-clamp-1 font-light">
                        {drain.location.landmark} &bull; <span className="text-[#86efac] font-mono">{drain.location.ward}</span>
                      </div>
                    </td>

                    {/* Score */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5 font-mono font-medium text-white">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            score >= 80
                              ? 'bg-rose-500 shadow-[0_0_6px_#f43f5e]'
                              : score >= 60
                              ? 'bg-amber-400'
                              : score >= 35
                              ? 'bg-[#86efac]'
                              : 'bg-emerald-400'
                          }`}
                        />
                        <span>{score}</span>
                      </div>
                    </td>

                    {/* Risk Badge */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <RiskBadge category={category} size="sm" />
                    </td>

                    {/* Silt Bar */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-[11px] text-[#d5dbc9] w-9 font-normal">
                          {silt}%
                        </span>
                        <div className="w-16 h-1.5 bg-[#1b1d19] rounded-full overflow-hidden border border-white/10">
                          <div
                            className={`h-full ${
                              silt >= 80
                                ? 'bg-rose-500'
                                : silt >= 60
                                ? 'bg-amber-400'
                                : silt >= 40
                                ? 'bg-[#86efac]'
                                : 'bg-emerald-400'
                            }`}
                            style={{ width: `${silt}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge status={drain.status} size="sm" />
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-3 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectDrain(drain);
                        }}
                        className="p-1 rounded-full text-[#a4aca0] hover:text-[#86efac] hover:bg-white/10 transition-colors cursor-pointer"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer Summary */}
      <div className="py-3 px-5 bg-[#242720]/80 border-t border-white/10 text-[11px] font-mono text-[#a4aca0] flex justify-between items-center">
        <span>Showing {filteredDrains.length} of {drains.length} Mumbai monitored waterways</span>
        <span className="text-[#86efac]">Catchment Ecological Priority Ledger</span>
      </div>
    </div>
  );
};
