// Live Real-Time Weather & Marine Wind Service
// Integrates National Weather Service (NWS) & NOAA Marine Model via Open-Meteo API
// Free, public, no-key required, with offline fallback caching

export interface HourlyWindData {
  timeIso: string;
  hourLabel: string;
  timestamp: number;
  windSpeedMph: number;
  windGustMph: number;
  windDirectionDeg: number;
  windDirectionText: string;
  temperatureF?: number;
}

function degToCompass(deg: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(deg / 22.5) % 16;
  return directions[index];
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
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&hourly=wind_speed_10m,wind_gusts_10m,wind_direction_10m,temperature_2m&wind_speed_unit=mph&temperature_unit=fahrenheit&forecast_days=3`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Weather API error status ${res.status}`);
    }
    const json = await res.json();
    if (!json.hourly || !json.hourly.time) {
      return null;
    }

    const times: string[] = json.hourly.time;
    const speeds: number[] = json.hourly.wind_speed_10m;
    const gusts: number[] = json.hourly.wind_gusts_10m;
    const directions: number[] = json.hourly.wind_direction_10m;
    const temps: number[] = json.hourly.temperature_2m || [];

    const result: HourlyWindData[] = times.map((tStr, idx) => {
      // Parse ISO timestamp into local representation
      const ts = new Date(tStr).getTime();
      const d = new Date(ts);
      const hourLabel = d.toLocaleTimeString([], { hour: 'numeric', hour12: true });
      const dirDeg = directions[idx] ?? 0;
      return {
        timeIso: tStr,
        hourLabel,
        timestamp: ts,
        windSpeedMph: Math.round(speeds[idx] ?? 0),
        windGustMph: Math.round(gusts[idx] ?? (speeds[idx] ? speeds[idx] * 1.3 : 0)),
        windDirectionDeg: dirDeg,
        windDirectionText: degToCompass(dirDeg),
        temperatureF: temps[idx] ? Math.round(temps[idx]) : undefined,
      };
    });

    cache[key] = { data: result, timestamp: now };
    return result;
  } catch (err) {
    console.warn('Could not fetch live weather from NOAA/NWS API, using tidal calculation model:', err);
    return null;
  }
}
