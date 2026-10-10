import React, { useState, useEffect, useMemo } from 'react';
import {
  CloudRain,
  RefreshCw,
  Clock,
  Thermometer,
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
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-base font-bold text-slate-900 tracking-tight">
              Predictive Hydrological Intelligence & Meteorological Forecasting
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
              Live Open-Meteo
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Synthesizing live precipitation forecasts with acoustic silt telemetry and 3-year historical Mumbai flood incidence
          </p>
        </div>

        <button
          onClick={loadPredictions}
          disabled={loadingPrediction}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingPrediction ? 'animate-spin' : ''}`} />
          <span>Refresh Forecast</span>
        </button>
      </div>

      {/* Live Mumbai Meteorology & 8-Hour Forecast Curve Widget */}
      {liveWeather && (
        <div className="p-5 rounded-xl bg-gradient-to-r from-sky-950 via-slate-900 to-indigo-950 text-white shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <CloudRain className="w-4 h-4 text-sky-400" />
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                  Live Mumbai Meteorological Observation (Open-Meteo Feed)
                </span>
                <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full font-mono border border-emerald-800/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  LIVE
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Coordinates: 19.076° N, 72.877° E &bull; Catchment: Greater Mumbai Region
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <Thermometer className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-slate-300">Temp:</span>
                <span className="font-bold text-white">{liveWeather.current_temp_c}°C</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CloudRain className="w-3.5 h-3.5 text-sky-400" />
                <span className="text-slate-300">Current Rain:</span>
                <span className="font-bold text-sky-300">{liveWeather.current_rain_mm_h} mm/h</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Condition:</span>
                <span className="text-slate-200 font-sans font-medium">{liveWeather.weather_condition}</span>
              </div>
            </div>
          </div>

          {/* 8-Hour Rainfall Forecast Histogram */}
          <div>
            <div className="flex items-center justify-between text-[11px] mb-2 text-slate-400">
              <span className="font-semibold text-slate-300">
                Hourly Precipitation Forecast Curve (Next 8 Hours)
              </span>
              <span>
                Forecast Peak: <strong className="text-sky-300">{liveWeather.max_forecast_rain_mm_h} mm/h</strong> at{' '}
                <strong className="text-white">{liveWeather.peak_forecast_time}</strong>
              </span>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 pt-2">
              {liveWeather.hourly_forecast.slice(0, 8).map((pt, i) => {
                const heightPct = Math.max(8, Math.min(100, (pt.precipitation_mm / Math.max(1.5, liveWeather.max_forecast_rain_mm_h)) * 100));
                return (
                  <div key={i} className="flex flex-col items-center gap-1 bg-slate-800/60 p-2 rounded-lg border border-slate-700/60">
                    <span className="text-[10px] font-mono font-bold text-sky-300">
                      {pt.precipitation_mm} <span className="text-[9px] font-sans text-slate-400">mm</span>
                    </span>
                    <div className="h-14 w-full flex items-end justify-center bg-slate-900/60 rounded p-1">
                      <div
                        className="w-full bg-gradient-to-t from-sky-600 to-teal-400 rounded-xs transition-all duration-300"
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">{pt.time}</span>
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
          <div className="p-4 bg-white rounded-xl border border-slate-200/90 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">
              Average Headroom Capacity
            </span>
            <div className="mt-1 text-2xl font-mono font-bold text-teal-700">
              {predictiveData.average_hydraulic_headroom_percent}%
            </div>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Remaining conduit cross-section margins
            </p>
          </div>

          <div className="p-4 bg-white rounded-xl border border-slate-200/90 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">
              Imminent Overflow Risk (&lt; 2h)
            </span>
            <div className={`mt-1 text-2xl font-mono font-bold ${predictiveData.imminent_overflow_count > 0 ? 'text-rose-700' : 'text-slate-700'}`}>
              {predictiveData.imminent_overflow_count}
            </div>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Assets projected to breach capacity
            </p>
          </div>

          <div className="p-4 bg-white rounded-xl border border-slate-200/90 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">
              Elevated Surge Risk (&lt; 6h)
            </span>
            <div className="mt-1 text-2xl font-mono font-bold text-orange-600">
              {predictiveData.elevated_risk_count}
            </div>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Pre-storm preventative jetting watch
            </p>
          </div>

          <div className="p-4 bg-white rounded-xl border border-slate-200/90 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">
              Chronic Mumbai Flood Hotspots
            </span>
            <div className="mt-1 text-2xl font-mono font-bold text-indigo-700">
              {predictiveData.chronic_flood_hotspot_count}
            </div>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Historical sags (&ge; 8 inundation events)
            </p>
          </div>
        </div>
      )}

      {/* Predictive Time-to-Overflow (TTO) Watchlist Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
              <span>Predictive Time-to-Overflow (TTO) Watchlist</span>
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Forecasted run-up to waterlogging based on conduit diameter, elevation sag, current silt %, and live rainfall
            </p>
          </div>

          {/* Filter Stage Buttons */}
          <div className="flex flex-wrap items-center gap-1">
            {['ALL', 'Imminent Danger (< 2 hrs)', 'High Risk (< 6 hrs)', 'Moderate Warning', 'Stable'].map((stage) => (
              <button
                key={stage}
                onClick={() => setFilterStage(stage)}
                className={`px-2 py-0.5 text-[11px] font-semibold rounded-md border transition-colors ${
                  filterStage === stage
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {stage === 'ALL' ? 'All Assets' : stage}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[10px] text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-2.5">Asset ID & Location</th>
                <th className="px-3 py-2.5">Ward & Elev.</th>
                <th className="px-3 py-2.5">Silt / Headroom</th>
                <th className="px-3 py-2.5">Flood History</th>
                <th className="px-3 py-2.5">Critical Rain Thresh.</th>
                <th className="px-3 py-2.5">Predicted TTO</th>
                <th className="px-4 py-2.5">Preventive Recommendation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filteredPredictions.map((pred) => {
                const isImminent = pred.predicted_waterlogging_stage.includes('Imminent');
                const isHigh = pred.predicted_waterlogging_stage.includes('High Risk');
                return (
                  <tr key={pred.drain_id} className={`hover:bg-slate-50/80 transition-colors ${isImminent ? 'bg-rose-50/40' : ''}`}>
                    <td className="px-4 py-3 font-sans">
                      <span className="font-mono font-bold text-slate-900 text-[11px] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 mr-1.5">
                        {pred.drain_id}
                      </span>
                      <span className="font-semibold text-slate-800 text-[11px] block sm:inline">
                        {pred.drain_name}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-[11px] font-sans text-slate-600">
                      <div>{pred.ward}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{pred.elevation_meters}m AMSL</div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="text-slate-900 font-bold text-[11px]">
                        {pred.current_silt_percent}% silt
                      </div>
                      <div className="text-[10px] text-teal-600 font-medium">
                        {pred.hydraulic_headroom_percent}% headroom
                      </div>
                    </td>
                    <td className="px-3 py-3 text-[11px]">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        pred.historical_flood_events >= 8
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {pred.historical_flood_events} events
                      </span>
                    </td>
                    <td className="px-3 py-3 text-[11px] text-slate-700 font-mono">
                      {pred.critical_threshold_mm_h} mm/h
                    </td>
                    <td className="px-3 py-3 font-sans">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          isImminent
                            ? 'bg-rose-100 text-rose-800 border-rose-300'
                            : isHigh
                            ? 'bg-orange-100 text-orange-800 border-orange-300'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}
                      >
                        <Clock className="w-2.5 h-2.5" />
                        {pred.time_to_overflow_hours !== null
                          ? `${pred.time_to_overflow_hours} hrs`
                          : '> 12 hrs (Stable)'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-sans text-[11px] text-slate-600 max-w-xs leading-snug">
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
                <span className="font-semibold text-orange-800">High (60–79)</span>
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
                <span className="font-semibold text-emerald-800">Low (0–34)</span>
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

        {/* BMC Ward Distribution */}
        <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-2xs">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4">
            Ward-Level Silt & Vulnerability Profile
          </h2>
          <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1 text-xs">
            {Object.entries(stats.byWard).map(([ward, data]) => (
              <div
                key={ward}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100"
              >
                <div>
                  <span className="font-semibold text-slate-800 block text-[11px]">{ward}</span>
                  <span className="text-[10px] text-slate-500">
                    {data.count} assets &bull; {data.highRisk} at elevated risk
                  </span>
                </div>
                <div className="text-right font-mono">
                  <span className="text-xs font-bold text-slate-900">{data.avgSilt}%</span>
                  <span className="text-[10px] text-slate-400 block font-sans">avg silt</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
