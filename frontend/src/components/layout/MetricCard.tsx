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
    neutral: 'bg-white/5 text-[#d5dbc9] border-white/10',
    danger: 'bg-rose-500/15 text-rose-300 border-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.15)]',
    warning: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    success: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 shadow-[0_0_10px_rgba(74,222,128,0.15)]',
  };

  return (
    <div
      onClick={onClick}
      className={`relative p-5 rounded-2xl nature-card transition-all duration-300 group ${
        onClick ? 'cursor-pointer' : ''
      } ${
        active
          ? 'border-[#86efac] shadow-[0_0_24px_rgba(134,239,172,0.25)]'
          : 'hover:border-[#86efac]/40 hover:-translate-y-0.5'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-normal tracking-wide text-[#a4aca0] uppercase">
          {title}
        </span>
        <div className="p-2 rounded-xl bg-[#2d3029] border border-white/10 text-[#86efac] group-hover:border-[#86efac]/50 group-hover:text-white transition-colors">
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="mt-4 flex items-baseline gap-3">
        <span className="text-3xl font-light tracking-tight text-white font-mono tabular-nums">
          {value}
        </span>
        {badge && (
          <span
            className={`text-[10px] font-mono tracking-wider uppercase px-2 py-0.5 rounded-full border ${
              badgeClasses[badgeVariant]
            }`}
          >
            {badge}
          </span>
        )}
      </div>

      <p className="mt-2 text-xs text-[#a4aca0] font-light leading-relaxed">
        {subtitle}
      </p>
    </div>
  );
};
