import React, { useState } from 'react';
import { FishingHotspot, FishSpeciesInfo, SeaConditions, TideEvent } from '../types';
import { Sparkles, Send, Anchor, Compass, CheckCircle2, Bot, AlertTriangle } from 'lucide-react';

interface AIAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  regionName: string;
  tideTrend: string;
  currentHeightFt: number;
  seaConditions: SeaConditions;
  hotspots: FishingHotspot[];
  selectedHotspot: FishingHotspot | null;
}

export const AIAdvisorModal: React.FC<AIAdvisorModalProps> = ({
  isOpen,
  onClose,
  regionName,
  tideTrend,
  currentHeightFt,
  seaConditions,
  hotspots,
  selectedHotspot
}) => {
  const [userQuestion, setUserQuestion] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleAsk = (prompt?: string) => {
    const query = prompt || userQuestion;
    if (!query.trim()) return;

    setIsLoading(true);
    setResponse(null);

    // Dynamic tactical calculation based on current telemetry
    setTimeout(() => {
      let advice = '';
      const spotName = selectedHotspot?.name || hotspots[0]?.name || 'the coastline';
      const tideDesc = `${currentHeightFt.toFixed(1)}ft ${tideTrend}`;
      
      if (query.toLowerCase().includes('lure') || query.toLowerCase().includes('bait')) {
        advice = `🎯 Tactical Bait Recommendation for ${regionName} (${tideDesc}):\n\n` +
          `• Primary Rig: Given the ${seaConditions.waterClarity.toLowerCase()} water and ${seaConditions.waveHeightFt}ft chop, run a Carolina rig with 1/2oz egg sinker and fluorocarbon leader (15lb).\n` +
          `• Top Artificial: 4-inch paddle tail swimbait in silver/pearl flash or a casting metal spoon to cut through the ${seaConditions.windSpeedMph}mph ${seaConditions.windDirection} breeze.\n` +
          `• Live Bait Pick: Fresh live shrimp or live pinfish/sardines hooked through the nose. Let current sweep them along drop-offs.`;
      } else if (query.toLowerCase().includes('best time') || query.toLowerCase().includes('when')) {
        advice = `⏰ Ideal Time Window Today:\n\n` +
          `• Solunar Rating: ${seaConditions.solunarRating} (${seaConditions.moonPhase}, ${seaConditions.moonIllumination}% illumination).\n` +
          `• Peak Feeding: Look for the maximum tidal velocity in the next 60 to 90 minutes. Predatory fish hold tight behind structure waiting for forage to be washed over the bars.\n` +
          `• Safety Tip: Wave periods are ${seaConditions.swellPeriodSec}s with ${seaConditions.waveHeightFt}ft sets. Keep safe footing on jetties.`;
      } else {
        advice = `🌊 Angler Tactical Briefing for ${spotName}:\n\n` +
          `1. Water Flow Strategy: With current tide ${tideTrend} (${currentHeightFt.toFixed(1)} ft), baitfish will be forced along structure edges.\n` +
          `2. Target Depths: Focus casts between 6 to 25 ft along transition drop-offs.\n` +
          `3. Best Approach: Cast 45-degrees up-current and retrieve at the natural drift speed of the ${seaConditions.currentKnots} kt current.\n` +
          `4. Atmospheric Factor: Barometer is ${seaConditions.barometerInHg} inHg (${seaConditions.barometerTrend}), signaling steady to aggressive bite triggers.`;
      }

      setResponse(advice);
      setIsLoading(false);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-cyan-500/30 w-full max-w-2xl rounded-2xl shadow-2xl p-6 relative flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-cyan-500/10 rounded-xl border border-cyan-500/30">
              <Bot className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Real-Time Tide & Angler Strategy AI
              </h3>
              <p className="text-xs text-slate-400">
                Synthesizing {regionName} ocean buoys, Solunar charts & tidal harmonics
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {/* Telemetry Snapshot Banner */}
        <div className="mt-4 bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-xs grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-300">
          <div><span className="text-slate-500 block">Tide:</span> <span className="font-semibold text-cyan-300">{currentHeightFt.toFixed(1)}ft ({tideTrend})</span></div>
          <div><span className="text-slate-500 block">Waves:</span> <span className="font-semibold text-white">{seaConditions.waveHeightFt}ft @ {seaConditions.swellPeriodSec}s</span></div>
          <div><span className="text-slate-500 block">Water Temp:</span> <span className="font-semibold text-rose-300">{seaConditions.waterTempF}°F</span></div>
          <div><span className="text-slate-500 block">Solunar Bite:</span> <span className="font-semibold text-emerald-400">{seaConditions.solunarRating}</span></div>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <button
            onClick={() => handleAsk('What lures and baits should I throw right now on this tide?')}
            className="bg-slate-800/80 hover:bg-slate-700 text-cyan-300 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
          >
            🎣 What lures/baits to throw right now?
          </button>
          <button
            onClick={() => handleAsk('When is the exact best bite window today?')}
            className="bg-slate-800/80 hover:bg-slate-700 text-cyan-300 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
          >
            ⏰ Best feeding time window?
          </button>
          <button
            onClick={() => handleAsk('Give me a tactical breakdown for the selected hotspot.')}
            className="bg-slate-800/80 hover:bg-slate-700 text-cyan-300 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
          >
            📍 Hotspot tactical breakdown
          </button>
        </div>

        {/* Response Box */}
        <div className="mt-4 flex-1 overflow-y-auto bg-slate-950/80 rounded-xl p-4 border border-slate-800 text-xs text-slate-200 min-h-[160px] font-mono leading-relaxed whitespace-pre-line">
          {isLoading ? (
            <div className="flex items-center justify-center h-full gap-2 text-cyan-400">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              Calculating optimal tidal flow and fish feeding dynamics...
            </div>
          ) : response ? (
            response
          ) : (
            <span className="text-slate-500 font-sans italic">
              Select a quick prompt above or type a specific coastal fishing question to generate tailored recommendations.
            </span>
          )}
        </div>

        {/* Input Bar */}
        <div className="mt-4 flex gap-2">
          <input
            type="text"
            placeholder="Ask about presentation, tide change, depth or species..."
            value={userQuestion}
            onChange={(e) => setUserQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
            className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
          />
          <button
            onClick={() => handleAsk()}
            disabled={isLoading || !userQuestion.trim()}
            className="bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors"
          >
            <Send className="w-4 h-4" /> Ask
          </button>
        </div>
      </div>
    </div>
  );
};
