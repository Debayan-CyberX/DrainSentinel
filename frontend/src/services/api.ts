import {
  Drain,
  CitizenReport,
  InspectionTask,
  ReportCreate,
  TaskStatus,
  DrainIntelligence,
  DraftRecommendation,
  WeatherForecastResponse,
  CityWidePredictiveSummary,
  DrainPrediction,
} from '../types';

export interface HealthStatus {
  status: string;
  service: string;
  version: string;
  environment: string;
  timestamp: string;
  cloud_readiness: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

/**
 * Fetch backend health status.
 */
export async function checkBackendHealth(): Promise<HealthStatus> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  try {
    const response = await fetch(`${API_BASE_URL}/api/health`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * GET /api/v1/drains
 */
export async function fetchDrains(params?: {
  ward?: string;
  risk_category?: string;
  status?: string;
  search?: string;
  rainfall_rate_mm_h?: number;
}): Promise<Drain[]> {
  const query = new URLSearchParams();
  if (params?.ward && params.ward !== 'ALL') query.set('ward', params.ward);
  if (params?.risk_category && params.risk_category !== 'ALL')
    query.set('risk_category', params.risk_category);
  if (params?.status && params.status !== 'ALL') query.set('status', params.status);
  if (params?.search) query.set('search', params.search);
  if (params?.rainfall_rate_mm_h !== undefined)
    query.set('rainfall_rate_mm_h', params.rainfall_rate_mm_h.toString());

  const url = `${API_BASE_URL}/api/v1/drains${query.toString() ? '?' + query.toString() : ''}`;
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`Failed to fetch drains: ${response.statusText}`);
  const data: Drain[] = await response.json();

  // Populate helper fields for UI compatibility
  return data.map((d) => ({
    ...d,
    siltLevelPercent: d.telemetry.silt_level_percent,
    riskScore: d.risk_assessment?.total_score || Math.round(d.telemetry.silt_level_percent),
    riskCategory: d.risk_assessment?.category || 'Low',
  }));
}

/**
 * GET /api/v1/drains/{drain_id}
 */
export async function fetchDrain(drainId: string): Promise<Drain> {
  const response = await fetch(`${API_BASE_URL}/api/v1/drains/${drainId}`, {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) throw new Error(`Drain ${drainId} not found`);
  const d: Drain = await response.json();
  return {
    ...d,
    siltLevelPercent: d.telemetry.silt_level_percent,
    riskScore: d.risk_assessment?.total_score || Math.round(d.telemetry.silt_level_percent),
    riskCategory: d.risk_assessment?.category || 'Low',
  };
}

/**
 * GET /api/v1/reports
 */
export async function fetchReports(params?: {
  status?: string;
  drain_id?: string;
}): Promise<CitizenReport[]> {
  const query = new URLSearchParams();
  if (params?.status && params.status !== 'ALL') query.set('status', params.status);
  if (params?.drain_id) query.set('drain_id', params.drain_id);

  const url = `${API_BASE_URL}/api/v1/reports${query.toString() ? '?' + query.toString() : ''}`;
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`Failed to fetch reports: ${response.statusText}`);
  return await response.json();
}

/**
 * POST /api/v1/reports
 */
export async function submitReport(reportData: ReportCreate): Promise<CitizenReport> {
  const response = await fetch(`${API_BASE_URL}/api/v1/reports`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(reportData),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(err.detail || 'Failed to submit report');
  }
  return await response.json();
}

/**
 * GET /api/v1/tasks
 */
export async function fetchTasks(params?: {
  status?: string;
  drain_id?: string;
}): Promise<InspectionTask[]> {
  const query = new URLSearchParams();
  if (params?.status && params.status !== 'ALL') query.set('status', params.status);
  if (params?.drain_id) query.set('drain_id', params.drain_id);

  const url = `${API_BASE_URL}/api/v1/tasks${query.toString() ? '?' + query.toString() : ''}`;
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`Failed to fetch tasks: ${response.statusText}`);
  return await response.json();
}

/**
 * POST /api/v1/tasks
 */
export async function createInspectionTask(taskData: {
  drain_id: string;
  title: string;
  issue_description: string;
  priority?: string;
  assigned_crew?: string;
  notes?: string;
}): Promise<InspectionTask> {
  const response = await fetch(`${API_BASE_URL}/api/v1/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(taskData),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(err.detail || 'Failed to create task');
  }
  return await response.json();
}

/**
 * PATCH /api/v1/tasks/{task_id}
 */
export async function updateInspectionTask(
  taskId: string,
  updateData: {
    status?: TaskStatus;
    assigned_crew?: string;
    priority?: string;
    notes?: string;
    verification_photo_url?: string;
  }
): Promise<InspectionTask> {
  const response = await fetch(`${API_BASE_URL}/api/v1/tasks/${taskId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(updateData),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(err.detail || 'Failed to update task state');
  }
  return await response.json();
}

/**
 * GET /api/v1/drains/{drain_id}/intelligence
 */
export async function fetchDrainIntelligence(drainId: string): Promise<DrainIntelligence> {
  const response = await fetch(`${API_BASE_URL}/api/v1/drains/${drainId}/intelligence`, {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(err.detail || 'Failed to fetch drain intelligence');
  }
  return await response.json();
}

/**
 * POST /api/v1/drains/{drain_id}/intelligence/approve
 */
export async function approveIntelligenceRecommendation(
  drainId: string,
  recommendation: DraftRecommendation
): Promise<InspectionTask> {
  const response = await fetch(`${API_BASE_URL}/api/v1/drains/${drainId}/intelligence/approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(recommendation),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(err.detail || 'Failed to approve recommendation');
  }
  return await response.json();
}

/**
 * GET /api/v1/weather/live
 */
export async function fetchLiveWeather(refresh: boolean = false): Promise<WeatherForecastResponse> {
  const url = `${API_BASE_URL}/api/v1/weather/live${refresh ? '?refresh=true' : ''}`;
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`Failed to fetch live weather: ${response.statusText}`);
  return await response.json();
}

/**
 * GET /api/v1/weather/predictive-summary
 */
export async function fetchPredictiveSummary(
  simulatedRainOverride?: number
): Promise<CityWidePredictiveSummary> {
  const query = new URLSearchParams();
  if (simulatedRainOverride !== undefined && simulatedRainOverride >= 0) {
    query.set('simulated_rain_override', simulatedRainOverride.toString());
  }
  const url = `${API_BASE_URL}/api/v1/weather/predictive-summary${query.toString() ? '?' + query.toString() : ''}`;
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`Failed to fetch predictive summary: ${response.statusText}`);
  return await response.json();
}

/**
 * GET /api/v1/weather/drains/{drain_id}/prediction
 */
export async function fetchDrainPrediction(drainId: string): Promise<DrainPrediction> {
  const url = `${API_BASE_URL}/api/v1/weather/drains/${drainId}/prediction`;
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`Failed to fetch prediction for ${drainId}: ${response.statusText}`);
  return await response.json();
}


