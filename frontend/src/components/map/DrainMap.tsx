import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Drain, RiskCategory } from '../../types';
import { RiskBadge } from '../common/RiskBadge';
import { StatusBadge } from '../common/StatusBadge';
import { MapLegend } from './MapLegend';
import { ArrowRight, Layers, Droplets } from 'lucide-react';

interface DrainMapProps {
  drains: Drain[];
  selectedDrain: Drain | null;
  onSelectDrain: (drain: Drain) => void;
  className?: string;
}

// Controller component to smoothly fly the map to a selected drain
const MapFlyTo: React.FC<{ target: [number, number] | null }> = ({ target }) => {
  const map = useMap();
  useEffect(() => {
    if (target) {
      map.flyTo(target, 15, { duration: 1.2 });
    }
  }, [target, map]);
  return null;
};

// Create custom glowing botanical water droplet markers
const createCustomMarker = (category: RiskCategory | string = 'low', isSelected: boolean) => {
  const norm = category.toString().toLowerCase();

  const colors: Record<string, { fill: string; stroke: string; glow: string }> = {
    low: { fill: '#4ade80', stroke: '#15803d', glow: 'rgba(74, 222, 128, 0.45)' },
    medium: { fill: '#38bdf8', stroke: '#0284c7', glow: 'rgba(56, 189, 248, 0.5)' },
    moderate: { fill: '#38bdf8', stroke: '#0284c7', glow: 'rgba(56, 189, 248, 0.5)' },
    high: { fill: '#fbbf24', stroke: '#b45309', glow: 'rgba(251, 191, 36, 0.6)' },
    critical: { fill: '#f87171', stroke: '#b91c1c', glow: 'rgba(248, 113, 113, 0.8)' },
  };

  const c = colors[norm] || colors.low;
  const isCritical = norm === 'critical';
  const size = isSelected ? 38 : isCritical ? 32 : 26;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="${size}" height="${size}">
      <defs>
        <filter id="glow-${norm}" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      ${
        isSelected
          ? `<circle cx="16" cy="16" r="14" fill="none" stroke="${c.fill}" stroke-width="2" stroke-dasharray="3 3">
               <animateTransform attributeName="transform" type="rotate" from="0 16 16" to="360 16 16" dur="6s" repeatCount="indefinite" />
             </circle>`
          : ''
      }
      ${
        isCritical
          ? `<circle cx="16" cy="16" r="11" fill="none" stroke="#f87171" stroke-width="1.5" opacity="0.8">
               <animate attributeName="r" values="9;15;9" dur="1.8s" repeatCount="indefinite" />
               <animate attributeName="opacity" values="0.9;0.1;0.9" dur="1.8s" repeatCount="indefinite" />
             </circle>`
          : ''
      }
      <!-- Botanical Water Droplet Pin Shape -->
      <path d="M16 3C11 10 7 15.5 7 20a9 9 0 0 0 18 0c0-4.5-4-10-9-17z" fill="${c.fill}" stroke="#2d3029" stroke-width="1.5" filter="drop-shadow(0 2px 6px ${c.glow})" />
      <circle cx="16" cy="19" r="3.5" fill="#ffffff" />
    </svg>
  `;

  return L.divIcon({
    className: 'custom-drain-marker',
    html: svg,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
};

export const DrainMap: React.FC<DrainMapProps> = ({
  drains,
  selectedDrain,
  onSelectDrain,
  className = 'h-[480px]',
}) => {
  const [mapStyle, setMapStyle] = useState<'dark' | 'satellite' | 'streets'>('dark');

  // Center map around Mumbai coordinates (approx 19.05, 72.86)
  const defaultCenter: [number, number] = useMemo(() => {
    if (drains.length === 0) return [19.076, 72.8777];
    const avgLat = drains.reduce((acc, d) => acc + d.location.lat, 0) / drains.length;
    const avgLng = drains.reduce((acc, d) => acc + d.location.lng, 0) / drains.length;
    return [avgLat, avgLng];
  }, [drains]);

  const targetCoords: [number, number] | null = selectedDrain
    ? [selectedDrain.location.lat, selectedDrain.location.lng]
    : null;

  return (
    <div className={`relative rounded-2xl overflow-hidden border border-white/10 shadow-[0_20px_50px_rgba(16,22,17,0.7)] ${className}`}>
      <MapContainer
        center={defaultCenter}
        zoom={12}
        scrollWheelZoom={true}
        className={`w-full h-full z-0 bg-[#1b1e18] ${mapStyle === 'dark' ? 'map-dark-mode' : ''}`}
      >
        {/* Free, Reliable Tile Layers with Zero API Key Requirements */}
        {mapStyle === 'dark' && (
          <TileLayer
            key="osm-dark"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            className="dark-map-tiles"
            maxZoom={19}
          />
        )}
        {mapStyle === 'satellite' && (
          <TileLayer
            key="esri-satellite"
            attribution='&copy; Esri &mdash; World Imagery'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            maxZoom={19}
          />
        )}
        {mapStyle === 'streets' && (
          <TileLayer
            key="osm-streets"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />
        )}

        <MapFlyTo target={targetCoords} />

        {drains.map((drain) => {
          const isSelected = selectedDrain?.id === drain.id;
          const silt = drain.siltLevelPercent ?? drain.telemetry?.silt_level_percent ?? 0;
          const score = drain.riskScore ?? drain.risk_assessment?.total_score ?? 0;
          const rawCat = (drain.riskCategory || drain.risk_assessment?.category || '').toString().toLowerCase();

          // Match municipal triage protocol & MapLegend:
          // Critical (>=85% silt or score>=80) -> Red
          // High (70-84% silt or score>=60) -> Amber
          // Moderate (40-69% silt or score>=35) -> Cyan
          // Low (<40% silt or score<35) -> Emerald Green
          let effectiveCat: RiskCategory = 'Low';
          if (rawCat === 'critical' || score >= 80 || silt >= 85) {
            effectiveCat = 'Critical';
          } else if (rawCat === 'high' || score >= 60 || silt >= 70) {
            effectiveCat = 'High';
          } else if (rawCat === 'medium' || rawCat === 'moderate' || score >= 35 || silt >= 40) {
            effectiveCat = 'Medium';
          } else {
            effectiveCat = 'Low';
          }

          const icon = createCustomMarker(effectiveCat, isSelected);

          return (
            <Marker
              key={drain.id}
              position={[drain.location.lat, drain.location.lng]}
              icon={icon}
              eventHandlers={{
                click: () => onSelectDrain(drain),
              }}
            >
              <Popup className="drain-popup">
                <div className="p-4 min-w-[250px] text-xs space-y-3 bg-[#2d3029] text-[#eef3e7]">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="font-mono text-xs text-white font-medium">
                      {drain.id}
                    </span>
                    <RiskBadge category={effectiveCat} score={drain.riskScore} size="sm" />
                  </div>

                  <div>
                    <h4 className="font-medium text-sm text-white leading-tight">
                      {drain.name}
                    </h4>
                    <p className="text-[11px] text-[#a4aca0] mt-0.5 line-clamp-2">
                      {drain.location.address}
                    </p>
                  </div>

                  {/* Silt Meter */}
                  <div className="space-y-1.5 pt-1 border-t border-white/10 text-[11px]">
                    <div>
                      <div className="flex justify-between font-mono text-[10px] text-[#d5dbc9] mb-1">
                        <span>Acoustic Silt Choke</span>
                        <span className="font-medium text-[#86efac]">
                          {drain.siltLevelPercent ?? drain.telemetry.silt_level_percent}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-[#242720] rounded-full overflow-hidden border border-white/10">
                        <div
                          className={`h-full ${
                            (drain.siltLevelPercent ?? drain.telemetry.silt_level_percent) >= 80
                              ? 'bg-rose-500'
                              : (drain.siltLevelPercent ?? drain.telemetry.silt_level_percent) >= 50
                              ? 'bg-amber-400'
                              : 'bg-emerald-400'
                          }`}
                          style={{
                            width: `${drain.siltLevelPercent ?? drain.telemetry.silt_level_percent}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/10">
                    <StatusBadge status={drain.status} size="sm" />
                    <button
                      onClick={() => onSelectDrain(drain)}
                      className="text-[11px] font-medium text-[#86efac] hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <span>Inspect Telemetry</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Floating Legend in Bottom Left */}
      <div className="absolute bottom-4 left-4 z-[400] pointer-events-auto">
        <MapLegend />
      </div>

      {/* Top Right Controls: Layer Switcher & Active Assets Counter */}
      <div className="absolute top-4 right-4 z-[400] flex items-center gap-2 pointer-events-auto">
        <div className="bg-[#1b1e18]/90 backdrop-blur-md border border-white/10 p-1 rounded-full flex items-center gap-1 shadow-lg text-xs">
          <button
            type="button"
            onClick={() => setMapStyle('dark')}
            className={`px-2.5 py-1 rounded-full font-mono text-[10px] tracking-wider uppercase transition-all cursor-pointer ${
              mapStyle === 'dark'
                ? 'bg-[#86efac]/20 text-[#86efac] border border-[#86efac]/40 font-semibold'
                : 'text-[#a4aca0] hover:text-white'
            }`}
          >
            Dark
          </button>
          <button
            type="button"
            onClick={() => setMapStyle('satellite')}
            className={`px-2.5 py-1 rounded-full font-mono text-[10px] tracking-wider uppercase transition-all cursor-pointer ${
              mapStyle === 'satellite'
                ? 'bg-[#86efac]/20 text-[#86efac] border border-[#86efac]/40 font-semibold'
                : 'text-[#a4aca0] hover:text-white'
            }`}
          >
            Satellite
          </button>
          <button
            type="button"
            onClick={() => setMapStyle('streets')}
            className={`px-2.5 py-1 rounded-full font-mono text-[10px] tracking-wider uppercase transition-all cursor-pointer ${
              mapStyle === 'streets'
                ? 'bg-[#86efac]/20 text-[#86efac] border border-[#86efac]/40 font-semibold'
                : 'text-[#a4aca0] hover:text-white'
            }`}
          >
            Streets
          </button>
        </div>

        <div className="bg-[#1b1e18]/90 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full flex items-center gap-2 text-xs font-mono text-[#eef3e7] shadow-lg">
          <Layers className="w-3.5 h-3.5 text-[#86efac]" />
          <span className="text-[11px] text-[#d5dbc9] font-normal">
            Active Assets: <b className="text-[#86efac]">{drains.length}</b>
          </span>
        </div>
      </div>
    </div>
  );
};
