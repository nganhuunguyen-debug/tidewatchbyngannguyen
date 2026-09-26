import React, { useEffect, useRef, useState } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import { FishingHotspot } from '../types';
import { LocationCoordinates } from '../marineCalculations';
import { 
  MapPin, Star, Waves, Crosshair, ExternalLink, 
  Layers, MousePointerClick, Compass, Fish
} from 'lucide-react';

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
  const [mapType, setMapType] = useState<'hybrid' | 'roadmap' | 'terrain'>('hybrid');
  const [isMapLoaded, setIsMapLoaded] = useState<boolean>(false);
  const [isLocatingUser, setIsLocatingUser] = useState<boolean>(false);

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
        importLibrary('marker')
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

          // Add click listener to pick ANY location on map
          map.addListener('click', (e: google.maps.MapMouseEvent) => {
            if (e.latLng) {
              const lat = Math.round(e.latLng.lat() * 10000) / 10000;
              const lng = Math.round(e.latLng.lng() * 10000) / 10000;
              onPickLocation({
                lat,
                lng,
                label: `Custom Pin (${lat.toFixed(3)}°, ${lng.toFixed(3)}°)`
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

  // Update map type
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setMapTypeId(mapType);
    }
  }, [mapType]);

  // Render / update the Selected Location Pin (pulse marker)
  useEffect(() => {
    if (!mapInstanceRef.current || !isMapLoaded) return;
    const { AdvancedMarkerElement } = google.maps.marker;

    if (userMarkerRef.current) {
      userMarkerRef.current.map = null;
    }

    const pinEl = document.createElement('div');
    pinEl.className = 'flex flex-col items-center cursor-pointer pointer-events-auto';
    pinEl.innerHTML = `
      <div class="relative flex items-center justify-center">
        <span class="absolute w-8 h-8 rounded-full bg-cyan-400/40 animate-ping"></span>
        <div class="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-500 border-2 border-white shadow-xl flex items-center justify-center text-slate-950 font-black">
          <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
          </svg>
        </div>
      </div>
      <div class="mt-1 bg-cyan-950/90 text-cyan-200 text-[10px] font-bold px-2 py-0.5 rounded shadow-lg border border-cyan-400/50 whitespace-nowrap">
        ACTIVE SPOT
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
  }, [selectedLocation, isMapLoaded]);

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
          label: `My GPS Location (${lat.toFixed(3)}°, ${lng.toFixed(3)}°)`
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

  return (
    <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 p-4 sm:p-5 shadow-2xl text-slate-100 flex flex-col">
      {/* Top Header & Map Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-cyan-500/10 rounded-xl border border-cyan-500/20 text-cyan-400">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight">
                Interactive Coastal Map & Location Picker
              </h3>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded-full border border-cyan-700/40">
                <MousePointerClick className="w-3 h-3" /> Click anywhere to set location
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Current Target: <span className="text-cyan-300 font-semibold">{selectedLocation.label || `${selectedLocation.lat.toFixed(3)}°, ${selectedLocation.lng.toFixed(3)}°`}</span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* GPS Locate Me Button */}
          <button
            onClick={handleUseMyLocation}
            disabled={isLocatingUser}
            className="bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 hover:border-cyan-500/40 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
            title="Use current GPS location"
          >
            <Crosshair className={`w-3.5 h-3.5 ${isLocatingUser ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Use My GPS</span>
          </button>

          {/* Map Layer Switcher */}
          <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
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

      {/* Map Canvas + Quick Hotspots Strip */}
      <div className="mt-3 relative rounded-xl overflow-hidden border border-slate-800 min-h-[360px] sm:min-h-[420px] bg-slate-950">
        <div ref={mapContainerRef} className="w-full h-full min-h-[360px] sm:min-h-[420px]" />

        {/* Floating Instruction / Status */}
        <div className="absolute top-3 left-3 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/80 text-xs text-slate-200 shadow-xl pointer-events-none flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
          <span>Click any water or shoreline to update live tides & conditions</span>
        </div>

        {/* Hotspots Quick Carousel at Bottom of Map */}
        <div className="absolute bottom-3 inset-x-3 flex gap-2 overflow-x-auto no-scrollbar py-1">
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
