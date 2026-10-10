import React, { useState } from 'react';
import {
  CloudRain,
  MapPin,
  ChevronDown,
  AlertTriangle,
  X,
  Droplets,
  Menu,
  Sparkles,
  Lock,
} from 'lucide-react';
import { NavigationPage, WeatherScenario } from '../../types';
import { WEATHER_SCENARIOS } from '../../data/weatherScenarios';

interface HeaderProps {
  activePage: NavigationPage;
  onNavigate: (page: NavigationPage) => void;
  selectedWard: string;
  onSelectWard: (ward: string) => void;
  wards: string[];
  currentWeather: WeatherScenario;
  onSelectWeather: (scenario: WeatherScenario) => void;
  onOpenReportModal: () => void;
  openInspectionsCount: number;
  unreviewedReportsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activePage,
  onNavigate,
  selectedWard,
  onSelectWard,
  wards,
  currentWeather,
  onSelectWeather,
  onOpenReportModal,
  openInspectionsCount,
  unreviewedReportsCount,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: { id: NavigationPage; label: string; badge?: number; badgeColor?: string; isSpecial?: boolean }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'map', label: 'Flow Map' },
    {
      id: 'inspections',
      label: 'Field Orders',
      badge: openInspectionsCount > 0 ? openInspectionsCount : undefined,
      badgeColor: '#f87171',
    },
    {
      id: 'reports',
      label: 'Observations',
      badge: unreviewedReportsCount > 0 ? unreviewedReportsCount : undefined,
      badgeColor: '#fbbf24',
    },
    { id: 'analytics', label: 'Hydrology Ledger' },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-[#2d3029]/80 backdrop-blur-xl border-b border-white/10 select-none transition-all">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* Brand Seal & Title */}
          <div
            className="flex items-center gap-3.5 flex-shrink-0 cursor-pointer group"
            onClick={() => onNavigate('overview')}
          >
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-[#4ade80]/20 via-[#86efac]/10 to-[#383b34] border border-[#86efac]/30 flex items-center justify-center overflow-hidden shadow-[0_0_20px_rgba(74,222,128,0.18)] group-hover:border-[#86efac]/60 transition-colors">
              <svg className="w-5 h-5 text-[#86efac]" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2C8 7.5 5 12 5 15.5a7 7 0 0 0 14 0c0-3.5-3-8-7-13.5z"
                  fill="url(#sylva-grad)"
                />
                <path
                  d="M12 7c-2 3-3.5 5.5-3.5 8a3.5 3.5 0 0 0 7 0c0-2.5-1.5-5-3.5-8z"
                  fill="#eef3e7"
                  opacity="0.65"
                />
                <defs>
                  <linearGradient id="sylva-grad" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#86efac" />
                    <stop offset="1" stopColor="#22c55e" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm sm:text-base tracking-wide text-[#eef3e7]">
                  DrainSentinel
                </span>
                <span className="hidden md:inline-block text-[9px] font-mono tracking-wider text-[#86efac] bg-[#383b34]/90 border border-[#86efac]/30 px-2 py-0.5 rounded-full font-semibold">
                  MUMBAI SWD
                </span>
              </div>
              <span className="text-[10px] tracking-wider text-[#a4aca0] font-light hidden sm:block">
                Nature-Based Catchment Intelligence &bull; Greater Mumbai
              </span>
            </div>
          </div>

          {/* Desktop Floating Dock Navigation */}
          <nav className="hidden lg:flex items-center gap-1.5 p-1.5 rounded-full dock-capsule">
            {navItems.map((item) => {
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`relative px-3.5 py-1.5 rounded-full text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-[#eef3e7] text-[#23261f] font-semibold shadow-[0_2px_12px_rgba(238,243,231,0.35)]'
                      : item.isSpecial
                      ? 'text-[#86efac] hover:bg-white/10 hover:text-white font-medium'
                      : 'text-[#d5dbc9] hover:bg-white/10 hover:text-white font-light'
                  }`}
                >
                  {item.isSpecial && <Sparkles className="w-3 h-3 text-[#86efac]" />}
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span
                      className="ml-1 text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold"
                      style={{
                        color: item.badgeColor || '#86efac',
                        backgroundColor: `${item.badgeColor}25`,
                        border: `1px solid ${item.badgeColor}40`,
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Controls: Ward Selector, Weather Simulator, Action CTA */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* BMC Ward Selector */}
            <div className="relative hidden xl:block">
              <div className="flex items-center gap-1.5 bg-[#383b34]/80 border border-white/10 hover:border-[#86efac]/40 rounded-full px-3 py-1.5 transition-colors">
                <MapPin className="w-3.5 h-3.5 text-[#86efac]" />
                <select
                  value={selectedWard}
                  onChange={(e) => onSelectWard(e.target.value)}
                  className="appearance-none bg-transparent text-[#eef3e7] text-xs font-light focus:outline-none cursor-pointer pr-5"
                >
                  <option value="ALL" className="bg-[#2d3029] text-[#eef3e7]">
                    All BMC Wards (24)
                  </option>
                  {wards.map((w) => (
                    <option key={w} value={w} className="bg-[#2d3029] text-[#eef3e7]">
                      Ward {w}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-[#a4aca0] absolute right-2 pointer-events-none" />
              </div>
            </div>

            {/* Weather Simulator */}
            <div className="relative hidden md:block">
              <div className="flex items-center gap-2 bg-[#383b34]/80 border border-white/10 hover:border-[#86efac]/40 rounded-full px-3 py-1.5 transition-colors">
                <CloudRain className="w-3.5 h-3.5 text-[#86efac]" />
                <select
                  value={currentWeather.id}
                  onChange={(e) => {
                    const found = WEATHER_SCENARIOS.find((w) => w.id === e.target.value);
                    if (found) onSelectWeather(found);
                  }}
                  className="appearance-none bg-transparent text-[#eef3e7] text-xs font-light focus:outline-none cursor-pointer pr-5"
                >
                  {WEATHER_SCENARIOS.map((w) => (
                    <option key={w.id} value={w.id} className="bg-[#2d3029] text-[#eef3e7]">
                      {w.name} ({w.rainfallRateMmH} mm/h)
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-[#a4aca0] absolute right-2 pointer-events-none" />
                {currentWeather.id === 'live_forecast' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#86efac] shadow-[0_0_8px_#86efac] animate-pulse" />
                )}
              </div>
            </div>

            {/* Officer Portal / Sign in */}
            <button
              onClick={() => onNavigate(activePage === 'login' ? 'overview' : 'login')}
              className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs transition-all cursor-pointer border ${
                activePage === 'login'
                  ? 'bg-[#eef3e7] text-[#23261f] border-white font-medium shadow-[0_2px_12px_rgba(238,243,231,0.25)]'
                  : 'bg-[#383b34]/80 text-[#d5dbc9] border-white/10 hover:border-[#86efac]/40 hover:text-white font-light'
              }`}
              title="Municipal Officer Portal"
            >
              <Lock className="w-3.5 h-3.5 text-[#86efac]" />
              <span>{activePage === 'login' ? 'Console' : 'Sign in'}</span>
            </button>

            {/* Primary Action Button: Liquid Metal Frosted Pill */}
            <button
              onClick={onOpenReportModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full pill-button text-xs font-medium cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-[#23261f]" />
              <span className="hidden sm:inline">Share Observation</span>
              <span className="sm:hidden">Share</span>
            </button>

            {/* Mobile Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-full text-[#d5dbc9] hover:text-white bg-[#383b34]/80 border border-white/10 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#2d3029]/95 backdrop-blur-2xl border-b border-white/10 px-4 py-4 space-y-2">
            {navItems.map((item) => {
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-[#eef3e7] text-[#23261f]'
                      : 'text-[#d5dbc9] hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {item.isSpecial && <Sparkles className="w-3.5 h-3.5 text-[#86efac]" />}
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span
                      className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold"
                      style={{
                        color: item.badgeColor || '#86efac',
                        backgroundColor: `${item.badgeColor}25`,
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Mobile Login Item */}
            <button
              onClick={() => {
                onNavigate(activePage === 'login' ? 'overview' : 'login');
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                activePage === 'login'
                  ? 'bg-[#eef3e7] text-[#23261f]'
                  : 'text-[#d5dbc9] hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-[#86efac]" />
                <span>{activePage === 'login' ? 'Catchment Console' : 'Officer Sign In'}</span>
              </div>
            </button>
          </div>
        )}
      </header>
    </>
  );
};
