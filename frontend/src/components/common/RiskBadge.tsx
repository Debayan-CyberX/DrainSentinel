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
    { label: string; bg: string; text: string; border: string; dot: string }
  > = {
    low: {
      label: 'Low Risk',
      bg: 'bg-emerald-50',
      text: 'text-emerald-800',
      border: 'border-emerald-200',
      dot: 'bg-emerald-500',
    },
    medium: {
      label: 'Medium',
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-200',
      dot: 'bg-amber-500',
    },
    moderate: {
      label: 'Moderate',
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-200',
      dot: 'bg-amber-500',
    },
    high: {
      label: 'High Risk',
      bg: 'bg-orange-50',
      text: 'text-orange-800',
      border: 'border-orange-200',
      dot: 'bg-orange-500',
    },
    critical: {
      label: 'Critical',
      bg: 'bg-rose-50',
      text: 'text-rose-800',
      border: 'border-rose-200',
      dot: 'bg-rose-600',
    },
  };

  const current = config[norm] || config.low;
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-md border ${current.bg} ${current.text} ${current.border} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`} />
      <span>{current.label}</span>
      {score !== undefined && (
        <span className="font-mono font-semibold ml-0.5 opacity-90">
          ({score})
        </span>
      )}
    </span>
  );
};
