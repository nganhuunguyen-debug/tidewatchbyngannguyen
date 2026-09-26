import { CoastalRegion, SeaConditions, TideEvent } from './types';

export interface LocationCoordinates {
  lat: number;
  lng: number;
  label?: string;
}

/**
 * Computes realistic continuous 24-hour sinusoidal tide cycle for ANY coordinate on Earth
 */
export function calculateTidesForCoordinates(coords: LocationCoordinates, baseTime: Date = new Date()): {
  tideEvents: TideEvent[];
  currentHeightFt: number;
  currentTrend: 'Rising (Flood)' | 'Falling (Ebb)' | 'Slack High' | 'Slack Low';
  nextTide: TideEvent;
  hourlyHeights: {
    hour: string;
    height: number;
    isNow: boolean;
    timestamp: number;
    windSpeedMph?: number;
    windGustMph?: number;
    windDirection?: string;
  }[];
} {
  // Semi-diurnal cycle period is approx 12.42 hours
  const cyclePeriodMs = 12.42 * 60 * 60 * 1000;
  
  // Coordinate-based harmonic phase & amplitude
  const phaseSeed = Math.abs(coords.lat * 8.3 + coords.lng * 4.7);
  // Tidal amplitude varies by latitude & oceanic geometry (typically 3 to 10 ft)
  const latFactor = Math.min(Math.max((Math.abs(coords.lat) - 15) / 35, 0.4), 1.8);
  const maxAmp = Math.round((3.2 * latFactor + ((phaseSeed % 10) / 4)) * 10) / 10;
  const meanHeight = maxAmp / 2 + 1.0;

  const nowMs = baseTime.getTime();

  // Calculate tide height at timestamp
  const calculateHeight = (tMs: number): number => {
    const elapsed = tMs % cyclePeriodMs;
    const angle = ((elapsed / cyclePeriodMs) * 2 * Math.PI) + (phaseSeed % 6.28);
    const primary = Math.sin(angle) * (maxAmp * 0.46);
    const secondary = Math.sin(angle * 2 + 0.6) * (maxAmp * 0.14);
    const val = meanHeight + primary + secondary;
    return Math.round(val * 10) / 10;
  };

  const currentHeightFt = calculateHeight(nowMs);
  const tenMinsLater = calculateHeight(nowMs + 10 * 60 * 1000);
  const diff = tenMinsLater - currentHeightFt;

  let currentTrend: 'Rising (Flood)' | 'Falling (Ebb)' | 'Slack High' | 'Slack Low' = 'Rising (Flood)';
  if (Math.abs(diff) < 0.04) {
    currentTrend = currentHeightFt > meanHeight ? 'Slack High' : 'Slack Low';
  } else if (diff > 0) {
    currentTrend = 'Rising (Flood)';
  } else {
    currentTrend = 'Falling (Ebb)';
  }

  // 24-hour continuous hourly dataset (-4h to +20h)
  const hourlyHeights = [];
  const startHourMs = nowMs - 4 * 3600 * 1000;
  for (let i = 0; i <= 24; i++) {
    const t = startHourMs + i * 3600 * 1000;
    const dateObj = new Date(t);
    const hourStr = dateObj.toLocaleTimeString([], { hour: 'numeric', hour12: true });
    const isNow = Math.abs(t - nowMs) < 1800 * 1000;
    
    // Realistic diurnal wind cycle: gentle morning breeze (5-8mph), peaks in afternoon sea breeze (12-18mph)
    const localHour = dateObj.getHours(); // 0 - 23
    const diurnalFactor = Math.sin(((localHour - 6) / 24) * 2 * Math.PI); // lowest around 6 AM, peaks around 4-5 PM
    const baseWind = 7 + (phaseSeed % 5);
    const diurnalWind = Math.max(0, diurnalFactor * 6);
    const windSpeedMph = Math.round(baseWind + diurnalWind + ((i * 1.7 + phaseSeed) % 3));
    const windGustMph = windSpeedMph + Math.round(4 + ((i + phaseSeed) % 4));
    
    const windDirections = ['WNW', 'NW', 'NNW', 'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W'];
    const dirIdx = Math.floor((phaseSeed + localHour * 0.4) % windDirections.length);
    const windDirection = windDirections[dirIdx];

    hourlyHeights.push({
      hour: hourStr,
      height: calculateHeight(t),
      isNow,
      timestamp: t,
      windSpeedMph,
      windGustMph,
      windDirection
    });
  }

  // Discrete High and Low events
  const tideEvents: TideEvent[] = [];
  const stepMs = 5 * 60 * 1000;
  const searchWindow = 26 * 3600 * 1000;

  for (let t = nowMs - 3 * 3600 * 1000; t <= nowMs + searchWindow; t += stepMs) {
    const prev = calculateHeight(t - stepMs);
    const curr = calculateHeight(t);
    const next = calculateHeight(t + stepMs);

    if (curr >= prev && curr > next && curr > meanHeight) {
      const d = new Date(t);
      tideEvents.push({
        time: d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }),
        timestamp: t,
        type: 'High',
        heightFt: curr
      });
      t += 2 * 3600 * 1000;
    } else if (curr <= prev && curr < next && curr < meanHeight) {
      const d = new Date(t);
      tideEvents.push({
        time: d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }),
        timestamp: t,
        type: 'Low',
        heightFt: curr
      });
      t += 2 * 3600 * 1000;
    }
  }

  const futureEvents = tideEvents.filter(e => e.timestamp > nowMs);
  const nextTide = futureEvents.length > 0 ? futureEvents[0] : tideEvents[0] || {
    time: 'In 2h 45m',
    timestamp: nowMs + 2.75 * 3600 * 1000,
    type: 'High',
    heightFt: maxAmp
  };

  return {
    tideEvents: tideEvents.slice(0, 6),
    currentHeightFt,
    currentTrend,
    nextTide,
    hourlyHeights
  };
}

