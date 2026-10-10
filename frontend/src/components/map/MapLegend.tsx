import React from 'react';

export const MapLegend: React.FC = () => {
  const items = [
    { label: 'Low (<40%)', color: 'bg-emerald-500', desc: 'Clear flow' },
    { label: 'Moderate (40-69%)', color: 'bg-amber-500', desc: 'Watch list' },
    { label: 'High (70-84%)', color: 'bg-orange-500', desc: 'Debris inflow' },
    { label: 'Critical (≥85%)', color: 'bg-rose-600', desc: 'Surcharge risk' },
  ];

  return (
    <div className="bg-white/95 backdrop-blur-sm border border-slate-200/90 rounded-lg p-2.5 shadow-sm text-xs">
      <div className="font-semibold text-slate-700 text-[11px] mb-1.5 uppercase tracking-wide">
        Risk Category
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${item.color} flex-shrink-0`} />
            <span className="text-slate-600 text-[11px] font-medium">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
