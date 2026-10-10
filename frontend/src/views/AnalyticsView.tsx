import React, { useState, useEffect, useMemo } from 'react';
import {
  CloudRain,
  RefreshCw,
  Clock,
  Thermometer,
  ShieldAlert,
  Layers,
  ArrowRight,
  Waves,
} from 'lucide-react';
import { Drain, CityWidePredictiveSummary } from '../types';
import { fetchPredictiveSummary } from '../services/api';

interface AnalyticsViewProps {
  drains: Drain[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ drains }) => {
  const [predictiveData, setPredictiveData] = useState<CityWidePredictiveSummary | null>(null);
  const [loadingPrediction, setLoadingPrediction] = useState<boolean>(true);
  const [filterStage, setFilterStage] = useState<string>('ALL');

  const loadPredictions = async () => {
    setLoadingPrediction(true);
    try {
      const summary = await fetchPredictiveSummary();
      setPredictiveData(summary);
    } catch (err) {
      console.error('Failed to load predictive summary:', err);
    } finally {
      setLoadingPrediction(false);
    }
  };

  useEffect(() => {
    loadPredictions();
  }, []);

  // Standard metrics
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

  const filteredPredictions = useMemo(() => {
    if (!predictiveData) return [];
    if (filterStage === 'ALL') return predictiveData.predictions;
    return predictiveData.predictions.filter((p) => p.predicted_waterlogging_stage === filterStage);
  }, [predictiveData, filterStage]);

  const liveWeather = predictiveData?.live_weather;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="nature-card p-5 rounded-2xl border border-white/10 shadow-[0_20px_50px_rgba(16,22,17,0.6)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#86efac] shadow-[0_0_8px_#86efac]" />
            <span className="text-[11px] font-mono tracking-wider uppercase text-[#86efac] font-medium">
              The Hydrological Ledger
            </span>
          </div>
          <h1 className="text-base font-medium text-white tracking-wide">
            The Hydrological Ledger & Rainfall Rhythms
          </h1>
          <p className="text-xs text-[#a4aca0] font-light mt-0.5">
            Reading precipitation rhythms, catchment headroom, and rainfall lead times across Greater Mumbai
          </p>
        </div>

        <button
          onClick={loadPredictions}
          disabled={loadingPrediction}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-[#d5dbc9] border border-white/10 rounded-full text-xs font-mono transition-colors cursor-pointer shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#86efac] ${loadingPrediction ? 'animate-spin' : ''}`} />
          <span>Refresh Weather Feed</span>
        </button>
      </div>

      {/* Live Mumbai Meteorology & 8-Hour Forecast Curve Widget */}
      {liveWeather && (
        <div className="p-6 rounded-2xl nature-card border border-white/10 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <CloudRain className="w-4 h-4 text-[#86efac]" />
                <span className="text-xs font-mono font-medium text-white uppercase tracking-wider">
                  Live Mumbai Meteorological Observation (Open-Meteo Feed)
                </span>
                <span className="flex items-center gap-1 text-[10px] text-emerald-300 bg-emerald-500/15 px-2.5 py-0.5 rounded-full font-mono border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  LIVE
                </span>
              </div>
              <p className="text-[11px] text-[#a4aca0] font-light mt-1 font-mono">
                Coordinates: 19.076° N, 72.877° E &bull; Catchment: Greater Mumbai Region
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <Thermometer className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[#a4aca0]">Temp:</span>
                <span className="font-medium text-white">{liveWeather.current_temp_c}°C</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CloudRain className="w-3.5 h-3.5 text-[#86efac]" />
                <span className="text-[#a4aca0]">Current Rain:</span>
                <span className="font-medium text-[#86efac]">{liveWeather.current_rain_mm_h} mm/h</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[#a4aca0]">Condition:</span>
                <span className="text-[#eef3e7] font-sans font-normal">{liveWeather.weather_condition}</span>
              </div>
            </div>
          </div>

          {/* 8-Hour Rainfall Forecast Histogram Curve */}
          <div>
            <div className="flex items-center justify-between text-xs font-mono mb-2 text-[#a4aca0]">
              <span className="uppercase tracking-wider text-[#d5dbc9] font-normal">
                Hourly Precipitation Forecast Curve (Next 8 Hours)
              </span>
              <span>
                Forecast Peak: <strong className="text-[#86efac]">{liveWeather.max_forecast_rain_mm_h} mm/h</strong> at{' '}
                <strong className="text-white">{liveWeather.peak_forecast_time}</strong>
              </span>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 pt-2">
              {liveWeather.hourly_forecast.slice(0, 8).map((pt, i) => {
                const heightPct = Math.max(8, Math.min(100, (pt.precipitation_mm / Math.max(1.5, liveWeather.max_forecast_rain_mm_h)) * 100));
                const isHeavy = pt.precipitation_mm >= 1.0;
                return (
                  <div key={i} className="flex flex-col items-center gap-1 bg-[#242720] p-2.5 rounded-xl border border-white/10">
                    <span className="text-[10px] font-mono font-medium text-white">
                      {pt.precipitation_mm} <span className="text-[9px] font-light text-[#a4aca0]">mm</span>
                    </span>
                    <div className="h-16 w-full flex items-end justify-center bg-[#1b1d19] rounded-lg p-1">
                      <div
                        className={`w-full rounded-sm transition-all duration-300 ${
                          isHeavy
                            ? 'bg-gradient-to-t from-[#15803d] via-[#22c55e] to-[#86efac] shadow-[0_0_10px_rgba(74,222,128,0.4)]'
                            : 'bg-gradient-to-t from-slate-700 to-[#4ade80]/60'
                        }`}
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-[#a4aca0] font-mono">{pt.time}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Predictive Summary KPI Cards */}
      {predictiveData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 nature-card rounded-2xl border border-white/10">
            <span className="text-xs uppercase font-mono tracking-wider text-[#a4aca0]">
              Average Conduit Headroom
            </span>
            <div className="mt-2 text-3xl font-mono font-light text-[#86efac] tabular-nums">
              {predictiveData.average_hydraulic_headroom_percent}%
            </div>
            <p className="mt-1 text-xs text-[#a4aca0] font-light">
              Remaining flow capacity margin
            </p>
          </div>

          <div className="p-5 nature-card rounded-2xl border border-white/10">
            <span className="text-xs uppercase font-mono tracking-wider text-[#a4aca0]">
              Imminent Runoff Watch (&lt; 2h)
            </span>
            <div className={`mt-2 text-3xl font-mono font-light tabular-nums ${
              predictiveData.imminent_overflow_count > 0 ? 'text-rose-400' : 'text-[#d5dbc9]'
            }`}>
              {predictiveData.imminent_overflow_count}
            </div>
            <p className="mt-1 text-xs text-[#a4aca0] font-light">
              Waterways nearing hydraulic capacity
            </p>
          </div>

          <div className="p-5 nature-card rounded-2xl border border-white/10">
            <span className="text-xs uppercase font-mono tracking-wider text-[#a4aca0]">
              Elevated Surge Watch (&lt; 6h)
            </span>
            <div className="mt-2 text-3xl font-mono font-light text-amber-400 tabular-nums">
              {predictiveData.elevated_risk_count}
            </div>
            <p className="mt-1 text-xs text-[#a4aca0] font-light">
              Pre-monsoon preventative clearance watch
            </p>
          </div>

          <div className="p-5 nature-card rounded-2xl border border-white/10">
            <span className="text-xs uppercase font-mono tracking-wider text-[#a4aca0]">
              Historical Waterlogging Sags
            </span>
            <div className="mt-2 text-3xl font-mono font-light text-white tabular-nums">
              {predictiveData.chronic_flood_hotspot_count}
            </div>
            <p className="mt-1 text-xs text-[#a4aca0] font-light">
              Historical sags (&ge; 8 inundation events)
            </p>
          </div>
        </div>
      )}

      {/* Predictive Time-to-Overflow (TTO) Watchlist Table */}
      <div className="nature-card rounded-2xl border border-white/10 shadow-[0_20px_50px_rgba(16,22,17,0.6)] overflow-hidden">
        <div className="p-5 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#242720]/80">
          <div>
            <h2 className="text-xs uppercase font-mono tracking-wider text-white font-medium flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-[#86efac]" />
              <span>Time-to-Overflow (TTO) Watchlist Ledger</span>
            </h2>
            <p className="text-xs text-[#a4aca0] font-light mt-0.5">
              Forecasted run-up to waterlogging based on channel diameter, elevation sag, current sediment %, and live rainfall
            </p>
          </div>

          {/* Filter Stage Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'ALL', label: 'All Channels' },
              { id: 'Imminent Danger (< 2 hrs)', label: 'Imminent (< 2h)' },
              { id: 'High Risk (< 6 hrs)', label: 'High Watch (< 6h)' },
              { id: 'Moderate Warning', label: 'Moderate' },
              { id: 'Stable', label: 'Nominal Flow' },
            ].map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setFilterStage(id)}
                className={`px-3 py-1 text-xs font-mono rounded-full border transition-all cursor-pointer ${
                  filterStage === id
                    ? 'bg-[#eef3e7] text-[#23261f] border-white font-medium shadow-[0_2px_8px_rgba(238,243,231,0.25)]'
                    : 'bg-white/5 text-[#d5dbc9] border-white/10 hover:border-[#86efac]/30'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#242720] text-[11px] font-mono uppercase tracking-wider text-[#a4aca0] border-b border-white/10">
              <tr>
                <th className="px-4 py-3">Waterway & Location</th>
                <th className="px-3 py-3">Ward & Elev.</th>
                <th className="px-3 py-3">Sediment / Headroom</th>
                <th className="px-3 py-3">Flood History</th>
                <th className="px-3 py-3">Rain Tolerance</th>
                <th className="px-3 py-3">Predicted Headroom</th>
                <th className="px-4 py-3">Stewardship Recommendation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {filteredPredictions.map((pred) => {
                const isImminent = pred.predicted_waterlogging_stage.includes('Imminent');
                const isHigh = pred.predicted_waterlogging_stage.includes('High Risk');
                return (
                  <tr
                    key={pred.drain_id}
                    className={`hover:bg-white/5 transition-colors ${
                      isImminent ? 'bg-rose-500/10' : ''
                    }`}
                  >
                    <td className="px-4 py-3.5 font-sans">
                      <span className="font-mono font-medium text-white text-xs bg-white/5 px-2 py-0.5 rounded-full border border-white/10 mr-2">
                        {pred.drain_id}
                      </span>
                      <span className="font-normal text-white text-xs block sm:inline">
                        {pred.drain_name}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 text-xs text-[#d5dbc9]">
                      <div>{pred.ward}</div>
                      <div className="text-[11px] text-[#a4aca0] font-mono">{pred.elevation_meters}m AMSL</div>
                    </td>
                    <td className="px-3 py-3.5">
                      <div className="text-white font-medium text-xs">
                        {pred.current_silt_percent}% silt
                      </div>
                      <div className="text-[11px] text-[#86efac] font-mono">
                        {pred.hydraulic_headroom_percent}% headroom
                      </div>
                    </td>
                    <td className="px-3 py-3.5 text-xs">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium ${
                          pred.historical_flood_events >= 8
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-white/5 text-[#d5dbc9]'
                        }`}
                      >
                        {pred.historical_flood_events} events
                      </span>
                    </td>
                    <td className="px-3 py-3.5 text-xs text-[#eef3e7] font-mono">
                      {pred.critical_threshold_mm_h} mm/h
                    </td>
                    <td className="px-3 py-3.5 font-sans">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-medium border ${
                          isImminent
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            : isHigh
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        }`}
                      >
                        <Clock className="w-2.5 h-2.5" />
                        {pred.time_to_overflow_hours !== null
                          ? `${pred.time_to_overflow_hours} hrs`
                          : '> 12 hrs (Nominal)'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-sans text-xs text-[#d5dbc9] max-w-xs leading-snug">
                      {pred.preventive_recommendation}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ward Breakdown & Risk Tier Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="nature-card p-5 rounded-2xl border border-white/10">
          <h2 className="text-xs uppercase font-mono tracking-wider text-white font-medium mb-4">
            Waterway Vulnerability Bands
          </h2>
          <div className="space-y-3.5 text-xs font-mono">
            <div>
              <div className="flex justify-between mb-1.5">
                <span className="text-rose-400 font-medium">Critical (80–100)</span>
                <span className="text-[#a4aca0]">
                  {stats.critical} drains ({Math.round((stats.critical / stats.total) * 100)}%)
                </span>
              </div>
              <div className="h-2 w-full bg-[#1b1d19] rounded-full overflow-hidden border border-white/10">
                <div
                  className="h-full bg-rose-500 shadow-[0_0_6px_#f43f5e]"
                  style={{ width: `${(stats.critical / stats.total) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1.5">
                <span className="text-amber-400 font-medium">High Risk (60–79)</span>
                <span className="text-[#a4aca0]">
                  {stats.high} drains ({Math.round((stats.high / stats.total) * 100)}%)
                </span>
              </div>
              <div className="h-2 w-full bg-[#1b1d19] rounded-full overflow-hidden border border-white/10">
                <div
                  className="h-full bg-amber-400"
                  style={{ width: `${(stats.high / stats.total) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1.5">
                <span className="text-[#86efac] font-medium">Moderate (35–59)</span>
                <span className="text-[#a4aca0]">
                  {stats.medium} drains ({Math.round((stats.medium / stats.total) * 100)}%)
                </span>
              </div>
              <div className="h-2 w-full bg-[#1b1d19] rounded-full overflow-hidden border border-white/10">
                <div
                  className="h-full bg-[#86efac]"
                  style={{ width: `${(stats.medium / stats.total) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1.5">
                <span className="text-emerald-400 font-medium">Low Risk (0–34)</span>
                <span className="text-[#a4aca0]">
                  {stats.low} drains ({Math.round((stats.low / stats.total) * 100)}%)
                </span>
              </div>
              <div className="h-2 w-full bg-[#1b1d19] rounded-full overflow-hidden border border-white/10">
                <div
                  className="h-full bg-emerald-400"
                  style={{ width: `${(stats.low / stats.total) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* BMC Ward Distribution */}
        <div className="nature-card p-5 rounded-2xl border border-white/10">
          <h2 className="text-xs uppercase font-mono tracking-wider text-white font-medium mb-4">
            Ward Vulnerability & Sediment Profile
          </h2>
          <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1 text-xs">
            {Object.entries(stats.byWard).map(([ward, data]) => (
              <div
                key={ward}
                className="flex items-center justify-between p-2.5 rounded-xl bg-[#242720] border border-white/10"
              >
                <div>
                  <span className="font-mono text-white font-medium block text-xs">{ward}</span>
                  <span className="text-[11px] text-[#a4aca0] font-light">
                    {data.count} waterways &bull; {data.highRisk} at elevated risk
                  </span>
                </div>
                <div className="text-right font-mono">
                  <span className="text-xs font-medium text-[#86efac]">{data.avgSilt}%</span>
                  <span className="text-[10px] text-[#a4aca0] block font-light">avg sediment</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
