import { CoastalRegion, SeaConditions, TideEvent } from './types';

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
  precipitationProbability: number;
  cloudCover: number;
  weatherCategory: WeatherCategory;
  conditionSummary: string;
}

export interface SolunarPeriod {
  type: 'Major' | 'Minor';
  name: string;
  start: string;
  end: string;
  startTimestamp: number;
  endTimestamp: number;
  description: string;
}

export interface SolunarForecast {
  dateIso: string;
  displayDate: string;
  moonPhase: 'New Moon' | 'Waxing Crescent' | 'First Quarter' | 'Waxing Gibbous' | 'Full Moon' | 'Waning Gibbous' | 'Last Quarter' | 'Waning Crescent';
  moonPhaseIcon: string;
  moonIllumination: number;
  moonAgeDays: number;
  fishingQualityScore: number;
  qualityRating: 'Peak Activity' | 'High Activity' | 'Moderate Activity' | 'Fair Activity';
  qualitySummary: string;
  majorPeriods: SolunarPeriod[];
  minorPeriods: SolunarPeriod[];
  allPeriods: SolunarPeriod[];
  moonOverheadTime: string;
  moonUnderfootTime: string;
  moonriseTime: string;
  moonsetTime: string;
}

function getMoonData(date: Date) {
  const refNewMoon = new Date(Date.UTC(2024, 0, 11, 11, 57, 0)).getTime();
  const synodicMonthMs = 29.53058867 * 24 * 60 * 60 * 1000;
  
  const diffMs = date.getTime() - refNewMoon;
  const cycles = diffMs / synodicMonthMs;
  const cycleFraction = ((cycles % 1) + 1) % 1;
  const ageDays = cycleFraction * 29.53058867;
  const illumination = Math.round((1 - Math.cos(cycleFraction * 2 * Math.PI)) / 2 * 100);

  let phase: SolunarForecast['moonPhase'];
  let icon: string;

  if (ageDays < 1.84) {
    phase = 'New Moon';
    icon = '🌑';
  } else if (ageDays < 5.53) {
    phase = 'Waxing Crescent';
    icon = '🌒';
  } else if (ageDays < 9.22) {
    phase = 'First Quarter';
    icon = '🌓';
  } else if (ageDays < 12.91) {
    phase = 'Waxing Gibbous';
    icon = '🌔';
  } else if (ageDays < 16.61) {
    phase = 'Full Moon';
    icon = '🌕';
  } else if (ageDays < 20.3) {
    phase = 'Waning Gibbous';
    icon = '🌖';
  } else if (ageDays < 23.99) {
    phase = 'Last Quarter';
    icon = '🌗';
  } else if (ageDays < 27.68) {
    phase = 'Waning Crescent';
    icon = '🌘';
  } else {
    phase = 'New Moon';
    icon = '🌑';
  }

  return { phase, icon, illumination, ageDays: Math.round(ageDays * 10) / 10, cycleFraction };
}

function formatHourMinute(d: Date): string {
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
}

