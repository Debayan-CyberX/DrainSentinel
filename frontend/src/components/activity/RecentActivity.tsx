import React from 'react';
import { ActivityLog } from '../../types';
import {
  Clock,
  Send,
  FileText,
  RefreshCw,
  CheckCircle,
  FileCheck,
  Activity,
} from 'lucide-react';

interface RecentActivityProps {
  activities: ActivityLog[];
  onSelectDrainId?: (drainId: string) => void;
}

export const RecentActivity: React.FC<RecentActivityProps> = ({
  activities,
  onSelectDrainId,
}) => {
  const getIcon = (type: ActivityLog['type']) => {
    switch (type) {
      case 'inspection_dispatched':
        return <Send className="w-3.5 h-3.5 text-[#86efac]" />;
      case 'report_filed':
        return <FileText className="w-3.5 h-3.5 text-amber-400" />;
      case 'status_updated':
        return <RefreshCw className="w-3.5 h-3.5 text-[#4ade80]" />;
      case 'verification_pending':
        return <FileCheck className="w-3.5 h-3.5 text-purple-400" />;
      case 'resolved':
        return <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />;
    }
  };

  return (
    <div className="nature-card rounded-2xl border border-white/10 shadow-[0_20px_50px_rgba(16,22,17,0.6)] p-5 flex flex-col h-full">
      <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#86efac] shadow-[0_0_8px_#86efac]" />
            <span className="text-[11px] font-mono tracking-wider uppercase text-[#86efac] font-medium">
              Live Ground Log
            </span>
          </div>
          <h2 className="text-sm font-medium text-white tracking-wide">
            Recent Stewardship Activity
          </h2>
          <p className="text-xs text-[#a4aca0] font-light mt-0.5">
            Field dispatches, community observations & clearance updates
          </p>
        </div>
        <Clock className="w-4 h-4 text-[#a4aca0]" />
      </div>

      <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[380px] pr-1">
        {activities.map((item) => (
          <div
            key={item.id}
            className="p-3 rounded-xl bg-[#242720]/80 border border-white/10 hover:border-[#86efac]/30 transition-all text-xs"
          >
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2">
                {getIcon(item.type)}
                <span className="font-mono text-[11px] font-medium text-white">
                  {item.actor}
                </span>
              </div>
              <span className="text-[10px] font-mono text-[#7c8177]">
                {item.timestamp}
              </span>
            </div>

            <p className="text-slate-200 text-xs mt-1 font-light leading-relaxed">
              {item.message}
            </p>

            {item.drainId && onSelectDrainId && (
              <div className="mt-2 pt-2 border-t border-white/5 flex justify-end">
                <button
                  onClick={() => onSelectDrainId(item.drainId)}
                  className="text-[11px] font-mono text-[#86efac] hover:underline"
                >
                  View {item.drainId} &rarr;
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
