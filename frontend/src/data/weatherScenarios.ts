import { WeatherScenario } from '../types';

export const WEATHER_SCENARIOS: WeatherScenario[] = [
  {
    id: 'live_forecast',
    name: '🌐 Live Mumbai Forecast (Open-Meteo)',
    intensity: 'Real-Time API',
    rainfallRateMmH: 0.2,
    description: 'Real-time meteorological observations and precipitation curve from Open-Meteo.',
    riskMultiplier: 1.0,
  },
  {
    id: 'dry',
    name: 'Dry Weather Baseline',
    intensity: '0 mm/h (Fair)',
    rainfallRateMmH: 0,
    description: 'Dry pavement condition. Baseline silt levels and gravity flow.',
    riskMultiplier: 1.0,
  },
  {
    id: 'moderate_rain',
    name: 'Monsoon Showers',
    intensity: '15 mm/h (Steady)',
    rainfallRateMmH: 15.0,
    description: 'Regular monsoon showers. Runoff active in Lowlands and subway dips.',
    riskMultiplier: 1.25,
  },
  {
    id: 'heavy_downpour',
    name: 'Heavy Mumbai Downpour',
    intensity: '40 mm/h (Surge)',
    rainfallRateMmH: 40.0,
    description: 'Intense precipitation. Milan, Hindmata, and Andheri subways experience elevated surcharge risk.',
    riskMultiplier: 1.55,
  },
  {
    id: 'torrential_storm',
    name: 'Severe Cloudburst & High Tide',
    intensity: '75 mm/h (Extreme)',
    rainfallRateMmH: 75.0,
    description: 'Torrential cloudburst coincident with Arabian Sea high tide (>4.5m). Sluices close, backflow risk critical.',
    riskMultiplier: 1.9,
  },
];
