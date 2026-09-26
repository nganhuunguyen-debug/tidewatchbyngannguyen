import React from 'react';
import { SolunarForecast, SolunarPeriod, getActiveSolunarPeriodForTime } from '../services/solunarService';
import { 
  Moon, Sparkles, Clock, Flame, ChevronRight, AlertCircle, Compass, CheckCircle2, ShieldCheck, Sun
} from 'lucide-react';

interface SolunarActivityWidgetProps {
  solunar: SolunarForecast;
  inspectedTimestamp?: number;
  currentTideTrend?: string;
  stationName?: string;
}

export const SolunarActivityWidget: React.FC<SolunarActivityWidgetProps> = ({
  solunar,
  inspectedTimestamp = Date.now(),
  currentTideTrend = 'Rising (Flood)',
  stationName = 'Coastal Station'
}) => {
  const activePeriod = getActiveSolunarPeriodForTime(inspectedTimestamp, solunar.allPeriods);

  // Score styling
  const getScoreTheme = (score: number) => {
    if (score >= 88) {
      return {
        text: 'text-emerald-400',
        bg: 'bg-emerald-950/40 border-emerald-500/50 ring-1 ring-emerald-500/30',
        badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        gradient: 'from-emerald-500 to-teal-400',
        barColor: 'bg-gradient-to-r from-emerald-500 to-teal-300'
      };
    }
    if (score >= 75) {
      return {
        text: 'text-cyan-400',
        bg: 'bg-cyan-950/40 border-cyan-500/50 ring-1 ring-cyan-500/30',
        badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
        gradient: 'from-cyan-500 to-blue-400',
        barColor: 'bg-gradient-to-r from-cyan-500 to-blue-400'
      };
    }
    if (score >= 60) {
      return {
        text: 'text-amber-400',
        bg: 'bg-amber-950/40 border-amber-500/50 ring-1 ring-amber-500/30',
        badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        gradient: 'from-amber-500 to-yellow-400',
        barColor: 'bg-gradient-to-r from-amber-500 to-yellow-400'
      };
    }
    return {
      text: 'text-slate-400',
      bg: 'bg-slate-900/60 border-slate-700/60',
      badge: 'bg-slate-800 text-slate-300 border-slate-700',
      gradient: 'from-slate-500 to-slate-400',
      barColor: 'bg-slate-600'
    };
  };

  const theme = getScoreTheme(solunar.fishingQualityScore);

  return (
    <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 p-4 sm:p-5 shadow-2xl text-slate-100 flex flex-col justify-between overflow-hidden">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-violet-500/20 text-white shrink-0">
            <Moon className="w-5 h-5 text-violet-200" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-1.5 truncate">
                Solunar Activity & Lunar Feeding Forecast
              </h3>
              <span className="hidden sm:inline-flex text-[10px] uppercase font-bold text-violet-300 bg-violet-950/80 px-2 py-0.5 rounded border border-violet-700/50 shrink-0">
                LUNAR ALIGNMENT
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate">
              {solunar.displayDate} • Based on moon phases, gravitational zenith & transit positions
            </p>
          </div>
        </div>

        {/* Live Active Solunar Period Pill */}
        <div className="flex items-center gap-2">
          {activePeriod ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-bold animate-pulse">
              <Flame className="w-3.5 h-3.5 text-emerald-400" />
              <span>ACTIVE: {activePeriod.name}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-slate-400 text-xs font-medium">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Between Major Feeding Windows</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Score Gauge + Moon Phase Visual + Periods */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 my-3.5 items-stretch">
        {/* Left Column (5 cols): Overall Fishing Quality Score & Moon Phase */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-3">
          {/* Fishing Quality Score Hero Card */}
          <div className={`p-4 rounded-xl border ${theme.bg} flex flex-col justify-between`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                Fishing Quality Score
              </span>
              <span className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full border ${theme.badge}`}>
                {solunar.qualityRating}
              </span>
            </div>

            <div className="flex items-baseline gap-2 my-2.5">
              <span className={`text-4xl sm:text-5xl font-black tracking-tight ${theme.text}`}>
                {solunar.fishingQualityScore}
              </span>
              <span className="text-lg font-bold text-slate-400">/ 100</span>
              <div className="ml-auto text-right">
                <div className="text-xs font-bold text-white">Daily Rating</div>
                <div className="text-[11px] text-slate-400">Solunar Index</div>
              </div>
            </div>

            {/* Score Progress Bar */}
            <div className="w-full bg-slate-950/80 rounded-full h-2.5 p-0.5 border border-slate-700/60 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${theme.barColor}`}
                style={{ width: `${solunar.fishingQualityScore}%` }}
              />
            </div>

            <p className="mt-2.5 text-xs text-slate-300 leading-relaxed">
              {solunar.qualitySummary}
            </p>
          </div>

          {/* Moon Phase & Illumination Details */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-3xl select-none">{solunar.moonPhaseIcon}</span>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>{solunar.moonPhase}</span>
                  <span className="text-[10px] text-violet-300 bg-violet-950/80 border border-violet-700/40 px-1.5 py-0.2 rounded font-semibold">
                    Day {solunar.moonAgeDays}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  <span className="text-violet-300 font-semibold">{solunar.moonIllumination}% Illuminated</span>
                  {' '}• {solunar.moonIllumination > 85 ? 'Strong Spring Tide pull' : solunar.moonIllumination < 15 ? 'New Moon tide draw' : 'Moderate tidal amplitude'}
                </div>
              </div>
            </div>
            
            <div className="text-right shrink-0">
              <div className="text-[10px] uppercase font-bold text-slate-400">Moon Zenith</div>
              <div className="text-xs font-extrabold text-cyan-300">{solunar.moonOverheadTime}</div>
            </div>
          </div>
        </div>

        {/* Right Column (7 cols): Major & Minor Solunar Feeding Periods */}
        <div className="lg:col-span-7 bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 sm:p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2.5">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                Solunar Feeding Periods (John Alden Knight Theory)
              </span>
              <span className="text-[10px] text-slate-400">
                Local Solar Meridian
              </span>
            </div>

            {/* List of 4 Periods */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Major 1: Moon Overhead */}
              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 transition-colors">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-emerald-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    Major Period 1
                  </span>
                  <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">2 Hours</span>
                </div>
                <div className="text-sm font-extrabold text-white">
                  {solunar.majorPeriods[0]?.start} – {solunar.majorPeriods[0]?.end}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  🌕 Moon Overhead (Transit zenith)
                </div>
              </div>

              {/* Major 2: Moon Underfoot */}
              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 transition-colors">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-emerald-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    Major Period 2
                  </span>
                  <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">2 Hours</span>
                </div>
                <div className="text-sm font-extrabold text-white">
                  {solunar.majorPeriods[1]?.start} – {solunar.majorPeriods[1]?.end}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  🌑 Moon Underfoot (Opposite nadir)
                </div>
              </div>

              {/* Minor 1: Moonrise */}
              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 transition-colors">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-cyan-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                    Minor Period 1
                  </span>
                  <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">1 Hour</span>
                </div>
                <div className="text-sm font-extrabold text-white">
                  {solunar.minorPeriods[0]?.start} – {solunar.minorPeriods[0]?.end}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  🌅 Moonrise (Eastern horizon)
                </div>
              </div>

              {/* Minor 2: Moonset */}
              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 transition-colors">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-cyan-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                    Minor Period 2
                  </span>
                  <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">1 Hour</span>
                </div>
                <div className="text-sm font-extrabold text-white">
                  {solunar.minorPeriods[1]?.start} – {solunar.minorPeriods[1]?.end}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  🌇 Moonset (Western horizon)
                </div>
              </div>
            </div>
          </div>

          {/* Golden Solunar + Tide Synergy Footer Banner */}
          <div className="mt-3 p-2.5 rounded-lg bg-gradient-to-r from-amber-950/40 via-cyan-950/40 to-slate-900/80 border border-amber-500/30 flex items-center gap-2.5 text-xs">
            <span className="text-amber-400 text-base shrink-0">⚡</span>
            <div className="text-slate-200">
              <span className="font-bold text-amber-300">Golden Bite Rule:</span> When a Major/Minor Solunar window overlaps with an <span className="text-cyan-300 font-semibold">{currentTideTrend}</span> moving tide, predatory fish feed at their highest intensity!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
