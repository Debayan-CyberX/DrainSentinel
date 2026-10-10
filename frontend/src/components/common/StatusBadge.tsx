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

  const config: Record<
    string,
    { label: string; bg: string; text: string; border: string }
  > = {
    reported: {
      label: 'Reported',
      bg: 'bg-rose-500/15',
      text: 'text-rose-300',
      border: 'border-rose-500/30',
    },
    risk_assessed: {
      label: 'Risk Assessed',
      bg: 'bg-amber-500/15',
      text: 'text-amber-300',
      border: 'border-amber-500/30',
    },
    assigned: {
      label: 'Assigned',
      bg: 'bg-sky-500/15',
      text: 'text-sky-300',
      border: 'border-sky-500/30',
    },
    inspected: {
      label: 'Inspected',
      bg: 'bg-cyan-500/15',
      text: 'text-cyan-300',
      border: 'border-cyan-500/30',
    },
    repair_in_progress: {
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
