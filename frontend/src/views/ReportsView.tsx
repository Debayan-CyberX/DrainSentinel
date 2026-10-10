import React, { useState } from 'react';
import { CitizenReport, Drain } from '../types';
import { EmptyState } from '../components/common/EmptyState';
import { ExternalLink, AlertTriangle, Info, Camera, CheckCircle2, ShieldCheck, Waves } from 'lucide-react';

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
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="nature-card p-5 rounded-2xl border border-white/10 shadow-[0_20px_50px_rgba(16,22,17,0.6)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#86efac] shadow-[0_0_8px_#86efac]" />
            <span className="text-[11px] font-mono tracking-wider uppercase text-[#86efac] font-medium">
              Community Ground Notes
            </span>
          </div>
          <h1 className="text-base font-medium text-white tracking-wide">
            Community Observations & Ground Notes
          </h1>
          <p className="text-xs text-[#a4aca0] font-light mt-0.5">
            Residents and ward stewards sharing what they see along Mumbai's roadside watercourses
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* File Report CTA */}
          <button
            onClick={onOpenReportModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 pill-button rounded-full text-xs font-medium cursor-pointer"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-[#23261f]" />
            <span>+ Share Observation</span>
          </button>

          {/* Filter buttons */}
          <div className="flex items-center gap-1 border-l border-white/10 pl-3">
            {[
              { id: 'ALL', label: 'All Notes' },
              { id: 'unverified', label: 'Pending Review' },
              { id: 'triaged', label: 'Audited' },
              { id: 'duplicates', label: 'Corroborated' },
            ].map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setFilter(id)}
                className={`px-3 py-1.5 text-xs font-mono rounded-full border transition-all cursor-pointer ${
                  filter === id
                    ? 'bg-[#eef3e7] text-[#23261f] border-white font-medium shadow-[0_2px_10px_rgba(238,243,231,0.25)]'
                    : 'bg-white/5 text-[#d5dbc9] border-white/10 hover:border-[#86efac]/30'
                }`}
              >
                {label}
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
              title="No observations in this category"
              description="No citizen observations or ground notes match your current filter."
              actionText="Show All Observations"
              onAction={() => setFilter('ALL')}
            />
          </div>
        ) : (
          filteredReports.map((report) => {
            const linkedDrain = drains.find((d) => d.id === report.drain_id);

            return (
              <div
                key={report.id}
                className="nature-card p-5 rounded-2xl border border-white/10 hover:border-[#86efac]/35 shadow-[0_15px_40px_rgba(16,22,17,0.5)] flex flex-col justify-between transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-medium text-[11px] text-[#86efac] tracking-wide uppercase">
                        Observation &bull; {report.id}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-wider bg-white/5 text-[#d5dbc9] border border-white/10">
                        {report.issue_type}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {report.is_duplicate && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          {report.duplicate_of ? `Corroborates ${report.duplicate_of}` : 'Corroborating Note'}
                        </span>
                      )}
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium uppercase ${
                          report.status === 'unverified'
                            ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                            : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {report.status === 'unverified' ? 'Under Review' : 'Verified Note'}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-[#eef3e7] font-light leading-relaxed mt-2.5">
                    "{report.description}"
                  </p>

                  <div className="mt-3 p-3 rounded-xl bg-[#242720]/80 border border-white/10 text-xs font-mono space-y-1.5">
                    <div className="text-[#a4aca0]">
                      Location: <span className="text-[#eef3e7]">{report.location.address}</span>
                    </div>
                    {linkedDrain && (
                      <div className="flex items-center gap-1.5 text-[#a4aca0]">
                        <span>Nearest Channel:</span>
                        <button
                          onClick={() => onSelectDrain(linkedDrain)}
                          className="text-[#86efac] hover:underline font-medium"
                        >
                          {linkedDrain.name} ({linkedDrain.id})
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Photo Portal Thumbnail */}
                  {report.photo_url && (
                    <div className="mt-3">
                      <div className="aspect-video w-full rounded-xl overflow-hidden border border-white/10 bg-[#242720] relative group">
                        <img
                          src={report.photo_url}
                          alt="Citizen evidence photo"
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-sm text-[10px] font-mono text-white flex items-center gap-1.5">
                          <Camera className="w-3.5 h-3.5 text-[#86efac]" />
                          <span>Field Evidence</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-mono text-[#7c8177]">
                  <span>Shared by {report.reporter_name}</span>
                  <span>{new Date(report.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
