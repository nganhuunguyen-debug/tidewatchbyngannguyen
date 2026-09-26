import React, { useState, useMemo } from 'react';
import { SolunarForecast, SolunarPeriod, getActiveSolunarPeriodForTime } from '../marineCalculations';
import { 
  Moon, Sparkles, Clock, Flame, ChevronRight, AlertCircle, Compass, CheckCircle2, ShieldCheck, Sun,
  Sunrise, Sunset, Target, Fish, Zap, Award, Calendar, ChevronLeft
} from 'lucide-react';

interface SolunarActivityWidgetProps {
  solunar: SolunarForecast;
  inspectedTimestamp?: number;
  currentTideTrend?: string;
  stationName?: string;
}

export interface HourlyOptimalWindow {
  hourIndex: number;
  timestamp: number;
  timeLabel: string; // e.g. "6:00 AM"
  relativeLabel: string; // "Now", "+1h", "+2h"
  score: number; // 0 to 100
  tier: 'Prime Peak' | 'High Activity' | 'Good Feeding' | 'Fair / Slow';
  solarEvent: string | null;
  lunarEvent: string | null;
  solunarType: 'major' | 'minor' | 'solar_peak' | 'dual_synergy' | 'baseline';
  summary: string;
  recommendedLures: string;
  targetSpecies: string[];
  isTopDayWindow: boolean;
}

