import React, { useState, useMemo } from 'react';
import { Drain, InspectionTask } from '../types';
import { RiskBadge } from '../components/common/RiskBadge';
import { StatusBadge } from '../components/common/StatusBadge';
import { EmptyState } from '../components/common/EmptyState';
import { Search, UserCheck, Clock, ArrowRight, ShieldAlert, Waves } from 'lucide-react';

interface InspectionsViewProps {
  tasks: InspectionTask[];
  drains: Drain[];
  onSelectDrain: (drain: Drain) => void;
}

export const InspectionsView: React.FC<InspectionsViewProps> = ({
  tasks,
  drains,
  onSelectDrain,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<string>('ALL');

  const counts = useMemo(() => {
    return {
      all: tasks.length,
      reported: tasks.filter((t) => t.status === 'Reported').length,
      risk_assessed: tasks.filter((t) => t.status === 'Risk Assessed').length,
      assigned: tasks.filter((t) => t.status === 'Assigned').length,
      inspected: tasks.filter((t) => t.status === 'Inspected').length,
      repair: tasks.filter((t) => t.status === 'Repair in Progress').length,
      resolved: tasks.filter((t) => t.status === 'Resolved').length,
      verified: tasks.filter((t) => t.status === 'Verified').length,
    };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        q === '' ||
        t.id.toLowerCase().includes(q) ||
        t.drain_id.toLowerCase().includes(q) ||
        t.title.toLowerCase().includes(q) ||
        t.issue_description.toLowerCase().includes(q) ||
        (t.assigned_crew && t.assigned_crew.toLowerCase().includes(q));

      let matchesTab = true;
      if (activeTab === 'Reported') matchesTab = t.status === 'Reported';
      else if (activeTab === 'Risk Assessed') matchesTab = t.status === 'Risk Assessed';
      else if (activeTab === 'Assigned') matchesTab = t.status === 'Assigned';
      else if (activeTab === 'Inspected') matchesTab = t.status === 'Inspected';
      else if (activeTab === 'Repair in Progress') matchesTab = t.status === 'Repair in Progress';
      else if (activeTab === 'Resolved') matchesTab = t.status === 'Resolved';
      else if (activeTab === 'Verified') matchesTab = t.status === 'Verified';

      return matchesSearch && matchesTab;
    });
  }, [tasks, searchQuery, activeTab]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="nature-card p-5 rounded-2xl border border-white/10 shadow-[0_20px_50px_rgba(16,22,17,0.6)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#86efac] shadow-[0_0_8px_#86efac]" />
            <span className="text-[11px] font-mono tracking-wider uppercase text-[#86efac] font-medium">
              Field Stewardship & Care Orders
            </span>
          </div>
          <h1 className="text-base font-medium text-white tracking-wide">
            Catchment Stewardship & Field Dispatches
          </h1>
          <p className="text-xs text-[#a4aca0] font-light mt-0.5">
            Tending to the culverts, channels, and bio-swales across Mumbai wards before the monsoon breaks
          </p>
        </div>

        {/* Search */}
        <div className="relative min-w-[280px]">
          <Search className="w-3.5 h-3.5 text-[#a4aca0] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by care order, channel, or crew..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#242720] border border-white/10 text-[#eef3e7] text-xs pl-8 pr-3 py-2 rounded-full focus:outline-none focus:border-[#86efac]/50 placeholder-[#7c8177] font-light"
          />
        </div>
      </div>

      {/* Workflow Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-3">
        {[
          { id: 'ALL', label: 'All Dispatches', count: counts.all },
          { id: 'Reported', label: 'Reported', count: counts.reported },
          { id: 'Risk Assessed', label: 'Assessed', count: counts.risk_assessed },
          { id: 'Assigned', label: 'Assigned', count: counts.assigned },
          { id: 'Inspected', label: 'Inspected', count: counts.inspected },
          { id: 'Repair in Progress', label: 'Restoration', count: counts.repair },
          { id: 'Resolved', label: 'Resolved', count: counts.resolved },
          { id: 'Verified', label: 'Verified', count: counts.verified },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3.5 py-1.5 text-xs font-mono rounded-full transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === tab.id
                ? 'bg-[#eef3e7] text-[#23261f] border border-white font-medium shadow-[0_2px_10px_rgba(238,243,231,0.25)]'
                : 'bg-white/5 text-[#d5dbc9] border border-white/10 hover:border-[#86efac]/30'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                activeTab === tab.id
                  ? 'bg-[#23261f] text-[#eef3e7]'
                  : 'bg-white/10 text-[#a4aca0]'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Tasks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTasks.length === 0 ? (
          <div className="col-span-full">
            <EmptyState
              title="No field dispatches in this stage"
              description="All watercourses in this category are currently flowing free or have not yet required maintenance."
              actionText="View All Dispatches"
              onAction={() => setActiveTab('ALL')}
            />
          </div>
        ) : (
          filteredTasks.map((task) => {
            const drain = drains.find((d) => d.id === task.drain_id);
            const isHighPriority = task.priority.includes('Critical') || task.priority.includes('P1');

            return (
              <div
                key={task.id}
                className="nature-card p-5 rounded-2xl border border-white/10 hover:border-[#86efac]/35 shadow-[0_15px_40px_rgba(16,22,17,0.5)] flex flex-col justify-between transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[11px] font-medium text-[#86efac] tracking-wide uppercase">
                      Care Order &bull; {task.id}
                    </span>
                    <StatusBadge status={task.status} size="sm" />
                  </div>

                  <h3 className="text-sm font-medium text-white leading-snug line-clamp-1 group-hover:text-[#86efac] transition-colors">
                    {task.title}
                  </h3>

                  <p className="text-xs text-[#a4aca0] font-light mt-1.5 line-clamp-2 leading-relaxed">
                    {task.issue_description}
                  </p>

                  <div className="mt-3.5 pt-3 border-t border-white/10 space-y-2 text-xs font-mono">
                    <div className="flex items-center justify-between text-[#d5dbc9]">
                      <span className="text-[#a4aca0]">Watercourse:</span>
                      <button
                        onClick={() => drain && onSelectDrain(drain)}
                        className="text-[#86efac] hover:underline font-medium truncate max-w-[180px] text-right"
                      >
                        {drain ? drain.name : task.drain_id}
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-[#a4aca0]">
                      <span>Urgency:</span>
                      <span
                        className={`font-medium ${
                          isHighPriority ? 'text-rose-400' : 'text-amber-400'
                        }`}
                      >
                        {task.priority}
                      </span>
                    </div>

                    {task.assigned_crew && (
                      <div className="flex items-center justify-between text-[#a4aca0]">
                        <span>Assigned Crew:</span>
                        <span className="text-[#eef3e7] truncate max-w-[160px]">
                          {task.assigned_crew}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-[#7c8177]">
                    {task.created_at ? new Date(task.created_at).toLocaleDateString() : 'Active'}
                  </span>

                  {drain && (
                    <button
                      onClick={() => onSelectDrain(drain)}
                      className="text-xs font-medium text-[#86efac] hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <span>Open Waterway Details</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
