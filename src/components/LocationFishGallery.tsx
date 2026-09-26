import React, { useState } from 'react';
import { FishSpeciesInfo } from '../types';
import { Fish, Waves, Thermometer, ShieldCheck, Sparkles, Scale, Info } from 'lucide-react';

interface LocationFishGalleryProps {
  locationLabel: string;
  fishes: FishSpeciesInfo[];
  currentTideTrend: string;
}

export const LocationFishGallery: React.FC<LocationFishGalleryProps> = ({
  locationLabel,
  fishes,
  currentTideTrend
}) => {
  const [selectedFish, setSelectedFish] = useState<FishSpeciesInfo>(fishes[0] || null);

  if (!fishes || fishes.length === 0) {
    return null;
  }

  return (
    <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 p-5 shadow-2xl text-slate-100">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Fish className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white tracking-tight">
              Native Fish Species at {locationLabel}
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Verified local fish species inhabiting this coastal water zone • Current trend: <span className="text-cyan-300 font-semibold">{currentTideTrend}</span>
          </p>
        </div>
        <div className="text-xs font-semibold text-slate-400 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
          {fishes.length} Target Species In Zone
        </div>
      </div>

      {/* Visual Photo Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 my-4">
        {fishes.map((fish) => {
          const isSelected = selectedFish?.id === fish.id;
          return (
            <div
              key={fish.id}
              onClick={() => setSelectedFish(fish)}
              className={`group relative rounded-xl overflow-hidden border cursor-pointer transition-all duration-200 ${
                isSelected
                  ? 'border-cyan-400 ring-2 ring-cyan-400/50 shadow-xl shadow-cyan-500/20 scale-102'
                  : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:scale-102'
              }`}
            >
              {/* Fish Image */}
              <div className="relative aspect-4/3 w-full overflow-hidden bg-slate-900">
                <img
                  src={fish.photoUrl}
                  alt={fish.name}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                <span className="absolute top-1.5 right-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-900/90 text-cyan-300 border border-slate-700">
                  {fish.category}
                </span>
              </div>

              {/* Title & Info */}
              <div className="p-2.5 bg-slate-950/90">
                <h4 className="font-bold text-xs text-white truncate">{fish.name}</h4>
                <div className="text-[10px] text-slate-400 italic truncate">{fish.scientificName}</div>
                <div className="mt-1 flex items-center justify-between text-[10px]">
                  <span className="text-cyan-400 font-medium">{fish.activeDepth}</span>
                  <span className="text-amber-400 font-semibold">★ {fish.edibilityRating}/5</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Deep-Dive Inspector for Clicked Fish */}
      {selectedFish && (
        <div className="bg-slate-950/80 rounded-xl border border-slate-800 p-4 mt-2 flex flex-col md:flex-row gap-5 items-start">
          {/* Large Photo */}
          <div className="w-full md:w-64 shrink-0 rounded-xl overflow-hidden border border-slate-800 relative aspect-4/3 bg-slate-900">
            <img
              src={selectedFish.photoUrl}
              alt={selectedFish.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-2 left-2 bg-slate-900/90 text-white text-[11px] font-semibold px-2 py-0.5 rounded border border-slate-700">
              {selectedFish.category}
            </div>
          </div>

          {/* Details */}
          <div className="flex-1 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-xl font-black text-white">{selectedFish.name}</h3>
                <p className="text-xs text-slate-400 italic">{selectedFish.scientificName}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-700/50">
                  {selectedFish.seasonalStatus}
                </span>
              </div>
            </div>

            {/* Tactical Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Optimal Tide</span>
                <span className="text-white font-medium">{selectedFish.idealTide}</span>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Ideal Water Temp</span>
                <span className="text-white font-medium">{selectedFish.idealWaterTemp}</span>
              </div>
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Active Feeding Depth</span>
                <span className="text-cyan-300 font-medium">{selectedFish.activeDepth}</span>
              </div>
            </div>

            {/* Best Baits */}
            <div className="text-xs">
              <span className="text-slate-400 font-semibold block mb-1">Top Rigs & Baits:</span>
              <div className="flex flex-wrap gap-1.5">
                {selectedFish.preferredBaitsAndLures.map((bait, idx) => (
                  <span
                    key={idx}
                    className="bg-cyan-950/60 text-cyan-200 border border-cyan-800/60 px-2 py-0.5 rounded text-xs"
                  >
                    {bait}
                  </span>
                ))}
              </div>
            </div>

            {/* Angler Tip */}
            <div className="bg-emerald-950/20 border border-emerald-500/20 p-2.5 rounded-lg text-xs text-slate-300">
              <span className="text-emerald-400 font-bold">Angler Technique: </span>
              {selectedFish.tips}
            </div>

            {/* Regulation */}
            <div className="text-[11px] text-slate-400">
              <span className="text-amber-400 font-semibold">Regulations: </span>
              {selectedFish.regulationSummary}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
