import React from 'react';
import { RiskCategory } from '../../types';

interface RiskBadgeProps {
  category: RiskCategory | string;
  score?: number;
  size?: 'sm' | 'md';
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  category,
  score,
  size = 'md',
}) => {
  const norm = (category || 'low').toString().toLowerCase();

  const config: Record<
    string,
    { label: string; bg: string; text: string; border: string; dot: string; shadow?: string }
  > = {
    low: {
      label: 'Low Risk',
      bg: 'bg-emerald-500/15',
      text: 'text-emerald-300',
      border: 'border-emerald-500/30',
      dot: 'bg-emerald-400',
    },
    medium: {
      label: 'Moderate',
      bg: 'bg-cyan-500/15',
      text: 'text-cyan-300',
      border: 'border-cyan-500/30',
      dot: 'bg-cyan-400',
    },
    moderate: {
      label: 'Moderate',
      bg: 'bg-cyan-500/15',
      text: 'text-cyan-300',
      border: 'border-cyan-500/30',
      dot: 'bg-cyan-400',
    },
    high: {
      label: 'High Risk',
      bg: 'bg-amber-500/15',
      text: 'text-amber-300',
      border: 'border-amber-500/35',
      dot: 'bg-amber-400',
    },
    critical: {
      label: 'Critical',
      bg: 'bg-rose-500/15',
      text: 'text-rose-300',
      border: 'border-rose-500/40',
      dot: 'bg-rose-400',
      shadow: 'shadow-[0_0_12px_rgba(244,63,94,0.25)]',
    },
  };

  const current = config[norm] || config.low;
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${current.bg} ${current.text} ${current.border} ${current.shadow || ''} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`} />
      <span>{current.label}</span>
      {score !== undefined && (
        <span className="font-mono font-bold ml-0.5 opacity-90">
          [{score}]
        </span>
      )}
    </span>
  );
};
