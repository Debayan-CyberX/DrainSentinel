import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
}) => {
  const norm = (status || 'operational').toLowerCase().replace(/\s+/g, '_');

  // Understated, professional status indicators for "Reported", "Assigned", and "Inspected"
  if (norm === 'reported') {
    const textSize = size === 'sm' ? 'text-[11px]' : 'text-xs';
    return (
      <span className={`inline-flex items-center gap-1.5 font-normal text-amber-300/90 ${textSize}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
        <span>Reported</span>
      </span>
    );
  }

  if (norm === 'assigned') {
    const textSize = size === 'sm' ? 'text-[11px]' : 'text-xs';
    return (
      <span className={`inline-flex items-center gap-1.5 font-normal text-sky-300/90 ${textSize}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-sky-400/80 flex-shrink-0" />
        <span>Assigned</span>
      </span>
    );
  }

  if (norm === 'inspected') {
    const textSize = size === 'sm' ? 'text-[11px]' : 'text-xs';
    return (
      <span className={`inline-flex items-center gap-1.5 font-normal text-teal-300/90 ${textSize}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-teal-400/80 flex-shrink-0" />
        <span>Inspected</span>
      </span>
    );
  }

  const config: Record<
    string,
    { label: string; bg: string; text: string; border: string }
  > = {
    risk_assessed: {
      label: 'Repairing',
      bg: 'bg-amber-500/15',
      text: 'text-amber-300',
      border: 'border-amber-500/30',
    },
    in_progress: {
      label: 'In Progress',
      bg: 'bg-amber-500/15',
      text: 'text-amber-300',
      border: 'border-amber-500/30',
    },
    resolved: {
      label: 'Resolved',
      bg: 'bg-teal-500/15',
      text: 'text-teal-300',
      border: 'border-teal-500/30',
    },
    verified: {
      label: 'Verified',
      bg: 'bg-emerald-500/15',
      text: 'text-emerald-300',
      border: 'border-emerald-500/30',
    },
    operational: {
      label: 'Clear Flow',
      bg: 'bg-slate-800/80',
      text: 'text-slate-300',
      border: 'border-slate-700/80',
    },
  };

  const current = config[norm] || {
    label: status,
    bg: 'bg-slate-800/80',
    text: 'text-slate-300',
    border: 'border-slate-700/80',
  };

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${current.bg} ${current.text} ${current.border} ${sizeClasses}`}
    >
      {current.label}
    </span>
  );
};
