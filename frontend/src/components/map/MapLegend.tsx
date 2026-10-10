import React from 'react';

export const MapLegend: React.FC = () => {
  const items = [
    { label: 'Low (<40%)', color: 'bg-emerald-400', desc: 'Clear flow' },
    { label: 'Moderate (40-69%)', color: 'bg-cyan-400', desc: 'Watch list' },
    { label: 'High (70-84%)', color: 'bg-amber-400', desc: 'Debris inflow' },
    { label: 'Critical (≥85%)', color: 'bg-rose-500', desc: 'Surcharge risk', glow: 'shadow-[0_0_8px_#f43f5e]' },
  ];

  return (
    <div className="bg-[#0b1c2b]/95 backdrop-blur-xl border border-sky-500/20 rounded-xl p-3 shadow-2xl text-xs">
      <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-2 font-semibold">
        Acoustic Silt Risk Legend
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${item.color} ${item.glow || ''} flex-shrink-0`} />
            <span className="text-slate-200 text-[11px] font-mono">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
