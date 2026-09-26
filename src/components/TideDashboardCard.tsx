import React, { useState, useRef, useCallback, useEffect } from 'react';
import { TideEvent, FishSpeciesInfo } from '../types';
import { 
  ArrowUpRight, ArrowDownRight, Clock, Waves, Compass, Activity, 
  Calendar, Fish, Sparkles, ShieldAlert, CheckCircle2, Sliders, Anchor, 
  Wind, CloudRain, Cloud, Sun, CloudSun, CloudLightning, Flame, Moon 
} from 'lucide-react';
import { SolunarForecast, getActiveSolunarPeriodForTime } from '../marineCalculations';

interface TideChartProps {
  currentHeightFt: number;
  currentTrend: 'Rising (Flood)' | 'Falling (Ebb)' | 'Slack High' | 'Slack Low';
  nextTide: TideEvent;
  tideEvents: TideEvent[];
  hourlyHeights: {
    hour: string;
    height: number;
    isNow: boolean;
    timestamp: number;
    windSpeedMph?: number;
    windGustMph?: number;
    windDirection?: string;
    weatherCategory?: 'Rain' | 'Cloudy' | 'Clear' | 'Partly Cloudy' | 'Thunderstorm';
    conditionSummary?: string;
    precipitationProbability?: number;
    cloudCover?: number;
  }[];
  stationName: string;
  selectedDate: string; // YYYY-MM-DD
  onDateChange: (newDate: string) => void;
  isToday: boolean;
  locationFishes: FishSpeciesInfo[];
  solunar?: SolunarForecast;
}

