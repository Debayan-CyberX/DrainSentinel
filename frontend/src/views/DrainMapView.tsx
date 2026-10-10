import React, { useState, useMemo } from 'react';
import { Drain } from '../types';
import { DrainMap } from '../components/map/DrainMap';
import { RiskBadge } from '../components/common/RiskBadge';
import { StatusBadge } from '../components/common/StatusBadge';
import { Search, MapPin, ChevronRight, Layers, Waves } from 'lucide-react';

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
    <div className="space-y-5 animate-in fade-in duration-500">
      {/* Header Controls */}
      <div className="nature-card p-5 rounded-2xl border border-white/10 shadow-[0_20px_50px_rgba(16,22,17,0.6)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#86efac] shadow-[0_0_8px_#86efac]" />
            <span className="text-[11px] font-mono tracking-wider uppercase text-[#86efac] font-medium">
              Living Catchment Observatory
            </span>
          </div>
          <h1 className="text-base font-medium text-white tracking-wide">
            Catchment Observatories & Mumbai Flow Map
          </h1>
          <p className="text-xs text-[#a4aca0] font-light mt-0.5">
            Watching over 25 natural nullahs, coastal outfalls, and urban culverts across the city's living hydrology
          </p>
        </div>

        {/* Filter Chips & CTA */}
        <div className="flex flex-wrap items-center gap-2">
          {['ALL', 'Critical', 'High', 'Medium', 'Low'].map((category) => (
            <button
              key={category}
              onClick={() => setSelectedRisk(category)}
              className={`px-3.5 py-1.5 text-xs font-mono rounded-full border transition-all cursor-pointer ${
                selectedRisk === category
                  ? 'bg-[#eef3e7] text-[#23261f] border-white font-medium shadow-[0_2px_10px_rgba(238,243,231,0.3)]'
                  : 'bg-white/5 text-[#d5dbc9] border-white/10 hover:border-[#86efac]/30'
              }`}
            >
              {category === 'ALL' ? 'All Channels' : category === 'Medium' ? 'Moderate' : category}
            </button>
          ))}

          {onOpenReportModal && (
            <button
              onClick={onOpenReportModal}
              className="ml-2 px-4 py-1.5 text-xs font-medium rounded-full pill-button cursor-pointer"
            >
              + Share Observation
            </button>
          )}
        </div>
      </div>

      {/* Map + Side Inspector Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-[calc(100vh-230px)] min-h-[580px]">
        {/* Left Side List */}
        <div className="lg:col-span-4 nature-card rounded-2xl border border-white/10 flex flex-col overflow-hidden">
          {/* Search Bar */}
          <div className="p-3.5 border-b border-white/10 bg-[#2d3029]/80">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#a4aca0] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search creek, ward, or channel name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#242720] border border-white/10 text-[#eef3e7] text-xs pl-8 pr-3 py-2 rounded-full focus:outline-none focus:border-[#86efac]/50 placeholder-[#7c8177] font-light"
              />
            </div>
            <div className="mt-2.5 flex justify-between text-[11px] font-mono text-[#a4aca0] px-1">
              <span>Channels in view: <b className="text-[#86efac]">{filteredDrains.length}</b></span>
              <span>Total observatories: <b className="text-white">{drains.length}</b></span>
            </div>
          </div>

          {/* Drains Scrollable Cards */}
          <div className="flex-1 overflow-y-auto divide-y divide-white/5">
            {filteredDrains.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#a4aca0] font-light">
                No monitored waterways match your search.
              </div>
            ) : (
              filteredDrains.map((drain) => {
                const isSelected = selectedDrain?.id === drain.id;
                const cat = drain.riskCategory || drain.risk_assessment?.category || 'Low';
                const score = drain.riskScore ?? drain.risk_assessment?.total_score ?? 0;
                const silt = drain.siltLevelPercent ?? drain.telemetry.silt_level_percent;

                return (
                  <div
                    key={drain.id}
                    onClick={() => onSelectDrain(drain)}
                    className={`p-3.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'nature-card-light shadow-md'
                        : 'hover:bg-white/5 bg-transparent text-[#eef3e7]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`font-mono text-xs font-medium ${isSelected ? 'text-[#23261f]' : 'text-white'}`}>
                          {drain.id}
                        </span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                          isSelected
                            ? 'bg-[#23261f]/10 text-[#23261f] border-[#23261f]/20 font-medium'
                            : 'text-[#d5dbc9] bg-white/5 border-white/10'
                        }`}>
                          {drain.location.ward}
                        </span>
                      </div>
                      <RiskBadge category={cat} score={score} size="sm" />
                    </div>

                    <h4 className={`text-xs font-normal line-clamp-1 ${isSelected ? 'text-[#23261f] font-medium' : 'text-white'}`}>
                      {drain.name}
                    </h4>

                    <div className={`flex items-center gap-1.5 text-[11px] font-light mt-1 ${isSelected ? 'text-[#565c50]' : 'text-[#a4aca0]'}`}>
                      <MapPin className={`w-3 h-3 flex-shrink-0 ${isSelected ? 'text-[#16a34a]' : 'text-[#86efac]'}`} />
                      <span className="truncate">{drain.location.landmark}</span>
                    </div>

                    {/* Silt Meter */}
                    <div className={`mt-2.5 flex items-center justify-between text-[11px] font-mono ${isSelected ? 'text-[#565c50]' : 'text-[#a4aca0]'}`}>
                      <span>Sediment: <b className={isSelected ? 'text-[#15803d]' : 'text-[#86efac]'}>{silt}%</b></span>
                      <StatusBadge status={drain.status} size="sm" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Map Canvas */}
        <div className="lg:col-span-8 h-full">
          <DrainMap
            drains={filteredDrains}
            selectedDrain={selectedDrain}
            onSelectDrain={onSelectDrain}
            className="h-full min-h-[500px]"
          />
        </div>
      </div>
    </div>
  );
};
