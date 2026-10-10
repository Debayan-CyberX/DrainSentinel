import React, { useState, useMemo } from 'react';
import { Search, ArrowUpDown, ChevronRight } from 'lucide-react';
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

        // Search by ID, address, name, ward, landmark
        const matchesSearch =
          query === '' ||
          drain.id.toLowerCase().includes(query) ||
          drain.name.toLowerCase().includes(query) ||
          drain.location.address.toLowerCase().includes(query) ||
          drain.location.landmark.toLowerCase().includes(query) ||
          drain.location.ward.toLowerCase().includes(query);

        // Risk Category filter
        const matchesRisk =
          riskFilter === 'ALL' || category === riskFilter.toLowerCase();

        // Status filter
        const matchesStatus =
          statusFilter === 'ALL' || status === statusFilter.toLowerCase().replace(/\s+/g, '_');

        return matchesSearch && matchesRisk && matchesStatus;
      })
      .sort((a, b) => {
        const scoreA = a.riskScore ?? a.risk_assessment?.total_score ?? 0;
        const scoreB = b.riskScore ?? b.risk_assessment?.total_score ?? 0;
        if (sortBy === 'score') {
          return scoreB - scoreA; // Highest priority first
        }
        return a.id.localeCompare(b.id);
      });
  }, [drains, searchQuery, riskFilter, statusFilter, sortBy]);

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col">
      {/* Header & Filter Controls */}
      <div className="p-4 border-b border-slate-200/80 bg-slate-50/50 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
              Prioritised Mumbai Storm-Drain Inspection Queue
            </h2>
            <p className="text-xs text-slate-500">
              Ranked triage based on 5-factor deterministic risk engine (Silt %, Rainfall Sag, Exposure, Confidence, Freshness)
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onOpenReportModal && (
              <button
                onClick={onOpenReportModal}
                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors"
              >
                <span>+ Report Blockage</span>
              </button>
            )}

            <button
              onClick={() => setSortBy((prev) => (prev === 'score' ? 'id' : 'score'))}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <span>Sort: {sortBy === 'score' ? 'Risk Score (High-to-Low)' : 'Drain ID'}</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 pt-1">
          {/* Search Input */}
          <div className="sm:col-span-6 relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search drain ID, ward (e.g. F-North), street, or landmark..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 text-slate-800 text-xs pl-8 pr-3 py-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 placeholder-slate-400"
            />
          </div>

          {/* Risk Filter */}
          <div className="sm:col-span-3">
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="w-full bg-white border border-slate-200 text-slate-700 text-xs py-1.5 px-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="ALL">All Risk Tiers</option>
              <option value="critical">Critical (80–100)</option>
              <option value="high">High Risk (60–79)</option>
              <option value="medium">Medium (35–59)</option>
              <option value="low">Low Risk (0–34)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="sm:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-white border border-slate-200 text-slate-700 text-xs py-1.5 px-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="ALL">All Lifecycle States</option>
              <option value="reported">Reported</option>
              <option value="risk_assessed">Risk Assessed</option>
              <option value="assigned">Assigned</option>
              <option value="inspected">Inspected</option>
              <option value="repair_in_progress">Repair in Progress</option>
              <option value="resolved">Resolved</option>
              <option value="verified">Verified</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto flex-1">
        {filteredDrains.length === 0 ? (
          <EmptyState
            title="No matching storm-drain assets found"
            description="Adjust your search criteria or reset filters to display monitored assets."
            actionText="Reset Filters"
            onAction={() => {
              setSearchQuery('');
              setRiskFilter('ALL');
              setStatusFilter('ALL');
            }}
          />
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 border-b border-slate-200 text-[11px] uppercase tracking-wider select-none font-medium">
              <tr>
                <th className="py-2.5 px-4">Drain ID</th>
                <th className="py-2.5 px-4">Location / BMC Ward</th>
                <th className="py-2.5 px-4 text-center">Triage Score</th>
                <th className="py-2.5 px-4">Risk Category</th>
                <th className="py-2.5 px-4">Silt Buildup</th>
                <th className="py-2.5 px-4">Inspection State</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDrains.map((drain) => {
                const isSelected = selectedDrainId === drain.id;
                const score = drain.riskScore ?? drain.risk_assessment?.total_score ?? 0;
                const silt = drain.siltLevelPercent ?? drain.telemetry.silt_level_percent;
                const category = drain.riskCategory || drain.risk_assessment?.category || 'Low';

                return (
                  <tr
                    key={drain.id}
                    onClick={() => onSelectDrain(drain)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-teal-50/70'
                        : 'hover:bg-slate-50/80 bg-white'
                    }`}
                  >
                    {/* Drain ID */}
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {drain.id}
                    </td>

                    {/* Location */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800 line-clamp-1">
                        {drain.name}
                      </div>
                      <div className="text-[11px] text-slate-500 line-clamp-1">
                        {drain.location.landmark} &bull; <strong className="text-teal-800 font-semibold">{drain.location.ward}</strong>
                      </div>
                    </td>

                    {/* Score */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5 font-mono font-bold text-slate-800">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            score >= 80
                              ? 'bg-rose-500'
                              : score >= 60
                              ? 'bg-orange-500'
                              : score >= 35
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                        />
                        <span>{score}</span>
                      </div>
                    </td>

                    {/* Risk Badge */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <RiskBadge category={category} size="sm" />
                    </td>

                    {/* Silt Bar */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-slate-700 w-9">
                          {silt}%
                        </span>
                        <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              silt >= 80
                                ? 'bg-rose-500'
                                : silt >= 60
                                ? 'bg-orange-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${silt}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <StatusBadge status={drain.status} size="sm" />
                    </td>

                    {/* Action */}
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectDrain(drain);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
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
      <div className="py-2.5 px-4 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex justify-between items-center">
        <span>Showing {filteredDrains.length} of {drains.length} Mumbai monitored drains</span>
        <span className="font-mono">BMC Stormwater Priority Matrix</span>
      </div>
    </div>
  );
};
