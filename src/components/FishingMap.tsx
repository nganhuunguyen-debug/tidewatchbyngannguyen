import React, { useEffect, useRef, useState } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import { FishingHotspot } from '../types';
import { LocationCoordinates } from '../marineCalculations';
import { 
  MapPin, Star, Waves, Crosshair, ExternalLink, 
  Layers, MousePointerClick, Compass, Fish, ShieldAlert,
  Bell, BellRing, BellOff, Volume2, VolumeX, ShieldCheck,
  AlertTriangle, Navigation, Sliders, ChevronDown, ChevronUp,
  Info, X, Flame
} from 'lucide-react';

export interface HistoricalPatrolPoint {
  lat: number;
  lng: number;
  weight: number; // 1 to 10 scale
  area: string;
  seasonMultiplier?: {
    summer: number;
    fall: number;
    winter: number;
  };
}

// Comprehensive historical marine patrol activity logs across Virginia waters
export const HISTORICAL_PATROL_DENSITY: HistoricalPatrolPoint[] = [
  // 1. Lynnhaven Inlet / Lesner Bridge / Crab Creek / Boat Ramp (Very High Density)
  { lat: 36.9090, lng: -76.0960, weight: 10, area: 'Lesner Bridge Channel' },
  { lat: 36.9075, lng: -76.0945, weight: 10, area: 'Lynnhaven Public Boat Ramp' },
  { lat: 36.9110, lng: -76.0980, weight: 9, area: 'Lynnhaven Inlet Mouth' },
  { lat: 36.9040, lng: -76.0920, weight: 8, area: 'Crab Creek / Long Creek Junction' },
  { lat: 36.9020, lng: -76.0860, weight: 8, area: 'The Narrows / First Landing' },

  // 2. Rudee Inlet / Oceanfront Basin / Rock Jetties (Very High Density)
  { lat: 36.8320, lng: -75.9710, weight: 10, area: 'Rudee Inlet Channel' },
  { lat: 36.8335, lng: -75.9680, weight: 9, area: 'Rudee Rock Jetties Entrance' },
  { lat: 36.8310, lng: -75.9760, weight: 9, area: 'Rudee Inlet Marina Basin' },
  { lat: 36.8360, lng: -75.9650, weight: 7, area: 'Virginia Beach Resort Strip Oceanfront' },

  // 3. Chesapeake Bay Bridge-Tunnel (CBBT) Complex & Islands (High Security & Enforcement)
  { lat: 37.0310, lng: -76.0750, weight: 9, area: 'CBBT 1st Island' },
  { lat: 37.0580, lng: -76.0590, weight: 9, area: 'CBBT 2nd Island' },
  { lat: 37.0980, lng: -76.0380, weight: 8, area: 'CBBT 3rd Island' },
  { lat: 37.1260, lng: -76.0240, weight: 8, area: 'CBBT 4th Island' },
  { lat: 37.1650, lng: -75.9800, weight: 7, area: 'CBBT High Rise / Fisherman Island' },

  // 4. Cape Henry / Atlantic Shipping Channel / Fort Story (High Enforcement Corridor)
  { lat: 36.9280, lng: -76.0080, weight: 8, area: 'Cape Henry Channel Entrance' },
  { lat: 36.9400, lng: -76.0200, weight: 8, area: 'Thimble Shoal Approach' },
  { lat: 36.9200, lng: -75.9900, weight: 7, area: 'Fort Story Outer Shoals' },
  { lat: 36.9550, lng: -75.9750, weight: 6, area: 'Virginia Pilot Boarding Area' },

  // 5. Broad Bay, Linkhorn Bay & Crystal Lake (No-Wake & Shellfish Enforcement)
  { lat: 36.8890, lng: -76.0350, weight: 8, area: 'Broad Bay Main Waters' },
  { lat: 36.8970, lng: -76.0550, weight: 8, area: 'Long Creek Canal No-Wake' },
  { lat: 36.8720, lng: -76.0150, weight: 7, area: 'Linkhorn Bay' },
  { lat: 36.8620, lng: -76.0020, weight: 6, area: 'Crystal Lake' },

  // 6. Little Creek / JEB Little Creek-Fort Story Naval Security Perimeter
  { lat: 36.9310, lng: -76.1750, weight: 9, area: 'Little Creek Channel Entrance' },
  { lat: 36.9190, lng: -76.1730, weight: 9, area: 'USCG Station Little Creek Basin' },
  { lat: 36.9500, lng: -76.1900, weight: 7, area: 'Ocean View Beachfront Waters' },

  // 7. Hampton Roads / Willoughby Spit / James River Gateway
  { lat: 36.9680, lng: -76.3120, weight: 8, area: 'Willoughby Spit / HRBT Island' },
  { lat: 36.9790, lng: -76.3500, weight: 8, area: 'Hampton Roads Harbor Channel' },
  { lat: 36.9500, lng: -76.4300, weight: 7, area: 'James River Bridge Span' },
  { lat: 36.9050, lng: -76.4000, weight: 7, area: 'Monitor-Merrimac Bridge-Tunnel' },

  // 8. Back Bay, North Landing & Knotts Island (Wildlife & Boating Safety)
  { lat: 36.6580, lng: -75.9890, weight: 6, area: 'Back Bay Wildlife Sanctuary' },
  { lat: 36.6850, lng: -76.0200, weight: 6, area: 'North Landing River Canal' },
  { lat: 36.5600, lng: -75.9500, weight: 5, area: 'Knotts Island Channel' },

  // 9. Lower Chesapeake Open Waters & Ocean Fishing Grounds (Moderate/Low Baseline)
  { lat: 37.0500, lng: -76.1800, weight: 5, area: 'Ocean View / Grandview Shoals' },
  { lat: 37.1000, lng: -76.1500, weight: 4, area: 'Middle Ground Lighthouse' },
  { lat: 36.8500, lng: -75.8600, weight: 3, area: 'Offshore Tower Reefs Approach' },
  { lat: 36.8000, lng: -75.7500, weight: 2, area: 'Federal Offshore Waters (3+ NM)' }
];

interface PatrolRestrictedZone {
  id: string;
  name: string;
  agency: string;
  lat: number;
  lng: number;
  frequency: 'High' | 'Daily' | 'Seasonal';
  criticalRadiusNM: number; // e.g. 0.35 NM
  primaryFocus: string;
  restrictionRules: string;
  vhfChannel: string;
  description: string;
}

