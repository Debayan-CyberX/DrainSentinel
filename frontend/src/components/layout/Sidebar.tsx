import React from 'react';
import {
  LayoutDashboard,
  MapPin,
  ClipboardCheck,
  FileText,
  BarChart2,
  Settings,
  CloudRain,
  X,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { NavigationPage } from '../../types';

interface SidebarProps {
  activePage: NavigationPage;
  onNavigate: (page: NavigationPage) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  openInspectionsCount: number;
  unreviewedReportsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  onNavigate,
  mobileOpen,
  onCloseMobile,
  openInspectionsCount,
  unreviewedReportsCount,
}) => {
  const navItems: {
    id: NavigationPage;
    label: string;
    icon: React.ElementType;
    badge?: number;
  }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'map', label: 'Drain Map', icon: MapPin },
    {
      id: 'inspections',
      label: 'Inspections',
      icon: ClipboardCheck,
      badge: openInspectionsCount > 0 ? openInspectionsCount : undefined,
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: FileText,
      badge: unreviewedReportsCount > 0 ? unreviewedReportsCount : undefined,
    },
    { id: 'analytics', label: 'Analytics', icon: BarChart2 },
    { id: 'sylva', label: 'Living 3D World', icon: Sparkles },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#0a1120] text-slate-300 border-r border-slate-800/80 w-64 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-teal-500/10 border border-teal-500/30 rounded-lg text-teal-400">
            <CloudRain className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white text-base tracking-tight">
                DrainSentinel
              </span>
            </div>
            <span className="text-[10px] text-slate-400 block -mt-0.5">
              Municipal Storm Intelligence
            </span>
          </div>
        </div>
        {mobileOpen && (
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
          Management & Operations
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                onNavigate(item.id);
                onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-teal-600/15 text-teal-300 font-semibold border border-teal-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-teal-400' : 'text-slate-400'
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* System Status Footer */}
      <div className="p-4 border-t border-slate-800/80 bg-[#070d18] text-xs">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-[11px] font-medium text-slate-300">
            Telemetry Feed Active
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
          <span>v0.1.0 &bull; Simulated Environment</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
