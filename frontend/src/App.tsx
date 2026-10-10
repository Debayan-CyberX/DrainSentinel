import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  NavigationPage,
  Drain,
  ActivityLog,
  CitizenReport,
  InspectionTask,
  WeatherScenario,
  TaskStatus,
} from './types';
import { WEATHER_SCENARIOS } from './data/weatherScenarios';
import { INITIAL_ACTIVITIES } from './data/mockActivities';
import {
  checkBackendHealth,
  fetchDrains,
  fetchReports,
  fetchTasks,
  updateInspectionTask,
  createInspectionTask,
  fetchLiveWeather,
} from './services/api';

import { Header } from './components/layout/Header';
import { DrainDetailModal } from './components/drains/DrainDetailModal';
import { ReportBlockageModal } from './components/reports/ReportBlockageModal';

import { OverviewView } from './views/OverviewView';
import { DrainMapView } from './views/DrainMapView';
import { InspectionsView } from './views/InspectionsView';
import { ReportsView } from './views/ReportsView';
import { AnalyticsView } from './views/AnalyticsView';
import { SettingsView } from './views/SettingsView';
import { Scene as SylvaHeroScene } from './views/SylvaHeroScene';
import { LivingNatureBackground } from './components/common/LivingNatureBackground';

export default function App() {
  const [activePage, setActivePage] = useState<NavigationPage>('overview');

  // Live Backend Data States
  const [drains, setDrains] = useState<Drain[]>([]);
  const [reports, setReports] = useState<CitizenReport[]>([]);
  const [tasks, setTasks] = useState<InspectionTask[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>(INITIAL_ACTIVITIES);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filter & Modal States
  const [currentWeather, setCurrentWeather] = useState<WeatherScenario>(WEATHER_SCENARIOS[0]);
  const [selectedWard, setSelectedWard] = useState<string>('ALL');
  const [selectedDrainId, setSelectedDrainId] = useState<string | null>(null);

  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [reportTargetDrain, setReportTargetDrain] = useState<Drain | null>(null);

  // Backend Health State
  const [backendStatus, setBackendStatus] = useState<'operational' | 'offline'>('offline');

  // Load initial data from real FastAPI backend
  const loadBackendData = useCallback(async (rainfallRate: number = 0.0) => {
    try {
      const [drainsData, reportsData, tasksData] = await Promise.all([
        fetchDrains({ rainfall_rate_mm_h: rainfallRate }),
        fetchReports(),
        fetchTasks(),
      ]);
      setDrains(drainsData);
      setReports(reportsData);
      setTasks(tasksData);
      setBackendStatus('operational');
    } catch (err) {
      console.error('Error fetching backend data:', err);
      setBackendStatus('offline');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkBackendHealth()
      .then(() => setBackendStatus('operational'))
      .catch(() => setBackendStatus('offline'));

    loadBackendData(currentWeather.rainfallRateMmH);

    // Real-time polling heartbeat (every 15s keeps map, reports, and tasks synchronised)
    const intervalId = setInterval(() => {
      loadBackendData(currentWeather.rainfallRateMmH);
    }, 15000);

    return () => clearInterval(intervalId);
  }, [loadBackendData, currentWeather.rainfallRateMmH]);

  const wallpaperIframeRef = useRef<HTMLIFrameElement>(null);

  // Synchronize active page with persistent 3D living wallpaper
  useEffect(() => {
    wallpaperIframeRef.current?.contentWindow?.postMessage({
      type: 'SET_PAGE',
      page: activePage,
    }, '*');
  }, [activePage]);

  // Forward scroll and pointer movements for continuous interactive 3D camera & particle physics
  useEffect(() => {
    const handleScroll = () => {
      wallpaperIframeRef.current?.contentWindow?.postMessage({
        type: 'SCROLL',
        scrollY: window.scrollY,
      }, '*');
    };

    const handlePointerMove = (e: PointerEvent) => {
      wallpaperIframeRef.current?.contentWindow?.postMessage({
        type: 'POINTER_MOVE',
        clientX: e.clientX,
        clientY: e.clientY,
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
      }, '*');
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('pointermove', handlePointerMove, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('pointermove', handlePointerMove);
    };
  }, []);

  // Handle postMessage events from the 3D living world iframe
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (!e.data || typeof e.data !== 'object') return;
      if (e.data.type === 'NAVIGATE' && e.data.page) {
        setActivePage(e.data.page as NavigationPage);
      } else if (e.data.type === 'OPEN_REPORT') {
        openReportModalForDrain(null);
      } else if (e.data.type === 'SCROLL_DOWN') {
        const el = document.getElementById('telemetry-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Handle weather scenario changes (triggers live risk recalculation on backend)
  const handleSelectWeather = useCallback(
    async (scenario: WeatherScenario) => {
      let rainRate = scenario.rainfallRateMmH;
      let updatedScenario = { ...scenario };

      if (scenario.id === 'live_forecast') {
        try {
          const live = await fetchLiveWeather();
          rainRate = live.current_rain_mm_h;
          updatedScenario = {
            ...scenario,
            rainfallRateMmH: live.current_rain_mm_h,
            intensity: `${live.current_temp_c}°C • ${live.current_rain_mm_h} mm/h`,
            description: `Live: ${live.weather_condition} in Mumbai (Open-Meteo API).`,
          };
        } catch (e) {
          console.error('Failed to fetch live weather:', e);
        }
      }

      setCurrentWeather(updatedScenario);
      setIsLoading(true);
      await loadBackendData(rainRate);
    },
    [loadBackendData]
  );

  // Distinct BMC wards
  const wards = useMemo(() => {
    return Array.from(new Set(drains.map((d) => d.location.ward))).sort();
  }, [drains]);

  // Drains filtered by selected BMC Ward
  const activeDrains = useMemo(() => {
    if (selectedWard === 'ALL') return drains;
    return drains.filter((d) => d.location.ward === selectedWard);
  }, [drains, selectedWard]);

  // Selected drain instance
  const selectedDrain = useMemo(() => {
    if (!selectedDrainId) return null;
    return drains.find((d) => d.id === selectedDrainId) || null;
  }, [selectedDrainId, drains]);

  // Handle workflow state transition
  const handleUpdateDrainStatus = useCallback(
    async (drainId: string, newStatus: TaskStatus, crew?: string) => {
      // Find if there is an active task for this drain
      const existingTask = tasks.find((t) => t.drain_id === drainId && t.status !== 'Verified');

      try {
        if (existingTask) {
          await updateInspectionTask(existingTask.id, {
            status: newStatus,
            assigned_crew: crew,
          });
        } else {
          // If no active task exists, create one in the target status
          await createInspectionTask({
            drain_id: drainId,
            title: `Inspection Work Order: ${drainId}`,
            issue_description: `Transitioned to ${newStatus} via municipal dispatch console.`,
            assigned_crew: crew,
          });
        }

        // Re-fetch data from backend to ensure synchronized state
        await loadBackendData(currentWeather.rainfallRateMmH);

        // Append log to activity stream
        const targetDrain = drains.find((d) => d.id === drainId);
        const newLog: ActivityLog = {
          id: `ACT-${Date.now()}`,
          timestamp: 'Just now',
          type:
            newStatus === 'Assigned'
              ? 'inspection_dispatched'
              : newStatus === 'Resolved' || newStatus === 'Verified'
              ? 'resolved'
              : 'status_updated',
          drainId,
          message: `${newStatus} stage reached for ${targetDrain?.name || drainId} (${crew || 'BMC SWD Team'})`,
          actor: 'BMC Dispatcher Vance',
        };
        setActivities((prev) => [newLog, ...prev]);
      } catch (err) {
        alert(err instanceof Error ? err.message : 'State transition error');
      }
    },
    [tasks, drains, currentWeather.rainfallRateMmH, loadBackendData]
  );

  // Handle report submission
  const handleReportSubmitted = useCallback(
    async (newReport: CitizenReport) => {
      // Refresh drains and tasks to show recalculated risk score and new work order
      await loadBackendData(currentWeather.rainfallRateMmH);

      const newLog: ActivityLog = {
        id: `ACT-${Date.now()}`,
        timestamp: 'Just now',
        type: 'report_filed',
        drainId: newReport.drain_id || 'Mumbai SWD Line',
        message: `New blockage report ${newReport.id} logged for ${newReport.location.address}`,
        actor: newReport.reporter_name,
      };
      setActivities((prev) => [newLog, ...prev]);
    },
    [currentWeather.rainfallRateMmH, loadBackendData]
  );

  const openReportModalForDrain = (drain?: Drain | null) => {
    setReportTargetDrain(drain || null);
    setIsReportModalOpen(true);
  };

  const openInspectionsCount = useMemo(() => {
    return tasks.filter((t) => t.status !== 'Verified').length;
  }, [tasks]);

  const unreviewedReportsCount = useMemo(() => {
    return reports.filter((r) => r.status === 'unverified').length;
  }, [reports]);

  return (
    <div className="min-h-screen text-[#eef3e7] font-sans antialiased relative selection:bg-emerald-500/30 selection:text-white">
      {/* Persistent Full-Screen 3D Living Nature Wallpaper */}
      <div className="fixed inset-0 w-full h-full z-0 overflow-hidden pointer-events-none">
        <iframe
          ref={wallpaperIframeRef}
          src="/landing-pages/inner-green-3d.html"
          title="Living Waters 3D World"
          className="w-full h-full border-0 block pointer-events-auto"
          allow="autoplay; encrypted-media"
        />
      </div>

      {/* Main Container */}
      <div className="relative z-10 flex flex-col min-h-screen pointer-events-none">
        {/* Sylva Living Green Floating Dock Top Bar */}
        <div className="pointer-events-auto">
          <Header
            activePage={activePage}
            onNavigate={setActivePage}
            selectedWard={selectedWard}
            onSelectWard={setSelectedWard}
            wards={wards}
            currentWeather={currentWeather}
            onSelectWeather={handleSelectWeather}
            onOpenReportModal={() => openReportModalForDrain(null)}
            openInspectionsCount={openInspectionsCount}
            unreviewedReportsCount={unreviewedReportsCount}
          />
        </div>

        {/* Loading Indicator in Pale Lichen / Emerald */}
        {isLoading && (
          <div className="h-[2px] bg-gradient-to-r from-[#86efac] via-[#4ade80] to-[#22c55e] shadow-[0_0_12px_#86efac] animate-pulse w-full sticky top-16 z-50 pointer-events-auto" />
        )}

        {/* Main Workspace Views */}
        <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pointer-events-none">
          <div className="pb-16 pointer-events-auto">
            {activePage === 'overview' && (
              <OverviewView
                drains={activeDrains}
                activities={activities}
                selectedDrain={selectedDrain}
                onSelectDrain={(drain) => setSelectedDrainId(drain.id)}
                currentWeather={currentWeather}
                onNavigateToInspections={() => setActivePage('inspections')}
                onOpenReportModal={() => openReportModalForDrain(null)}
              />
            )}

            {activePage === 'map' && (
              <DrainMapView
                drains={activeDrains}
                selectedDrain={selectedDrain}
                onSelectDrain={(drain) => setSelectedDrainId(drain.id)}
                onOpenReportModal={() => openReportModalForDrain(null)}
              />
            )}

            {activePage === 'inspections' && (
              <InspectionsView
                tasks={tasks}
                drains={activeDrains}
                onSelectDrain={(drain) => setSelectedDrainId(drain.id)}
              />
            )}

            {activePage === 'reports' && (
              <ReportsView
                reports={reports}
                drains={activeDrains}
                onSelectDrain={(drain) => setSelectedDrainId(drain.id)}
                onOpenReportModal={() => openReportModalForDrain(null)}
              />
            )}

            {activePage === 'analytics' && (
              <AnalyticsView drains={activeDrains} />
            )}

            {activePage === 'settings' && (
              <SettingsView backendStatus={backendStatus} />
            )}
          </div>
        </main>
      </div>

      {/* Drain Detail Drawer */}
      <DrainDetailModal
        drain={selectedDrain}
        onClose={() => setSelectedDrainId(null)}
        onUpdateStatus={handleUpdateDrainStatus}
        onOpenReportModal={(d) => openReportModalForDrain(d)}
      />

      {/* Report Blockage Modal */}
      <ReportBlockageModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        drains={drains}
        initialDrain={reportTargetDrain}
        onReportSubmitted={handleReportSubmitted}
      />
    </div>
  );
}