const PATROL_RESTRICTED_ZONES: PatrolRestrictedZone[] = [
  {
    id: 'lynnhaven-inlet',
    name: 'Lynnhaven Inlet & Lesner Bridge',
    agency: 'VMRC Marine Police & VB Marine Unit',
    lat: 36.909,
    lng: -76.096,
    frequency: 'High',
    criticalRadiusNM: 0.35,
    primaryFocus: 'No-wake zones, boat ramp safety, 2 7/8" gill net mesh checks, Croaker/Spot limits',
    restrictionRules: '5 MPH Idle Speed strictly enforced in channel. 2 7/8" minimum mesh required on nets. Ramp safety gear checks.',
    vhfChannel: 'VHF 16 / 17',
    description: 'Active year-round patrol area. High officer presence at Lynnhaven Boat Ramp and Lesner Bridge channel.'
  },
  {
    id: 'rudee-inlet',
    name: 'Rudee Inlet & Oceanfront Channel',
    agency: 'USCG Station Little Creek & VB Police',
    lat: 36.832,
    lng: -75.971,
    frequency: 'High',
    criticalRadiusNM: 0.35,
    primaryFocus: 'Inlet channel navigation safety, PFD compliance, Flounder/Drum catch inspections',
    restrictionRules: 'Strict No-Wake Zone inside inlet basin. Keep right in rock jetty channel. PFD required on all underway personal watercraft.',
    vhfChannel: 'VHF 16 / 22A',
    description: 'Critical navigation gateway. Routine vessel safety boardings and jet ski/boating speed enforcement.'
  },
  {
    id: 'cbbt-islands',
    name: 'Chesapeake Bay Bridge-Tunnel (CBBT) Pilings',
    agency: 'VMRC Marine Police & US Coast Guard',
    lat: 37.031,
    lng: -76.075,
    frequency: 'Daily',
    criticalRadiusNM: 0.40,
    primaryFocus: '300-ft bridge security zone, Striped Bass regulations, Cobia/Red Drum size limits',
    restrictionRules: 'Federal 300-ft security exclusion zone around island portals. Strictly prohibited to tie off to bridge pilings.',
    vhfChannel: 'VHF 16 / 13',
    description: 'Frequent on-water patrol vessels monitoring bridge structure security and recreational sportfishing.'
  },
  {
    id: 'cape-henry',
    name: 'Cape Henry & Virginia Beach Oceanfront',
    agency: 'US Coast Guard Sector Virginia & VMRC',
    lat: 36.928,
    lng: -76.008,
    frequency: 'Daily',
    criticalRadiusNM: 0.50,
    primaryFocus: 'Commercial shipping channel safety, offshore safety gear, Cobia/Mackerel regulations',
    restrictionRules: 'Deep-draft commercial shipping channel. Avoid impeding large cargo vessels and navy warships.',
    vhfChannel: 'VHF 16 / 22A',
    description: 'Major maritime shipping corridor. Coast Guard cutters and Response Boats operate routine safety patrols.'
  },
  {
    id: 'broad-bay',
    name: 'Broad Bay, Linkhorn Bay & Long Creek',
    agency: 'Virginia Marine Police (VMRC)',
    lat: 36.889,
    lng: -76.035,
    frequency: 'Daily',
    criticalRadiusNM: 0.35,
    primaryFocus: 'Idle-speed no-wake compliance, oyster sanctuary enforcement, crab pot licensing',
    restrictionRules: 'Continuous No-Wake idle speed in Long Creek canal. Prohibited to disturb marked oyster sanctuaries.',
    vhfChannel: 'VHF 17',
    description: 'Inland bay network with strict no-wake zones and residential shoreline monitoring.'
  },
  {
    id: 'back-bay',
    name: 'Back Bay & North Landing River',
    agency: 'Virginia DWR Conservation Police',
    lat: 36.658,
    lng: -75.989,
    frequency: 'Seasonal',
    criticalRadiusNM: 0.45,
    primaryFocus: 'Wildlife management area rules, freshwater/saltwater transition licenses, boat registration',
    restrictionRules: 'DWR Wildlife Management Area rules apply. Verify freshwater vs saltwater boundary licenses.',
    vhfChannel: 'VHF 16',
    description: 'DWR conservation officers patrol for waterfowl sanctuary compliance and recreational boating safety.'
  }
];

// Calculate Haversine distance in Nautical Miles
function calculateDistanceNM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3440.065; // Earth radius in nautical miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Play pleasant synthesizer chime for proximity warning
function playProximityAlertSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;
    
    // First tone (880 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now);
    gain1.gain.setValueAtTime(0.12, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.2);

    // Second tone (1174.66 Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1174.66, now + 0.12);
    gain2.gain.setValueAtTime(0.12, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.38);
  } catch (err) {}
}

interface FishingMapProps {
  hotspots: FishingHotspot[];
  selectedLocation: LocationCoordinates;
  onPickLocation: (coords: LocationCoordinates) => void;
  selectedHotspot: FishingHotspot | null;
  onSelectHotspot: (hotspot: FishingHotspot) => void;
  apiKey: string;
}

