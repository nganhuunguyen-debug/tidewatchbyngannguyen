import React from 'react';
import { SeaConditions } from '../types';
import { 
  Waves, Wind, Thermometer, Eye, Gauge, Compass, 
  Moon, Sun, Droplets, ShieldAlert, Sparkles, Navigation 
} from 'lucide-react';

interface SeaConditionsCardProps {
  conditions: SeaConditions;
  regionName: string;
}

export const SeaConditionsCard: React.FC<SeaConditionsCardProps> = ({ conditions, regionName }) => {
  // Wave state assessment
  const waveStatus = conditions.waveHeightFt < 2.5 
    ? { text: 'Calm & Glassy', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' }
    : conditions.waveHeightFt < 5 
    ? { text: 'Moderate Sea / Clean Chop', color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' }
    : { text: 'Rough Swell / Hazardous', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' };

  return (
    <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 p-5 shadow-2xl text-slate-100 flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs uppercase tracking-wider font-semibold text-emerald-400">Live Ocean Buoy Telemetry</span>
          </div>
          <h3 className="text-base font-bold text-white mt-0.5">Real-Time Sea & Weather Profile</h3>
        </div>
        <div className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${waveStatus.bg} ${waveStatus.color}`}>
          {waveStatus.text}
        </div>
      </div>

      {/* Grid of Marine Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-4">
        {/* Swell / Wave Height */}
        <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/50 hover:border-cyan-500/40 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5"><Waves className="w-3.5 h-3.5 text-cyan-400" /> Wave & Swell</span>
            <span className="text-[11px] text-slate-500">{conditions.swellDirection}</span>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-black text-white">{conditions.waveHeightFt}</span>
            <span className="text-xs text-slate-400">ft @ {conditions.swellPeriodSec}s</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Optimal period for structured reef fishing</p>
        </div>

        {/* Sea Surface Temp */}
        <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/50 hover:border-cyan-500/40 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5"><Thermometer className="w-3.5 h-3.5 text-rose-400" /> Water Temp</span>
            <span className="text-[11px] text-slate-400">Surface</span>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-black text-rose-300">{conditions.waterTempF}°</span>
            <span className="text-xs text-slate-400">F</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Air: {conditions.airTempF}°F • Visibility: {conditions.visibilityMiles}mi</p>
        </div>

        {/* Wind Speed & Gusts */}
        <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/50 hover:border-cyan-500/40 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5"><Wind className="w-3.5 h-3.5 text-sky-400" /> Coastal Wind</span>
            <span className="text-[11px] text-slate-300 font-medium">{conditions.windDirection}</span>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-black text-white">{conditions.windSpeedMph}</span>
            <span className="text-xs text-slate-400">mph</span>
            <span className="text-[11px] text-amber-400 ml-1">gusts {conditions.windGustMph}</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Offshore breeze maintaining glassy flats</p>
        </div>

        {/* Solunar & Moon Phase */}
        <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/50 hover:border-cyan-500/40 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5"><Moon className="w-3.5 h-3.5 text-violet-400" /> Solunar Feed</span>
            <span className="text-[11px] text-violet-300 font-semibold">{conditions.moonIllumination}% illuminated</span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-lg font-bold text-violet-300">{conditions.solunarRating}</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">{conditions.moonPhase} - Strong tidal draw</p>
        </div>
      </div>

      {/* Secondary Quick Indicators */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80 text-xs text-slate-300">
        <div className="flex items-center gap-2 bg-slate-950/50 px-3 py-2 rounded-lg border border-slate-800">
          <Droplets className="w-4 h-4 text-cyan-400 shrink-0" />
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Water Clarity</div>
            <div className="font-semibold text-white">{conditions.waterClarity}</div>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-950/50 px-3 py-2 rounded-lg border border-slate-800">
          <Gauge className="w-4 h-4 text-emerald-400 shrink-0" />
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Barometer</div>
            <div className="font-semibold text-white">{conditions.barometerInHg} inHg ({conditions.barometerTrend})</div>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-950/50 px-3 py-2 rounded-lg border border-slate-800">
          <Navigation className="w-4 h-4 text-blue-400 shrink-0" />
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Tidal Drift Current</div>
            <div className="font-semibold text-white">{conditions.currentKnots} knots flow</div>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-950/50 px-3 py-2 rounded-lg border border-slate-800">
          <Sun className="w-4 h-4 text-amber-400 shrink-0" />
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">UV & Solar</div>
            <div className="font-semibold text-white">Index {conditions.uvIndex} • Polarized recommended</div>
          </div>
        </div>
      </div>
    </div>
  );
};
