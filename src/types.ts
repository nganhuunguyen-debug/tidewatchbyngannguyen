export interface FishingHotspot {
  id: string;
  name: string;
  lat: number;
  lng: number;
  region: string;
  subType: 'Pier & Jetty' | 'Surf Fishing' | 'Inshore Bay' | 'Reef / Offshore' | 'Estuary & Flats';
  targetSpecies: string[];
  depthFt: string;
  bottomStructure: string;
  tidePreference: 'Incoming (Flood)' | 'Outgoing (Ebb)' | 'Slack High' | 'Slack Low' | 'Any Moving Water';
  bestBaits: string[];
  access: 'Public Pier' | 'Beach Access' | 'Boat Ramp / Kayak' | 'Park / Trail';
  rating: number; // 1-5
  currentActivity: 'Prime (Feeding)' | 'Active' | 'Moderate' | 'Slow';
  hazards?: string;
  description: string;
}

export interface TideEvent {
  time: string; // "04:18 AM"
  timestamp: number;
  type: 'High' | 'Low';
  heightFt: number; // e.g. 5.8 or 0.4
}

export interface SeaConditions {
  waveHeightFt: number;
  swellPeriodSec: number;
  swellDirection: string;
  waterTempF: number;
  waterClarity: 'Gin Clear' | 'Mild Stain' | 'Choppy / Murky' | 'Turbid';
  windSpeedMph: number;
  windGustMph: number;
  windDirection: string;
  currentKnots: number;
  barometerInHg: number;
  barometerTrend: 'Rising' | 'Falling' | 'Steady';
  solunarRating: 'Peak Major' | 'Good' | 'Moderate' | 'Poor';
  moonPhase: 'New Moon' | 'Waxing Crescent' | 'First Quarter' | 'Waxing Gibbous' | 'Full Moon' | 'Waning Gibbous' | 'Last Quarter' | 'Waning Crescent';
  moonIllumination: number; // 0-100%
  uvIndex: number;
  airTempF: number;
  visibilityMiles: number;
}

export interface FishSpeciesInfo {
  id: string;
  name: string;
  scientificName: string;
  category: 'Pelagic' | 'Inshore / Estuary' | 'Bottom / Reef' | 'Surf';
  seasonalStatus: 'Peak Season' | 'In Season' | 'Moderate' | 'Off Season';
  activeDepth: string;
  idealTide: string;
  idealWaterTemp: string;
  preferredBaitsAndLures: string[];
  regulationSummary: string; // bag limit / size
  minSize?: string;
  bagLimit?: string;
  gillNetInfo?: string;
  edibilityRating: 1 | 2 | 3 | 4 | 5;
  difficultyRating: 1 | 2 | 3 | 4 | 5;
  tips: string;
  badgeColor: string;
  photoUrl: string;
}

export interface CoastalRegion {
  id: string;
  name: string;
  state: string;
  center: { lat: number; lng: number };
  zoom: number;
  tideStation: string;
}
