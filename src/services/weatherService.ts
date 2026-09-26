// Live Real-Time Weather & Marine Wind Service
// Integrates National Weather Service (NWS) & NOAA Marine Model via Open-Meteo API
// Free, public, no-key required, with offline fallback caching

export type WeatherCategory = 'Rain' | 'Cloudy' | 'Clear' | 'Partly Cloudy' | 'Thunderstorm';

export interface HourlyWindData {
  timeIso: string;
  hourLabel: string;
  timestamp: number;
  windSpeedMph: number;
  windGustMph: number;
  windDirectionDeg: number;
  windDirectionText: string;
  temperatureF?: number;
  weatherCode?: number;
  precipitationProbability: number; // 0 - 100%
  cloudCover: number; // 0 - 100%
  weatherCategory: WeatherCategory;
  conditionSummary: string; // e.g. "Rain: 75% chance" or "Cloudy: 80% coverage" or "Clear: 10% clouds"
}

function degToCompass(deg: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(deg / 22.5) % 16;
  return directions[index];
}

export function parseWeatherCondition(
  code: number = 0, 
  precipProb: number = 0, 
  clouds: number = 0
): { category: WeatherCategory; summary: string } {
  // Thunderstorm
  if ([95, 96, 99].includes(code)) {
    return {
      category: 'Thunderstorm',
      summary: `Thunderstorms (${Math.max(precipProb, 50)}% chance)`
    };
  }

  // Rain / Showers / Drizzle or high rain probability
  const isRainCode = [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code);
  if (isRainCode || precipProb >= 35) {
    const chance = Math.max(precipProb, isRainCode ? 45 : 0);
    return {
      category: 'Rain',
      summary: `Rain: ${chance}% chance`
    };
  }

  // Cloudy (Overcast or high cloud coverage)
  if (clouds >= 60 || code === 3) {
    return {
      category: 'Cloudy',
      summary: `Cloudy: ${clouds}% coverage`
    };
  }

  // Partly Cloudy
  if (clouds >= 25 || [1, 2].includes(code)) {
    return {
      category: 'Partly Cloudy',
      summary: `Partly Cloudy: ${clouds}% clouds`
    };
  }

  // Clear
  return {
    category: 'Clear',
    summary: `Clear: ${clouds}% clouds`
  };
}

const cache: { [key: string]: { data: HourlyWindData[]; timestamp: number } } = {};
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache

export async function fetchLiveMarineWind(lat: number, lng: number): Promise<HourlyWindData[] | null> {
  const key = `${lat.toFixed(3)},${lng.toFixed(3)}`;
  const now = Date.now();

  if (cache[key] && now - cache[key].timestamp < CACHE_TTL_MS) {
    return cache[key].data;
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&hourly=wind_speed_10m,wind_gusts_10m,wind_direction_10m,temperature_2m,weather_code,precipitation_probability,cloud_cover&wind_speed_unit=mph&temperature_unit=fahrenheit&forecast_days=3`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Weather API error status ${res.status}`);
    }
    const json = await res.json();
    if (!json.hourly || !json.hourly.time) {
      return null;
    }

    const times: string[] = json.hourly.time;
    const speeds: number[] = json.hourly.wind_speed_10m || [];
    const gusts: number[] = json.hourly.wind_gusts_10m || [];
    const directions: number[] = json.hourly.wind_direction_10m || [];
    const temps: number[] = json.hourly.temperature_2m || [];
    const codes: number[] = json.hourly.weather_code || [];
    const precipProbs: number[] = json.hourly.precipitation_probability || [];
    const cloudCovers: number[] = json.hourly.cloud_cover || [];

    const result: HourlyWindData[] = times.map((tStr, idx) => {
      // Parse ISO timestamp into local representation
      const ts = new Date(tStr).getTime();
      const d = new Date(ts);
      const hourLabel = d.toLocaleTimeString([], { hour: 'numeric', hour12: true });
      const dirDeg = directions[idx] ?? 0;
      const code = codes[idx] ?? 0;
      const precipProb = Math.round(precipProbs[idx] ?? 0);
      const cloud = Math.round(cloudCovers[idx] ?? 0);

      const { category, summary } = parseWeatherCondition(code, precipProb, cloud);

      return {
        timeIso: tStr,
        hourLabel,
        timestamp: ts,
        windSpeedMph: Math.round(speeds[idx] ?? 0),
        windGustMph: Math.round(gusts[idx] ?? (speeds[idx] ? speeds[idx] * 1.3 : 0)),
        windDirectionDeg: dirDeg,
        windDirectionText: degToCompass(dirDeg),
        temperatureF: temps[idx] ? Math.round(temps[idx]) : undefined,
        weatherCode: code,
        precipitationProbability: precipProb,
        cloudCover: cloud,
        weatherCategory: category,
        conditionSummary: summary
      };
    });

    cache[key] = { data: result, timestamp: now };
    return result;
  } catch (err) {
    console.warn('Could not fetch live weather from NOAA/NWS API, using tidal calculation model:', err);
    return null;
  }
}