export const SolunarActivityWidget: React.FC<SolunarActivityWidgetProps> = ({
  solunar,
  inspectedTimestamp = Date.now(),
  currentTideTrend = 'Rising (Flood)',
  stationName = 'Coastal Station'
}) => {
  const activePeriod = getActiveSolunarPeriodForTime(inspectedTimestamp, solunar.allPeriods);
  const [selectedHourIndex, setSelectedHourIndex] = useState<number>(0);
  const [viewFilter, setViewFilter] = useState<'all' | 'peaks_only'>('all');

  // Compute 24 Hourly Optimal Fishing Windows based on solar & lunar transit peaks
  const hourlyWindows: HourlyOptimalWindow[] = useMemo(() => {
    const baseDate = new Date(inspectedTimestamp);
    baseDate.setMinutes(0, 0, 0);
    const startHourMs = baseDate.getTime();
    const windows: HourlyOptimalWindow[] = [];

    for (let i = 0; i < 24; i++) {
      const slotMs = startHourMs + i * 3600 * 1000;
      const slotDate = new Date(slotMs);
      const hourOfDay = slotDate.getHours();

      // Format label
      const timeLabel = slotDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
      const relativeLabel = i === 0 ? 'Now' : `+${i}h`;

      // 1. Check Solar Golden Hours (Dawn Twilight ~6:00-7:30 AM, Dusk Sunset ~6:30-8:00 PM)
      let isDawn = hourOfDay === 6 || hourOfDay === 7;
      let isDusk = hourOfDay === 18 || hourOfDay === 19;
      let solarEvent: string | null = null;
      if (isDawn) solarEvent = 'Dawn Twilight Golden Hour (Sunrise Bite)';
      if (isDusk) solarEvent = 'Dusk Predator Strike Window (Sunset Bite)';

      // 2. Check Major Lunar Transits (Moon Overhead / Underfoot +/- 60 mins)
      let isMajor = false;
      let isMinor = false;
      let lunarEvent: string | null = null;

      solunar.majorPeriods.forEach(mp => {
        if (slotMs >= mp.startTimestamp - 1800000 && slotMs <= mp.endTimestamp + 1800000) {
          isMajor = true;
          lunarEvent = mp.name;
        }
      });

      solunar.minorPeriods.forEach(minp => {
        if (slotMs >= minp.startTimestamp - 1800000 && slotMs <= minp.endTimestamp + 1800000) {
          isMinor = true;
          if (!lunarEvent) lunarEvent = minp.name;
        }
      });

      // 3. Compute Composite Bite Score (0 to 100)
      let baseScore = solunar.fishingQualityScore * 0.65; // ~40-60 baseline
      let solunarType: HourlyOptimalWindow['solunarType'] = 'baseline';

      if (isMajor && (isDawn || isDusk)) {
        // Double synergy: Solar Dawn/Dusk + Major Lunar Zenith
        baseScore += 38;
        solunarType = 'dual_synergy';
      } else if (isMajor) {
        baseScore += 30;
        solunarType = 'major';
      } else if (isMinor && (isDawn || isDusk)) {
        baseScore += 26;
        solunarType = 'dual_synergy';
      } else if (isMinor) {
        baseScore += 18;
        solunarType = 'minor';
      } else if (isDawn || isDusk) {
        baseScore += 20;
        solunarType = 'solar_peak';
      } else {
        // Minor night/midday variation
        if (hourOfDay >= 22 || hourOfDay <= 4) baseScore += 5; // Night tide movement
      }

      const finalScore = Math.min(100, Math.max(38, Math.round(baseScore)));

      // 4. Determine Tier & Detailed Fishing Tactics
      let tier: HourlyOptimalWindow['tier'];
      let summary: string;
      let recommendedLures: string;
      let targetSpecies: string[];

      if (finalScore >= 88) {
        tier = 'Prime Peak';
        summary = '⚡ EXCEPTIONAL TROPHY WINDOW: Maximum gravitational pull and low-light predator frenzy.';
        recommendedLures = 'Topwater walk-the-dog plugs, live spot/menhaden under cork, 1/2oz swimbaits.';
        targetSpecies = ['Trophy Striped Bass', 'Bull Red Drum', 'Speckled Trout', 'Cobia'];
      } else if (finalScore >= 72) {
        tier = 'High Activity';
        summary = '🔥 STRONG FEEDING WINDOW: Opportunistic predator strikes along channel dropoffs and marsh cuts.';
        recommendedLures = 'Z-Man PaddlerZ on 3/8oz jigheads, soft plastic jerkbaits, live shrimp on popping cork.';
        targetSpecies = ['Flounder', 'Slot Red Drum', 'Speckled Trout', 'Puppy Drum'];
      } else if (finalScore >= 55) {
        tier = 'Good Feeding';
        summary = '✨ MODERATE BITE: Fish active on structured ledges, oyster beds, and bridge pilings.';
        recommendedLures = 'Bottom bouncing rigs with live peeler crab, Gulp! swimming mullet, bucktails.';
        targetSpecies = ['Black Sea Bass', 'Croaker', 'Spot', 'Tautog'];
      } else {
        tier = 'Fair / Slow';
        summary = '⏸️ SLOW TRANSIT: Fish holding in deep holes or resting between feeding cycles.';
        recommendedLures = 'Slow-finesse soft plastics, scented bottom bait (clam/squid), deep vertical jigs.';
        targetSpecies = ['Spot', 'Croaker', 'Skate'];
      }

      windows.push({
        hourIndex: i,
        timestamp: slotMs,
        timeLabel,
        relativeLabel,
        score: finalScore,
        tier,
        solarEvent,
        lunarEvent,
        solunarType,
        summary,
        recommendedLures,
        targetSpecies,
        isTopDayWindow: false
      });
    }

    // Mark the top 2 highest scoring slots as Top Day Windows
    const sortedIndices = [...windows].sort((a, b) => b.score - a.score);
    if (sortedIndices[0]) sortedIndices[0].isTopDayWindow = true;
    if (sortedIndices[1] && sortedIndices[1].score >= 80) sortedIndices[1].isTopDayWindow = true;

    return windows;
  }, [solunar, inspectedTimestamp]);

  // Selected window details
  const selectedWindow = hourlyWindows[selectedHourIndex] || hourlyWindows[0];

  // Filtered list of top peak windows
  const topPeakWindows = useMemo(() => {
    return hourlyWindows.filter(w => w.score >= 75).slice(0, 4);
  }, [hourlyWindows]);

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

      {/* NEW SECTION: Optimal Fishing Windows (Next 24 Hours) */}
      <div className="mt-4 pt-4 border-t border-slate-800 space-y-3.5">
        {/* Section Header with Top Rating Pill */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gradient-to-tr from-amber-500 to-orange-600 rounded-lg text-slate-950 shadow-md">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm sm:text-base font-extrabold text-white tracking-tight">
                  Optimal Fishing Windows • Next 24 Hours
                </h4>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-300 border border-amber-500/50">
                  Solar & Lunar Peaks
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Hourly predatory feeding likelihood derived from solar zenith, civil twilight, and lunar transit gravity
              </p>
            </div>
          </div>

          {/* Quick Filter Toggle */}
          <div className="flex items-center gap-1 self-start sm:self-auto bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setViewFilter('all')}
              className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                viewFilter === 'all'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              24-Hour Timeline
            </button>
            <button
              onClick={() => setViewFilter('peaks_only')}
              className={`px-2.5 py-1 rounded-md font-bold flex items-center gap-1 transition-all ${
                viewFilter === 'peaks_only'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-300" />
              <span>Prime Peaks Only</span>
            </button>
          </div>
        </div>

        {/* Top 3 Prime Windows Spotlight Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          {topPeakWindows.map((win, idx) => {
            const isSelected = selectedHourIndex === win.hourIndex;
            return (
              <div
                key={win.timestamp}
                onClick={() => setSelectedHourIndex(win.hourIndex)}
                className={`p-3 rounded-xl border cursor-pointer transition-all relative overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? 'bg-slate-900/95 border-amber-400 ring-2 ring-amber-400/40 shadow-xl'
                    : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                }`}
              >
                {/* Ranking Badge */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1 ${
                      idx === 0
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-extrabold shadow-sm'
                        : idx === 1
                        ? 'bg-slate-800 text-cyan-300 border border-cyan-500/40'
                        : 'bg-slate-800 text-emerald-300 border border-emerald-500/40'
                    }`}>
                      {idx === 0 ? '🏆 TOP PEAK' : idx === 1 ? '⭐ PEAK #2' : '⭐ PEAK #3'}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">({win.relativeLabel})</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="text-sm font-black text-amber-300">{win.score}</span>
                    <span className="text-[10px] text-slate-400 font-bold">/ 100</span>
                  </div>
                </div>

                {/* Time Slot & Trigger */}
                <div>
                  <div className="text-base font-black text-white flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    <span>{win.timeLabel} Window</span>
                  </div>
                  <div className="text-xs font-bold text-amber-300 mt-1 flex items-center gap-1">
                    {win.solunarType === 'dual_synergy' ? (
                      <span className="text-amber-300">⚡ Double Synergy (Solar + Lunar)</span>
                    ) : win.solunarType === 'major' ? (
                      <span className="text-emerald-400">🌕 Major Lunar Transit</span>
                    ) : win.solunarType === 'minor' ? (
                      <span className="text-cyan-400">🌔 Minor Horizon Transit</span>
                    ) : (
                      <span className="text-orange-300">🌅 Dawn / Dusk Twilight</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1 leading-snug line-clamp-2">
                    {win.lunarEvent || win.solarEvent || win.summary}
                  </p>
                </div>

                {/* Target Species Pills */}
                <div className="flex flex-wrap gap-1 mt-2.5 pt-2 border-t border-slate-800/80">
                  {win.targetSpecies.slice(0, 3).map(sp => (
                    <span key={sp} className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-900 text-cyan-200 border border-slate-700/60">
                      {sp}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* 24-Hour Interactive Visual Histogram / Timeline */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-3">
          <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
            <span className="font-bold text-slate-300 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              24-Hour Feeding Intensity Histogram (Click bar to inspect)
            </span>
            <span className="text-[11px] text-slate-400">
              Selected: <strong className="text-amber-300">{selectedWindow.timeLabel} ({selectedWindow.relativeLabel})</strong>
            </span>
          </div>

          {/* Hourly Vertical Bars Grid */}
          <div className="grid grid-cols-12 sm:grid-cols-24 gap-1 sm:gap-1.5 items-end h-28 pt-2 px-1">
            {hourlyWindows.map((win) => {
              const isSelected = selectedHourIndex === win.hourIndex;
              const isPeak = win.score >= 80;
              const isHigh = win.score >= 70;
              const isGood = win.score >= 55;

              const barBg = isPeak
                ? 'bg-gradient-to-t from-amber-600 via-orange-500 to-yellow-300'
                : isHigh
                ? 'bg-gradient-to-t from-emerald-600 to-teal-400'
                : isGood
                ? 'bg-gradient-to-t from-cyan-600 to-blue-400'
                : 'bg-gradient-to-t from-slate-800 to-slate-600';

              return (
                <div
                  key={win.timestamp}
                  onClick={() => setSelectedHourIndex(win.hourIndex)}
                  className="flex flex-col items-center h-full justify-end group cursor-pointer"
                  title={`${win.timeLabel}: Score ${win.score}/100 (${win.tier})`}
                >
                  {/* Event Marker on top of bar */}
                  <div className="h-4 flex items-center justify-center text-[10px]">
                    {win.solarEvent?.includes('Dawn') ? (
                      <span className="text-[10px]">🌅</span>
                    ) : win.solarEvent?.includes('Dusk') ? (
                      <span className="text-[10px]">🌇</span>
                    ) : win.solunarType === 'major' ? (
                      <span className="text-[10px]">🌕</span>
                    ) : win.solunarType === 'minor' ? (
                      <span className="text-[10px]">🌔</span>
                    ) : win.isTopDayWindow ? (
                      <span className="text-[10px]">⭐</span>
                    ) : null}
                  </div>

                  {/* Vertical Bar */}
                  <div
                    className={`w-full rounded-t-md transition-all duration-300 ${barBg} ${
                      isSelected
                        ? 'ring-2 ring-white scale-110 shadow-[0_0_12px_rgba(245,158,11,0.8)]'
                        : 'group-hover:scale-105 group-hover:brightness-125 opacity-90'
                    }`}
                    style={{ height: `${Math.max(18, (win.score / 100) * 80)}px` }}
                  />

                  {/* Hour Label */}
                  <span className={`text-[9px] font-bold mt-1.5 truncate ${
                    isSelected ? 'text-amber-300 font-black' : 'text-slate-400 group-hover:text-white'
                  }`}>
                    {win.timeLabel.replace(':00 ', '').toLowerCase()}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Inspected Hour Deep-Dive Card */}
          <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-3 sm:p-4 text-xs space-y-2 mt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <div className={`px-2.5 py-1 rounded-lg text-xs font-black ${
                  selectedWindow.score >= 80 
                    ? 'bg-amber-500 text-slate-950' 
                    : selectedWindow.score >= 70 
                    ? 'bg-emerald-500 text-slate-950' 
                    : selectedWindow.score >= 55 
                    ? 'bg-cyan-500 text-slate-950' 
                    : 'bg-slate-800 text-slate-300'
                }`}>
                  {selectedWindow.score} / 100
                </div>
                <div>
                  <span className="font-extrabold text-white text-sm">
                    {selectedWindow.timeLabel} Window ({selectedWindow.relativeLabel})
                  </span>
                  <span className="text-slate-400 text-xs ml-2">
                    Tier: <strong className="text-cyan-300">{selectedWindow.tier}</strong>
                  </span>
                </div>
              </div>

              {/* Transit Event Tags */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {selectedWindow.solarEvent && (
                  <span className="text-[10px] font-bold text-orange-300 bg-orange-950/80 border border-orange-600/40 px-2 py-0.5 rounded">
                    {selectedWindow.solarEvent}
                  </span>
                )}
                {selectedWindow.lunarEvent && (
                  <span className="text-[10px] font-bold text-violet-300 bg-violet-950/80 border border-violet-600/40 px-2 py-0.5 rounded">
                    {selectedWindow.lunarEvent}
                  </span>
                )}
              </div>
            </div>

            <p className="text-slate-200 text-xs leading-relaxed">
              {selectedWindow.summary}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {/* Tactical Lure Setup */}
              <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                <div className="text-[10px] uppercase font-bold text-amber-400 flex items-center gap-1 mb-1">
                  <Target className="w-3 h-3" />
                  Recommended Rig & Bait Presentation
                </div>
                <div className="text-xs text-slate-300">
                  {selectedWindow.recommendedLures}
                </div>
              </div>

              {/* Active Species Focus */}
              <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                <div className="text-[10px] uppercase font-bold text-cyan-400 flex items-center gap-1 mb-1">
                  <Fish className="w-3 h-3" />
                  Peak Target Species
                </div>
                <div className="flex flex-wrap gap-1">
                  {selectedWindow.targetSpecies.map(sp => (
                    <span key={sp} className="text-[10px] font-semibold text-cyan-200 bg-cyan-950/60 border border-cyan-800/40 px-1.5 py-0.5 rounded">
                      {sp}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
