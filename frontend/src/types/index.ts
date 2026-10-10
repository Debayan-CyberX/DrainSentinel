export type RiskCategory = 'Low' | 'Medium' | 'High' | 'Critical' | 'low' | 'moderate' | 'high' | 'critical';

export type TaskStatus =
  | 'Reported'
  | 'Risk Assessed'
  | 'Assigned'
  | 'Inspected'
  | 'Repair in Progress'
  | 'Resolved'
  | 'Verified';

export type PriorityLevel = 'P1 - Critical' | 'P2 - High' | 'P3 - Standard' | 'P4 - Routine';

export interface FactorBreakdown {
  raw_value: number;
  normalized_score: number;
  weight: number;
  weighted_score: number;
}

export interface RiskFactors {
  blockage_severity: FactorBreakdown;
  rainfall_risk: FactorBreakdown;
  exposure: FactorBreakdown;
  report_confidence: FactorBreakdown;
  data_freshness: FactorBreakdown;
}

export interface RiskAssessment {
  total_score: number;
  category: 'Low' | 'Medium' | 'High' | 'Critical';
  factors: RiskFactors;
  explanation: string;
  prototype_disclaimer: string;
}

export interface DrainLocation {
  lat: number;
  lng: number;
  address: string;
  landmark: string;
  ward: string;
}

export interface DrainTelemetry {
  silt_level_percent: number;
  water_level_cm: number;
  flow_velocity_mps: number;
  sensor_health: string;
  last_updated: string;
}

export interface DrainageHistory {
  flood_events_past_3yr: number;
  chronic_vulnerability_index: number;
  last_desilted_date: string;
  days_since_desilting: number;
  historical_silt_accumulation_rate_cm_month: number;
  trend: string;
  notable_flooding_hotspot_reason?: string | null;
}

export interface Drain {
  id: string;
  name: string;
  location: DrainLocation;
  catchment_zone: string;
  drain_type: string;
  pipe_diameter_mm: number;
  elevation_meters: number;
  exposure_tier: string;
  telemetry: DrainTelemetry;
  status: string;
  active_report_count: number;
  has_verified_report: boolean;
  risk_assessment?: RiskAssessment;
  assigned_crew?: string;
  drainage_history?: DrainageHistory;
  // UI helper getters
  siltLevelPercent?: number;
  riskScore?: number;
  riskCategory?: RiskCategory;
}

export interface InspectionTask {
  id: string;
  drain_id: string;
  report_id?: string | null;
  title: string;
  issue_description: string;
  risk_score: number;
  risk_category: string;
  priority: PriorityLevel | string;
  status: TaskStatus;
  assigned_crew?: string | null;
  created_at: string;
  updated_at: string;
  due_date: string;
  notes?: string | null;
  verification_photo_url?: string | null;
}

export interface ReportLocation {
  lat: number;
  lng: number;
  address: string;
  ward?: string;
}

export interface ReportCreate {
  drain_id?: string;
  location: ReportLocation;
  issue_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  photo_url?: string;
  reporter_name?: string;
  is_citizen?: boolean;
}

export interface CitizenReport {
  id: string;
  drain_id?: string | null;
  location: ReportLocation;
  issue_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  photo_url?: string | null;
  reporter_name: string;
  status: 'unverified' | 'reviewed' | 'triaged' | 'dismissed';
  is_citizen: boolean;
  is_duplicate: boolean;
  duplicate_of?: string | null;
  created_at: string;
  linked_task_id?: string | null;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  type: 'inspection_dispatched' | 'report_filed' | 'status_updated' | 'verification_pending' | 'resolved';
  drainId: string;
  message: string;
  actor: string;
}

export interface WeatherScenario {
  id: 'dry' | 'moderate_rain' | 'heavy_downpour' | 'torrential_storm' | 'live_forecast';
  name: string;
  intensity: string;
  rainfallRateMmH: number;
  description: string;
  riskMultiplier: number;
}

export type NavigationPage =
  | 'overview'
  | 'map'
  | 'reports'
  | 'inspections'
  | 'analytics'
  | 'settings'
  | 'sylva'
  | 'login';

export interface DraftRecommendation {
  priority: string;
  suggested_crew: string;
  recommended_actions: string[];
  equipment_needed: string[];
  urgency: string;
}

export interface DrainIntelligence {
  drain_id: string;
  drain_name: string;
  generated_at: string;
  is_ai_generated: boolean;
  provider: string;
  summary: string;
  risk_factor_explanation: string[];
  missing_or_conflicting_info: string[];
  draft_recommendation: DraftRecommendation;
  human_approval_required: boolean;
  disclaimer: string;
}

export interface HourlyForecastPoint {
  time: string;
  precipitation_mm: number;
  rain_probability_pct?: number | null;
}

export interface WeatherForecastResponse {
  location_name: string;
  latitude: number;
  longitude: number;
  current_rain_mm_h: number;
  current_temp_c: number;
  weather_code: number;
  weather_condition: string;
  is_live_feed: boolean;
  fetched_at: string;
  hourly_forecast: HourlyForecastPoint[];
  max_forecast_rain_mm_h: number;
  peak_forecast_time?: string | null;
}

export interface DrainPrediction {
  drain_id: string;
  drain_name: string;
  ward: string;
  elevation_meters: number;
  current_silt_percent: number;
  hydraulic_headroom_percent: number;
  historical_flood_events: number;
  chronic_vulnerability_index: number;
  critical_threshold_mm_h: number;
  forecast_rain_at_peak_mm_h: number;
  time_to_overflow_hours?: number | null;
  predicted_waterlogging_stage: string;
  preventive_recommendation: string;
  projected_peak_risk_score: number;
}

export interface CityWidePredictiveSummary {
  total_assets: number;
  chronic_flood_hotspot_count: number;
  imminent_overflow_count: number;
  elevated_risk_count: number;
  average_hydraulic_headroom_percent: number;
  live_weather: WeatherForecastResponse;
  predictions: DrainPrediction[];
}


