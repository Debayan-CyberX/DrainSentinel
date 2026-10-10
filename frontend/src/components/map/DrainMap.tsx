import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Drain, RiskCategory } from '../../types';
import { RiskBadge } from '../common/RiskBadge';
import { StatusBadge } from '../common/StatusBadge';
import { MapLegend } from './MapLegend';
import { MapPin, ArrowRight } from 'lucide-react';

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

// Create custom SVG markers for clean, crisp rendering
const createCustomMarker = (category: RiskCategory | string = 'low', isSelected: boolean) => {
  const norm = category.toString().toLowerCase();

  const colors: Record<string, { fill: string; stroke: string }> = {
    low: { fill: '#10b981', stroke: '#065f46' },
    medium: { fill: '#f59e0b', stroke: '#92400e' },
    moderate: { fill: '#f59e0b', stroke: '#92400e' },
    high: { fill: '#f97316', stroke: '#9a3412' },
    critical: { fill: '#f43f5e', stroke: '#881337' },
  };

  const c = colors[norm] || colors.low;
  const size = isSelected ? 34 : 26;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}">
      ${
        isSelected
          ? `<circle cx="12" cy="12" r="11" fill="none" stroke="${c.fill}" stroke-width="2" stroke-opacity="0.8" />`
          : ''
      }
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="${
        c.fill
      }" stroke="#ffffff" stroke-width="1.5" />
      <circle cx="12" cy="9" r="2.8" fill="#ffffff" />
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
    <div className={`relative rounded-xl overflow-hidden border border-slate-200/90 shadow-sm ${className}`}>
      <MapContainer
        center={defaultCenter}
        zoom={12}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapFlyTo target={targetCoords} />

        {drains.map((drain) => {
          const isSelected = selectedDrain?.id === drain.id;
          const icon = createCustomMarker(drain.riskCategory || 'low', isSelected);

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
                <div className="p-1 min-w-[220px] text-xs">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1.5 mb-2">
                    <span className="font-mono font-bold text-slate-900">
                      {drain.id}
                    </span>
                    <RiskBadge category={drain.riskCategory || 'Low'} score={drain.riskScore} size="sm" />
                  </div>

                  <div className="font-semibold text-slate-800 leading-snug mb-0.5">
                    {drain.name}
                  </div>
                  <div className="text-[11px] text-slate-500 mb-1">
                    {drain.location.address}
                  </div>
                  <div className="text-[10px] text-teal-800 font-semibold mb-2">
                    {drain.location.ward}
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 bg-slate-50 p-1.5 rounded border border-slate-100 mb-2 text-[11px]">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Silt Buildup</span>
                      <span className="font-semibold font-mono text-slate-700">
                        {drain.siltLevelPercent ?? drain.telemetry.silt_level_percent}%
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Conduit</span>
                      <span className="font-semibold font-mono text-slate-700">
                        {drain.pipe_diameter_mm} mm
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <StatusBadge status={drain.status} size="sm" />
                    <button
                      onClick={() => onSelectDrain(drain)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 hover:text-teal-900"
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

      {/* Floating Legend */}
      <div className="absolute bottom-4 left-4 z-10">
        <MapLegend />
      </div>

      {/* Floating Status Pill */}
      <div className="absolute top-4 right-4 z-10 bg-white/95 backdrop-blur-sm border border-slate-200/90 rounded-lg px-3 py-1.5 shadow-sm text-xs flex items-center gap-2">
        <MapPin className="w-3.5 h-3.5 text-teal-600" />
        <span className="font-medium text-slate-700">
          Mumbai Catchment &bull; {drains.length} Assets
        </span>
      </div>
    </div>
  );
};
