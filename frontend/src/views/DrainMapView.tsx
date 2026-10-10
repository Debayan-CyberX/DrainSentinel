import React, { useState, useMemo } from 'react';
import { Drain } from '../types';
import { DrainMap } from '../components/map/DrainMap';
import { RiskBadge } from '../components/common/RiskBadge';
import { StatusBadge } from '../components/common/StatusBadge';
import { Search, MapPin } from 'lucide-react';

interface DrainMapViewProps {
  drains: Drain[];
  selectedDrain: Drain | null;
  onSelectDrain: (drain: Drain) => void;
  onOpenReportModal?: () => void;
}

export const DrainMapView: React.FC<DrainMapViewProps> = ({
  drains,
  selectedDrain,
  onSelectDrain,
  onOpenReportModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRisk, setSelectedRisk] = useState<string>('ALL');

  const filteredDrains = useMemo(() => {
    return drains.filter((d) => {
      const q = searchQuery.toLowerCase();
      const cat = (d.riskCategory || d.risk_assessment?.category || 'Low').toString().toLowerCase();

      const matchesSearch =
        q === '' ||
        d.id.toLowerCase().includes(q) ||
        d.name.toLowerCase().includes(q) ||
        d.location.address.toLowerCase().includes(q) ||
        d.location.ward.toLowerCase().includes(q) ||
        d.location.landmark.toLowerCase().includes(q);

      const matchesRisk =
        selectedRisk === 'ALL' || cat === selectedRisk.toLowerCase();

      return matchesSearch && matchesRisk;
    });
  }, [drains, searchQuery, selectedRisk]);

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-bold text-slate-900 tracking-tight">
            Mumbai Stormwater Drainage GIS Map
          </h1>
          <p className="text-xs text-slate-500">
            Interactive GIS plotting of municipal sump chambers, culverts, and drop inlets across BMC administrative wards
          </p>
        </div>

        {/* Filter Chips & CTA */}
        <div className="flex flex-wrap items-center gap-1.5">
          {['ALL', 'Critical', 'High', 'Medium', 'Low'].map((category) => (
            <button
              key={category}
              onClick={() => setSelectedRisk(category)}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors ${
                selectedRisk === category
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {category === 'ALL' ? 'All Risks' : category}
            </button>
          ))}

          {onOpenReportModal && (
            <button
              onClick={onOpenReportModal}
              className="ml-2 px-3 py-1 text-xs font-semibold rounded-lg bg-rose-600 text-white hover:bg-rose-700 shadow-2xs"
            >
              + Report Drain
            </button>
          )}
        </div>
      </div>

      {/* Map + Side Inspector Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-220px)] min-h-[550px]">
        {/* Left Side List */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200/90 shadow-2xs flex flex-col overflow-hidden">
          {/* Search Bar */}
          <div className="p-3 border-b border-slate-100 bg-slate-50/50">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search location, ward, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-200 text-xs pl-8 pr-3 py-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 placeholder-slate-400"
              />
            </div>
            <div className="mt-2 flex justify-between text-[11px] text-slate-500 font-medium px-1">
              <span>{filteredDrains.length} Mumbai drains located</span>
              <span>Click to pan & inspect</span>
            </div>
          </div>

          {/* Scrollable list */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredDrains.map((drain) => {
              const isSelected = selectedDrain?.id === drain.id;
              const silt = drain.siltLevelPercent ?? drain.telemetry.silt_level_percent;
              const category = drain.riskCategory || drain.risk_assessment?.category || 'Low';
              const score = drain.riskScore ?? drain.risk_assessment?.total_score ?? 0;

              return (
                <div
                  key={drain.id}
                  onClick={() => onSelectDrain(drain)}
                  className={`p-3 cursor-pointer transition-colors ${
                    isSelected ? 'bg-teal-50/80 border-l-4 border-l-teal-600' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-bold text-xs text-slate-900">
                      {drain.id}
                    </span>
                    <RiskBadge category={category} score={score} size="sm" />
                  </div>

                  <div className="text-xs font-semibold text-slate-800 line-clamp-1">
                    {drain.name}
                  </div>

                  <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 line-clamp-1">
                    <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                    <span>{drain.location.landmark} &bull; <strong className="text-teal-800">{drain.location.ward}</strong></span>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-100/80">
                    <span className="font-mono text-slate-500">
                      Silt: <strong className="text-slate-700">{silt}%</strong>
                    </span>
                    <StatusBadge status={drain.status} size="sm" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Map Canvas */}
        <div className="lg:col-span-8 h-full">
          <DrainMap
            drains={filteredDrains}
            selectedDrain={selectedDrain}
            onSelectDrain={onSelectDrain}
            className="h-full"
          />
        </div>
      </div>
    </div>
  );
};
