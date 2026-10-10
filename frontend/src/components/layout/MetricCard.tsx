import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: number | string;
  subtitle: string;
  icon: LucideIcon;
  badge?: string;
  badgeVariant?: 'neutral' | 'danger' | 'warning' | 'success';
  onClick?: () => void;
  active?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  badge,
  badgeVariant = 'neutral',
  onClick,
  active = false,
}) => {
  const badgeClasses: Record<string, string> = {
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  };

  return (
    <div
      onClick={onClick}
      className={`p-5 rounded-xl border bg-white transition-all shadow-sm ${
        onClick ? 'cursor-pointer hover:border-slate-300' : ''
      } ${
        active
          ? 'border-teal-600 ring-2 ring-teal-600/10'
          : 'border-slate-200/90'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
          {title}
        </span>
        <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-slate-600">
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="mt-3 flex items-baseline gap-2.5">
        <span className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
          {value}
        </span>
        {badge && (
          <span
            className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${
              badgeClasses[badgeVariant]
            }`}
          >
            {badge}
          </span>
        )}
      </div>

      <p className="mt-2 text-xs text-slate-500 line-clamp-1">{subtitle}</p>
    </div>
  );
};