export const TideDashboardCard: React.FC<TideChartProps> = ({
  currentHeightFt,
  currentTrend,
  nextTide,
  tideEvents,
  hourlyHeights,
  stationName,
  selectedDate,
  onDateChange,
  isToday,
  locationFishes,
  solunar
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Selected species ID to showcase in the side panel (default to 'striped-mullet' or first available)
  const [selectedSpeciesId, setSelectedSpeciesId] = useState<string>('striped-mullet');

  // Selected hour index (0 to 23). Default to current hour if today, else hour 12
  const initialIdx = hourlyHeights.findIndex(h => h.isNow);
  const [selectedHourIdx, setSelectedHourIdx] = useState<number>(initialIdx >= 0 ? initialIdx : 12);

  // Curve height mode: allows the user to switch between Large (540px), Giant (680px), or Mega (820px)
  const [curveHeightMode, setCurveHeightMode] = useState<'large' | 'giant' | 'mega'>('giant');

  const chartHeight = curveHeightMode === 'mega' ? 820 : curveHeightMode === 'giant' ? 680 : 540;

  // Keep selectedHourIdx in sync when date changes
  useEffect(() => {
    if (initialIdx >= 0 && isToday) {
      setSelectedHourIdx(initialIdx);
    }
  }, [selectedDate, isToday, initialIdx]);

  // Measure container width for dynamic responsive SVG viewBox and layout
  const [containerWidth, setContainerWidth] = useState<number>(900);
  const isMobile = containerWidth < 560;
  const isSmallMobile = containerWidth < 420;

  useEffect(() => {
    if (!containerRef.current) return;
    const updateWidth = () => {
      if (containerRef.current) {
        const w = containerRef.current.getBoundingClientRect().width;
        if (w > 0) setContainerWidth(Math.round(w));
      }
    };
    updateWidth();

    // Use ResizeObserver for responsive adaptation
    const observer = new ResizeObserver(() => {
      updateWidth();
    });
    observer.observe(containerRef.current);
    window.addEventListener('resize', updateWidth);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateWidth);
    };
  }, []);

  // SVG chart dimensions match the physical container width and selected height!
  // This guarantees 1:1 crisp pixels without downscaling, letterboxing, or shrinking on any screen!
  const svgWidth = Math.max(containerWidth, 340);
  const svgHeight = chartHeight;
  const paddingX = isMobile ? 32 : 46;
  const paddingY = isMobile ? 44 : 54;

  const heights = hourlyHeights.map(h => h.height);
  const actualMin = Math.min(...heights);
  const actualMax = Math.max(...heights);
  const waveSpan = actualMax - actualMin || 0.8;
  // Dynamic full-amplitude scale: pad by only 8% so the wave swings through ~88% of vertical canvas height
  const pad = Math.max(waveSpan * 0.08, 0.15);
  const minH = actualMin - pad;
  const maxH = actualMax + pad * 1.25;
  const range = maxH - minH || 1;

  const getX = (index: number) => paddingX + (index / (hourlyHeights.length - 1)) * (svgWidth - paddingX * 2);
  const getY = (h: number) => svgHeight - paddingY - ((h - minH) / range) * (svgHeight - paddingY * 2);

  // Generate smooth cubic bezier curve
  const points = hourlyHeights.map((pt, i) => ({ x: getX(i), y: getY(pt.height) }));
  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2 < points.length ? i + 2 : points.length - 1];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    pathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }

  // Find current index
  const currentIndex = hourlyHeights.findIndex(h => h.isNow);
  const activePt = isToday && currentIndex >= 0 ? points[currentIndex] : null;

  const areaD = `${pathD} L ${points[points.length - 1].x} ${svgHeight - paddingY} L ${points[0].x} ${svgHeight - paddingY} Z`;

  const todayIso = new Date().toISOString().split('T')[0];

  // Robust clientX to hour index calculator
  const setHourFromClientX = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    if (rect.width <= 0) return;

    // Chart padding offset inside container
    const chartLeft = (paddingX / svgWidth) * rect.width;
    const chartRight = rect.width - chartLeft;
    const chartW = chartRight - chartLeft;

    const relX = clientX - rect.left - chartLeft;
    const ratio = Math.max(0, Math.min(1, relX / chartW));

    const targetIdx = Math.round(ratio * (hourlyHeights.length - 1));
    const safeIdx = Math.max(0, Math.min(hourlyHeights.length - 1, targetIdx));
    
    setSelectedHourIdx(safeIdx);
  }, [hourlyHeights.length, svgWidth, paddingX]);

  // Pointer event handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (_) {}
    setHourFromClientX(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    setHourFromClientX(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (_) {}
  };

  // Compute telemetry for the currently selected hour
  const inspectedIdx = Math.max(0, Math.min(hourlyHeights.length - 1, selectedHourIdx));
  const inspectedData = hourlyHeights[inspectedIdx] || hourlyHeights[0];
  const inspectedPt = points[inspectedIdx] || points[0];

  // Detect local peaks (High Tide) and troughs (Low Tide) along the 24-hour curve
  interface TideExtremaPoint {
    type: 'High' | 'Low';
    label: string;
    hour: string;
    height: number;
    x: number;
    y: number;
    index: number;
  }

  const extremaPoints: TideExtremaPoint[] = [];
  for (let i = 0; i < hourlyHeights.length; i++) {
    const currH = hourlyHeights[i].height;
    const prevH = i > 0 ? hourlyHeights[i - 1].height : currH;
    const nextH = i < hourlyHeights.length - 1 ? hourlyHeights[i + 1].height : currH;

    // Local peak (High Tide)
    if (i > 0 && i < hourlyHeights.length - 1 && currH >= prevH && currH >= nextH && (currH > prevH || currH > nextH)) {
      extremaPoints.push({
        type: 'High',
        label: 'High Tide',
        hour: hourlyHeights[i].hour,
        height: currH,
        x: points[i].x,
        y: points[i].y,
        index: i
      });
    }
    // Local trough (Low Tide)
    else if (i > 0 && i < hourlyHeights.length - 1 && currH <= prevH && currH <= nextH && (currH < prevH || currH < nextH)) {
      extremaPoints.push({
        type: 'Low',
        label: 'Low Tide',
        hour: hourlyHeights[i].hour,
        height: currH,
        x: points[i].x,
        y: points[i].y,
        index: i
      });
    }
  }

  // Fallback: If no internal peak/trough detected due to slope, match against tideEvents
  if (extremaPoints.length === 0 && tideEvents.length > 0) {
    tideEvents.forEach(evt => {
      // Find closest hour in hourlyHeights by time string
      const matchedIdx = hourlyHeights.findIndex(h => h.hour.split(' ')[0] === evt.time.split(' ')[0] && h.hour.slice(-2) === evt.time.slice(-2));
      if (matchedIdx >= 0) {
        extremaPoints.push({
          type: evt.type,
          label: `${evt.type} Tide`,
          hour: evt.time,
          height: evt.heightFt,
          x: points[matchedIdx].x,
          y: points[matchedIdx].y,
          index: matchedIdx
        });
      }
    });
  }

  // Determine movement direction around this hour
  const prevH = inspectedIdx > 0 ? hourlyHeights[inspectedIdx - 1].height : inspectedData.height;
  const nextH = inspectedIdx < hourlyHeights.length - 1 ? hourlyHeights[inspectedIdx + 1].height : inspectedData.height;
  const diff = nextH - prevH;

  let inspectedTrend = 'Slack Water';
  if (diff > 0.08) inspectedTrend = 'Rising (Flood)';
  else if (diff < -0.08) inspectedTrend = 'Falling (Ebb)';

  // Prioritize active fish list for this location
  // Order: Mullet, Croaker, Spot, Striped Bass, Red Drum, Flounder, Specks, Bluefish
  const allSpecies = locationFishes && locationFishes.length > 0 ? locationFishes : [];
  
  // Featured selected fish
  const featuredFish = allSpecies.find(f => f.id === selectedSpeciesId) || allSpecies[0];

  // Weather condition determination for the currently inspected hour
  const getWeatherDisplay = () => {
    const cat = inspectedData.weatherCategory;
    const precip = inspectedData.precipitationProbability ?? 0;
    const cloud = inspectedData.cloudCover ?? 0;

    if (cat === 'Thunderstorm' || (inspectedData.conditionSummary && inspectedData.conditionSummary.includes('Thunderstorm'))) {
      return {
        label: inspectedData.conditionSummary || `Thunderstorms (${Math.max(precip, 50)}% chance)`,
        icon: <CloudLightning className="w-3.5 h-3.5 text-amber-400 shrink-0" />,
        badgeClass: 'bg-amber-950/90 text-amber-200 border-amber-500/50',
        textClass: 'text-amber-300'
      };
    }

    if (cat === 'Rain' || precip >= 35) {
      const chance = Math.max(precip, 40);
      return {
        label: `Rain: ${chance}% chance`,
        icon: <CloudRain className="w-3.5 h-3.5 text-sky-400 shrink-0" />,
        badgeClass: 'bg-sky-950/90 text-sky-200 border-sky-500/40',
        textClass: 'text-sky-300'
      };
    }

    if (cat === 'Cloudy' || cloud >= 60) {
      return {
        label: `Cloudy: ${cloud || 75}% coverage`,
        icon: <Cloud className="w-3.5 h-3.5 text-slate-300 shrink-0" />,
        badgeClass: 'bg-slate-800/90 text-slate-200 border-slate-600/50',
        textClass: 'text-slate-300'
      };
    }

    if (cat === 'Partly Cloudy' || (cloud >= 25 && cloud < 60)) {
      return {
        label: `Partly Cloudy: ${cloud}% clouds`,
        icon: <CloudSun className="w-3.5 h-3.5 text-amber-300 shrink-0" />,
        badgeClass: 'bg-blue-950/80 text-blue-200 border-blue-500/40',
        textClass: 'text-blue-300'
      };
    }

    return {
      label: `Clear: ${cloud}% clouds (0% rain)`,
      icon: <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />,
      badgeClass: 'bg-amber-950/60 text-amber-200 border-amber-500/40',
      textClass: 'text-amber-300'
    };
  };

  const weather = getWeatherDisplay();

  // Active Solunar period for inspected timestamp
  const activeSolunar = solunar ? getActiveSolunarPeriodForTime(inspectedData.timestamp, solunar.allPeriods) : null;

  return (
    <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl border border-cyan-500/20 p-3 sm:p-5 shadow-2xl text-slate-100 flex flex-col justify-between overflow-hidden">
      {/* Top Banner with NOAA station + Date Picker */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3 sm:pb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={`flex h-2.5 w-2.5 rounded-full ${isToday ? 'bg-cyan-400 animate-ping' : 'bg-amber-400'} shrink-0`} />
            <span className="text-xs uppercase tracking-wider font-semibold text-cyan-400">
              Live NOAA Tidal Station
            </span>
            {!isToday && (
              <span className="text-[10px] uppercase font-bold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-600/50">
                Future Forecast
              </span>
            )}
            {solunar && (
              <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-bold text-violet-300 bg-violet-950/80 px-2 py-0.5 rounded border border-violet-700/50">
                <span>{solunar.moonPhaseIcon}</span>
                <span>{solunar.moonPhase}</span>
                <span className="text-emerald-400 font-extrabold">• Solunar {solunar.fishingQualityScore}/100</span>
              </span>
            )}
          </div>
          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight mt-0.5 truncate">{stationName}</h2>
        </div>

        {/* Date Selector for Future Scheduling */}
        <div className="flex items-center justify-between sm:justify-start gap-2 bg-slate-950/80 p-1.5 rounded-xl border border-slate-700 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 px-1 text-xs text-slate-300 font-semibold shrink-0">
            <Calendar className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Schedule Date:</span>
            <span className="sm:hidden">Date:</span>
          </div>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              if (e.target.value) onDateChange(e.target.value);
            }}
            className="bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs px-2 py-1.5 rounded-lg border border-slate-600 focus:outline-none focus:border-cyan-400 cursor-pointer flex-1 sm:flex-initial min-w-0"
          />
          {!isToday && (
            <button
              onClick={() => onDateChange(todayIso)}
              className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-2.5 py-1.5 rounded-lg text-[11px] transition-colors shrink-0"
            >
              Today
            </button>
          )}
        </div>
      </div>

      {/* 24-Hour Tidal Harmonic Curve Section (Moved to the Top) */}
      <div className="my-4 bg-slate-950/70 rounded-xl p-2.5 sm:p-4 border border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 px-1 mb-2">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <span className="font-semibold text-slate-200">
              24-Hour Tidal Harmonic Curve ({new Date(selectedDate + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })})
            </span>
            <div className="flex flex-col gap-1">
              {inspectedData.windSpeedMph !== undefined && (
                <span className="text-[11px] font-bold text-teal-300 bg-teal-950/80 border border-teal-500/40 px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm w-fit">
                  <Wind className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                  <span>Wind at {inspectedData.hour}: {inspectedData.windSpeedMph} mph {inspectedData.windDirection || 'NE'}</span>
                </span>
              )}
              {/* Directly below Wind at 9 AM: 19 mph NW */}
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1.5 shadow-sm border w-fit ${weather.badgeClass}`}>
                {weather.icon}
                <span>{weather.label}</span>
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* Direct Curve Size Selector */}
            <div className="flex items-center gap-1 bg-slate-900/95 p-1 rounded-lg border border-slate-700/80 shadow-md">
              <span className="text-[10px] font-bold text-slate-400 px-1.5 uppercase tracking-wider">Height:</span>
              <button
                type="button"
                onClick={() => setCurveHeightMode('large')}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                  curveHeightMode === 'large'
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                540px
              </button>
              <button
                type="button"
                onClick={() => setCurveHeightMode('giant')}
                className={`px-2.5 py-1 text-xs font-extrabold rounded-md transition-all ${
                  curveHeightMode === 'giant'
                    ? 'bg-cyan-500 text-slate-950 shadow-sm ring-1 ring-cyan-400'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                Giant 680px
              </button>
              <button
                type="button"
                onClick={() => setCurveHeightMode('mega')}
                className={`px-2.5 py-1 text-xs font-black rounded-md transition-all ${
                  curveHeightMode === 'mega'
                    ? 'bg-emerald-400 text-slate-950 shadow-md ring-1 ring-emerald-300 animate-pulse'
                    : 'text-emerald-400 hover:bg-emerald-950/60'
                }`}
              >
                ⚡ Mega 820px
              </button>
            </div>

            {activeSolunar && (
              <span className="text-[11px] font-bold text-emerald-300 bg-emerald-950/90 border border-emerald-500/50 px-2.5 py-1 rounded-md flex items-center gap-1 animate-pulse">
                <Flame className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{activeSolunar.name}</span>
              </span>
            )}
            <span className="text-[11px] text-cyan-400 font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-cyan-400 shrink-0 animate-pulse" />
              <span className="hidden sm:inline">Slide mouse or drag scrubber</span>
            </span>
          </div>
        </div>

        {/* Full-Width Expansive Tidal Harmonic Curve (100% Width & Generous Height) */}
        <div className="w-full bg-slate-900/70 rounded-2xl p-2 sm:p-4 border border-cyan-500/30 shadow-2xl flex flex-col justify-between mb-4">
          {/* Interactive Graph Surface */}
          <div
            ref={containerRef}
            className="w-full relative select-none cursor-pointer touch-none bg-slate-950/60 rounded-xl p-1 sm:p-2 overflow-x-hidden"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            {/* SVG Canvas - Rendered at exact physical 1:1 pixel dimensions (no scaling down) */}
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              style={{ width: '100%', height: `${svgHeight}px`, display: 'block' }}
              className="w-full block overflow-visible select-none"
            >
              <defs>
                <linearGradient id="tideGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.55" />
                  <stop offset="60%" stopColor="#0891b2" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#0891b2" stopOpacity="0.02" />
                </linearGradient>
                <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="35%" stopColor="#06b6d4" />
                  <stop offset="70%" stopColor="#2dd4bf" />
                  <stop offset="100%" stopColor="#38bdf8" />
                </linearGradient>
              </defs>

              {/* Reference Grid lines */}
              <line x1={paddingX} y1={getY(actualMax)} x2={svgWidth - paddingX} y2={getY(actualMax)} stroke="#475569" strokeDasharray="4 4" strokeWidth="1.5" />
              <line x1={paddingX} y1={getY((actualMax + actualMin) / 2)} x2={svgWidth - paddingX} y2={getY((actualMax + actualMin) / 2)} stroke="#334155" strokeDasharray="4 4" strokeWidth="1.5" />
              <line x1={paddingX} y1={getY(actualMin)} x2={svgWidth - paddingX} y2={getY(actualMin)} stroke="#475569" strokeDasharray="4 4" strokeWidth="1.5" />

              {/* Y-Axis height labels with large crisp fonts */}
              <text x={paddingX - 8} y={getY(actualMax) + 5} fill="#38bdf8" fontSize={isMobile ? "12" : "14"} fontWeight="900" textAnchor="end">{actualMax.toFixed(1)}ft</text>
              <text x={paddingX - 8} y={getY((actualMax + actualMin) / 2) + 5} fill="#94a3b8" fontSize={isMobile ? "11" : "12.5"} fontWeight="bold" textAnchor="end">{((actualMax + actualMin) / 2).toFixed(1)}ft</text>
              <text x={paddingX - 8} y={getY(actualMin) + 5} fill="#38bdf8" fontSize={isMobile ? "12" : "14"} fontWeight="900" textAnchor="end">{actualMin.toFixed(1)}ft</text>

              <path d={areaD} fill="url(#tideGradient)" />
              <path d={pathD} fill="none" stroke="url(#lineGrad)" strokeWidth={isMobile ? "6" : "8"} strokeLinecap="round" filter="drop-shadow(0 0 10px rgba(6, 182, 212, 0.95))" />

              {/* High Tide and Low Tide Labels on the Harmonic Curve */}
              {extremaPoints.map((pt, idx) => {
                const isHigh = pt.type === 'High';
                const labelY = isHigh ? Math.max(pt.y - 24, paddingY + 4) : Math.min(pt.y + 32, svgHeight - paddingY - 14);
                const badgeY = isHigh ? labelY - 18 : labelY - 10;
                const pillColor = isHigh ? '#065f46' : '#0369a1';
                const strokeColor = isHigh ? '#34d399' : '#38bdf8';
                const textColor = '#ffffff';

                const badgeW = isMobile ? 96 : 124;
                const badgeH = isMobile ? 24 : 28;
                const badgeX = Math.max(paddingX, Math.min(svgWidth - paddingX - badgeW, pt.x - badgeW / 2));
                const labelText = isHigh 
                  ? `▲ HIGH ${pt.height.toFixed(1)} ft` 
                  : `▼ LOW ${pt.height.toFixed(1)} ft`;

                return (
                  <g key={`extrema-${idx}`} className="transition-opacity">
                    {/* Anchor Dot on the curve */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isMobile ? "6.5" : "8.5"}
                      fill={isHigh ? '#10b981' : '#0284c7'}
                      stroke="#ffffff"
                      strokeWidth="2.5"
                    />
                    
                    {/* Dotted indicator line from curve point to badge */}
                    <line
                      x1={pt.x}
                      y1={isHigh ? pt.y - 8 : pt.y + 8}
                      x2={pt.x}
                      y2={isHigh ? badgeY + badgeH : badgeY}
                      stroke={strokeColor}
                      strokeWidth="2"
                      strokeDasharray="3 3"
                      opacity="0.95"
                    />

                    {/* Pill Badge Background */}
                    <rect
                      x={badgeX}
                      y={badgeY}
                      width={badgeW}
                      height={badgeH}
                      rx="6"
                      fill={pillColor}
                      stroke={strokeColor}
                      strokeWidth="2"
                      filter="drop-shadow(0 4px 8px rgba(0,0,0,0.85))"
                    />

                    {/* Letter Label: High Tide / Low Tide */}
                    <text
                      x={badgeX + badgeW / 2}
                      y={badgeY + (isMobile ? 16.5 : 19)}
                      fill={textColor}
                      fontSize={isMobile ? "11.5" : "13.5"}
                      fontWeight="900"
                      letterSpacing="0.04em"
                      textAnchor="middle"
                    >
                      {labelText}
                    </text>
                  </g>
                );
              })}

              {/* Vertical Marker for Current Time if today */}
              {activePt && (
                <g>
                  <line
                    x1={activePt.x}
                    y1={paddingY}
                    x2={activePt.x}
                    y2={svgHeight - paddingY - 14}
                    stroke="#ef4444"
                    strokeWidth="2.5"
                    strokeDasharray="4 2"
                  />
                  <circle cx={activePt.x} cy={activePt.y} r="7" fill="#ef4444" stroke="#ffffff" strokeWidth="2.5" />
                </g>
              )}

              {/* Vertical Tracker Line & Point for Currently Selected Hour */}
              <g>
                <line
                  x1={inspectedPt.x}
                  y1={paddingY - 5}
                  x2={inspectedPt.x}
                  y2={svgHeight - paddingY - 14}
                  stroke="#38bdf8"
                  strokeWidth="3.5"
                  strokeDasharray="4 3"
                />
                <circle cx={inspectedPt.x} cy={inspectedPt.y} r={isMobile ? "12" : "16"} fill="#0284c7" opacity="0.4" />
                <circle cx={inspectedPt.x} cy={inspectedPt.y} r={isMobile ? "7" : "9"} fill="#38bdf8" stroke="#ffffff" strokeWidth="3" />

                {/* Marker Tag over Cursor Line - Displays Hour + Tide + Wind Speed */}
                {(() => {
                  const tagW = isMobile ? 120 : 154;
                  const tagH = 30;
                  const tagX = Math.max(paddingX, Math.min(svgWidth - paddingX - tagW, inspectedPt.x - tagW / 2));
                  const windStr = inspectedData.windSpeedMph !== undefined ? ` • 💨 ${inspectedData.windSpeedMph}mph` : '';
                  return (
                    <g>
                      <rect
                        x={tagX}
                        y={paddingY - 32}
                        width={tagW}
                        height={tagH}
                        rx="8"
                        fill="#0f172a"
                        stroke="#38bdf8"
                        strokeWidth="2"
                        filter="drop-shadow(0 4px 8px rgba(0,0,0,0.85))"
                      />
                      <text
                        x={tagX + tagW / 2}
                        y={paddingY - 12}
                        fill="#ffffff"
                        fontSize={isMobile ? "11.5" : "13.5"}
                        fontWeight="900"
                        textAnchor="middle"
                      >
                        <tspan fill="#38bdf8">{inspectedData.hour}</tspan>
                        <tspan fill="#ffffff" fontWeight="800"> • {inspectedData.height.toFixed(1)}ft</tspan>
                      </text>
                    </g>
                  );
                })()}
              </g>

              {/* Bottom timeline and wind speed axis */}
              {hourlyHeights.map((h, i) => {
                const step = isSmallMobile ? 4 : isMobile ? 3 : 2;
                if (i % step !== 0 && i !== hourlyHeights.length - 1) return null;
                const x = getX(i);
                const displayHour = isMobile
                  ? h.hour.replace(':00', '').toLowerCase().replace(' ', '')
                  : h.hour;

                return (
                  <g key={i}>
                    {/* Hour label */}
                    <text x={x} y={svgHeight - 24} fill="#f8fafc" fontSize={isMobile ? "12" : "14"} fontWeight="800" textAnchor="middle">
                      {displayHour}
                    </text>
                    {/* Wind speed label directly on curve axis */}
                    {h.windSpeedMph !== undefined && (
                      <text x={x} y={svgHeight - 7} fill="#2dd4bf" fontSize={isMobile ? "10.5" : "12"} fontWeight="900" textAnchor="middle">
                        {h.windSpeedMph} mph
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Slider Scrubber Alternative to Touch: 100% Mobile & Desktop accessible */}
          <div className="mt-3 pt-2.5 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5 shrink-0">
              <Sliders className="w-4 h-4 text-cyan-400" />
              Scrub Hour:
            </span>
            <input
              type="range"
              min="0"
              max={hourlyHeights.length - 1}
              value={selectedHourIdx}
              onChange={(e) => {
                setSelectedHourIdx(Number(e.target.value));
              }}
              className="w-full accent-cyan-400 h-3 bg-slate-700 rounded-lg cursor-pointer"
            />
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 shrink-0">
              <span className="text-sm font-black text-cyan-300 bg-cyan-950 px-2.5 py-1 rounded-md border border-cyan-700/60">
                {inspectedData.hour}
              </span>
              {inspectedData.windSpeedMph !== undefined && (
                <span className="text-xs font-black text-teal-300 bg-teal-950/90 border border-teal-500/40 px-2.5 py-1 rounded-md flex items-center gap-1">
                  <Wind className="w-3.5 h-3.5 text-teal-400" />
                  {inspectedData.windSpeedMph} mph
                </span>
              )}
              <span className={`text-xs font-bold px-2.5 py-1 rounded-md border flex items-center gap-1 ${weather.badgeClass}`}>
                {weather.icon}
                <span>{weather.label}</span>
              </span>
            </div>
          </div>
        </div>

        {/* 3-Column Spacious Marine Telemetry & Species Grid Directly Below Curve */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 items-stretch">
          {/* Card 1: Inspected Hour Tidal Telemetry & Weather */}
          <div className="bg-slate-900/95 border border-slate-700/80 rounded-xl p-4 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">
                    Tidal Stage Inspected
                  </span>
                  <div className="text-base font-extrabold text-white flex items-center gap-2">
                    <span>{inspectedData.hour}</span>
                    <span className="text-xs font-semibold text-cyan-300">
                      • {inspectedTrend}
                    </span>
                  </div>
                  {inspectedData.windSpeedMph !== undefined && (
                    <div className="mt-1 flex items-center gap-1.5 text-xs font-bold text-teal-300">
                      <Wind className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                      <span>Wind at {inspectedData.hour}: {inspectedData.windSpeedMph} mph {inspectedData.windDirection || 'NE'}</span>
                      {inspectedData.windGustMph && (
                        <span className="text-[10px] text-slate-400 font-normal">
                          (gusts {inspectedData.windGustMph} mph)
                        </span>
                      )}
                    </div>
                  )}
                  {/* Weather Condition directly below Wind */}
                  <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold">
                    {weather.icon}
                    <span className={weather.textClass}>{weather.label}</span>
                  </div>
                  {activeSolunar && (
                    <div className="mt-2 text-[11px] font-bold text-emerald-300 bg-emerald-950/80 px-2 py-1 rounded-md border border-emerald-500/40 flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-emerald-400 shrink-0 animate-pulse" />
                      <span>{activeSolunar.name}</span>
                    </div>
                  )}
                </div>

                <div className="text-right">
                  <div className="text-3xl font-black text-cyan-300 tracking-tight">
                    {inspectedData.height.toFixed(1)}
                    <span className="text-sm font-normal text-cyan-500 ml-1">ft</span>
                  </div>
                  <div className="text-[10px] text-slate-400">MLLW datum</div>
                </div>
              </div>

              <div className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                <span className="font-bold text-cyan-300">Water Movement: </span>
                {inspectedTrend.includes('Rising')
                  ? 'Floods shoreline & mud flats for Mullet, Red Drum & Speckled Trout.'
                  : inspectedTrend.includes('Falling')
                  ? 'Flushes Croaker, Spot & baitfish through channels and deeper trenches.'
                  : 'Slack water turning phase with light feeding.'}
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 flex items-center justify-between">
              <span>National Ocean Service</span>
              <span className="text-cyan-400 font-semibold">Real-Time Harmonic Wave</span>
            </div>
          </div>

          {/* Card 2: Featured Fish Species Profile */}
          {featuredFish && (
            <div className="bg-slate-900/95 border border-slate-700/80 rounded-xl p-4 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs uppercase font-bold text-emerald-400 flex items-center gap-1.5">
                    <Fish className="w-4 h-4 text-emerald-400" />
                    Active Species Profile
                  </span>
                  <span className="text-[10px] font-semibold text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                    {featuredFish.category}
                  </span>
                </div>

                {/* Fish Photo & Identity */}
                <div className="flex gap-3 items-center bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 mb-3 shadow-inner">
                  <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 border border-cyan-500/40 bg-white/95 relative shadow-md p-1 flex items-center justify-center">
                    <img
                      src={featuredFish.photoUrl}
                      alt={featuredFish.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-black text-white text-sm truncate">
                      {featuredFish.name}
                    </h4>
                    <div className="text-[11px] text-slate-400 italic truncate mb-1">
                      {featuredFish.scientificName}
                    </div>
                    <div className="text-[11px] text-emerald-300 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="truncate">{featuredFish.seasonalStatus}</span>
                    </div>
                  </div>
                </div>

                {/* Legal Size & Bag Limit Specifications */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800">
                    <div className="text-[10px] font-semibold text-slate-400 uppercase">Legal Size</div>
                    <div className="text-xs font-bold text-amber-300 mt-0.5 truncate">
                      {featuredFish.minSize || featuredFish.regulationSummary}
                    </div>
                  </div>
                  <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800">
                    <div className="text-[10px] font-semibold text-slate-400 uppercase">Daily Bag Limit</div>
                    <div className="text-xs font-bold text-emerald-300 mt-0.5 truncate">
                      {featuredFish.bagLimit || 'Check regulations'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 flex items-center justify-between">
                <span>Ideal Tide: <strong className="text-slate-300">{featuredFish.idealTide}</strong></span>
                <span className="text-emerald-400 font-semibold">{featuredFish.activeDepth}</span>
              </div>
            </div>
          )}

          {/* Card 3: Virginia VMRC Gill Net Rule & Species Switcher */}
          <div className="bg-slate-900/95 border border-slate-700/80 rounded-xl p-4 shadow-xl flex flex-col justify-between">
            <div>
              {/* Gill Net Specifications Box with VMRC 2 7/8" minimum */}
              <div className="bg-cyan-950/30 border border-cyan-500/30 rounded-xl p-2.5 mb-3">
                <div className="flex items-center justify-between text-[11px] font-bold text-cyan-300 mb-1">
                  <span className="flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
                    Gill Net (Virginia VMRC)
                  </span>
                  <span className="text-[10px] text-amber-300 bg-amber-950/80 px-1.5 py-0.2 rounded border border-amber-600/50">
                    2 7/8" Min Mesh
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-snug">
                  {featuredFish?.gillNetInfo || 'VMRC requires minimum mesh size is 2 7/8" stretched mesh in Virginia tidal waters.'}
                </p>
              </div>

              {/* Switchable Fish Selector: Prominently showcases Mullet, Croaker, Spot, Striped Bass, Red Drum, Flounder */}
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400 mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1 text-cyan-400">
                    <Anchor className="w-3.5 h-3.5" /> Select Target Species:
                  </span>
                  <span className="text-slate-500">{allSpecies.length} species</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
                  {allSpecies.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setSelectedSpeciesId(f.id)}
                      className={`text-xs px-2 py-1.5 rounded-lg font-bold text-left transition-all truncate border ${
                        featuredFish?.id === f.id
                          ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md scale-[1.02]'
                          : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700'
                      }`}
                      title={f.name}
                    >
                      {f.name.split(' (')[0]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 flex items-center justify-between">
              <span>VA Marine Resources Commission</span>
              <span className="text-cyan-400 font-semibold">2 7/8" Mesh Minimum</span>
            </div>
          </div>
        </div>
      </div>

      {/* Discrete Upcoming Tides Timeline */}
      <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
        {tideEvents.slice(0, 4).map((evt, idx) => (
          <div
            key={idx}
            className={`p-2.5 rounded-lg border flex items-center justify-between text-xs transition-all ${
              evt.type === 'High'
                ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                : 'bg-sky-950/20 border-sky-500/30 text-sky-200'
            }`}
          >
            <div>
              <span className={`font-bold ${evt.type === 'High' ? 'text-emerald-400' : 'text-sky-400'}`}>
                {evt.type} Tide
              </span>
              <div className="text-[11px] text-slate-300">{evt.time}</div>
            </div>
            <div className="text-right">
              <span className="font-extrabold text-sm">{evt.heightFt.toFixed(1)}</span>
              <span className="text-[10px] text-slate-400 ml-0.5">ft</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