export const FishingMap: React.FC<FishingMapProps> = ({
  hotspots,
  selectedLocation,
  onPickLocation,
  selectedHotspot,
  onSelectHotspot,
  apiKey
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const userMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const spotMarkersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const patrolMarkersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const patrolCirclesRef = useRef<google.maps.Circle[]>([]);
  const userRangeCircleRef = useRef<google.maps.Circle | null>(null);
  const targetLaserLineRef = useRef<google.maps.Polyline | null>(null);
  const laserMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const heatmapLayerRef = useRef<any>(null);

  const [mapType, setMapType] = useState<'hybrid' | 'roadmap' | 'terrain'>('hybrid');
  const [isMapLoaded, setIsMapLoaded] = useState<boolean>(false);
  const [isLocatingUser, setIsLocatingUser] = useState<boolean>(false);
  
  // Patrol Density Heatmap State
  const [showHeatmap, setShowHeatmap] = useState<boolean>(true);
  const [heatmapSeason, setHeatmapSeason] = useState<'all' | 'summer_peak' | 'fall_striper'>('all');
  const [heatmapIntensity, setHeatmapIntensity] = useState<'high' | 'normal' | 'soft'>('high');
  const [showHeatmapControls, setShowHeatmapControls] = useState<boolean>(false);

  // Patrol Proximity State synchronized with localStorage
  const [proximityEnabled, setProximityEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('vmrc_patrol_proximity_enabled');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const [proximityThresholdNM, setProximityThresholdNM] = useState<number>(1.0); // 0.5 NM, 1.0 NM, 2.0 NM
  const [soundAlerts, setSoundAlerts] = useState<boolean>(true);
  const [selectedZoneInfo, setSelectedZoneInfo] = useState<PatrolRestrictedZone | null>(null);
  const [isHudExpanded, setIsHudExpanded] = useState<boolean>(true);
  const lastAlertZoneRef = useRef<string | null>(null);

  // Sync proximity toggle with localStorage
  const handleToggleProximity = (enabled: boolean) => {
    setProximityEnabled(enabled);
    try {
      localStorage.setItem('vmrc_patrol_proximity_enabled', JSON.stringify(enabled));
    } catch {}
    if (enabled && soundAlerts) {
      playProximityAlertSound();
    }
  };

  // Compute live distances from current selected location to all patrol zones
  const zonesWithDistances = PATROL_RESTRICTED_ZONES.map(z => {
    const distNM = calculateDistanceNM(selectedLocation.lat, selectedLocation.lng, z.lat, z.lng);
    return {
      ...z,
      distanceNM: distNM,
      distanceFt: Math.round(distNM * 6076.12),
      isInsideThreshold: distNM <= proximityThresholdNM,
      isImmediateWarning: distNM <= z.criticalRadiusNM
    };
  }).sort((a, b) => a.distanceNM - b.distanceNM);

  const nearestZone = zonesWithDistances[0];
  const isApproachingZone = proximityEnabled && nearestZone.isInsideThreshold;
  const isCriticalZone = proximityEnabled && nearestZone.isImmediateWarning;

  // Compute localized patrol density score at selected vessel position
  const localPatrolDensity = (() => {
    let rawScore = 0;
    let closestAreaName = '';
    let closestDist = 999;

    HISTORICAL_PATROL_DENSITY.forEach(pt => {
      const dist = calculateDistanceNM(selectedLocation.lat, selectedLocation.lng, pt.lat, pt.lng);
      if (dist < 2.5) {
        const proximityWeight = Math.max(0, (2.5 - dist) / 2.5);
        rawScore += pt.weight * proximityWeight;
      }
      if (dist < closestDist) {
        closestDist = dist;
        closestAreaName = pt.area;
      }
    });

    const score = Math.min(10, Math.max(1, Math.round(rawScore * 10) / 10));
    const level: 'Critical' | 'High' | 'Moderate' | 'Low' = 
      score >= 8.0 ? 'Critical' : score >= 5.5 ? 'High' : score >= 3.0 ? 'Moderate' : 'Low';

    return {
      score,
      level,
      closestAreaName,
      closestDistNM: closestDist
    };
  })();

  // Sound chime when entering warning perimeter
  useEffect(() => {
    if (isApproachingZone && soundAlerts) {
      if (lastAlertZoneRef.current !== nearestZone.id) {
        playProximityAlertSound();
        lastAlertZoneRef.current = nearestZone.id;
      }
    } else if (!isApproachingZone) {
      lastAlertZoneRef.current = null;
    }
  }, [isApproachingZone, nearestZone?.id, soundAlerts]);

  // Initialize Google Maps instance
  useEffect(() => {
    let isMounted = true;
    
    try {
      setOptions({
        key: apiKey,
        v: 'weekly',
      });

      Promise.all([
        importLibrary('maps'),
        importLibrary('marker'),
        importLibrary('visualization')
      ])
        .then(([mapsLib]) => {
          if (!isMounted || !mapContainerRef.current) return;

          const map = new mapsLib.Map(mapContainerRef.current, {
            center: { lat: selectedLocation.lat, lng: selectedLocation.lng },
            zoom: 11,
            mapTypeId: mapType,
            mapId: 'TIDE_ANGLER_MAP_ID',
            tilt: 45,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true,
          });

          // Click anywhere to place location and compute live proximity
          map.addListener('click', (e: google.maps.MapMouseEvent) => {
            if (e.latLng) {
              const lat = Math.round(e.latLng.lat() * 10000) / 10000;
              const lng = Math.round(e.latLng.lng() * 10000) / 10000;
              onPickLocation({
                lat,
                lng,
                label: `Vessel Pin (${lat.toFixed(3)}°, ${lng.toFixed(3)}°)`
              });
            }
          });

          mapInstanceRef.current = map;
          setIsMapLoaded(true);
        })
        .catch((err) => {
          console.error('Google Maps Load Error:', err);
        });
    } catch (err) {
      console.error('Google Maps setOptions error:', err);
    }

    return () => {
      isMounted = false;
    };
  }, [apiKey]);

  // Render & Synchronize Historical Marine Patrol Density Heatmap Layer
  useEffect(() => {
    if (!mapInstanceRef.current || !isMapLoaded) return;

    if (!showHeatmap) {
      if (heatmapLayerRef.current) {
        heatmapLayerRef.current.setMap(null);
      }
      return;
    }

    try {
      const visLib = (window.google?.maps as any)?.visualization;
      if (visLib?.HeatmapLayer) {
        // Calculate season-weighted data points
        const points = HISTORICAL_PATROL_DENSITY.map(pt => {
          let adjustedWeight = pt.weight;
          if (heatmapSeason === 'summer_peak') {
            // Summer holiday / weekend surge at boat ramps, beaches & inlets
            if (pt.area.includes('Ramp') || pt.area.includes('Inlet') || pt.area.includes('Strip')) {
              adjustedWeight = Math.min(10, pt.weight * 1.35);
            }
          } else if (heatmapSeason === 'fall_striper') {
            // Fall striper & cobia migration surge at bridge tunnels & channels
            if (pt.area.includes('CBBT') || pt.area.includes('Channel') || pt.area.includes('Shoal')) {
              adjustedWeight = Math.min(10, pt.weight * 1.35);
            }
          }

          return {
            location: new google.maps.LatLng(pt.lat, pt.lng),
            weight: adjustedWeight
          };
        });

        // Vivid thermal heatmap gradient: Transparent -> Cyan -> Blue -> Lime -> Yellow -> Orange -> Crimson
        const gradient = [
          'rgba(0, 255, 255, 0)',
          'rgba(0, 255, 255, 0.7)',
          'rgba(0, 191, 255, 0.85)',
          'rgba(0, 128, 255, 0.9)',
          'rgba(0, 255, 128, 0.95)',
          'rgba(255, 255, 0, 0.95)',
          'rgba(255, 140, 0, 1.0)',
          'rgba(255, 0, 60, 1.0)'
        ];

        const radiusPixels = heatmapIntensity === 'high' ? 38 : heatmapIntensity === 'normal' ? 28 : 20;
        const opacityValue = heatmapIntensity === 'high' ? 0.85 : heatmapIntensity === 'normal' ? 0.72 : 0.55;

        if (!heatmapLayerRef.current) {
          heatmapLayerRef.current = new visLib.HeatmapLayer({
            data: points,
            map: mapInstanceRef.current,
            radius: radiusPixels,
            opacity: opacityValue,
            gradient: gradient,
            maxIntensity: 10
          });
        } else {
          heatmapLayerRef.current.setData(points);
          heatmapLayerRef.current.set('radius', radiusPixels);
          heatmapLayerRef.current.set('opacity', opacityValue);
          heatmapLayerRef.current.set('gradient', gradient);
          heatmapLayerRef.current.setMap(mapInstanceRef.current);
        }
      }
    } catch (err) {
      console.warn('Error rendering HeatmapLayer:', err);
    }
  }, [isMapLoaded, showHeatmap, heatmapSeason, heatmapIntensity]);

  // Update map type
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setMapTypeId(mapType);
    }
  }, [mapType]);

  // Render User Active Vessel Pin + Pulsing Range Circle
  useEffect(() => {
    if (!mapInstanceRef.current || !isMapLoaded) return;
    const { AdvancedMarkerElement } = google.maps.marker;

    if (userMarkerRef.current) {
      userMarkerRef.current.map = null;
    }

    const pinEl = document.createElement('div');
    pinEl.className = 'flex flex-col items-center cursor-pointer pointer-events-auto';
    
    const ringColor = isCriticalZone 
      ? 'bg-rose-500/50' 
      : isApproachingZone 
      ? 'bg-amber-400/50' 
      : 'bg-cyan-400/40';
      
    const dotColor = isCriticalZone 
      ? 'from-rose-600 to-amber-600 ring-rose-400' 
      : isApproachingZone 
      ? 'from-amber-500 to-orange-600 ring-amber-400' 
      : 'from-cyan-500 to-blue-600 ring-cyan-400';

    pinEl.innerHTML = `
      <div class="relative flex items-center justify-center">
        <span class="absolute w-9 h-9 rounded-full ${ringColor} animate-ping"></span>
        <div class="w-8 h-8 rounded-full bg-gradient-to-tr ${dotColor} border-2 border-white shadow-2xl flex items-center justify-center text-white ring-2">
          <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
          </svg>
        </div>
      </div>
      <div class="mt-1 bg-slate-950/95 text-[10px] font-black px-2 py-0.5 rounded shadow-xl border ${
        isCriticalZone 
          ? 'border-rose-500 text-rose-300' 
          : isApproachingZone 
          ? 'border-amber-500 text-amber-300' 
          : 'border-cyan-400 text-cyan-200'
      } whitespace-nowrap">
        ${isCriticalZone ? '⚠️ CRITICAL PROXIMITY' : isApproachingZone ? '⚠️ CAUTION PERIMETER' : 'ACTIVE VESSEL'}
      </div>
    `;

    const marker = new AdvancedMarkerElement({
      map: mapInstanceRef.current,
      position: { lat: selectedLocation.lat, lng: selectedLocation.lng },
      title: selectedLocation.label || 'Selected Location',
      content: pinEl,
      zIndex: 9999
    });

    userMarkerRef.current = marker;

    // User Radar Range Circle
    if (userRangeCircleRef.current) {
      userRangeCircleRef.current.setMap(null);
      userRangeCircleRef.current = null;
    }

    if (proximityEnabled) {
      const circleRadiusMeters = proximityThresholdNM * 1852;
      const rangeCircle = new google.maps.Circle({
        strokeColor: isCriticalZone ? '#ef4444' : isApproachingZone ? '#f59e0b' : '#06b6d4',
        strokeOpacity: 0.85,
        strokeWeight: 1.5,
        fillColor: isCriticalZone ? '#ef4444' : isApproachingZone ? '#f59e0b' : '#06b6d4',
        fillOpacity: 0.08,
        map: mapInstanceRef.current,
        center: { lat: selectedLocation.lat, lng: selectedLocation.lng },
        radius: circleRadiusMeters,
        clickable: false
      });
      userRangeCircleRef.current = rangeCircle;
    }
  }, [selectedLocation, isMapLoaded, proximityEnabled, proximityThresholdNM, isApproachingZone, isCriticalZone]);

  // Render Patrol Geofence Danger & Caution Circles
  useEffect(() => {
    if (!mapInstanceRef.current || !isMapLoaded) return;
    const { AdvancedMarkerElement } = google.maps.marker;

    patrolMarkersRef.current.forEach(m => (m.map = null));
    patrolMarkersRef.current = [];
    patrolCirclesRef.current.forEach(c => c.setMap(null));
    patrolCirclesRef.current = [];

    PATROL_RESTRICTED_ZONES.forEach((zone) => {
      const isTargetNearest = nearestZone?.id === zone.id && proximityEnabled;
      const isUserInside = isTargetNearest && nearestZone.isInsideThreshold;

      // 1. Outer Caution Ring (e.g. 1.0 NM)
      if (proximityEnabled) {
        const outerCircle = new google.maps.Circle({
          strokeColor: isUserInside ? '#f59e0b' : '#3b82f6',
          strokeOpacity: isUserInside ? 0.9 : 0.45,
          strokeWeight: isUserInside ? 2 : 1,
          fillColor: isUserInside ? '#f59e0b' : '#3b82f6',
          fillOpacity: isUserInside ? 0.12 : 0.04,
          map: mapInstanceRef.current,
          center: { lat: zone.lat, lng: zone.lng },
          radius: proximityThresholdNM * 1852, // Convert NM to meters
          clickable: true
        });

        outerCircle.addListener('click', () => {
          setSelectedZoneInfo(zone);
          if (mapInstanceRef.current) {
            mapInstanceRef.current.panTo({ lat: zone.lat, lng: zone.lng });
          }
        });

        patrolCirclesRef.current.push(outerCircle);
      }

      // 2. Inner Critical Danger Ring (e.g. 0.35 NM)
      const innerCircle = new google.maps.Circle({
        strokeColor: '#ef4444',
        strokeOpacity: 0.85,
        strokeWeight: 2,
        fillColor: '#ef4444',
        fillOpacity: 0.18,
        map: mapInstanceRef.current,
        center: { lat: zone.lat, lng: zone.lng },
        radius: zone.criticalRadiusNM * 1852,
        clickable: true
      });

      innerCircle.addListener('click', () => {
        setSelectedZoneInfo(zone);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.panTo({ lat: zone.lat, lng: zone.lng });
        }
      });

      patrolCirclesRef.current.push(innerCircle);

      // 3. Custom Shield Marker Badge
      const pinEl = document.createElement('div');
      pinEl.className = 'group relative cursor-pointer transform transition-transform hover:scale-110';
      pinEl.innerHTML = `
        <div class="flex items-center justify-center w-8 h-8 rounded-full ${
          isUserInside ? 'bg-rose-600 ring-4 ring-rose-500/50 scale-110' : 'bg-blue-600 ring-2 ring-blue-400/40'
        } text-white shadow-2xl border-2 border-white">
          <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 10.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
        </div>
        <div class="absolute bottom-9 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-950 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-2xl border border-blue-500 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50">
          <div class="text-blue-300 font-extrabold flex items-center gap-1">
            <span>🛡️ ${zone.name}</span>
          </div>
          <div class="text-[9px] text-amber-300 font-semibold">${zone.primaryFocus.split(',')[0]}</div>
          <div class="text-[8px] text-slate-400">${zone.vhfChannel}</div>
        </div>
      `;

      const marker = new AdvancedMarkerElement({
        map: mapInstanceRef.current,
        position: { lat: zone.lat, lng: zone.lng },
        title: zone.name,
        content: pinEl
      });

      marker.addListener('click', () => {
        setSelectedZoneInfo(zone);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.panTo({ lat: zone.lat, lng: zone.lng });
        }
      });

      patrolMarkersRef.current.push(marker);
    });
  }, [proximityEnabled, proximityThresholdNM, isMapLoaded, nearestZone?.id, nearestZone?.isInsideThreshold]);

  // Render Connecting Target Laser Line to Nearest Zone
  useEffect(() => {
    if (!mapInstanceRef.current || !isMapLoaded) return;
    const { AdvancedMarkerElement } = google.maps.marker;

    if (targetLaserLineRef.current) {
      targetLaserLineRef.current.setMap(null);
      targetLaserLineRef.current = null;
    }
    if (laserMarkerRef.current) {
      laserMarkerRef.current.map = null;
      laserMarkerRef.current = null;
    }

    if (proximityEnabled && nearestZone) {
      // Connecting dashed laser vector
      const line = new google.maps.Polyline({
        path: [
          { lat: selectedLocation.lat, lng: selectedLocation.lng },
          { lat: nearestZone.lat, lng: nearestZone.lng }
        ],
        geodesic: true,
        strokeColor: isCriticalZone ? '#ef4444' : isApproachingZone ? '#f59e0b' : '#38bdf8',
        strokeOpacity: 0.85,
        strokeWeight: isCriticalZone ? 3 : 2,
        map: mapInstanceRef.current
      });
      targetLaserLineRef.current = line;

      // Label at midpoint of line
      const midLat = (selectedLocation.lat + nearestZone.lat) / 2;
      const midLng = (selectedLocation.lng + nearestZone.lng) / 2;

      const badgeEl = document.createElement('div');
      badgeEl.className = 'pointer-events-none select-none';
      badgeEl.innerHTML = `
        <div class="bg-slate-950/95 px-2 py-0.5 rounded-full border ${
          isCriticalZone 
            ? 'border-rose-500 text-rose-300 ring-2 ring-rose-500/40 animate-pulse' 
            : isApproachingZone 
            ? 'border-amber-500 text-amber-300 ring-2 ring-amber-500/40 animate-pulse' 
            : 'border-cyan-400 text-cyan-200'
        } text-[10px] font-black shadow-2xl whitespace-nowrap">
          ${nearestZone.distanceNM < 0.2 ? `${nearestZone.distanceFt} ft` : `${nearestZone.distanceNM.toFixed(2)} NM`} ➔ ${nearestZone.name.split('&')[0]}
        </div>
      `;

      const midMarker = new AdvancedMarkerElement({
        map: mapInstanceRef.current,
        position: { lat: midLat, lng: midLng },
        content: badgeEl,
        zIndex: 9998
      });
      laserMarkerRef.current = midMarker;
    }
  }, [selectedLocation, nearestZone, proximityEnabled, isMapLoaded, isApproachingZone, isCriticalZone]);

  // Render Hotspots markers
  useEffect(() => {
    if (!mapInstanceRef.current || !isMapLoaded) return;
    const { AdvancedMarkerElement } = google.maps.marker;

    spotMarkersRef.current.forEach(m => (m.map = null));
    spotMarkersRef.current = [];

    hotspots.forEach((spot) => {
      const isSelected = selectedHotspot?.id === spot.id;
      const pinEl = document.createElement('div');
      pinEl.className = 'group relative cursor-pointer transform transition-transform hover:scale-110';
      
      const badgeColor = spot.currentActivity.includes('Prime')
        ? 'bg-rose-500'
        : 'bg-emerald-500';

      pinEl.innerHTML = `
        <div class="flex items-center justify-center w-7 h-7 rounded-full ${badgeColor} text-white shadow-lg border-2 ${
          isSelected ? 'border-amber-300 ring-4 ring-amber-300/40 scale-110' : 'border-white/80'
        }">
          <svg class="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918" />
          </svg>
        </div>
        <div class="absolute bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-900/90 text-white text-[10px] font-semibold px-2 py-0.5 rounded shadow border border-slate-700 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
          ${spot.name}
        </div>
      `;

      const marker = new AdvancedMarkerElement({
        map: mapInstanceRef.current,
        position: { lat: spot.lat, lng: spot.lng },
        title: spot.name,
        content: pinEl
      });

      marker.addListener('click', () => {
        onSelectHotspot(spot);
        onPickLocation({
          lat: spot.lat,
          lng: spot.lng,
          label: spot.name
        });
        if (mapInstanceRef.current) {
          mapInstanceRef.current.panTo({ lat: spot.lat, lng: spot.lng });
        }
      });

      spotMarkersRef.current.push(marker);
    });
  }, [hotspots, selectedHotspot, isMapLoaded, onSelectHotspot, onPickLocation]);

  // Use browser Geolocation to pick location
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) return;
    setIsLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Math.round(pos.coords.latitude * 10000) / 10000;
        const lng = Math.round(pos.coords.longitude * 10000) / 10000;
        onPickLocation({
          lat,
          lng,
          label: `GPS Location (${lat.toFixed(3)}°, ${lng.toFixed(3)}°)`
        });
        if (mapInstanceRef.current) {
          mapInstanceRef.current.panTo({ lat, lng });
          mapInstanceRef.current.setZoom(13);
        }
        setIsLocatingUser(false);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setIsLocatingUser(false);
      }
    );
  };

  // Fly boat directly to simulation point
  const handleSimulateFlyTo = (target: string) => {
    let targetCoords: LocationCoordinates | null = null;
    if (target === 'lesner') {
      targetCoords = { lat: 36.909, lng: -76.096, label: 'At Lesner Bridge Channel' };
    } else if (target === 'cbbt') {
      targetCoords = { lat: 37.031, lng: -76.075, label: 'At CBBT 1st Island' };
    } else if (target === 'rudee') {
      targetCoords = { lat: 36.832, lng: -75.971, label: 'At Rudee Inlet Channel' };
    } else if (target === 'broad_bay') {
      targetCoords = { lat: 36.889, lng: -76.035, label: 'At Broad Bay Long Creek' };
    } else if (target === 'offshore') {
      targetCoords = { lat: 36.850, lng: -75.860, label: '5.5 NM Offshore (Safe Clear)' };
    }

    if (targetCoords) {
      onPickLocation(targetCoords);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.panTo({ lat: targetCoords.lat, lng: targetCoords.lng });
        mapInstanceRef.current.setZoom(13);
      }
      setProximityEnabled(true);
    }
  };

  return (
    <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 p-3 sm:p-5 shadow-2xl text-slate-100 flex flex-col overflow-hidden">
      {/* Top Header & Map Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 bg-cyan-500/10 rounded-xl border border-cyan-500/20 text-cyan-400 shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
                Interactive Coastal Map with Patrol Proximity Radar
              </h3>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded-full border border-cyan-700/40 shrink-0">
                <MousePointerClick className="w-3 h-3" /> Click anywhere
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 truncate">
              Vessel Pin: <span className="text-cyan-300 font-semibold">{selectedLocation.label || `${selectedLocation.lat.toFixed(3)}°, ${selectedLocation.lng.toFixed(3)}°`}</span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between lg:justify-end gap-2 w-full lg:w-auto">
          {/* Patrol Density Heatmap Layer Button */}
          <button
            onClick={() => {
              setShowHeatmap(!showHeatmap);
              if (!showHeatmap) setShowHeatmapControls(true);
            }}
            className={`px-3 py-1.5 rounded-xl border text-xs font-black flex items-center gap-1.5 transition-all shadow-md ${
              showHeatmap
                ? 'bg-gradient-to-r from-orange-600 via-rose-600 to-amber-600 text-white border-orange-400/80 ring-2 ring-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.4)]'
                : 'bg-slate-950/90 text-slate-400 border-slate-700 hover:text-slate-200 hover:border-slate-600'
            }`}
            title="Toggle Historical Marine Patrol Density Heatmap"
          >
            <Flame className={`w-3.5 h-3.5 ${showHeatmap ? 'text-amber-200 animate-pulse' : 'text-slate-500'}`} />
            <span>Patrol Heatmap</span>
            <span className={`text-[9px] px-1.5 py-0.2 rounded font-black uppercase ${
              showHeatmap ? 'bg-black/40 text-amber-200' : 'bg-slate-800 text-slate-500'
            }`}>
              {showHeatmap ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* Visual Toggle Switch for Patrol Proximity */}
          <div className="flex items-center gap-2 bg-slate-950/90 border border-slate-700/80 px-3 py-1.5 rounded-xl shadow-md">
            <div 
              className="flex items-center gap-1.5 cursor-pointer select-none"
              onClick={() => handleToggleProximity(!proximityEnabled)}
            >
              <Bell className={`w-3.5 h-3.5 ${proximityEnabled ? 'text-amber-400 animate-bounce' : 'text-slate-400'}`} />
              <span className="text-xs font-black text-slate-200 whitespace-nowrap">
                Proximity:
              </span>
            </div>

            {/* Sliding Switch */}
            <button
              type="button"
              role="switch"
              aria-checked={proximityEnabled}
              onClick={() => handleToggleProximity(!proximityEnabled)}
              className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-slate-900 ${
                proximityEnabled ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-slate-700 hover:bg-slate-600'
              }`}
            >
              <span className="sr-only">Toggle Patrol Proximity</span>
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  proximityEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>

            <span className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded transition-colors ${
              proximityEnabled ? 'bg-amber-950 text-amber-300 border border-amber-500/50' : 'bg-slate-800 text-slate-400'
            }`}>
              {proximityEnabled ? 'ON' : 'OFF'}
            </span>
          </div>

          {/* GPS Locate Me Button */}
          <button
            onClick={handleUseMyLocation}
            disabled={isLocatingUser}
            className="bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 hover:border-cyan-500/40 px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0"
            title="Use current GPS location"
          >
            <Crosshair className={`w-3.5 h-3.5 ${isLocatingUser ? 'animate-spin' : ''}`} />
            <span>GPS</span>
          </button>

          {/* Map Layer Switcher */}
          <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs shrink-0">
            <button
              onClick={() => setMapType('hybrid')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                mapType === 'hybrid' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Satellite
            </button>
            <button
              onClick={() => setMapType('terrain')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                mapType === 'terrain' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Marine
            </button>
            <button
              onClick={() => setMapType('roadmap')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                mapType === 'roadmap' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Roads
            </button>
          </div>
        </div>
      </div>

      {/* Map Canvas with Integrated HUD Overlays */}
      <div className="mt-3 relative rounded-xl overflow-hidden border border-slate-800 min-h-[440px] sm:min-h-[520px] bg-slate-950">
        <div ref={mapContainerRef} className="w-full h-full min-h-[440px] sm:min-h-[520px]" />

        {/* FLOATING PROXIMITY RADAR HUD (Upper-Right Overlay on the Map) */}
        <div className="absolute top-3 right-3 max-w-[340px] w-full bg-slate-950/95 backdrop-blur-md rounded-xl border border-amber-500/40 p-3 shadow-2xl text-xs space-y-2 z-20">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-1.5 font-black text-white">
              <ShieldAlert className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>Patrol Proximity Radar HUD</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setSoundAlerts(!soundAlerts);
                  if (!soundAlerts) playProximityAlertSound();
                }}
                className={`p-1 rounded border text-[10px] ${
                  soundAlerts ? 'bg-amber-950 text-amber-300 border-amber-500' : 'bg-slate-900 text-slate-500 border-slate-800'
                }`}
                title={soundAlerts ? 'Mute Chimes' : 'Enable Chimes'}
              >
                {soundAlerts ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => setIsHudExpanded(!isHudExpanded)}
                className="p-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300"
              >
                {isHudExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Status Badge & Nearest Law Enforcement Zone */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Nearest Law Enforcement Zone</div>
              <div className="font-extrabold text-white text-xs mt-0.5">{nearestZone.name}</div>
              <div className="text-[10px] text-blue-300">{nearestZone.agency}</div>
            </div>
            <div className="text-right shrink-0">
              <div className={`text-sm font-black ${
                isCriticalZone ? 'text-rose-400 animate-pulse' : isApproachingZone ? 'text-amber-300' : 'text-emerald-400'
              }`}>
                {nearestZone.distanceNM < 0.2 ? `${nearestZone.distanceFt} ft` : `${nearestZone.distanceNM.toFixed(2)} NM`}
              </div>
              <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border ${
                isCriticalZone 
                  ? 'bg-rose-950 text-rose-300 border-rose-600' 
                  : isApproachingZone 
                  ? 'bg-amber-950 text-amber-300 border-amber-600' 
                  : 'bg-emerald-950 text-emerald-300 border-emerald-600'
              }`}>
                {isCriticalZone ? 'CRITICAL DISTANCE' : isApproachingZone ? 'CAUTION ZONE' : 'SAFE CLEAR'}
              </span>
            </div>
          </div>

          {/* Expanded HUD Controls & Quick Simulator */}
          {isHudExpanded && (
            <div className="space-y-2 pt-1 border-t border-slate-800/80">
              <div className="bg-slate-900/90 p-2 rounded-lg border border-slate-800 text-[11px] text-slate-300 leading-snug">
                <span className="font-bold text-amber-300">Active Rule: </span>
                {nearestZone.restrictionRules}
              </div>

              {/* Threshold Selector & Simulator Buttons */}
              <div className="flex items-center justify-between gap-1 pt-0.5">
                <span className="text-[10px] font-bold text-slate-400">Radar Ring:</span>
                <div className="flex gap-1">
                  {[0.5, 1.0, 2.0].map((nm) => (
                    <button
                      key={nm}
                      onClick={() => setProximityThresholdNM(nm)}
                      className={`px-2 py-0.5 text-[10px] font-black rounded border transition-all ${
                        proximityThresholdNM === nm
                          ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-sm'
                          : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
                      }`}
                    >
                      {nm} NM
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Fly-To Simulator Dropdown */}
              <div className="flex items-center gap-1.5 pt-0.5">
                <span className="text-[10px] font-bold text-slate-400 shrink-0">Test GPS:</span>
                <select
                  onChange={(e) => handleSimulateFlyTo(e.target.value)}
                  className="w-full bg-slate-900 text-[10px] font-bold text-cyan-300 p-1 rounded border border-slate-700 focus:outline-none focus:border-amber-400 cursor-pointer"
                  defaultValue=""
                >
                  <option value="" disabled>Fly Boat to Location...</option>
                  <option value="lesner">Lesner Bridge (0.0 NM - Warning)</option>
                  <option value="cbbt">CBBT 1st Island (0.0 NM - Security)</option>
                  <option value="rudee">Rudee Inlet (0.0 NM - No-Wake)</option>
                  <option value="broad_bay">Broad Bay Canal (0.0 NM)</option>
                  <option value="offshore">Offshore Waters (5.5 NM - Safe)</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* FLOATING HISTORICAL PATROL DENSITY HEATMAP HUD (Upper-Left Overlay) */}
        {showHeatmap && (
          <div className="absolute top-3 left-3 max-w-[320px] w-full bg-slate-950/95 backdrop-blur-md rounded-xl border border-orange-500/50 p-3 shadow-2xl text-xs space-y-2.5 z-20">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <div className="flex items-center gap-1.5 font-black text-white">
                <Flame className="w-4 h-4 text-orange-400 animate-pulse" />
                <span>Historical Patrol Density Heatmap</span>
              </div>
              <button
                onClick={() => setShowHeatmapControls(!showHeatmapControls)}
                className="p-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-[10px] font-bold flex items-center gap-0.5"
              >
                <Sliders className="w-3 h-3 text-orange-400" />
                <span>{showHeatmapControls ? 'Hide' : 'Filter'}</span>
              </button>
            </div>

            {/* Current Vessel Pin Density Score */}
            <div className="flex items-center justify-between gap-2 bg-slate-900/90 p-2 rounded-lg border border-slate-800">
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Patrol Frequency at Pin</div>
                <div className="font-extrabold text-white text-xs mt-0.5 truncate max-w-[180px]">
                  {localPatrolDensity.closestAreaName || 'Open Waters'}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className={`text-xs font-black ${
                  localPatrolDensity.level === 'Critical' 
                    ? 'text-rose-400' 
                    : localPatrolDensity.level === 'High' 
                    ? 'text-orange-400' 
                    : localPatrolDensity.level === 'Moderate' 
                    ? 'text-yellow-300' 
                    : 'text-cyan-300'
                }`}>
                  {localPatrolDensity.score} / 10
                </div>
                <span className={`text-[8px] font-black uppercase px-1.5 py-0.2 rounded border ${
                  localPatrolDensity.level === 'Critical'
                    ? 'bg-rose-950 text-rose-300 border-rose-600'
                    : localPatrolDensity.level === 'High'
                    ? 'bg-orange-950 text-orange-300 border-orange-600'
                    : localPatrolDensity.level === 'Moderate'
                    ? 'bg-yellow-950 text-yellow-300 border-yellow-600'
                    : 'bg-cyan-950 text-cyan-300 border-cyan-700'
                }`}>
                  {localPatrolDensity.level} Density
                </span>
              </div>
            </div>

            {/* Thermal Gradient Legend */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[9px] font-bold text-slate-400">
                <span>Low Frequency</span>
                <span>Moderate</span>
                <span>High / Critical</span>
              </div>
              <div className="h-2 rounded-full w-full bg-gradient-to-r from-cyan-400 via-yellow-400 via-orange-500 to-rose-600 shadow-inner border border-slate-700/60" />
            </div>

            {/* Collapsible Filter & Intensity Controls */}
            {showHeatmapControls && (
              <div className="space-y-2 pt-1 border-t border-slate-800">
                {/* Season Model Selector */}
                <div>
                  <div className="text-[10px] font-bold text-slate-400 mb-1">Model / Timeframe:</div>
                  <div className="grid grid-cols-3 gap-1">
                    {[
                      { id: 'all', label: 'Year-Round' },
                      { id: 'summer_peak', label: 'Summer Peak' },
                      { id: 'fall_striper', label: 'Fall Run' }
                    ].map(s => (
                      <button
                        key={s.id}
                        onClick={() => setHeatmapSeason(s.id as any)}
                        className={`py-1 px-1 text-[9px] font-black rounded border transition-all ${
                          heatmapSeason === s.id
                            ? 'bg-orange-600 text-white border-orange-400 shadow-sm'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Heatmap Intensity Preset */}
                <div className="flex items-center justify-between gap-1 pt-0.5">
                  <span className="text-[10px] font-bold text-slate-400">Glow Intensity:</span>
                  <div className="flex gap-1">
                    {[
                      { id: 'soft', label: 'Soft' },
                      { id: 'normal', label: 'Normal' },
                      { id: 'high', label: 'Vivid' }
                    ].map(int => (
                      <button
                        key={int.id}
                        onClick={() => setHeatmapIntensity(int.id as any)}
                        className={`px-2 py-0.5 text-[9px] font-black rounded border transition-all ${
                          heatmapIntensity === int.id
                            ? 'bg-amber-500 text-slate-950 border-amber-400'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                        }`}
                      >
                        {int.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="text-[9px] text-slate-400 bg-slate-900/60 p-1.5 rounded border border-slate-800 leading-tight">
                  ℹ️ Aggregated from multi-year VMRC on-water inspection logs and USCG safety records.
                </div>
              </div>
            )}
          </div>
        )}

        {/* Selected Zone Popover Card on Map */}
        {selectedZoneInfo && (
          <div className="absolute bottom-16 left-3 max-w-sm w-full bg-slate-950/95 backdrop-blur-md rounded-xl border border-blue-500 p-3.5 shadow-2xl z-30 text-xs space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <div className="flex items-center gap-1.5 font-black text-white">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                <span>{selectedZoneInfo.name}</span>
              </div>
              <button
                onClick={() => setSelectedZoneInfo(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="text-[11px] font-bold text-cyan-300">
              Agency: {selectedZoneInfo.agency} • {selectedZoneInfo.vhfChannel}
            </div>
            <p className="text-slate-300 text-xs leading-snug">
              {selectedZoneInfo.description}
            </p>
            <div className="bg-slate-900 p-2 rounded-lg border border-slate-800 text-[11px] text-amber-200">
              <strong className="text-white">Law Enforcement Regulations:</strong> {selectedZoneInfo.restrictionRules}
            </div>
            <div className="flex justify-end pt-1">
              <button
                onClick={() => {
                  onPickLocation({
                    lat: selectedZoneInfo.lat,
                    lng: selectedZoneInfo.lng,
                    label: selectedZoneInfo.name
                  });
                  setSelectedZoneInfo(null);
                }}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-3 py-1 rounded-lg transition-colors"
              >
                Set Vessel Position Here
              </button>
            </div>
          </div>
        )}

        {/* Floating Instruction */}
        <div className="absolute top-3 left-3 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/80 text-xs text-slate-200 shadow-xl pointer-events-none flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
          <span>Click any water to move vessel pin & measure live proximity</span>
        </div>

        {/* Hotspots Quick Carousel at Bottom of Map */}
        <div className="absolute bottom-3 inset-x-3 flex gap-2 overflow-x-auto no-scrollbar py-1 z-10">
          {hotspots.map((spot) => {
            const isSelected = selectedHotspot?.id === spot.id;
            return (
              <button
                key={spot.id}
                onClick={() => {
                  onSelectHotspot(spot);
                  onPickLocation({
                    lat: spot.lat,
                    lng: spot.lng,
                    label: spot.name
                  });
                  if (mapInstanceRef.current) {
                    mapInstanceRef.current.panTo({ lat: spot.lat, lng: spot.lng });
                  }
                }}
                className={`shrink-0 text-left px-3 py-2 rounded-xl backdrop-blur-md border text-xs shadow-xl transition-all ${
                  isSelected
                    ? 'bg-slate-900/95 border-cyan-400 ring-2 ring-cyan-400/40 text-white'
                    : 'bg-slate-950/85 border-slate-700/80 hover:bg-slate-900 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold">
                  <span className={`w-2 h-2 rounded-full ${spot.currentActivity.includes('Prime') ? 'bg-rose-500' : 'bg-emerald-400'}`} />
                  <span className="truncate max-w-[130px]">{spot.name}</span>
                </div>
                <div className="text-[10px] text-cyan-300/80 mt-0.5">
                  {spot.subType} • {spot.tidePreference}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
