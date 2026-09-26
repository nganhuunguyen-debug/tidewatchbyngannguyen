import React, { useState } from 'react';
import { FISH_SPECIES_CATALOG } from '../data';
import { FishSpeciesInfo } from '../types';
import { Fish, Waves, Compass, Sparkles, Scale, Info, CheckCircle2, Search, SlidersHorizontal } from 'lucide-react';

interface FishSpeciesGuideProps {
  currentTideTrend: string;
  onSelectSpecies?: (speciesName: string) => void;
}

export const FishSpeciesGuide: React.FC<FishSpeciesGuideProps> = ({ currentTideTrend, onSelectSpecies }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFish, setSelectedFish] = useState<FishSpeciesInfo | null>(FISH_SPECIES_CATALOG[0]);

  const categories = ['All', 'Inshore / Estuary', 'Surf', 'Pelagic', 'Bottom / Reef'];

  const filteredSpecies = FISH_SPECIES_CATALOG.filter(fish => {
    const matchesCategory = selectedCategory === 'All' || fish.category === selectedCategory;
    const matchesSearch = fish.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          fish.preferredBaitsAndLures.some(b => b.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          fish.tips.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 p-5 shadow-2xl text-slate-100 flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Fish className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-bold text-white tracking-tight">Active Marine Fish & Bite Guide</h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Species actively hunting during current <span className="text-cyan-300 font-semibold">{currentTideTrend}</span> water movement
          </p>
        </div>

        {/* Search & Filter */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-56">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search fish, bait, lures..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-700/80 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex gap-2 py-3 overflow-x-auto no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 border border-slate-700/50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Main Content: Split grid with species list and deep dive inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-1 flex-1">
        {/* Left Species Cards List */}
        <div className="lg:col-span-6 space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
          {filteredSpecies.map((fish) => {
            const isSelected = selectedFish?.id === fish.id;
            return (
              <div
                key={fish.id}
                onClick={() => {
                  setSelectedFish(fish);
                  if (onSelectSpecies) onSelectSpecies(fish.name);
                }}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-slate-800 border-cyan-400 shadow-lg shadow-cyan-500/10'
                    : 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-800/60 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-white">{fish.name}</h4>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700/50">
                        {fish.seasonalStatus}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 italic">{fish.scientificName}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Depth</span>
                    <div className="text-xs font-bold text-cyan-300">{fish.activeDepth}</div>
                  </div>
                </div>

                <div className="mt-2 text-xs text-slate-300 line-clamp-2">
                  <span className="text-slate-400 font-medium">Bait/Lures: </span>
                  {fish.preferredBaitsAndLures.join(', ')}
                </div>

                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 pt-1.5 border-t border-slate-800">
                  <div className="flex items-center gap-1 text-emerald-400">
                    <Waves className="w-3 h-3" />
                    <span>{fish.idealTide}</span>
                  </div>
                  <div className="text-slate-500">Tap for tactic & regulations &rarr;</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Detail Card */}
        {selectedFish && (
          <div className="lg:col-span-6 bg-slate-950/60 rounded-xl border border-slate-800 p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-cyan-400 font-bold">{selectedFish.category}</span>
                  <h4 className="text-xl font-extrabold text-white mt-0.5">{selectedFish.name}</h4>
                  <p className="text-xs text-slate-400 italic">{selectedFish.scientificName}</p>
                </div>
                <div className="flex items-center gap-1 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700 text-xs">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-slate-200 font-bold">Edibility: {selectedFish.edibilityRating}/5</span>
                </div>
              </div>

              {/* Tactical Overview */}
              <div className="mt-4 space-y-3">
                <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                  <div className="text-xs font-semibold text-cyan-300 flex items-center gap-1.5 mb-1">
                    <Compass className="w-3.5 h-3.5" />
                    Tactical Tide & Ambient Preferences
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400">Optimal Tide: </span>
                      <span className="text-white font-medium">{selectedFish.idealTide}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Water Temp Range: </span>
                      <span className="text-white font-medium">{selectedFish.idealWaterTemp}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Highest Percentage Baits & Rigs
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedFish.preferredBaitsAndLures.map((bait, i) => (
                      <span
                        key={i}
                        className="bg-cyan-950/50 text-cyan-200 border border-cyan-800/60 px-2.5 py-1 rounded-md text-xs font-medium"
                      >
                        {bait}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-emerald-950/20 border border-emerald-500/20 p-3 rounded-lg text-xs">
                  <div className="font-semibold text-emerald-400 flex items-center gap-1.5 mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Pro Angler Tip & Presentation
                  </div>
                  <p className="text-slate-300 leading-relaxed">{selectedFish.tips}</p>
                </div>

                <div className="bg-amber-950/20 border border-amber-500/20 p-3 rounded-lg text-xs">
                  <div className="font-semibold text-amber-400 flex items-center gap-1.5 mb-1">
                    <Scale className="w-3.5 h-3.5 text-amber-400" />
                    State Regulation & Size Limits
                  </div>
                  <p className="text-slate-300">{selectedFish.regulationSummary}</p>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Difficulty Rating: {selectedFish.difficultyRating} of 5</span>
              <span className="text-cyan-400 font-medium">Verify local fishing license requirements</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
