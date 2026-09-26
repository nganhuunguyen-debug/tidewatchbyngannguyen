import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldAlert, ShieldCheck, Radio, PhoneCall, AlertTriangle, 
  MapPin, CheckSquare, Square, Info, Anchor, Navigation, 
  Eye, RefreshCw, PlusCircle, Compass, HelpCircle,
  Bell, BellRing, BellOff, Volume2, VolumeX, LocateFixed,
  AlertCircle, Sliders, Waves, Settings, X, Gauge, SlidersHorizontal, Sparkles
} from 'lucide-react';

interface PatrolZone {
  id: string;
  name: string;
  agency: string;
  frequency: 'High' | 'Daily' | 'Seasonal' | 'Variable';
  primaryFocus: string;
  restrictionRules: string;
  coordinates: { lat: number; lng: number };
  description: string;
}

const PATROL_ZONES: PatrolZone[] = [
  {
    id: 'lynnhaven-inlet',
    name: 'Lynnhaven Inlet & Lesner Bridge',
    agency: 'VMRC Marine Police & VB Marine Unit',
    frequency: 'High',
    primaryFocus: 'No-wake zones, boat ramp safety, 2 7/8" gill net mesh checks, Croaker/Spot/Mullet bag limits',
    restrictionRules: '5 MPH Idle Speed strictly enforced in channel. 2 7/8" minimum mesh required on nets. Ramp safety gear checks.',
    coordinates: { lat: 36.909, lng: -76.096 },
    description: 'Active year-round patrol area. High officer presence at Lynnhaven Boat Ramp and Lesner Bridge channel.'
  },
  {
    id: 'rudee-inlet',
    name: 'Rudee Inlet & Oceanfront Channel',
    agency: 'USCG Station Little Creek & VB Police',
    frequency: 'High',
    primaryFocus: 'Inlet channel navigation safety, PFD compliance, Flounder/Drum catch inspections',
    restrictionRules: 'Strict No-Wake Zone inside inlet basin. Keep right in rock jetty channel. PFD required on all underway personal watercraft.',
    coordinates: { lat: 36.832, lng: -75.971 },
    description: 'Critical navigation gateway. Routine vessel safety boardings and jet ski/boating speed enforcement.'
  },
  {
    id: 'cbbt-islands',
    name: 'Chesapeake Bay Bridge-Tunnel (CBBT) Pilings',
    agency: 'VMRC Marine Police & US Coast Guard',
    frequency: 'Daily',
    primaryFocus: '300-ft bridge security zone, Striped Bass regulations, Cobia/Red Drum size limits',
    restrictionRules: 'Federal 300-ft security exclusion zone around island portals. Strictly prohibited to tie off to bridge pilings.',
    coordinates: { lat: 37.031, lng: -76.075 },
    description: 'Frequent on-water patrol vessels monitoring bridge structure security and recreational sportfishing.'
  },
  {
    id: 'cape-henry',
    name: 'Cape Henry & Virginia Beach Oceanfront',
    agency: 'US Coast Guard Sector Virginia & VMRC',
    frequency: 'Daily',
    primaryFocus: 'Commercial shipping channel safety, offshore safety gear, Cobia/Mackerel regulations',
    restrictionRules: 'Deep-draft commercial shipping channel. Avoid impeding large cargo vessels and navy warships.',
    coordinates: { lat: 36.928, lng: -76.008 },
    description: 'Major maritime shipping corridor. Coast Guard cutters and Response Boats operate routine safety patrols.'
  },
  {
    id: 'broad-bay',
    name: 'Broad Bay, Linkhorn Bay & Long Creek',
    agency: 'Virginia Marine Police (VMRC)',
    frequency: 'Daily',
    primaryFocus: 'Idle-speed no-wake compliance, oyster sanctuary enforcement, crab pot licensing',
    restrictionRules: 'Continuous No-Wake idle speed in Long Creek canal. Prohibited to disturb marked oyster sanctuaries.',
    coordinates: { lat: 36.889, lng: -76.035 },
    description: 'Inland bay network with strict no-wake zones and residential shoreline monitoring.'
  },
  {
    id: 'back-bay',
    name: 'Back Bay & North Landing River',
    agency: 'Virginia DWR Conservation Police',
    frequency: 'Seasonal',
    primaryFocus: 'Wildlife management area rules, freshwater/saltwater transition licenses, boat registration',
    restrictionRules: 'DWR Wildlife Management Area rules apply. Verify freshwater vs saltwater boundary licenses.',
    coordinates: { lat: 36.658, lng: -75.989 },
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

// Synthesizer chime for proximity warning
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
  } catch (err) {
    console.warn('Audio notification unavailable:', err);
  }
}

interface CommunityReport {
  id: string;
  location: string;
  type: 'Safety Check' | 'Routine Patrol' | 'Vessel Boarding' | 'Navigation Hazard';
  agency: string;
  timeAgo: string;
  details: string;
}