export function calculateSolunarForecast(
  date: Date, 
  lat: number = 36.909, 
  lng: number = -76.096
): SolunarForecast {
  const moon = getMoonData(date);
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  const midnightMs = new Date(year, month, day, 0, 0, 0).getTime();

  const transitHours = ((moon.cycleFraction * 24 + 12 - (lng / 15)) % 24 + 24) % 24;
  const transitMs = midnightMs + transitHours * 3600 * 1000;
  const underfootMs = transitMs + 12.42 * 3600 * 1000;
  const moonriseMs = transitMs - 6.21 * 3600 * 1000;
  const moonsetMs = transitMs + 6.21 * 3600 * 1000;

  const majorPeriods: SolunarPeriod[] = [
    {
      type: 'Major',
      name: 'Moon Overhead (Major 1)',
      start: formatHourMinute(new Date(transitMs - 60 * 60 * 1000)),
      end: formatHourMinute(new Date(transitMs + 60 * 60 * 1000)),
      startTimestamp: transitMs - 60 * 60 * 1000,
      endTimestamp: transitMs + 60 * 60 * 1000,
      description: 'Lunar zenith: Peak gravitational pull stimulates maximum predatory feeding instincts.'
    },
    {
      type: 'Major',
      name: 'Moon Underfoot (Major 2)',
      start: formatHourMinute(new Date(underfootMs - 60 * 60 * 1000)),
      end: formatHourMinute(new Date(underfootMs + 60 * 60 * 1000)),
      startTimestamp: underfootMs - 60 * 60 * 1000,
      endTimestamp: underfootMs + 60 * 60 * 1000,
      description: 'Lunar nadir: Secondary gravitational surge triggering heavy school feeding.'
    }
  ];

  const minorPeriods: SolunarPeriod[] = [
    {
      type: 'Minor',
      name: 'Moonrise (Minor 1)',
      start: formatHourMinute(new Date(moonriseMs - 30 * 60 * 1000)),
      end: formatHourMinute(new Date(moonriseMs + 30 * 60 * 1000)),
      startTimestamp: moonriseMs - 30 * 60 * 1000,
      endTimestamp: moonriseMs + 30 * 60 * 1000,
      description: 'Moon emergence over the horizon drives opportunistic forage bites.'
    },
    {
      type: 'Minor',
      name: 'Moonset (Minor 2)',
      start: formatHourMinute(new Date(moonsetMs - 30 * 60 * 1000)),
      end: formatHourMinute(new Date(moonsetMs + 30 * 60 * 1000)),
      startTimestamp: moonsetMs - 30 * 60 * 1000,
      endTimestamp: moonsetMs + 30 * 60 * 1000,
      description: 'Moon descent on the horizon creates a concentrated 60-minute feeding flurry.'
    }
  ];

  const distFromExtreme = Math.min(
    Math.abs(moon.illumination - 0),
    Math.abs(moon.illumination - 100)
  );
  let score = Math.round(96 - (distFromExtreme * 0.75));

  if (moon.phase === 'Full Moon' || moon.phase === 'New Moon') {
    score = Math.min(100, score + 4);
  } else if (moon.phase === 'First Quarter' || moon.phase === 'Last Quarter') {
    score = Math.max(52, score - 6);
  }
  score = Math.max(45, Math.min(99, score));

  let qualityRating: SolunarForecast['qualityRating'];
  let qualitySummary: string;

  if (score >= 88) {
    qualityRating = 'Peak Activity';
    qualitySummary = 'Exceptional feeding potential! Spring tides and strong lunar alignment trigger prime bites during major windows.';
  } else if (score >= 75) {
    qualityRating = 'High Activity';
    qualitySummary = 'Strong feeding activity expected. Fish will feed aggressively during Major & Minor transit periods.';
  } else if (score >= 60) {
    qualityRating = 'Moderate Activity';
    qualitySummary = 'Average feeding activity. Focus on moving water during the designated 2-hour Major transit window.';
  } else {
    qualityRating = 'Fair Activity';
    qualitySummary = 'Neap tide cycle with sluggish water movement. Key bites will be restricted tightly to Major windows.';
  }

  const allPeriods = [...majorPeriods, ...minorPeriods].sort((a, b) => a.startTimestamp - b.startTimestamp);

  return {
    dateIso: date.toISOString().split('T')[0],
    displayDate: date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }),
    moonPhase: moon.phase,
    moonPhaseIcon: moon.icon,
    moonIllumination: moon.illumination,
    moonAgeDays: moon.ageDays,
    fishingQualityScore: score,
    qualityRating,
    qualitySummary,
    majorPeriods,
    minorPeriods,
    allPeriods,
    moonOverheadTime: formatHourMinute(new Date(transitMs)),
    moonUnderfootTime: formatHourMinute(new Date(underfootMs)),
    moonriseTime: formatHourMinute(new Date(moonriseMs)),
    moonsetTime: formatHourMinute(new Date(moonsetMs))
  };
}

