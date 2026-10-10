import React, { useMemo } from 'react';
import { Drain } from '../types';

interface AnalyticsViewProps {
  drains: Drain[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ drains }) => {
  const stats = useMemo(() => {
    const total = drains.length;
    const critical = drains.filter((d) => {
      const cat = (d.riskCategory || d.risk_assessment?.category || '').toString().toLowerCase();
      return cat === 'critical';
    }).length;

    const high = drains.filter((d) => {
      const cat = (d.riskCategory || d.risk_assessment?.category || '').toString().toLowerCase();
      return cat === 'high';
    }).length;

    const medium = drains.filter((d) => {
      const cat = (d.riskCategory || d.risk_assessment?.category || '').toString().toLowerCase();
      return cat === 'medium' || cat === 'moderate';
    }).length;

    const low = drains.filter((d) => {
      const cat = (d.riskCategory || d.risk_assessment?.category || '').toString().toLowerCase();
      return cat === 'low';
    }).length;

    const avgSilt = Math.round(
      drains.reduce((acc, d) => acc + (d.siltLevelPercent ?? d.telemetry.silt_level_percent), 0) /
        (total || 1)
    );

    // Group by BMC Ward
    const byWard: Record<string, { count: number; highRisk: number; avgSilt: number }> = {};
    drains.forEach((d) => {
      const ward = d.location.ward || 'Other';
      if (!byWard[ward]) {
        byWard[ward] = { count: 0, highRisk: 0, avgSilt: 0 };
      }
      byWard[ward].count += 1;
      const cat = (d.riskCategory || d.risk_assessment?.category || '').toString().toLowerCase();
      if (cat === 'critical' || cat === 'high') {
        byWard[ward].highRisk += 1;
      }
      byWard[ward].avgSilt += d.siltLevelPercent ?? d.telemetry.silt_level_percent;
    });

    Object.keys(byWard).forEach((k) => {
      byWard[k].avgSilt = Math.round(byWard[k].avgSilt / byWard[k].count);
    });

    return {
      total,
      critical,
      high,
      medium,
      low,
      avgSilt,
      byWard,
    };
  }, [drains]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
        <h1 className="text-base font-bold text-slate-900 tracking-tight">
          Mumbai Catchment Hydrological & Risk Analytics
        </h1>
        <p className="text-xs text-slate-500">
          Deterministic 5-factor risk distribution, silt accumulation across BMC administrative wards, and low-elevation flood sag points
        </p>
      </div>

      {/* Top 3 KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 bg-white rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500 uppercase">
            Network Average Silt
          </div>
          <div className="mt-2 text-3xl font-mono font-bold text-slate-900">
            {stats.avgSilt}%
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Across {stats.total} Mumbai acoustic depth sensors
          </p>
        </div>

        <div className="p-5 bg-white rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500 uppercase">
            At-Risk Assets (Score &ge; 60)
          </div>
          <div className="mt-2 text-3xl font-mono font-bold text-rose-700">
            {stats.critical + stats.high}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {Math.round(((stats.critical + stats.high) / stats.total) * 100)}% of monitored Mumbai network
          </p>
        </div>

        <div className="p-5 bg-white rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500 uppercase">
            Optimal Flow Capacity (&lt; 35)
          </div>
          <div className="mt-2 text-3xl font-mono font-bold text-emerald-700">
            {stats.low}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Adequate gravity discharge margins
          </p>
        </div>
      </div>

      {/* Risk Distribution & Ward Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4">
            Deterministic Risk Tier Bands
          </h2>
          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between mb-1">
                <span className="font-semibold text-rose-800">Critical (80–100)</span>
                <span className="font-mono text-slate-600">
                  {stats.critical} drains ({Math.round((stats.critical / stats.total) * 100)}%)
                </span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-600 rounded-full"
                  style={{ width: `${(stats.critical / stats.total) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="font-semibold text-orange-800">High Risk (60–79)</span>
                <span className="font-mono text-slate-600">
                  {stats.high} drains ({Math.round((stats.high / stats.total) * 100)}%)
                </span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-500 rounded-full"
                  style={{ width: `${(stats.high / stats.total) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="font-semibold text-amber-800">Medium (35–59)</span>
                <span className="font-mono text-slate-600">
                  {stats.medium} drains ({Math.round((stats.medium / stats.total) * 100)}%)
                </span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{ width: `${(stats.medium / stats.total) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="font-semibold text-emerald-800">Low Risk (0–34)</span>
                <span className="font-mono text-slate-600">
                  {stats.low} drains ({Math.round((stats.low / stats.total) * 100)}%)
                </span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${(stats.low / stats.total) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* BMC Ward Vulnerability Breakdown */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4">
            BMC Administrative Ward Vulnerability
          </h2>
          <div className="divide-y divide-slate-100 text-xs max-h-[300px] overflow-y-auto pr-1">
            {Object.entries(stats.byWard).map(([ward, data]) => (
              <div key={ward} className="py-2.5 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-800 block">
                    {ward}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {data.count} monitored assets
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-slate-900 block">
                    {data.avgSilt}% Avg Silt
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                      data.highRisk > 0
                        ? 'bg-rose-50 text-rose-700'
                        : 'bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    {data.highRisk} at-risk
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
