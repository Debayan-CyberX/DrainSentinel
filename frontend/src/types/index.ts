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
  id: 'dry' | 'moderate_rain' | 'heavy_downpour' | 'torrential_storm';
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
  | 'settings';
