import React, { useState } from 'react';
import { CitizenReport, Drain } from '../types';
import { EmptyState } from '../components/common/EmptyState';
import { ExternalLink, AlertTriangle, Info, Camera } from 'lucide-react';

interface ReportsViewProps {
  reports: CitizenReport[];
  drains: Drain[];
  onSelectDrain: (drain: Drain) => void;
  onOpenReportModal: () => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  reports,
  drains,
  onSelectDrain,
  onOpenReportModal,
}) => {
  const [filter, setFilter] = useState<string>('ALL');

  const filteredReports = reports.filter((r) => {
    if (filter === 'ALL') return true;
    if (filter === 'duplicates') return r.is_duplicate;
    return r.status === filter;
  });

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-base font-bold text-slate-900 tracking-tight">
            Mumbai Citizen 311 & Field Blockage Reports
          </h1>
          <p className="text-xs text-slate-500">
            Citizen submissions tagged as unverified until audited. Corroborating duplicate reports auto-flagged to enhance risk confidence.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* File Report CTA */}
          <button
            onClick={onOpenReportModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>+ Report Blockage</span>
          </button>

          {/* Filter buttons */}
          <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
            {['ALL', 'unverified', 'triaged', 'duplicates'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors capitalize ${
                  filter === f
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {f === 'ALL' ? 'All' : f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredReports.length === 0 ? (
          <div className="md:col-span-2">
            <EmptyState
              title="No reports match this criteria"
              description="All incoming citizen reports have been reviewed or no duplicates recorded."
              actionText="Show All Reports"
              onAction={() => setFilter('ALL')}
            />
          </div>
        ) : (
          filteredReports.map((report) => {
            const linkedDrain = drains.find((d) => d.id === report.drain_id);

            return (
              <div
                key={report.id}
                className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-slate-900">
                        {report.id}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {report.issue_type}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {report.is_duplicate && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                          <Info className="w-3 h-3" />
                          <span>Duplicate</span>
                        </span>
                      )}

                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                          report.severity === 'critical'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : report.severity === 'high'
                            ? 'bg-orange-50 text-orange-700 border border-orange-200'
                            : report.severity === 'medium'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {report.severity}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-xs font-bold text-slate-800 mb-0.5">
                    {report.location.address}
                  </h3>
                  {report.location.ward && (
                    <div className="text-[11px] text-teal-800 font-semibold mb-2">
                      {report.location.ward}
                    </div>
                  )}

                  <p className="text-xs text-slate-600 leading-relaxed mb-3">
                    &ldquo;{report.description}&rdquo;
                  </p>

                  {report.photo_url && (
                    <div className="mb-3 p-2 bg-slate-50 rounded-lg border border-slate-100 flex items-center gap-2 text-[11px] text-slate-600">
                      <Camera className="w-3.5 h-3.5 text-teal-600" />
                      <span>Photo Proof Attached:</span>
                      <a
                        href={report.photo_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-teal-700 hover:underline truncate max-w-[200px]"
                      >
                        {report.photo_url}
                      </a>
                    </div>
                  )}

                  <div className="text-[11px] text-slate-400 flex items-center justify-between pb-3 border-b border-slate-100">
                    <span>Submitted: {new Date(report.created_at).toLocaleDateString()}</span>
                    <span className="text-slate-600 font-medium">{report.reporter_name}</span>
                  </div>
                </div>

                <div className="mt-4 pt-1 flex items-center justify-between">
                  {linkedDrain ? (
                    <button
                      onClick={() => onSelectDrain(linkedDrain)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:text-teal-900"
                    >
                      <span>Inspect {report.drain_id}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">No linked asset</span>
                  )}

                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded border capitalize ${
                        report.status === 'unverified'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : report.status === 'triaged'
                          ? 'bg-teal-50 text-teal-800 border-teal-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {report.status}
                    </span>
                    {report.linked_task_id && (
                      <span className="text-[10px] font-mono text-teal-700 bg-teal-50/60 px-1.5 py-0.5 rounded border border-teal-200">
                        {report.linked_task_id}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
