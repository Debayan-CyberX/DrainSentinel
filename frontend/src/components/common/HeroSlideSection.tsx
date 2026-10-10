import React, { useState, useEffect } from 'react';
import {
  Waves,
  Shield,
  Clock,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Droplets,
  Activity,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { WeatherScenario } from '../../types';

interface HeroSlideSectionProps {
  currentWeather: WeatherScenario;
  onNavigateToMap: () => void;
  onNavigateToInspections: () => void;
  onOpenReportModal: () => void;
  onOpenSylva3D?: () => void;
}

interface Slide {
  id: string;
  tag: string;
  title: string;
  highlightWord: string;
  description: string;
  badge1: { label: string; value: string };
  badge2: { label: string; value: string };
  badge3: { label: string; value: string };
  primaryAction: { label: string; onClick: () => void };
  secondaryAction?: { label: string; onClick: () => void };
}

export const HeroSlideSection: React.FC<HeroSlideSectionProps> = ({
  currentWeather,
  onNavigateToMap,
  onNavigateToInspections,
  onOpenReportModal,
  onOpenSylva3D,
}) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const slides: Slide[] = [
    {
      id: 'sensing',
      tag: 'ECOLOGICAL CATCHMENT STEWARDSHIP',
      title: 'Nature-Based Hydraulic Sensing &',
      highlightWord: 'Living Bio-Swale Telemetry',
      description:
        'Continuous ultrasonic silt depth monitoring, vegetal water absorption tracking, and sponge-drain capacity across Greater Mumbai’s 24 urban catchments.',
      badge1: { label: 'Living Catchments', value: '25 Sump Basins' },
      badge2: { label: 'Acoustic Pulse', value: '40 kHz Active' },
      badge3: { label: 'Network Health', value: '100% Online' },
      primaryAction: { label: 'Explore Catchment Map', onClick: onNavigateToMap },
      secondaryAction: { label: 'Report Drain Obstruction', onClick: onOpenReportModal },
    },
    {
      id: 'prediction',
      tag: 'HYDROLOGIC INUNDATION ENGINE',
      title: 'Time-To-Overflow (TTO)',
      highlightWord: 'Predictive Sponge Defense',
      description:
        'Synthesizing real-time Open-Meteo precipitation curves with elevation gradient, soil saturation, and culvert sedimentation to forecast runoff bottlenecks.',
      badge1: { label: 'Rainfall Inflow', value: `${currentWeather.rainfallRateMmH} mm/h` },
      badge2: { label: 'Forecast Horizon', value: '8 Hours Ahead' },
      badge3: { label: 'TTO Alert Lead', value: '< 2h Imminent' },
      primaryAction: { label: 'View Catchment Analytics', onClick: onNavigateToMap },
      secondaryAction: { label: 'Simulate Storm Rainfall', onClick: onNavigateToMap },
    },
    {
      id: 'dispatch',
      tag: 'RESTORE WILD RUNOFF EQUILIBRIUM',
      title: 'Automated Municipal Triage &',
      highlightWord: 'Field Steward Dispatch',
      description:
        'Deterministic 5-factor risk scoring generates instant work orders, dispatching specialized desilting squads and drainage crews before street flooding occurs.',
      badge1: { label: 'Risk Engine', value: '5-Factor Model' },
      badge2: { label: 'Response Units', value: 'Eco-Jet Crews' },
      badge3: { label: 'Resolution Audit', value: 'Photo Verified' },
      primaryAction: { label: 'Open Work Orders', onClick: onNavigateToInspections },
      secondaryAction: { label: 'File Observation', onClick: onOpenReportModal },
    },
  ];

  // Auto-advance slides every 7 seconds unless hovered
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % slides.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [isPaused, slides.length]);

  const currentSlide = slides[currentSlideIndex];

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative rounded-3xl bg-gradient-to-b from-[#383b34]/95 via-[#2d3029]/95 to-[#242720]/95 backdrop-blur-2xl border border-white/10 shadow-[0_24px_64px_-15px_rgba(16,22,17,0.65)] overflow-hidden transition-all p-6 sm:p-8 lg:p-10 select-none"
    >
      {/* Decorative ambient light pools (sampled from Sylva authored hero) */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#86efac]/40 to-transparent" />
      <div className="absolute -top-32 left-1/4 w-96 h-96 bg-[#86efac]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 right-1/4 w-96 h-96 bg-[#eef3e7]/8 rounded-full blur-3xl pointer-events-none" />

      {/* Main Slide Content with Fade/Slide Key */}
      <div className="relative z-10">
        {/* Top Tag & Slide Counter */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-[#86efac] shadow-[0_0_10px_#86efac] animate-pulse" />
            <span className="font-mono text-[11px] font-medium tracking-wider text-[#86efac] uppercase">
              {currentSlide.tag}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {onOpenSylva3D && (
              <button
                onClick={onOpenSylva3D}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#86efac]/15 hover:bg-[#86efac]/25 border border-[#86efac]/30 text-[#86efac] text-[11px] font-medium transition-colors cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                <span>Open 3D Living World</span>
              </button>
            )}
            <div className="flex items-center gap-2 font-mono text-[11px] text-[#a4aca0]">
              <span className="text-white font-semibold">0{currentSlideIndex + 1}</span>
              <span>/</span>
              <span>0{slides.length}</span>
            </div>
          </div>
        </div>

        {/* Hero Title & Description */}
        <div key={currentSlide.id} className="pt-6 sm:pt-8 max-w-3xl animate-in fade-in slide-in-from-right-4 duration-500">
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-light tracking-tight text-white leading-[1.18]">
            {currentSlide.title}{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#86efac] via-[#4ade80] to-[#eef3e7] font-normal">
              {currentSlide.highlightWord}
            </span>
          </h1>

          <p className="mt-4 text-sm sm:text-base text-[#d5dbc9] leading-relaxed font-light max-w-2xl">
            {currentSlide.description}
          </p>

          {/* Telemetry Stat Badges */}
          <div className="mt-6 flex flex-wrap gap-2.5 sm:gap-3">
            {[currentSlide.badge1, currentSlide.badge2, currentSlide.badge3].map((b, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#2d3029]/90 border border-white/10 text-xs font-mono shadow-xs"
              >
                <span className="text-[#a4aca0] text-[11px]">{b.label}:</span>
                <span className="font-medium text-[#86efac]">{b.value}</span>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              onClick={currentSlide.primaryAction.onClick}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full pill-button text-xs font-medium cursor-pointer"
            >
              <span>{currentSlide.primaryAction.label}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            {currentSlide.secondaryAction && (
              <button
                onClick={currentSlide.secondaryAction.onClick}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#86efac]/40 text-[#eef3e7] text-xs font-light tracking-wide transition-all cursor-pointer"
              >
                <span>{currentSlide.secondaryAction.label}</span>
              </button>
            )}

            {onOpenSylva3D && (
              <button
                onClick={onOpenSylva3D}
                className="sm:hidden inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-[#86efac]/15 border border-[#86efac]/30 text-[#86efac] text-xs font-medium cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>3D World</span>
              </button>
            )}
          </div>
        </div>

        {/* Slide Navigation & Progress Bar */}
        <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Chapter Buttons */}
          <div className="flex items-center gap-2">
            {slides.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => setCurrentSlideIndex(idx)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-mono tracking-wider transition-all cursor-pointer ${
                  currentSlideIndex === idx
                    ? 'bg-[#eef3e7] text-[#23261f] font-semibold shadow-[0_2px_12px_rgba(238,243,231,0.25)]'
                    : 'text-[#a4aca0] hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                0{idx + 1} &bull; {s.id.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Arrows */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() =>
                setCurrentSlideIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1))
              }
              className="p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-[#d5dbc9] hover:text-white transition-colors cursor-pointer"
              aria-label="Previous Slide"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentSlideIndex((prev) => (prev + 1) % slides.length)}
              className="p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-[#d5dbc9] hover:text-white transition-colors cursor-pointer"
              aria-label="Next Slide"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Auto-Slide Progress Bar */}
        <div className="mt-3 w-full h-[2px] bg-white/10 rounded-full overflow-hidden">
          <div
            key={currentSlideIndex}
            className={`h-full bg-gradient-to-r from-[#86efac] to-[#4ade80] ${
              isPaused ? 'w-full opacity-50' : 'animate-[progress_7s_linear]'
            }`}
            style={{
              animation: isPaused ? 'none' : 'progress 7s linear infinite',
            }}
          />
        </div>
      </div>
    </div>
  );
};
