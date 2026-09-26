import React, { useState, useRef, useCallback, useEffect } from 'react';
import { TideEvent, FishSpeciesInfo } from '../types';
import { ArrowUpRight, ArrowDownRight, Clock, Waves, Compass, Activity, Calendar, Fish, Sparkles, ShieldAlert, CheckCircle2, Sliders, Anchor, Wind } from 'lucide-react';

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
  }[];
  stationName: string;
  selectedDate: string; // YYYY-MM-DD
  onDateChange: (newDate: string) => void;
  isToday: boolean;
  locationFishes: FishSpeciesInfo[];
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
  locationFishes
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Selected species ID to showcase in the side panel (default to 'striped-mullet' or first available)
  const [selectedSpeciesId, setSelectedSpeciesId] = useState<string>('striped-mullet');

  // Selected hour index (0 to 23). Default to current hour if today, else hour 12
  const initialIdx = hourlyHeights.findIndex(h => h.isNow);
  const [selectedHourIdx, setSelectedHourIdx] = useState<number>(initialIdx >= 0 ? initialIdx : 12);

  // Keep selectedHourIdx in sync when date changes
  useEffect(() => {
    if (initialIdx >= 0 && isToday) {
      setSelectedHourIdx(initialIdx);
    }
  }, [selectedDate, isToday, initialIdx]);

  // SVG chart dimensions
  const svgWidth = 640;
  const svgHeight = 224;
  const paddingX = 40;
  const paddingY = 28;

  const heights = hourlyHeights.map(h => h.height);
  const minH = Math.min(...heights, 0);
  const maxH = Math.max(...heights, 8);
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

  return (
    <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl border border-cyan-500/20 p-5 shadow-2xl text-slate-100 flex flex-col justify-between">
      {/* Top Banner with NOAA station + Date Picker */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className={`flex h-2.5 w-2.5 rounded-full ${isToday ? 'bg-cyan-400 animate-ping' : 'bg-amber-400'}`} />
            <span className="text-xs uppercase tracking-wider font-semibold text-cyan-400">
              Live NOAA Tidal Station
            </span>
            {!isToday && (
              <span className="text-[10px] uppercase font-bold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-600/50">
                Future Forecast
              </span>
            )}
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight mt-0.5">{stationName}</h2>
        </div>

        {/* Date Selector for Future Scheduling */}
        <div className="flex items-center gap-2 bg-slate-950/80 p-1 rounded-xl border border-slate-700">
          <div className="flex items-center gap-1.5 px-2 text-xs text-slate-300 font-semibold">
            <Calendar className="w-4 h-4 text-cyan-400" />
            <span>Schedule Date:</span>
          </div>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              if (e.target.value) onDateChange(e.target.value);
            }}
            className="bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs px-2.5 py-1.5 rounded-lg border border-slate-600 focus:outline-none focus:border-cyan-400 cursor-pointer"
          />
          {!isToday && (
            <button
              onClick={() => onDateChange(todayIso)}
              className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-2.5 py-1.5 rounded-lg text-[11px] transition-colors"
            >
              Today
            </button>
          )}
        </div>
      </div>

      {/* 24-Hour Tidal Harmonic Curve Section (Moved to the Top) */}
      <div className="my-4 bg-slate-950/70 rounded-xl p-4 border border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 px-1 mb-2">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-300">
              24-Hour Tidal Harmonic Curve ({new Date(selectedDate + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })})
            </span>
            {inspectedData.windSpeedMph !== undefined && (
              <span className="text-[11px] font-bold text-teal-300 bg-teal-950/80 border border-teal-500/40 px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm">
                <Wind className="w-3.5 h-3.5 text-teal-400" />
                <span>Wind at {inspectedData.hour}: {inspectedData.windSpeedMph} mph {inspectedData.windDirection}</span>
              </span>
            )}
          </div>
          <span className="text-[11px] text-cyan-400 font-medium flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-cyan-400 animate-pulse" />
            Slide mouse, tap curve, or use scrubber — inspect Tide Height, Wind Speed, Mullet & Croaker in the side panel
          </span>
        </div>

        {/* Side-by-Side Layout: Curve on Left, Information Panel on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          {/* Left Column: Harmonic Tide Curve (8 Cols on Desktop) */}
          <div className="lg:col-span-8 bg-slate-900/60 rounded-xl p-3 border border-slate-800 flex flex-col justify-between">
            {/* Interactive Graph Surface */}
            <div
              ref={containerRef}
              className="w-full relative select-none cursor-pointer touch-none"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            >
              {/* SVG Canvas */}
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="w-full h-60 block"
              >
                <defs>
                  <linearGradient id="tideGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.02" />
                  </linearGradient>
                  <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#38bdf8" />
                    <stop offset="50%" stopColor="#06b6d4" />
                    <stop offset="100%" stopColor="#2dd4bf" />
                  </linearGradient>
                </defs>

                {/* Grid lines */}
                <line x1={paddingX} y1={getY(0)} x2={svgWidth - paddingX} y2={getY(0)} stroke="#334155" strokeDasharray="3 3" strokeWidth="1" />
                <line x1={paddingX} y1={getY(maxH / 2)} x2={svgWidth - paddingX} y2={getY(maxH / 2)} stroke="#334155" strokeDasharray="3 3" strokeWidth="1" />
                <line x1={paddingX} y1={getY(maxH)} x2={svgWidth - paddingX} y2={getY(maxH)} stroke="#334155" strokeDasharray="3 3" strokeWidth="1" />

                <text x={paddingX - 6} y={getY(maxH) + 4} fill="#64748b" fontSize="10" textAnchor="end">{maxH.toFixed(0)}ft</text>
                <text x={paddingX - 6} y={getY(maxH / 2) + 4} fill="#64748b" fontSize="10" textAnchor="end">{(maxH / 2).toFixed(1)}ft</text>
                <text x={paddingX - 6} y={getY(0) + 4} fill="#64748b" fontSize="10" textAnchor="end">0ft</text>

                <path d={areaD} fill="url(#tideGradient)" />
                <path d={pathD} fill="none" stroke="url(#lineGrad)" strokeWidth="3.5" strokeLinecap="round" />

                {/* High Tide and Low Tide Labels on the Harmonic Curve */}
                {extremaPoints.map((pt, idx) => {
                  const isHigh = pt.type === 'High';
                  // Keep label inside chart bounds
                  const labelY = isHigh ? Math.max(pt.y - 14, paddingY) : Math.min(pt.y + 20, svgHeight - paddingY - 8);
                  const badgeY = isHigh ? labelY - 11 : labelY - 10;
                  const pillColor = isHigh ? '#065f46' : '#0369a1';
                  const strokeColor = isHigh ? '#34d399' : '#38bdf8';
                  const textColor = isHigh ? '#a7f3d0' : '#bae6fd';

                  return (
                    <g key={`extrema-${idx}`} className="transition-opacity">
                      {/* Anchor Dot on the curve */}
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r="4.5"
                        fill={isHigh ? '#10b981' : '#0284c7'}
                        stroke="#ffffff"
                        strokeWidth="1.5"
                      />
                      
                      {/* Dotted indicator line from curve point to badge */}
                      <line
                        x1={pt.x}
                        y1={isHigh ? pt.y - 4 : pt.y + 4}
                        x2={pt.x}
                        y2={isHigh ? badgeY + 16 : badgeY}
                        stroke={strokeColor}
                        strokeWidth="1"
                        strokeDasharray="2 2"
                        opacity="0.8"
                      />

                      {/* Pill Badge Background */}
                      <rect
                        x={Math.max(paddingX, Math.min(svgWidth - paddingX - 68, pt.x - 34))}
                        y={badgeY}
                        width="68"
                        height="16"
                        rx="4"
                        fill={pillColor}
                        stroke={strokeColor}
                        strokeWidth="1"
                        filter="drop-shadow(0 2px 3px rgba(0,0,0,0.6))"
                      />

                      {/* Letter Label: High Tide / Low Tide */}
                      <text
                        x={Math.max(paddingX, Math.min(svgWidth - paddingX - 68, pt.x - 34)) + 34}
                        y={badgeY + 11.5}
                        fill={textColor}
                        fontSize="9.5"
                        fontWeight="800"
                        letterSpacing="0.02em"
                        textAnchor="middle"
                      >
                        {isHigh ? '▲ HIGH TIDE' : '▼ LOW TIDE'}
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
                      strokeWidth="1.5"
                      strokeDasharray="4 2"
                    />
                    <circle cx={activePt.x} cy={activePt.y} r="5" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" />
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
                    strokeWidth="2.5"
                    strokeDasharray="3 3"
                  />
                  <circle cx={inspectedPt.x} cy={inspectedPt.y} r="12" fill="#0284c7" opacity="0.4" />
                  <circle cx={inspectedPt.x} cy={inspectedPt.y} r="6" fill="#38bdf8" stroke="#ffffff" strokeWidth="2.5" />

                  {/* Marker Tag over Cursor Line - Displays Hour + Tide + Wind Speed */}
                  {(() => {
                    const tagW = 104;
                    const tagX = Math.max(paddingX, Math.min(svgWidth - paddingX - tagW, inspectedPt.x - tagW / 2));
                    const windStr = inspectedData.windSpeedMph !== undefined ? `💨 ${inspectedData.windSpeedMph}mph` : '';
                    return (
                      <g>
                        <rect
                          x={tagX}
                          y={paddingY - 24}
                          width={tagW}
                          height="22"
                          rx="6"
                          fill="#0f172a"
                          stroke="#38bdf8"
                          strokeWidth="1.5"
                          filter="drop-shadow(0 2px 5px rgba(0,0,0,0.7))"
                        />
                        <text
                          x={tagX + tagW / 2}
                          y={paddingY - 9}
                          fill="#ffffff"
                          fontSize="10"
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          <tspan fill="#38bdf8">{inspectedData.hour}</tspan>
                          {windStr && <tspan fill="#2dd4bf" fontWeight="800"> • {windStr}</tspan>}
                        </text>
                      </g>
                    );
                  })()}
                </g>

                {/* Bottom timeline and wind speed axis */}
                {hourlyHeights.map((h, i) => {
                  if (i % 3 !== 0 && i !== hourlyHeights.length - 1) return null;
                  const x = getX(i);
                  return (
                    <g key={i}>
                      {/* Hour label */}
                      <text x={x} y={svgHeight - 17} fill="#94a3b8" fontSize="9.5" fontWeight="500" textAnchor="middle">
                        {h.hour}
                      </text>
                      {/* Wind speed label directly on curve axis */}
                      {h.windSpeedMph !== undefined && (
                        <text x={x} y={svgHeight - 4} fill="#2dd4bf" fontSize="8.5" fontWeight="bold" textAnchor="middle">
                          {h.windSpeedMph}mph
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Slider Scrubber Alternative to Touch: 100% Mobile & Desktop accessible */}
            <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between gap-3">
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 shrink-0">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
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
                className="w-full accent-cyan-400 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
              />
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-bold text-cyan-300">
                  {inspectedData.hour}
                </span>
                {inspectedData.windSpeedMph !== undefined && (
                  <span className="text-xs font-extrabold text-teal-300 bg-teal-950/90 border border-teal-500/40 px-2 py-0.5 rounded flex items-center gap-1">
                    <Wind className="w-3 h-3 text-teal-400" />
                    {inspectedData.windSpeedMph} mph {inspectedData.windDirection}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Dedicated SIDE Information Panel (4 Cols on Desktop) */}
          <div className="lg:col-span-4 bg-slate-900/95 border border-slate-700/80 rounded-xl p-4 shadow-xl flex flex-col justify-between">
            {/* Top: Inspecting Hour, Water Telemetry & Wind Speed */}
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
                      <span>Wind: {inspectedData.windSpeedMph} mph {inspectedData.windDirection || 'NE'}</span>
                      {inspectedData.windGustMph && (
                        <span className="text-[10px] text-slate-400 font-normal">
                          (gusts {inspectedData.windGustMph} mph)
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="text-right">
                  <div className="text-2xl font-black text-cyan-300 tracking-tight">
                    {inspectedData.height.toFixed(1)}
                    <span className="text-xs font-normal text-cyan-500 ml-1">ft</span>
                  </div>
                  <div className="text-[10px] text-slate-400">MLLW datum</div>
                </div>
              </div>

              {/* Target Fish Details with Photo */}
              {featuredFish && (
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
                    <div className="w-24 h-24 rounded-lg overflow-hidden shrink-0 border border-cyan-500/40 bg-white/95 relative shadow-md p-1 flex items-center justify-center">
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
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800">
                      <div className="text-[10px] font-semibold text-slate-400 uppercase">Legal Size</div>
                      <div className="text-xs font-bold text-amber-300 mt-0.5">
                        {featuredFish.minSize || featuredFish.regulationSummary}
                      </div>
                    </div>
                    <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800">
                      <div className="text-[10px] font-semibold text-slate-400 uppercase">Daily Bag Limit</div>
                      <div className="text-xs font-bold text-emerald-300 mt-0.5">
                        {featuredFish.bagLimit || 'Check regulations'}
                      </div>
                    </div>
                  </div>

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
                      {featuredFish.gillNetInfo}
                    </p>
                  </div>

                  {/* Switchable Fish Selector: Prominently showcases Mullet, Croaker, Spot, Striped Bass, Red Drum, Flounder */}
                  <div className="pt-2 border-t border-slate-800">
                    <div className="text-[10px] uppercase font-bold text-slate-400 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1 text-cyan-400">
                        <Anchor className="w-3.5 h-3.5" /> Select Target Fish to Inspect:
                      </span>
                      <span className="text-slate-500">{allSpecies.length} species</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-36 overflow-y-auto pr-1">
                      {allSpecies.map((f) => (
                        <button
                          key={f.id}
                          onClick={() => setSelectedSpeciesId(f.id)}
                          className={`text-xs px-2 py-1.5 rounded-lg font-bold text-left transition-all truncate border ${
                            featuredFish.id === f.id
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
              )}
            </div>

            {/* Quick VMRC Compliance Footer */}
            <div className="mt-3 pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 flex items-center justify-between">
              <span>VA Marine Resources Commission</span>
              <span className="text-cyan-400 font-semibold">2 7/8" Mesh Minimum</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Stats Row (Shows Inspected Hour Data & Fish) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 my-2">
        {/* Height */}
        <div className="bg-cyan-950/30 border border-cyan-500/40 rounded-xl p-3.5 transition-all">
          <div className="text-xs text-slate-400 font-medium flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Waves className="w-3.5 h-3.5 text-cyan-400" />
              Tide at {inspectedData.hour}
            </span>
            <span className="text-[10px] text-cyan-300 font-bold px-1.5 py-0.5 rounded bg-cyan-900/60 border border-cyan-700">
              INSPECTED
            </span>
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-3xl font-extrabold text-cyan-300 tracking-tight">
              {inspectedData.height.toFixed(1)}
            </span>
            <span className="text-sm font-semibold text-cyan-500">ft MLLW</span>
          </div>
          <div className="mt-1 flex items-center gap-1 text-xs">
            <span className="text-cyan-200 font-semibold">{inspectedTrend}</span>
          </div>
        </div>

        {/* Movement & Wind Speed */}
        <div className="bg-slate-800/60 border border-slate-700/70 rounded-xl p-3.5">
          <div className="text-xs text-slate-400 font-medium flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              Water Movement
            </span>
            {inspectedData.windSpeedMph !== undefined && (
              <span className="text-[10px] text-teal-300 font-bold px-1.5 py-0.5 rounded bg-teal-950/80 border border-teal-700 flex items-center gap-0.5">
                <Wind className="w-3 h-3 text-teal-400" />
                {inspectedData.windSpeedMph} mph
              </span>
            )}
          </div>
          <div className="mt-1 text-base font-bold text-white truncate">
            {inspectedTrend}
          </div>
          <div className="mt-1 text-xs text-slate-400">
            {inspectedTrend.includes('Rising')
              ? 'Floods shoreline & mud flats for Mullet & Drum'
              : inspectedTrend.includes('Falling')
              ? 'Flushes Croaker, Spot & bait through trenches'
              : 'Slack water turning phase'}
            {inspectedData.windDirection && (
              <span className="block mt-0.5 text-teal-400 font-medium">
                Surface wind: {inspectedData.windSpeedMph} mph {inspectedData.windDirection}
              </span>
            )}
          </div>
        </div>

        {/* Target Species for Inspected Hour */}
        <div className="bg-emerald-950/30 border border-emerald-500/40 ring-1 ring-emerald-500/30 rounded-xl p-3.5">
          <div className="text-xs text-slate-400 font-medium flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Fish className="w-3.5 h-3.5 text-emerald-400" />
              Featured Species
            </span>
            {featuredFish?.minSize && (
              <span className="text-[10px] text-amber-300 font-bold bg-amber-950/70 px-1 rounded border border-amber-600/40">
                {featuredFish.minSize}
              </span>
            )}
          </div>
          <div className="mt-1">
            <div className="text-sm font-bold text-emerald-300 truncate">
              {featuredFish?.name}
            </div>
            <div className="mt-0.5 text-[11px] text-slate-300 line-clamp-1">
              Limit: <span className="text-amber-300 font-semibold">{featuredFish?.bagLimit || featuredFish?.regulationSummary}</span>
            </div>
          </div>
        </div>

        {/* Gill Net & Mesh Advisory Window */}
        <div className="bg-gradient-to-br from-cyan-950/40 to-blue-950/40 rounded-xl p-3.5 border border-cyan-500/30">
          <div className="text-xs text-cyan-300 font-medium flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
              Gill Net & Mesh Rule
            </span>
            <span className="text-[10px] uppercase font-bold text-amber-300 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-600/50">
              VMRC: 2 7/8" Min
            </span>
          </div>
          <div className="mt-1 text-sm font-bold text-white truncate">
            {featuredFish ? featuredFish.name : 'Virginia Beach (VMRC)'}
          </div>
          <div className="mt-1 text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
            {featuredFish?.gillNetInfo || 'VMRC requires minimum mesh size is 2 7/8" stretched mesh in Virginia tidal waters.'}
          </div>
        </div>
      </div>

      {/* Discrete Upcoming Tides Timeline */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
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
