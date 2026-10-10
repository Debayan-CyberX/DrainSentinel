import React from 'react';
import {
  Menu,
  CloudRain,
  MapPin,
  ChevronDown,
  AlertTriangle,
  Building2,
} from 'lucide-react';
import { WeatherScenario } from '../../types';
import { WEATHER_SCENARIOS } from '../../data/weatherScenarios';

interface HeaderProps {
  onToggleMobileMenu: () => void;
  selectedWard: string;
  onSelectWard: (ward: string) => void;
  wards: string[];
  currentWeather: WeatherScenario;
  onSelectWeather: (scenario: WeatherScenario) => void;
  onOpenReportModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleMobileMenu,
  selectedWard,
  onSelectWard,
  wards,
  currentWeather,
  onSelectWeather,
  onOpenReportModal,
}) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200/90 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Left: Mobile Toggle & BMC Ward Selector */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="md:hidden p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* BMC Ward Selector */}
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-slate-400 hidden sm:block" />
          <div className="relative">
            <select
              value={selectedWard}
              onChange={(e) => onSelectWard(e.target.value)}
              className="appearance-none bg-slate-50 hover:bg-slate-100/80 border border-slate-200 text-slate-700 text-xs font-medium py-1.5 pl-3 pr-8 rounded-lg cursor-pointer focus:outline-none focus:ring-1 focus:ring-teal-500 transition-colors"
            >
              <option value="ALL">All Mumbai BMC Wards</option>
              {wards.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Right: Report Button, Rainfall Simulator & BMC Profile */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* Report Blockage CTA Button */}
        <button
          onClick={onOpenReportModal}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Report Blockage</span>
          <span className="sm:hidden">Report</span>
        </button>

        {/* Rainfall Simulator Toggle */}
        <div className="flex items-center gap-1.5">
          <div className="hidden lg:flex items-center gap-1.5 px-2 py-1 rounded bg-sky-50 border border-sky-100 text-sky-800 text-[11px] font-semibold">
            <CloudRain className="w-3.5 h-3.5 text-sky-600" />
            <span>Weather:</span>
            {currentWeather.id === 'live_forecast' && (
              <span className="flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded font-mono font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                LIVE
              </span>
            )}
          </div>

          <div className="relative">
            <select
              value={currentWeather.id}
              onChange={(e) => {
                const found = WEATHER_SCENARIOS.find(
                  (w) => w.id === e.target.value
                );
                if (found) onSelectWeather(found);
              }}
              className="appearance-none bg-slate-50 hover:bg-slate-100/80 border border-slate-200 text-slate-800 text-xs font-semibold py-1.5 pl-2.5 pr-7 rounded-lg cursor-pointer focus:outline-none focus:ring-1 focus:ring-sky-500 transition-colors"
            >
              {WEATHER_SCENARIOS.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.intensity})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
            <Building2 className="w-4 h-4 text-teal-700" />
          </div>
          <div className="hidden xl:block text-left">
            <span className="text-xs font-semibold text-slate-800 block leading-tight">
              BMC SWD Control Cell
            </span>
            <span className="text-[10px] text-slate-500 block">
              Monsoon Operations Hub
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
