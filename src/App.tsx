import React, { useState, useEffect } from 'react';
import { COASTAL_REGIONS, FISHING_HOTSPOTS, FISH_SPECIES_CATALOG } from './data';
import { CoastalRegion, FishingHotspot, FishSpeciesInfo } from './types';
import { 
  calculateTidesForCoordinates, 
  LocationCoordinates 
} from './marineCalculations';
import { TideDashboardCard } from './components/TideDashboardCard';
import { FishingMap } from './components/FishingMap';
import { 
  Waves, MapPin, Compass, RefreshCw 
} from 'lucide-react';

const GOOGLE_MAPS_KEY = 'AIzaSyAWnMSxv9SjjmsS50ZExrm-XYF2oeX4W2Q';

export default function App() {
  // Default location is ALWAYS at the custom pin (36.909, -76.096)
  const [selectedLocation, setSelectedLocation] = useState<LocationCoordinates>({
    lat: 36.909,
    lng: -76.096,
    label: 'Custom Pin (36.909°, -76.096°)'
  });

  const [selectedHotspot, setSelectedHotspot] = useState<FishingHotspot | null>(FISHING_HOTSPOTS[0]);
  
  // Date Picker state for scheduling tides into the future (default: today's ISO date string)
  const todayIso = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayIso);

  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Compute base Date object for calculation (using selectedDate at noon to avoid timezone shifts)
  const isViewingToday = selectedDate === todayIso;
  const calculationDate = isViewingToday ? new Date() : new Date(`${selectedDate}T12:00:00`);

  // Calculate real-time continuous sinusoidal tide cycle for chosen coordinates & scheduled date
  const tideData = calculateTidesForCoordinates(selectedLocation, calculationDate);

  // Determine which fish species inhabit the currently picked location
  const getFishesForLocation = (): FishSpeciesInfo[] => {
    if (selectedHotspot && selectedHotspot.targetSpecies.length > 0) {
      const matched = FISH_SPECIES_CATALOG.filter(fish =>
        selectedHotspot.targetSpecies.some(target => 
          fish.name.toLowerCase().includes(target.toLowerCase()) ||
          target.toLowerCase().includes(fish.name.toLowerCase())
        )
      );
      if (matched.length > 0) return matched;
    }

    const lat = selectedLocation.lat;
    const lng = selectedLocation.lng;

    if (lng < -115 && lat > 45) {
      // Pacific Northwest
      return FISH_SPECIES_CATALOG.filter(f => ['Chinook (King) Salmon', 'Coho (Silver) Salmon', 'Lingcod', 'Barred Surfperch'].includes(f.name));
    } else if (lng < -115) {
      // California Pacific
      return FISH_SPECIES_CATALOG.filter(f => ['California Halibut', 'California Yellowtail', 'Kelp Bass (Calico Bass)', 'White Seabass', 'Barred Surfperch'].includes(f.name));
    } else if (lng > -98 && lng < -80 && lat < 31) {
      // Florida & Gulf Coast
      return FISH_SPECIES_CATALOG.filter(f => ['Atlantic Tarpon', 'Common Snook', 'Red Drum', 'Spotted Seatrout', 'Bonefish', 'Spanish Mackerel'].includes(f.name));
    } else {
      // Atlantic Coast / Virginia Beach Chesapeake Bay (Lesner Bridge)
      return FISH_SPECIES_CATALOG.filter(f => 
        [
          'Atlantic Croaker (Hardhead)',
          'Striped Mullet (Jumping Mullet)',
          'Atlantic Spot',
          'Striped Bass (Rockfish)',
          'Red Drum (Puppy Drum / Channel Bass)',
          'Summer Flounder (Fluke)',
          'Spotted Seatrout (Specks)',
          'Bluefish',
          'Spanish Mackerel'
        ].includes(f.name)
      );
    }
  };

  const locationFishes = getFishesForLocation();

  // Preset region selector
  const handleSelectPresetRegion = (regionId: string) => {
    const reg = COASTAL_REGIONS.find(r => r.id === regionId);
    if (!reg) return;
    const firstSpot = FISHING_HOTSPOTS.find(h => h.region === reg.id);
    setSelectedLocation({
      lat: reg.center.lat,
      lng: reg.center.lng,
      label: reg.name
    });
    if (firstSpot) {
      setSelectedHotspot(firstSpot);
    }
  };

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 400);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white">
              <Waves className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                Tide Watch <span className="text-cyan-400 font-medium text-sm sm:text-base">by Ngan Nguyen</span>
                <span className="text-[10px] uppercase font-bold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-700/50">
                  LIVE
                </span>
              </h1>
              <p className="text-[11px] text-slate-400">
                Default: Custom Pin (36.909°, -76.096°) • Schedule future tide dates • Hover curve to see active fish
              </p>
            </div>
          </div>

          {/* Preset quick jumps & refresh */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-800/90 rounded-xl border border-slate-700 px-3 py-1.5 shadow-inner text-xs">
              <Compass className="w-4 h-4 text-cyan-400 mr-2 shrink-0" />
              <select
                aria-label="Preset Coastal Region"
                onChange={(e) => handleSelectPresetRegion(e.target.value)}
                className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer"
                defaultValue="va-beach"
              >
                {COASTAL_REGIONS.map((r) => (
                  <option key={r.id} value={r.id} className="bg-slate-900 text-white">
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleManualRefresh}
              title="Refresh telemetry"
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 space-y-6">
        {/* 1. Live NOAA Tidal Station with Interactive 24-Hour Harmonic Curve (Moved to Top) */}
        <TideDashboardCard
          currentHeightFt={tideData.currentHeightFt}
          currentTrend={tideData.currentTrend}
          nextTide={tideData.nextTide}
          tideEvents={tideData.tideEvents}
          hourlyHeights={tideData.hourlyHeights}
          stationName={selectedLocation.label || `Coastal Station (${selectedLocation.lat.toFixed(3)}°, ${selectedLocation.lng.toFixed(3)}°)`}
          selectedDate={selectedDate}
          onDateChange={(newDate) => setSelectedDate(newDate)}
          isToday={isViewingToday}
          locationFishes={locationFishes}
        />

        {/* 2. Map & Interactive Location Picker */}
        <FishingMap
          hotspots={FISHING_HOTSPOTS}
          selectedLocation={selectedLocation}
          onPickLocation={(coords) => {
            setSelectedLocation(coords);
            // Check if user clicked near an existing hotspot
            const nearby = FISHING_HOTSPOTS.find(
              h => Math.hypot(h.lat - coords.lat, h.lng - coords.lng) < 0.05
            );
            setSelectedHotspot(nearby || null);
          }}
          selectedHotspot={selectedHotspot}
          onSelectHotspot={(spot) => {
            setSelectedHotspot(spot);
            setSelectedLocation({
              lat: spot.lat,
              lng: spot.lng,
              label: spot.name
            });
          }}
          apiKey={GOOGLE_MAPS_KEY}
        />
      </main>

      {/* Clean Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-4 text-xs text-slate-400 text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Tide Watch by Ngan Nguyen • Coastal Tides & Future Scheduling</span>
          <span className="text-slate-500">Pick any point on the map to forecast tides and see active fish</span>
        </div>
      </footer>
    </div>
  );
}