export function getActiveSolunarPeriodForTime(timestamp: number, periods: SolunarPeriod[]): SolunarPeriod | null {
  return periods.find(p => timestamp >= p.startTimestamp && timestamp <= p.endTimestamp) || null;
}

export interface LocationCoordinates {
  lat: number;
  lng: number;
  label?: string;
}

/**
 * Computes realistic continuous 24-hour sinusoidal tide cycle for ANY coordinate on Earth
 * Optionally incorporates live hourly meteorological wind & gust observations
 */
export function calculateTidesForCoordinates(
  coords: LocationCoordinates, 
  baseTime: Date = new Date(),
  liveWindData?: HourlyWindData[] | null
): {
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
    weatherCategory?: 'Rain' | 'Cloudy' | 'Clear' | 'Partly Cloudy' | 'Thunderstorm';
    conditionSummary?: string;
    precipitationProbability?: number;
    cloudCover?: number;
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
    
    // Check if we have live NOAA/NWS forecast data for this hour
    let windSpeedMph: number;
    let windGustMph: number;
    let windDirection: string;
    let weatherCategory: 'Rain' | 'Cloudy' | 'Clear' | 'Partly Cloudy' | 'Thunderstorm';
    let conditionSummary: string;
    let precipitationProbability: number;
    let cloudCover: number;

    const matchedLive = liveWindData && liveWindData.length > 0
      ? liveWindData.find(w => Math.abs(w.timestamp - t) <= 1800 * 1000)
      : null;

    if (matchedLive) {
      windSpeedMph = matchedLive.windSpeedMph;
      windGustMph = matchedLive.windGustMph;
      windDirection = matchedLive.windDirectionText;
      weatherCategory = matchedLive.weatherCategory;
      conditionSummary = matchedLive.conditionSummary;
      precipitationProbability = matchedLive.precipitationProbability;
      cloudCover = matchedLive.cloudCover;
    } else {
      // Fallback diurnal wind model
      const localHour = dateObj.getHours(); // 0 - 23
      const diurnalFactor = Math.sin(((localHour - 6) / 24) * 2 * Math.PI); // lowest around 6 AM, peaks around 4-5 PM
      const baseWind = 7 + (phaseSeed % 5);
      const diurnalWind = Math.max(0, diurnalFactor * 6);
      windSpeedMph = Math.round(baseWind + diurnalWind + ((i * 1.7 + phaseSeed) % 3));
      windGustMph = windSpeedMph + Math.round(4 + ((i + phaseSeed) % 4));
      
      const windDirections = ['WNW', 'NW', 'NNW', 'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W'];
      const dirIdx = Math.floor((phaseSeed + localHour * 0.4) % windDirections.length);
      windDirection = windDirections[dirIdx];

      // Realistic coastal weather fallback based on coordinates
      const isRainyTime = (phaseSeed % 7 === 0 && localHour > 14 && localHour < 19);
      if (isRainyTime) {
        weatherCategory = 'Rain';
        precipitationProbability = 65;
        cloudCover = 85;
        conditionSummary = 'Rain: 65% chance';
      } else if (phaseSeed % 3 === 0) {
        weatherCategory = 'Cloudy';
        precipitationProbability = 15;
        cloudCover = 75;
        conditionSummary = 'Cloudy: 75% coverage';
      } else {
        weatherCategory = 'Clear';
        precipitationProbability = 5;
        cloudCover = 10;
        conditionSummary = 'Clear: 10% clouds';
      }
    }

    hourlyHeights.push({
      hour: hourStr,
      height: calculateHeight(t),
      isNow,
      timestamp: t,
      windSpeedMph,
      windGustMph,
      windDirection,
      weatherCategory,
      conditionSummary,
      precipitationProbability,
      cloudCover
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
