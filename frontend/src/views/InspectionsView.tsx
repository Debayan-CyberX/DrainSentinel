import React, { useState, useMemo } from 'react';
import { Drain, InspectionTask } from '../types';
import { RiskBadge } from '../components/common/RiskBadge';
import { StatusBadge } from '../components/common/StatusBadge';
import { EmptyState } from '../components/common/EmptyState';
import { Search, UserCheck } from 'lucide-react';

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
    <div className="space-y-5">
      {/* Page Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-base font-bold text-slate-900 tracking-tight">
            BMC Stormwater Work Order & Inspection Queue
          </h1>
          <p className="text-xs text-slate-500">
            Triage lifecycle: Reported &rarr; Risk Assessed &rarr; Assigned &rarr; Inspected &rarr; Repair in Progress &rarr; Resolved &rarr; Verified
          </p>
        </div>

        {/* Search */}
        <div className="relative min-w-[260px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search task ID, drain, or crew..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-xs pl-8 pr-3 py-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 placeholder-slate-400"
          />
        </div>
      </div>

      {/* Workflow Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        {[
          { id: 'ALL', label: 'All Tasks', count: counts.all },
          { id: 'Reported', label: 'Reported', count: counts.reported },
          { id: 'Risk Assessed', label: 'Risk Assessed', count: counts.risk_assessed },
          { id: 'Assigned', label: 'Assigned', count: counts.assigned },
          { id: 'Inspected', label: 'Inspected', count: counts.inspected },
          { id: 'Repair in Progress', label: 'In Repair', count: counts.repair },
          { id: 'Resolved', label: 'Resolved', count: counts.resolved },
          { id: 'Verified', label: 'Verified', count: counts.verified },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 ${
              activeTab === tab.id
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeTab === tab.id
                  ? 'bg-slate-800 text-teal-300'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Tasks Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {filteredTasks.length === 0 ? (
          <EmptyState
            title="No tasks in this lifecycle state"
            description="All work orders in this phase have progressed through the workflow."
            actionText="View All Tasks"
            onAction={() => setActiveTab('ALL')}
          />
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 border-b border-slate-200 text-[11px] uppercase tracking-wider font-medium select-none">
              <tr>
                <th className="py-2.5 px-4">Task ID</th>
                <th className="py-2.5 px-4">Drain ID & Asset</th>
                <th className="py-2.5 px-4">Priority & Score</th>
                <th className="py-2.5 px-4">Issue Description</th>
                <th className="py-2.5 px-4">Assigned Crew</th>
                <th className="py-2.5 px-4">Workflow Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTasks.map((task) => {
                const linkedDrain = drains.find((d) => d.id === task.drain_id);
                return (
                  <tr
                    key={task.id}
                    onClick={() => {
                      if (linkedDrain) onSelectDrain(linkedDrain);
                    }}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {task.id}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800 font-mono">
                        {task.drain_id}
                      </div>
                      <div className="text-[11px] text-slate-500 line-clamp-1">
                        {task.title}
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <RiskBadge category={task.risk_category} score={task.risk_score} size="sm" />
                        <span className="text-[11px] font-mono text-slate-500">
                          {task.priority}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 max-w-xs text-slate-600">
                      <span className="line-clamp-1">{task.issue_description}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {task.assigned_crew && task.assigned_crew !== 'Unassigned' ? (
                        <span className="inline-flex items-center gap-1.5 font-medium text-slate-800">
                          <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                          <span>{task.assigned_crew}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={task.status} size="sm" />
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (linkedDrain) onSelectDrain(linkedDrain);
                        }}
                        className="px-2.5 py-1 text-[11px] font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-md transition-colors"
                      >
                        Inspect & Transition
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