export const MarinePoliceRadar: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'status' | 'proximity' | 'zones' | 'checklist' | 'contacts' | 'radar_tech'>('status');

  // Patrol Proximity Notifications State (Persisted in localStorage)
  const [proximityEnabled, setProximityEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('vmrc_patrol_proximity_enabled');
      return saved !== null ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  // Alert Distance Threshold in Nautical Miles (Persisted in localStorage)
  const [proximityThresholdNM, setProximityThresholdNM] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('vmrc_patrol_alert_threshold_nm');
      return saved !== null ? Number(saved) : 1.0;
    } catch {
      return 1.0;
    }
  });

  // Marine Activity Profile: 'inshore_kayak' | 'powerboat' | 'fast_craft' | 'bay_cruise' | 'offshore' | 'custom'
  const [activityProfile, setActivityProfile] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('vmrc_patrol_activity_profile');
      return saved !== null ? saved : 'powerboat';
    } catch {
      return 'powerboat';
    }
  });

  const [distanceUnit, setDistanceUnit] = useState<'NM' | 'miles'>('NM');
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);

  const handleUpdateThreshold = (nm: number, profileName?: string) => {
    const clamped = Math.max(0.25, Math.min(15.0, Math.round(nm * 100) / 100));
    setProximityThresholdNM(clamped);
    try {
      localStorage.setItem('vmrc_patrol_alert_threshold_nm', String(clamped));
      if (profileName) {
        setActivityProfile(profileName);
        localStorage.setItem('vmrc_patrol_activity_profile', profileName);
      } else {
        setActivityProfile('custom');
        localStorage.setItem('vmrc_patrol_activity_profile', 'custom');
      }
    } catch {}
  };

  const handleToggleProximity = (enabled: boolean) => {
    setProximityEnabled(enabled);
    try {
      localStorage.setItem('vmrc_patrol_proximity_enabled', JSON.stringify(enabled));
    } catch {}
    if (enabled && soundAlerts) {
      playProximityAlertSound();
    }
  };

  const [soundAlerts, setSoundAlerts] = useState<boolean>(true);
  const [userGps, setUserGps] = useState<{ lat: number; lng: number; accuracy: number; timestamp: number } | null>(null);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'tracking' | 'error' | 'simulated'>('idle');
  const [gpsErrorMsg, setGpsErrorMsg] = useState<string | null>(null);
  const [simulatedZoneId, setSimulatedZoneId] = useState<string>('none');
  const watchIdRef = useRef<number | null>(null);
  const lastAlertZoneRef = useRef<string | null>(null);

  // Pre-loaded realistic community safety & law enforcement reports with localStorage persistence
  const [reports, setReports] = useState<CommunityReport[]>(() => {
    try {
      const saved = localStorage.getItem('vmrc_patrol_community_reports');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [
      {
        id: 'rep-1',
        location: 'Lynnhaven Inlet Boat Ramp',
        type: 'Safety Check',
        agency: 'VMRC Marine Police',
        timeAgo: '15 mins ago',
        details: 'VMRC marine officer performing dockside PFD, fire extinguisher, and recreational fishing gear checks at public ramp.'
      },
      {
        id: 'rep-2',
        location: 'CBBT 1st Island Channel',
        type: 'Routine Patrol',
        agency: 'US Coast Guard Station Little Creek',
        timeAgo: '45 mins ago',
        details: 'USCG 45ft Response Boat monitoring Federal 300-ft bridge security zone and deep-draft commercial traffic.'
      },
      {
        id: 'rep-3',
        location: 'Lesner Bridge Channel',
        type: 'Routine Patrol',
        agency: 'Virginia Beach Police Marine Unit',
        timeAgo: '1.2 hours ago',
        details: 'VBPD marine patrol enforcing 5 MPH idle speed no-wake compliance under Lesner Bridge bridge pilings.'
      },
      {
        id: 'rep-4',
        location: 'Broad Bay / Long Creek Canal',
        type: 'Safety Check',
        agency: 'VMRC Marine Police',
        timeAgo: '2.5 hours ago',
        details: 'Routine compliance inspection verifying 2 7/8" minimum gill net mesh sizes and crab pot license markers.'
      }
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem('vmrc_patrol_community_reports', JSON.stringify(reports));
    } catch {}
  }, [reports]);

  // Handle Geolocation API tracking
  useEffect(() => {
    if (!proximityEnabled) {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (gpsStatus === 'tracking') {
        setGpsStatus('idle');
      }
      return;
    }

    if (simulatedZoneId !== 'none') {
      // Simulated GPS mode is active
      return;
    }

    if (!navigator.geolocation) {
      setGpsStatus('error');
      setGpsErrorMsg('Geolocation is not supported by your browser.');
      return;
    }

    setGpsStatus('tracking');
    setGpsErrorMsg(null);

    // Request browser notification permissions if available
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setUserGps({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy),
          timestamp: pos.timestamp
        });
        setGpsStatus('tracking');
      },
      (err) => {
        console.warn('Geolocation Watch error:', err);
        setGpsStatus('error');
        setGpsErrorMsg(err.message || 'Unable to retrieve live GPS coordinates.');
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 20000
      }
    );

    return () => {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [proximityEnabled, simulatedZoneId]);

  // Handle Simulated Position changes
  const handleSimulatePosition = (zoneId: string) => {
    setSimulatedZoneId(zoneId);
    if (zoneId === 'none') {
      setUserGps(null);
      setGpsStatus(proximityEnabled ? 'tracking' : 'idle');
      return;
    }

    if (zoneId === 'open_ocean') {
      setUserGps({
        lat: 36.850,
        lng: -75.860,
        accuracy: 10,
        timestamp: Date.now()
      });
      setGpsStatus('simulated');
      setProximityEnabled(true);
      return;
    }

    const matchedZone = PATROL_ZONES.find(z => z.id === zoneId);
    if (matchedZone) {
      setUserGps({
        lat: matchedZone.coordinates.lat + 0.0015, // Approx 0.1 NM from zone center
        lng: matchedZone.coordinates.lng + 0.0015,
        accuracy: 8,
        timestamp: Date.now()
      });
      setGpsStatus('simulated');
      setProximityEnabled(true);
    }
  };

  // Compute distances from active GPS location to all patrol zones
  const effectiveGps = userGps || { lat: 36.909, lng: -76.096 }; // Default to custom pin if GPS not active yet
  const zonesWithDistances = PATROL_ZONES.map(z => {
    const distNM = calculateDistanceNM(effectiveGps.lat, effectiveGps.lng, z.coordinates.lat, z.coordinates.lng);
    return {
      ...z,
      distanceNM: distNM,
      distanceFt: Math.round(distNM * 6076.12),
      isInsideThreshold: distNM <= proximityThresholdNM,
      isImmediateWarning: distNM <= 0.35 // Within ~2,000 ft
    };
  }).sort((a, b) => a.distanceNM - b.distanceNM);

  const nearestZone = zonesWithDistances[0];
  const isApproachingZone = proximityEnabled && userGps && nearestZone.isInsideThreshold;

  // Sound chime when entering warning threshold
  useEffect(() => {
    if (isApproachingZone && soundAlerts) {
      if (lastAlertZoneRef.current !== nearestZone.id) {
        playProximityAlertSound();
        lastAlertZoneRef.current = nearestZone.id;

        // Trigger browser notification if allowed
        if ('Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification(`⚠️ Law Enforcement Zone Proximity Alert`, {
              body: `Approaching ${nearestZone.name} (${nearestZone.distanceNM.toFixed(2)} NM). Rules: ${nearestZone.restrictionRules}`,
              icon: '/vite.svg'
            });
          } catch (e) {}
        }
      }
    } else if (!isApproachingZone) {
      lastAlertZoneRef.current = null;
    }
  }, [isApproachingZone, nearestZone?.id, soundAlerts]);

  // Report creation modal/drawer state
  const [showAddReport, setShowAddReport] = useState(false);
  const [newLocation, setNewLocation] = useState('Lynnhaven Inlet');
  const [newType, setNewType] = useState<'Safety Check' | 'Routine Patrol' | 'Vessel Boarding' | 'Navigation Hazard'>('Routine Patrol');
  const [newAgency, setNewAgency] = useState('VMRC Marine Police');
  const [newDetails, setNewDetails] = useState('');

  // Interactive USCG / VMRC Safety Checklist state
  const [checklist, setChecklist] = useState<{ [key: string]: boolean }>({
    license: true,
    mesh_rule: true,
    life_jackets: true,
    throwable: false,
    sound_device: true,
    fire_ext: true,
    flares: false,
    kill_switch: true,
    fish_limits: true
  });

  const toggleCheck = (key: string) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const completedCount = Object.values(checklist).filter(Boolean).length;
  const totalChecklist = Object.keys(checklist).length;
  const isFullyCompliant = completedCount === totalChecklist;

  const handleAddReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDetails.trim()) return;
    const newRep: CommunityReport = {
      id: `rep-${Date.now()}`,
      location: newLocation,
      type: newType,
      agency: newAgency,
      timeAgo: 'Just now',
      details: newDetails.trim()
    };
    setReports([newRep, ...reports]);
    setNewDetails('');
    setShowAddReport(false);
  };

  const handleDeleteReport = (id: string) => {
    setReports(prev => prev.filter(r => r.id !== id));
  };

  const handleResetReports = () => {
    setReports([
      {
        id: 'rep-1',
        location: 'Lynnhaven Inlet Boat Ramp',
        type: 'Safety Check',
        agency: 'VMRC Marine Police',
        timeAgo: '15 mins ago',
        details: 'VMRC marine officer performing dockside PFD, fire extinguisher, and recreational fishing gear checks at public ramp.'
      },
      {
        id: 'rep-2',
        location: 'CBBT 1st Island Channel',
        type: 'Routine Patrol',
        agency: 'US Coast Guard Station Little Creek',
        timeAgo: '45 mins ago',
        details: 'USCG 45ft Response Boat monitoring Federal 300-ft bridge security zone and deep-draft commercial traffic.'
      },
      {
        id: 'rep-3',
        location: 'Lesner Bridge Channel',
        type: 'Routine Patrol',
        agency: 'Virginia Beach Police Marine Unit',
        timeAgo: '1.2 hours ago',
        details: 'VBPD marine patrol enforcing 5 MPH idle speed no-wake compliance under Lesner Bridge bridge pilings.'
      },
      {
        id: 'rep-4',
        location: 'Broad Bay / Long Creek Canal',
        type: 'Safety Check',
        agency: 'VMRC Marine Police',
        timeAgo: '2.5 hours ago',
        details: 'Routine compliance inspection verifying 2 7/8" minimum gill net mesh sizes and crab pot license markers.'
      }
    ]);
  };

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-blue-500/30 p-3 sm:p-5 shadow-2xl text-slate-100 flex flex-col space-y-4">
      {/* Header with Badges & Proximity Quick Toggle */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-800 pb-3 sm:pb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`flex h-2.5 w-2.5 rounded-full ${proximityEnabled ? 'bg-emerald-400 animate-ping' : 'bg-blue-400'}`} />
            <span className="text-xs uppercase tracking-wider font-extrabold text-blue-400 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5" />
              Marine Law Enforcement & Safety Advisory
            </span>
            {proximityEnabled && (
              <span className="text-[10px] font-black text-emerald-300 bg-emerald-950/90 px-2 py-0.5 rounded-full border border-emerald-500/50 flex items-center gap-1 shadow-sm">
                <BellRing className="w-3 h-3 text-emerald-400 animate-pulse" />
                PROXIMITY RADAR ACTIVE
              </span>
            )}
            <span className="text-[10px] font-bold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-600/40">
              Virginia Waters
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-black text-white tracking-tight mt-0.5">
            Marine Police Surroundings & VMRC Patrol Monitor
          </h2>
        </div>

        {/* Header Right Action Area: Visual Toggle + Settings Trigger */}
        <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
          {/* Quick Threshold Badge / Settings Opener */}
          <button
            onClick={() => setShowSettingsModal(true)}
            className="flex items-center gap-1.5 bg-slate-950/90 hover:bg-slate-900 border border-slate-700/80 hover:border-amber-500/50 px-2.5 py-1.5 rounded-xl shadow-md text-xs font-bold text-slate-300 transition-all group"
            title="Configure Alert Distance Threshold & Marine Activity Profiles"
          >
            <Settings className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-45 transition-transform" />
            <span>Alert Range:</span>
            <span className="text-amber-300 font-extrabold bg-amber-950/80 px-1.5 py-0.2 rounded border border-amber-600/40">
              {proximityThresholdNM} NM ({Math.round(proximityThresholdNM * 1.15078 * 10) / 10} mi)
            </span>
          </button>

          {/* Visual Toggle Switch for Patrol Proximity Notifications */}
          <div className="flex items-center gap-2.5 bg-slate-950/90 border border-slate-700/80 px-3 py-1.5 rounded-xl shadow-md">
            <div 
              className="flex items-center gap-1.5 cursor-pointer select-none" 
              onClick={() => handleToggleProximity(!proximityEnabled)}
            >
              <Bell className={`w-4 h-4 ${proximityEnabled ? 'text-amber-400 animate-bounce' : 'text-slate-400'}`} />
              <span className="text-xs font-extrabold text-slate-200 whitespace-nowrap">
                Proximity Alerts:
              </span>
            </div>

            {/* Physical-Style Visual Toggle Switch */}
            <button
              type="button"
              role="switch"
              aria-checked={proximityEnabled}
              onClick={() => handleToggleProximity(!proximityEnabled)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-slate-900 ${
                proximityEnabled ? 'bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.5)]' : 'bg-slate-700 hover:bg-slate-600'
              }`}
            >
              <span className="sr-only">Toggle Patrol Proximity Notifications</span>
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  proximityEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>

            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded transition-colors ${
              proximityEnabled ? 'bg-amber-950 text-amber-300 border border-amber-500/50' : 'bg-slate-800 text-slate-400'
            }`}>
              {proximityEnabled ? 'ON' : 'OFF'}
            </span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800 self-start overflow-x-auto max-w-full">
        <button
          onClick={() => setActiveTab('status')}
          className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 shrink-0 ${
            activeTab === 'status'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          Live Advisory
        </button>
        <button
          onClick={() => setActiveTab('proximity')}
          className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 shrink-0 ${
            activeTab === 'proximity'
              ? 'bg-amber-600 text-white shadow-md ring-1 ring-amber-400'
              : proximityEnabled
              ? 'text-amber-300 bg-amber-950/50 hover:text-white'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Bell className={`w-3.5 h-3.5 ${proximityEnabled ? 'text-amber-300 animate-bounce' : ''}`} />
          Proximity Radar {proximityEnabled && `(${proximityThresholdNM} NM)`}
        </button>
        <button
          onClick={() => setActiveTab('zones')}
          className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 shrink-0 ${
            activeTab === 'zones'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <MapPin className="w-3.5 h-3.5" />
          Patrol Sectors
        </button>
        <button
          onClick={() => setActiveTab('checklist')}
          className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 shrink-0 ${
            activeTab === 'checklist'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          Inspection Ready ({completedCount}/{totalChecklist})
        </button>
        <button
          onClick={() => setActiveTab('contacts')}
          className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 shrink-0 ${
            activeTab === 'contacts'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <PhoneCall className="w-3.5 h-3.5" />
          VHF & Hotlines
        </button>
        <button
          onClick={() => setActiveTab('radar_tech')}
          className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 shrink-0 ${
            activeTab === 'radar_tech'
              ? 'bg-emerald-600 text-white shadow-md ring-1 ring-emerald-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          Radar & AIS FAQ
        </button>
      </div>

      {/* ACTIVE PROXIMITY ALERT BANNER WITH FRAMER MOTION TRANSITIONS */}
      <AnimatePresence mode="wait">
        {isApproachingZone && (
          <motion.div
            key={`proximity-alert-${nearestZone.id}`}
            initial={{ opacity: 0, y: -18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -14, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 420, damping: 28, mass: 0.8 }}
            className={`border-2 rounded-xl p-3.5 sm:p-4 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              nearestZone.isImmediateWarning
                ? 'bg-gradient-to-r from-rose-950/95 via-slate-900 to-rose-950/95 border-rose-500 shadow-[0_0_25px_rgba(244,63,94,0.4)]'
                : 'bg-gradient-to-r from-amber-950/95 via-slate-900 to-amber-950/95 border-amber-500 shadow-[0_0_22px_rgba(245,158,11,0.35)]'
            }`}
          >
            <div className="flex items-start gap-3">
              <motion.div 
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg font-black ${
                  nearestZone.isImmediateWarning ? 'bg-rose-500 text-white' : 'bg-amber-500 text-slate-950'
                }`}
              >
                <ShieldAlert className="w-6 h-6" />
              </motion.div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-black uppercase px-2 py-0.5 rounded border ${
                    nearestZone.isImmediateWarning
                      ? 'bg-rose-950 text-rose-300 border-rose-500'
                      : 'bg-amber-950 text-amber-300 border-amber-500'
                  }`}>
                    {nearestZone.isImmediateWarning ? '🚨 CRITICAL RESTRICTED ZONE' : '⚠️ RESTRICTED PATROL ZONE APPROACHING'}
                  </span>
                  <span className="text-xs font-black text-white">
                    {nearestZone.distanceNM < 0.2 ? `${nearestZone.distanceFt} ft` : `${nearestZone.distanceNM.toFixed(2)} NM`}
                  </span>
                </div>
                <h3 className="text-sm font-black text-white mt-1">
                  {nearestZone.name} • <span className="text-amber-300 font-bold">{nearestZone.agency}</span>
                </h3>
                <p className="text-xs text-amber-100/90 mt-0.5 leading-snug">
                  <strong className="text-white">Rule:</strong> {nearestZone.restrictionRules}
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('proximity')}
              className={`font-black text-xs px-3.5 py-2 rounded-lg transition-all shadow-md shrink-0 self-start sm:self-auto ${
                nearestZone.isImmediateWarning
                  ? 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/30'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/30'
              }`}
            >
              View Proximity Radar →
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Official Clarification Banner */}
      <div className="bg-slate-950/80 border border-blue-500/20 rounded-xl p-3 flex items-start gap-2.5 text-xs text-slate-300 leading-relaxed">
        <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-white">Direct Answer on Marine Police Tracking: </span>
          Real-time law enforcement vessels (VMRC Marine Police, US Coast Guard, and Virginia Beach Police Marine Unit) 
          <strong className="text-amber-300"> do not broadcast live tactical police positions</strong> on public civilian GPS feeds for security and operational reasons. 
          However, this monitor provides <strong>active VMRC patrol sectors, high-enforcement checkpoints, official VHF channels, and an on-water inspection checklist</strong> to ensure you are 100% legal and prepared when operating near officers.
        </div>
      </div>

      {/* Tab 1: Live Advisory & Community Safety Feed */}
      {activeTab === 'status' && (
        <div className="space-y-4">
          {/* Quick Status Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Card 1: Proximity Alerts Status */}
            <div 
              onClick={() => setActiveTab('proximity')}
              className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 hover:border-amber-500/50 cursor-pointer transition-all flex items-center justify-between gap-3 group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${
                  proximityEnabled 
                    ? 'bg-amber-950/80 border-amber-500/50 text-amber-400' 
                    : 'bg-slate-900 border-slate-700 text-slate-400'
                }`}>
                  <Bell className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Patrol Proximity</div>
                  <div className="text-sm font-black text-white truncate">
                    {proximityEnabled ? `${nearestZone.distanceNM.toFixed(1)} NM to ${nearestZone.name.split('&')[0]}` : 'Disabled'}
                  </div>
                  <div className="text-[10px] text-amber-300 font-semibold">
                    {proximityEnabled ? 'Active GPS Tracking' : 'Click to Enable'}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-950/80 border border-blue-500/40 flex items-center justify-center shrink-0">
                <Radio className="w-5 h-5 text-blue-400 animate-pulse" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] uppercase font-bold text-slate-400">Primary Calling VHF</div>
                <div className="text-sm font-black text-white">Ch 16 / Ch 22A</div>
                <div className="text-[10px] text-blue-300 font-semibold">VMRC Dispatch: Ch 17</div>
              </div>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] uppercase font-bold text-slate-400">Boarding Readiness</div>
                <div className="text-sm font-black text-emerald-300">{completedCount} of {totalChecklist} Items Verified</div>
                <div className="text-[10px] text-slate-400">{isFullyCompliant ? 'Fully Compliant' : 'Review Required Gear'}</div>
              </div>
            </div>
          </div>

          {/* Community Safety Reports Feed */}
          <div className="bg-slate-950/60 rounded-xl p-3 sm:p-4 border border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-extrabold text-white">Recent Marine Safety & Patrol Reports</h3>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                  {reports.length} Reports
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleResetReports}
                  className="text-[11px] font-bold text-slate-400 hover:text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-700 px-2 py-1 rounded-lg transition-all"
                  title="Reset to official VMRC & USCG Virginia Waters reports"
                >
                  Reset Official
                </button>
                <button
                  onClick={() => setShowAddReport(!showAddReport)}
                  className="text-xs font-bold text-blue-400 hover:text-blue-300 bg-blue-950/60 hover:bg-blue-900/60 border border-blue-500/40 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  {showAddReport ? 'Close' : 'Log Notice'}
                </button>
              </div>
            </div>

            {/* Add Report Form */}
            {showAddReport && (
              <form onSubmit={handleAddReport} className="mb-4 bg-slate-900 p-3 rounded-xl border border-blue-500/30 space-y-2.5 animate-fadeIn">
                <div className="text-xs font-bold text-blue-300 flex items-center gap-1">
                  <Navigation className="w-3.5 h-3.5" /> Log Boater Notice / Patrol Sighting
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <select
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="bg-slate-950 text-xs text-white p-2 rounded-lg border border-slate-700 focus:outline-none focus:border-blue-400"
                  >
                    <option value="Lynnhaven Inlet">Lynnhaven Inlet</option>
                    <option value="Lesner Bridge Channel">Lesner Bridge Channel</option>
                    <option value="Rudee Inlet">Rudee Inlet</option>
                    <option value="CBBT Islands">CBBT Islands</option>
                    <option value="Cape Henry Shoals">Cape Henry Shoals</option>
                    <option value="Broad Bay">Broad Bay</option>
                    <option value="Back Bay">Back Bay</option>
                  </select>

                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="bg-slate-950 text-xs text-white p-2 rounded-lg border border-slate-700 focus:outline-none focus:border-blue-400"
                  >
                    <option value="Routine Patrol">Routine Patrol</option>
                    <option value="Safety Check">Safety Check</option>
                    <option value="Vessel Boarding">Vessel Boarding</option>
                    <option value="Navigation Hazard">Navigation Hazard</option>
                  </select>

                  <select
                    value={newAgency}
                    onChange={(e) => setNewAgency(e.target.value)}
                    className="bg-slate-950 text-xs text-white p-2 rounded-lg border border-slate-700 focus:outline-none focus:border-blue-400"
                  >
                    <option value="VMRC Marine Police">VMRC Marine Police</option>
                    <option value="US Coast Guard">US Coast Guard</option>
                    <option value="VB Police Marine Unit">VB Police Marine Unit</option>
                    <option value="Virginia DWR Officers">Virginia DWR Officers</option>
                  </select>
                </div>

                <input
                  type="text"
                  placeholder="Details (e.g. routine life jacket & catch checks at ramp)..."
                  value={newDetails}
                  onChange={(e) => setNewDetails(e.target.value)}
                  className="w-full bg-slate-950 text-xs text-white p-2 rounded-lg border border-slate-700 focus:outline-none focus:border-blue-400"
                  required
                />

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddReport(false)}
                    className="px-3 py-1 rounded-lg text-xs font-semibold text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 py-1 rounded-lg text-xs transition-colors"
                  >
                    Submit Report
                  </button>
                </div>
              </form>
            )}

            {/* Reports List */}
            <div className="space-y-2">
              {reports.map((r) => (
                <div
                  key={r.id}
                  className="bg-slate-900/80 p-2.5 sm:p-3 rounded-lg border border-slate-800/90 flex items-start justify-between gap-3 text-xs group"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-extrabold text-white text-xs">{r.location}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        r.type === 'Safety Check'
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600/40'
                          : r.type === 'Vessel Boarding'
                          ? 'bg-amber-950/80 text-amber-300 border-amber-600/40'
                          : r.type === 'Navigation Hazard'
                          ? 'bg-rose-950/80 text-rose-300 border-rose-600/40'
                          : 'bg-blue-950/80 text-blue-300 border-blue-600/40'
                      }`}>
                        {r.type}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">• {r.agency}</span>
                    </div>
                    <p className="text-slate-300 text-xs leading-relaxed">{r.details}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-950 px-2 py-1 rounded border border-slate-800">
                      {r.timeAgo}
                    </span>
                    <button
                      onClick={() => handleDeleteReport(r.id)}
                      className="text-slate-500 hover:text-rose-400 p-1 rounded transition-colors opacity-70 group-hover:opacity-100"
                      title="Delete report notice"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Patrol Proximity Notifications with Live Geolocation API */}
      {activeTab === 'proximity' && (
        <div className="space-y-4">
          {/* Main Toggle & Configuration Control Box */}
          <div className="bg-slate-950/80 p-4 rounded-xl border border-amber-500/40 space-y-3.5 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
                  proximityEnabled 
                    ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.4)]' 
                    : 'bg-slate-900 text-slate-400 border-slate-700'
                }`}>
                  {proximityEnabled ? <BellRing className="w-6 h-6 animate-pulse" /> : <BellOff className="w-6 h-6" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-white">Patrol Proximity Notifications</h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      proximityEnabled 
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-500' 
                        : 'bg-slate-900 text-slate-400 border-slate-700'
                    }`}>
                      {proximityEnabled ? 'ACTIVE (TRACKING)' : 'DISABLED'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Continuously monitors your GPS coordinates and alerts you when approaching known law enforcement and security zones.
                  </p>
                </div>
              </div>

              {/* Master Proximity Visual Toggle Switch */}
              <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-700/80 px-4 py-2 rounded-xl shrink-0">
                <span className="text-xs font-black text-slate-200 select-none">
                  {proximityEnabled ? 'GPS Watch Active' : 'GPS Watch Disabled'}
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={proximityEnabled}
                  onClick={() => handleToggleProximity(!proximityEnabled)}
                  className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-slate-900 ${
                    proximityEnabled ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-slate-700 hover:bg-slate-600'
                  }`}
                >
                  <span className="sr-only">Toggle Patrol Proximity Notifications</span>
                  <span
                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      proximityEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Controls: Alert Threshold & Sound Settings */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 pt-1">
              {/* Alert Radius & Marine Activity Presets (8 Cols) */}
              <div className="lg:col-span-8 bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-amber-400" /> 
                    <span>Alert Distance Threshold:</span>
                    <span className="text-amber-300 font-extrabold bg-amber-950 px-2 py-0.5 rounded border border-amber-600/40">
                      {proximityThresholdNM} NM ({Math.round(proximityThresholdNM * 1.15078 * 10) / 10} Statute Miles)
                    </span>
                  </div>
                  <button
                    onClick={() => setShowSettingsModal(true)}
                    className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 bg-slate-950 px-2 py-0.5 rounded border border-cyan-800/40"
                  >
                    <Settings className="w-3 h-3" />
                    <span>Settings Menu</span>
                  </button>
                </div>

                {/* 5 Activity-Based Distance Presets */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                  {[
                    { nm: 0.5, miles: '0.6 mi', label: 'Kayak / Inshore', profile: 'inshore_kayak' },
                    { nm: 1.0, miles: '1.15 mi', label: 'Powerboat (Std)', profile: 'powerboat' },
                    { nm: 2.5, miles: '2.9 mi', label: 'Coastal Fast Craft', profile: 'fast_craft' },
                    { nm: 5.0, miles: '5.75 mi', label: 'Bay Cruising', profile: 'bay_cruise' },
                    { nm: 10.0, miles: '11.5 mi', label: 'Offshore Trolling', profile: 'offshore' }
                  ].map((p) => {
                    const isCurrent = proximityThresholdNM === p.nm;
                    return (
                      <button
                        key={p.nm}
                        onClick={() => handleUpdateThreshold(p.nm, p.profile)}
                        className={`p-1.5 rounded-lg border text-left transition-all flex flex-col justify-between ${
                          isCurrent
                            ? 'bg-gradient-to-tr from-amber-600 to-amber-500 text-slate-950 border-amber-300 shadow-md font-extrabold ring-1 ring-amber-300'
                            : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-900 hover:border-slate-700'
                        }`}
                      >
                        <div className="text-xs font-black flex items-center justify-between">
                          <span>{p.nm} NM</span>
                          <span className={`text-[9px] ${isCurrent ? 'text-slate-950/80 font-bold' : 'text-slate-500'}`}>
                            {p.miles}
                          </span>
                        </div>
                        <div className={`text-[9px] mt-0.5 leading-tight truncate ${isCurrent ? 'text-slate-950 font-bold' : 'text-slate-400'}`}>
                          {p.label}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Precision Range Slider */}
                <div className="space-y-1 pt-1 border-t border-slate-800/80">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold">
                    <span>Tight Harbor (0.25 NM)</span>
                    <span className="text-amber-300 font-extrabold">Custom Slider: {proximityThresholdNM} NM / {(proximityThresholdNM * 6076.12).toLocaleString()} ft</span>
                    <span>Wide Offshore (15.0 NM)</span>
                  </div>
                  <input
                    type="range"
                    min="0.25"
                    max="15.0"
                    step="0.25"
                    value={proximityThresholdNM}
                    onChange={(e) => handleUpdateThreshold(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                </div>
              </div>

              {/* Sound Settings & Simulator (4 Cols) */}
              <div className="lg:col-span-4 flex flex-col justify-between gap-2.5">
                {/* Audio Alert Toggle */}
                <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                  <div className="text-[11px] font-bold text-slate-400 mb-1 flex items-center gap-1">
                    <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> Warning Sound Chime:
                  </div>
                  <button
                    onClick={() => {
                      setSoundAlerts(!soundAlerts);
                      if (!soundAlerts) playProximityAlertSound();
                    }}
                    className={`w-full py-1 text-xs font-bold rounded-lg border transition-all flex items-center justify-center gap-1.5 ${
                      soundAlerts
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                        : 'bg-slate-950 text-slate-400 border-slate-700'
                    }`}
                  >
                    {soundAlerts ? <Volume2 className="w-3.5 h-3.5 text-amber-400" /> : <VolumeX className="w-3.5 h-3.5" />}
                    <span>{soundAlerts ? 'Sound Enabled' : 'Muted'}</span>
                  </button>
                </div>

                {/* GPS Simulator (Quick Test in Browser) */}
                <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                  <div className="text-[11px] font-bold text-slate-400 mb-1 flex items-center gap-1">
                    <Compass className="w-3.5 h-3.5 text-emerald-400" /> Test Simulated Location:
                  </div>
                  <select
                    value={simulatedZoneId}
                    onChange={(e) => handleSimulatePosition(e.target.value)}
                    className="w-full bg-slate-950 text-xs font-semibold text-white p-1 rounded-lg border border-slate-700 focus:outline-none focus:border-amber-400 cursor-pointer"
                  >
                    <option value="none">Live GPS (Real Device)</option>
                    <option value="lynnhaven-inlet">At Lesner Bridge (0.1 NM)</option>
                    <option value="cbbt-islands">At CBBT 1st Island (0.1 NM)</option>
                    <option value="rudee-inlet">At Rudee Inlet (0.1 NM)</option>
                    <option value="broad-bay">At Broad Bay Canal (0.1 NM)</option>
                    <option value="open_ocean">Offshore Open Water (5.5 NM)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* GPS Telemetry Diagnostics */}
            {userGps && (
              <div className="bg-slate-900/60 px-3 py-2 rounded-lg border border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>GPS Fix: <strong className="text-white">{userGps.lat.toFixed(4)}°, {userGps.lng.toFixed(4)}°</strong></span>
                  <span>(Acc: ±{userGps.accuracy}m)</span>
                </div>
                <div>
                  Status: <span className="text-cyan-300 font-bold uppercase">{gpsStatus}</span>
                </div>
              </div>
            )}

            {gpsErrorMsg && (
              <div className="bg-rose-950/60 p-2.5 rounded-lg border border-rose-600/40 text-xs text-rose-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{gpsErrorMsg} (Tip: Select a simulated location above to test notifications in your browser).</span>
              </div>
            )}
          </div>

          {/* Live Zone Distance Radar List */}
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h4 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                Real-Time Proximity to Known Law Enforcement & Security Zones
              </h4>
              <span className="text-[10px] text-slate-400 font-semibold">
                Threshold: {proximityThresholdNM} NM ({Math.round(proximityThresholdNM * 6076.12).toLocaleString()} ft)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {zonesWithDistances.map((zone) => {
                const isClose = zone.isInsideThreshold;
                const isCritical = zone.isImmediateWarning;

                return (
                  <div
                    key={zone.id}
                    className={`p-3 rounded-xl border transition-all flex flex-col justify-between space-y-2 ${
                      isCritical
                        ? 'bg-rose-950/30 border-rose-500 shadow-md'
                        : isClose
                        ? 'bg-amber-950/30 border-amber-500/70 shadow-sm'
                        : 'bg-slate-900/80 border-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${
                            isCritical ? 'bg-rose-500 animate-ping' : isClose ? 'bg-amber-400 animate-pulse' : 'bg-slate-500'
                          }`} />
                          <h5 className="font-extrabold text-white text-xs">{zone.name}</h5>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{zone.agency}</div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className={`text-xs font-black ${
                          isCritical ? 'text-rose-400' : isClose ? 'text-amber-300' : 'text-slate-300'
                        }`}>
                          {zone.distanceNM < 0.2 ? `${zone.distanceFt} ft` : `${zone.distanceNM.toFixed(2)} NM`}
                        </div>
                        <span className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border ${
                          isCritical
                            ? 'bg-rose-950 text-rose-300 border-rose-600'
                            : isClose
                            ? 'bg-amber-950 text-amber-300 border-amber-600'
                            : 'bg-slate-950 text-slate-400 border-slate-700'
                        }`}>
                          {isCritical ? 'CRITICAL PROXIMITY' : isClose ? 'IN CAUTION ZONE' : 'CLEAR'}
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800/80 text-[11px] text-slate-300">
                      <span className="font-bold text-amber-300">Active Rule: </span>
                      {zone.restrictionRules}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Known Patrol Sectors */}
      {activeTab === 'zones' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {PATROL_ZONES.map((zone) => (
            <div
              key={zone.id}
              className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between space-y-2.5"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <h4 className="font-black text-white text-sm flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-blue-400 shrink-0" />
                    {zone.name}
                  </h4>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
                    zone.frequency === 'High'
                      ? 'bg-rose-950/80 text-rose-300 border-rose-600/50'
                      : 'bg-blue-950/80 text-blue-300 border-blue-600/50'
                  }`}>
                    {zone.frequency} Patrol
                  </span>
                </div>
                <div className="text-[11px] font-semibold text-blue-300 mb-1">
                  Enforcement: {zone.agency}
                </div>
                <p className="text-xs text-slate-300 leading-snug">
                  {zone.description}
                </p>
              </div>

              <div className="bg-slate-900 p-2 rounded-lg border border-slate-800 text-[11px] text-slate-300">
                <span className="font-bold text-amber-300">Primary Focus: </span>
                {zone.primaryFocus}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 4: Inspection Ready Checklist */}
      {activeTab === 'checklist' && (
        <div className="bg-slate-950/70 p-3.5 sm:p-4 rounded-xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div>
              <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                VMRC & USCG Boarding Compliance Checklist
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Ensure every mandatory safety item is on board to avoid fines during routine marine police stops.
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className={`text-xs font-black px-2.5 py-1 rounded-lg border ${
                isFullyCompliant
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-500'
                  : 'bg-amber-950 text-amber-300 border-amber-500'
              }`}>
                {isFullyCompliant ? '100% BOARDING READY' : `${totalChecklist - completedCount} PENDING`}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div
              onClick={() => toggleCheck('license')}
              className={`p-2.5 rounded-lg border flex items-start gap-2.5 cursor-pointer transition-all ${
                checklist.license
                  ? 'bg-emerald-950/20 border-emerald-500/40 text-slate-200'
                  : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}
            >
              {checklist.license ? <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> : <Square className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />}
              <div>
                <div className="font-bold text-xs text-white">Virginia Saltwater Recreational License</div>
                <div className="text-[11px] text-slate-400">Valid VMRC license or approved reciprocal permit.</div>
              </div>
            </div>

            <div
              onClick={() => toggleCheck('mesh_rule')}
              className={`p-2.5 rounded-lg border flex items-start gap-2.5 cursor-pointer transition-all ${
                checklist.mesh_rule
                  ? 'bg-emerald-950/20 border-emerald-500/40 text-slate-200'
                  : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}
            >
              {checklist.mesh_rule ? <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> : <Square className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />}
              <div>
                <div className="font-bold text-xs text-amber-300">2 7/8" Gill Net Mesh Minimum</div>
                <div className="text-[11px] text-slate-400">VMRC requirement for stretched mesh in VA waters.</div>
              </div>
            </div>

            <div
              onClick={() => toggleCheck('life_jackets')}
              className={`p-2.5 rounded-lg border flex items-start gap-2.5 cursor-pointer transition-all ${
                checklist.life_jackets
                  ? 'bg-emerald-950/20 border-emerald-500/40 text-slate-200'
                  : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}
            >
              {checklist.life_jackets ? <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> : <Square className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />}
              <div>
                <div className="font-bold text-xs text-white">USCG-Approved Life Jackets (PFDs)</div>
                <div className="text-[11px] text-slate-400">One wearable PFD per person on board, proper size.</div>
              </div>
            </div>

            <div
              onClick={() => toggleCheck('throwable')}
              className={`p-2.5 rounded-lg border flex items-start gap-2.5 cursor-pointer transition-all ${
                checklist.throwable
                  ? 'bg-emerald-950/20 border-emerald-500/40 text-slate-200'
                  : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}
            >
              {checklist.throwable ? <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> : <Square className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />}
              <div>
                <div className="font-bold text-xs text-white">Type IV Throwable Device</div>
                <div className="text-[11px] text-slate-400">Required on all boats 16ft and longer.</div>
              </div>
            </div>

            <div
              onClick={() => toggleCheck('sound_device')}
              className={`p-2.5 rounded-lg border flex items-start gap-2.5 cursor-pointer transition-all ${
                checklist.sound_device
                  ? 'bg-emerald-950/20 border-emerald-500/40 text-slate-200'
                  : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}
            >
              {checklist.sound_device ? <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> : <Square className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />}
              <div>
                <div className="font-bold text-xs text-white">Sound Signaling Device (Horn or Whistle)</div>
                <div className="text-[11px] text-slate-400">Audible for 1/2 nautical mile.</div>
              </div>
            </div>

            <div
              onClick={() => toggleCheck('fire_ext')}
              className={`p-2.5 rounded-lg border flex items-start gap-2.5 cursor-pointer transition-all ${
                checklist.fire_ext
                  ? 'bg-emerald-950/20 border-emerald-500/40 text-slate-200'
                  : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}
            >
              {checklist.fire_ext ? <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> : <Square className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />}
              <div>
                <div className="font-bold text-xs text-white">Marine Fire Extinguisher</div>
                <div className="text-[11px] text-slate-400">Charged, unexpired 5-B / B-I rated extinguisher.</div>
              </div>
            </div>

            <div
              onClick={() => toggleCheck('flares')}
              className={`p-2.5 rounded-lg border flex items-start gap-2.5 cursor-pointer transition-all ${
                checklist.flares
                  ? 'bg-emerald-950/20 border-emerald-500/40 text-slate-200'
                  : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}
            >
              {checklist.flares ? <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> : <Square className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />}
              <div>
                <div className="font-bold text-xs text-white">Visual Distress Signals (Day/Night Flares)</div>
                <div className="text-[11px] text-slate-400">Mandatory on coastal waters and Chesapeake Bay.</div>
              </div>
            </div>

            <div
              onClick={() => toggleCheck('kill_switch')}
              className={`p-2.5 rounded-lg border flex items-start gap-2.5 cursor-pointer transition-all ${
                checklist.kill_switch
                  ? 'bg-emerald-950/20 border-emerald-500/40 text-slate-200'
                  : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}
            >
              {checklist.kill_switch ? <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> : <Square className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />}
              <div>
                <div className="font-bold text-xs text-white">Engine Cut-Off Switch (ECOS) Lanyard</div>
                <div className="text-[11px] text-slate-400">Federal law on boats under 26ft when underway.</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: VHF Frequencies & Direct Contact Numbers */}
      {activeTab === 'contacts' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 space-y-2">
            <h4 className="font-extrabold text-white text-xs uppercase tracking-wider flex items-center gap-1.5 text-blue-400">
              <PhoneCall className="w-4 h-4" /> Law Enforcement 24/7 Dispatch
            </h4>
            <div className="space-y-2 text-xs">
              <div className="p-2 rounded bg-slate-900 border border-slate-800 flex justify-between items-center">
                <div>
                  <div className="font-bold text-white">Virginia Marine Police (VMRC)</div>
                  <div className="text-[11px] text-slate-400">24/7 Law Enforcement Dispatch</div>
                </div>
                <span className="font-mono font-black text-cyan-300">1-800-541-4646</span>
              </div>

              <div className="p-2 rounded bg-slate-900 border border-slate-800 flex justify-between items-center">
                <div>
                  <div className="font-bold text-white">US Coast Guard Sector Virginia</div>
                  <div className="text-[11px] text-slate-400">Portsmouth Command Center</div>
                </div>
                <span className="font-mono font-black text-cyan-300">(757) 483-8567</span>
              </div>

              <div className="p-2 rounded bg-slate-900 border border-slate-800 flex justify-between items-center">
                <div>
                  <div className="font-bold text-white">VA DWR Wildlife Crime Line</div>
                  <div className="text-[11px] text-slate-400">Poaching & Boating Violations</div>
                </div>
                <span className="font-mono font-black text-cyan-300">1-800-237-5712</span>
              </div>

              <div className="p-2 rounded bg-slate-900 border border-slate-800 flex justify-between items-center">
                <div>
                  <div className="font-bold text-white">Virginia Beach Police Marine Unit</div>
                  <div className="text-[11px] text-slate-400">Emergency & Channel Reports</div>
                </div>
                <span className="font-mono font-black text-cyan-300">911 / (757) 385-5000</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 space-y-2">
            <h4 className="font-extrabold text-white text-xs uppercase tracking-wider flex items-center gap-1.5 text-blue-400">
              <Radio className="w-4 h-4" /> VHF Marine Radio Frequencies
            </h4>
            <div className="space-y-2 text-xs">
              <div className="p-2 rounded bg-slate-900 border border-slate-800 flex justify-between items-center">
                <div>
                  <div className="font-bold text-white">VHF Channel 16 (156.800 MHz)</div>
                  <div className="text-[11px] text-slate-400">International Distress, Safety & Calling</div>
                </div>
                <span className="text-[11px] font-bold text-rose-400 bg-rose-950 px-2 py-0.5 rounded border border-rose-800">Distress</span>
              </div>

              <div className="p-2 rounded bg-slate-900 border border-slate-800 flex justify-between items-center">
                <div>
                  <div className="font-bold text-white">VHF Channel 22A (157.100 MHz)</div>
                  <div className="text-[11px] text-slate-400">US Coast Guard Safety & Marine Broadcasts</div>
                </div>
                <span className="text-[11px] font-bold text-blue-400 bg-blue-950 px-2 py-0.5 rounded border border-blue-800">Coast Guard</span>
              </div>

              <div className="p-2 rounded bg-slate-900 border border-slate-800 flex justify-between items-center">
                <div>
                  <div className="font-bold text-white">VHF Channel 17 (156.850 MHz)</div>
                  <div className="text-[11px] text-slate-400">VMRC State Marine Police Working Channel</div>
                </div>
                <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">VMRC Ops</span>
              </div>

              <div className="p-2 rounded bg-slate-900 border border-slate-800 flex justify-between items-center">
                <div>
                  <div className="font-bold text-white">VHF Channel 13 / 68 (156.650 MHz)</div>
                  <div className="text-[11px] text-slate-400">Bridge-to-Bridge Navigation / Recreational Inter-ship</div>
                </div>
                <span className="text-[11px] font-bold text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">Bridge / Ship</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Radar Scope & Tracking FAQ */}
      {activeTab === 'radar_tech' && (
        <div className="space-y-4">
          {/* Top: Simulated Marine Radar Scope Visualizer */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center bg-slate-950/80 p-4 rounded-xl border border-slate-800">
            {/* Left: Radar Scope SVG */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center p-2">
              <div className="relative w-56 h-56 sm:w-64 sm:h-64 rounded-full bg-slate-950 border-2 border-emerald-500/60 shadow-[0_0_25px_rgba(16,185,129,0.25)] flex items-center justify-center overflow-hidden">
                {/* Distance Rings */}
                <div className="absolute w-44 h-44 rounded-full border border-emerald-500/30" />
                <div className="absolute w-28 h-28 rounded-full border border-emerald-500/40" />
                <div className="absolute w-14 h-14 rounded-full border border-emerald-500/50" />

                {/* Crosshairs */}
                <div className="absolute inset-x-0 h-px bg-emerald-500/30" />
                <div className="absolute inset-y-0 w-px bg-emerald-500/30" />

                {/* Rotating Sweep Line */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-spin" style={{ animationDuration: '4s' }}>
                  <div className="w-1/2 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-emerald-200 shadow-[0_0_8px_#34d399] origin-left" style={{ transform: 'rotate(0deg)' }} />
                </div>

                {/* Simulated Radar Targets */}
                {/* 1. Commercial Ship (AIS Active) */}
                <div className="absolute top-12 left-20 flex flex-col items-center">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#38bdf8] animate-ping" />
                  <span className="text-[8px] font-bold text-cyan-300 bg-slate-900/90 px-1 rounded border border-cyan-700/60 mt-0.5 whitespace-nowrap">
                    Cargo Ship (AIS)
                  </span>
                </div>

                {/* 2. Unidentified Echo Dot (Boat Radar Return) */}
                <div className="absolute bottom-16 right-16 flex flex-col items-center">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
                  <span className="text-[8px] font-bold text-emerald-300 bg-slate-900/90 px-1 rounded border border-emerald-700/60 mt-0.5 whitespace-nowrap">
                    Echo Return (?)
                  </span>
                </div>

                {/* 3. Patrol Area Center (Lesner Bridge) */}
                <div className="absolute top-20 right-14 flex flex-col items-center">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e] animate-pulse" />
                  <span className="text-[8px] font-bold text-rose-300 bg-slate-900/90 px-1 rounded border border-rose-700/60 mt-0.5 whitespace-nowrap">
                    VMRC Zone
                  </span>
                </div>

                {/* Center Boat Own Vessel */}
                <div className="w-3 h-3 rounded-full bg-white shadow-[0_0_8px_#ffffff] z-10 border border-slate-900" />
                <span className="absolute bottom-2 text-[9px] font-bold text-emerald-400/80">RANGE: 3 NM</span>
              </div>
            </div>

            {/* Right: Technical Explanation */}
            <div className="lg:col-span-7 space-y-2.5 text-xs text-slate-300">
              <h4 className="text-sm font-extrabold text-white flex items-center gap-1.5 text-emerald-400">
                <Compass className="w-4 h-4" /> Why Law Enforcement Cannot Be Tracked in Real Time
              </h4>

              <div className="space-y-2">
                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                  <span className="font-bold text-amber-300">1. Silent AIS & Tactical Security: </span>
                  Under federal maritime regulations, military craft and law enforcement vessels (VMRC, Coast Guard, Police Marine Units) are exempt from broadcasting public AIS coordinates to protect officer safety and prevent illegal operations or poachers from evading inspection.
                </div>

                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                  <span className="font-bold text-cyan-300">2. Physical Marine Radar vs. Civilian Apps: </span>
                  Hardware radar (like Garmin, Raymarine, or Furuno Doppler dome mounted on a boat's T-top) emits microwave pulses and detects physical echoes. It shows that an object is floating there, but <strong className="text-white">cannot identify vessel ownership, agency, or officer identity</strong> without visual contact or VHF radio hail.
                </div>

                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                  <span className="font-bold text-emerald-300">3. No Public Government Telemetry API: </span>
                  State and municipal police agencies do not publish real-time live patrol telemetry feeds to public web servers or consumer mobile applications.
                </div>
              </div>
            </div>
          </div>

          {/* Golden Rules for Approaching Marine Police */}
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 space-y-2">
            <h4 className="font-black text-white text-xs uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> Best Practices When Operating Near Law Enforcement
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="font-bold text-white">✓ Throttle Back in No-Wake Zones: </span>
                Virginia Beach strictly enforces idle-speed no-wake at Lesner Bridge, Rudee Inlet, and Long Creek.
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="font-bold text-white">✓ Have Life Jackets Accessible: </span>
                PFDs must be readily accessible, not buried in locked hatches. Kids under 13 must wear them while underway.
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="font-bold text-white">✓ Comply with 2 7/8" Gill Net Mesh: </span>
                VMRC game wardens carry official mesh gauges to verify minimum 2 7/8" stretched mesh compliance.
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="font-bold text-white">✓ Monitor VHF Channel 16: </span>
                Keep marine radio tuned to VHF 16 for hail or Coast Guard safety broadcasts in the inlet channels.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SETTINGS MODAL: Alert Distance Thresholds & Marine Activity Configuration */}
      <AnimatePresence>
        {showSettingsModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="bg-slate-900 border border-amber-500/50 rounded-2xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-slate-100"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
                    <Settings className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-white">
                      Patrol Alert Thresholds & Marine Settings
                    </h3>
                    <p className="text-xs text-slate-400">
                      Customize geofence alert distance and notification preferences by marine activity
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 1. Marine Activity Presets Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase text-amber-400 flex items-center gap-1.5">
                    <Gauge className="w-4 h-4" />
                    Select Marine Activity Profile
                  </label>
                  <span className="text-[11px] text-slate-400">Auto-calibrates warning perimeter</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    {
                      id: 'inshore_kayak',
                      name: '🛶 Inshore / Kayak / Paddleboard',
                      threshold: 0.5,
                      miles: '0.58 mi',
                      desc: 'Short-range alerts for tight canals, boat launches, and shallow oyster flats.'
                    },
                    {
                      id: 'powerboat',
                      name: '🚤 Standard Powerboating',
                      threshold: 1.0,
                      miles: '1.15 mi',
                      desc: 'Recommended baseline for inlet channels, Lesner Bridge, and harbor runs.'
                    },
                    {
                      id: 'fast_craft',
                      name: '⚡ Coastal Fast Craft / Center Console',
                      threshold: 2.5,
                      miles: '2.88 mi',
                      desc: 'Extended lead time for vessels cruising at 25-45 knots.'
                    },
                    {
                      id: 'bay_cruise',
                      name: '⛵ Bay & Sound Cruising',
                      threshold: 5.0,
                      miles: '5.75 mi',
                      desc: 'Wide radius for navigating lower Chesapeake Bay & CBBT spans.'
                    },
                    {
                      id: 'offshore',
                      name: '🎣 Offshore Sportfishing & Blue Water',
                      threshold: 10.0,
                      miles: '11.51 mi',
                      desc: 'Long-range horizon alerts when trolling offshore past Virginia Capes.'
                    }
                  ].map((prof) => {
                    const isSelected = proximityThresholdNM === prof.threshold;
                    return (
                      <div
                        key={prof.id}
                        onClick={() => handleUpdateThreshold(prof.threshold, prof.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-amber-950/60 border-amber-400 ring-2 ring-amber-400/40'
                            : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-950'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-xs text-white">{prof.name}</span>
                          <span className={`text-xs font-black px-2 py-0.5 rounded ${
                            isSelected ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-amber-300'
                          }`}>
                            {prof.threshold} NM ({prof.miles})
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 mt-1 leading-snug">
                          {prof.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. Custom Continuous Distance Slider */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
                    Custom Precision Slider
                  </span>
                  <div className="text-right">
                    <span className="text-sm font-black text-amber-300">
                      {proximityThresholdNM} Nautical Miles
                    </span>
                    <span className="text-xs text-slate-400 ml-1.5">
                      ({(proximityThresholdNM * 1.15078).toFixed(2)} Statute Miles / {(proximityThresholdNM * 6076.12).toLocaleString()} ft)
                    </span>
                  </div>
                </div>

                <input
                  type="range"
                  min="0.25"
                  max="15.0"
                  step="0.25"
                  value={proximityThresholdNM}
                  onChange={(e) => handleUpdateThreshold(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />

                <div className="flex justify-between text-[10px] text-slate-400 font-bold px-0.5">
                  <span>0.25 NM (1,500 ft)</span>
                  <span>1.0 NM (Default)</span>
                  <span>5.0 NM (Bay)</span>
                  <span>10.0 NM (Offshore)</span>
                  <span>15.0 NM (Max)</span>
                </div>
              </div>

              {/* 3. Audio & Notification Preferences */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1">
                      <Volume2 className="w-4 h-4 text-cyan-400" /> Warning Chimes
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Play acoustic dual-tone when crossing threshold
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSoundAlerts(!soundAlerts);
                      if (!soundAlerts) playProximityAlertSound();
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors shrink-0 ${
                      soundAlerts
                        ? 'bg-amber-500 text-slate-950 border-amber-400'
                        : 'bg-slate-900 text-slate-400 border-slate-700'
                    }`}
                  >
                    {soundAlerts ? 'Enabled' : 'Muted'}
                  </button>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1">
                      <LocateFixed className="w-4 h-4 text-emerald-400" /> Browser Push Alert
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Send system notification in background
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if ('Notification' in window) {
                        Notification.requestPermission();
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-emerald-500/40 shrink-0"
                  >
                    Test Permission
                  </button>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between border-t border-slate-800 pt-3">
                <span className="text-[11px] text-slate-400">
                  Settings automatically save to your browser's local memory.
                </span>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-5 py-2 rounded-xl transition-all shadow-lg shadow-amber-500/20"
                >
                  Save & Apply Settings
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
