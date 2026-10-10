import React from 'react';
import { ActivityLog } from '../../types';
import {
  Clock,
  Send,
  FileText,
  RefreshCw,
  CheckCircle,
  FileCheck,
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
        return <Send className="w-3.5 h-3.5 text-blue-600" />;
      case 'report_filed':
        return <FileText className="w-3.5 h-3.5 text-amber-600" />;
      case 'status_updated':
        return <RefreshCw className="w-3.5 h-3.5 text-indigo-600" />;
      case 'verification_pending':
        return <FileCheck className="w-3.5 h-3.5 text-purple-600" />;
      case 'resolved':
        return <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-sm p-5 flex flex-col">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
        <div>
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">
            Recent System Activity
          </h2>
          <p className="text-xs text-slate-500">
            Field dispatches, 311 citizen reports & clearance updates
          </p>
        </div>
        <Clock className="w-4 h-4 text-slate-400" />
      </div>

      <div className="space-y-3.5 flex-1 overflow-y-auto max-h-[380px] pr-1">
        {activities.map((item) => (
          <div
            key={item.id}
            className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100"
          >
            <div className="p-1.5 rounded-md bg-slate-100 flex-shrink-0 mt-0.5">
              {getIcon(item.type)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-mono font-semibold text-slate-500">
                  {item.timestamp}
                </span>
                {item.drainId && onSelectDrainId && (
                  <button
                    onClick={() => onSelectDrainId(item.drainId)}
                    className="text-[11px] font-mono font-semibold text-teal-700 hover:text-teal-900 hover:underline"
                  >
                    {item.drainId}
                  </button>
                )}
              </div>

              <p className="text-xs text-slate-800 font-medium leading-snug mt-0.5">
                {item.message}
              </p>

              <div className="text-[10px] text-slate-400 mt-1">
                By <span className="text-slate-600 font-medium">{item.actor}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