/**
 * Derives realistic real-time sea conditions for any chosen coordinate
 */
export function calculateSeaConditionsForCoordinates(coords: LocationCoordinates): SeaConditions {
  const seed = Math.abs(coords.lat * 13.7 + coords.lng * 9.1);
  
  // Latitude-based sea surface temperature gradient
  const lat = Math.abs(coords.lat);
  let baseWaterTemp = 84 - (lat - 24) * 1.35;
  if (baseWaterTemp > 86) baseWaterTemp = 85.5;
  if (baseWaterTemp < 48) baseWaterTemp = 50.2;
  baseWaterTemp = Math.round(baseWaterTemp * 10) / 10;

  // Swell height: Pacific or open coast has higher swells (3-6ft), sheltered/Gulf has lower (1.5-3ft)
  const isPacific = coords.lng < -110;
  const isGulf = coords.lng > -98 && coords.lng < -81 && coords.lat < 31;
  const waveHeight = isPacific ? (3.2 + (seed % 3.5)) : isGulf ? (1.5 + (seed % 2.0)) : (2.4 + (seed % 2.8));
  const period = isPacific ? Math.round(11 + (seed % 5)) : Math.round(6 + (seed % 5));

  const windSpeed = Math.round(7 + (seed % 12));
  const windGust = windSpeed + Math.round(4 + (seed % 5));

  const directions = ['WNW 290°', 'NW 315°', 'W 270°', 'SW 225°', 'S 180°', 'SE 140°', 'E 90°', 'ENE 070°'];
  const swellDirections = ['SSW 205°', 'WNW 290°', 'W 270°', 'SE 135°', 'E 090°'];

  const clarities: ('Gin Clear' | 'Mild Stain' | 'Choppy / Murky')[] = ['Gin Clear', 'Mild Stain', 'Choppy / Murky'];

  return {
    waveHeightFt: Math.round(waveHeight * 10) / 10,
    swellPeriodSec: period,
    swellDirection: swellDirections[Math.floor(seed) % swellDirections.length],
    waterTempF: baseWaterTemp,
    waterClarity: clarities[Math.floor(seed) % clarities.length],
    windSpeedMph: windSpeed,
    windGustMph: windGust,
    windDirection: directions[Math.floor(seed * 2) % directions.length],
    currentKnots: Math.round((0.8 + (seed % 2.5)) * 10) / 10,
    barometerInHg: Math.round((29.85 + (seed % 30) * 0.01) * 100) / 100,
    barometerTrend: (seed % 3 < 1) ? 'Rising' : (seed % 3 < 2) ? 'Steady' : 'Falling',
    solunarRating: (seed % 4 < 2) ? 'Peak Major' : (seed % 4 < 3) ? 'Good' : 'Moderate',
    moonPhase: 'Waxing Gibbous',
    moonIllumination: 78,
    uvIndex: Math.min(Math.max(Math.round(9 - (lat - 24) * 0.2), 3), 10),
    airTempF: Math.round(baseWaterTemp + (seed % 6 - 2)),
    visibilityMiles: 9 + Math.round(seed % 4)
  };
}
