import React, { useState } from "react";
import { BarChart3, TrendingUp, TrendingDown, Minus, ShieldCheck, AlertTriangle } from "lucide-react";
import { TopicDetails } from "@/services/weakness";

interface SkillGapChartProps {
  strongTopics: TopicDetails[];
  moderateTopics: TopicDetails[];
  weakTopics: TopicDetails[];
}

export function SkillGapChart({ strongTopics, moderateTopics, weakTopics }: SkillGapChartProps) {
  const [hoveredBar, setHoveredBar] = useState<{
    topic: string;
    score: number;
    attempts: number;
    x: number;
    y: number;
  } | null>(null);

  // Combine topics for visualization
  const allTopics = [...strongTopics, ...moderateTopics, ...weakTopics];
  
  // Custom SVG Bar Chart sizing
  const svgWidth = 600;
  const svgHeight = 250;
  const paddingX = 50;
  const paddingY = 30;

  const chartWidth = svgWidth - 2 * paddingX;
  const chartHeight = svgHeight - 2 * paddingY;

  // Calculate coordinates for bars
  const totalTopics = allTopics.length;
  const barWidth = totalTopics > 0 ? Math.min(50, (chartWidth / totalTopics) * 0.6) : 30;
  const gap = totalTopics > 0 ? (chartWidth - barWidth * totalTopics) / (totalTopics + 1) : 10;

  const bars = allTopics.map((item, idx) => {
    const x = paddingX + gap + idx * (barWidth + gap);
    // Invert height since Y = 0 is top
    const h = (item.average_score / 100) * chartHeight;
    const y = svgHeight - paddingY - h;
    return { x, y, h, w: barWidth, ...item };
  });

  // Calculate Strength Distribution
  const strongCount = strongTopics.length;
  const moderateCount = moderateTopics.length;
  const weakCount = weakTopics.length;
  const totalCount = strongCount + moderateCount + weakCount;

  const strongPct = totalCount > 0 ? (strongCount / totalCount) * 100 : 0;
  const moderatePct = totalCount > 0 ? (moderateCount / totalCount) * 100 : 0;
  const weakPct = totalCount > 0 ? (weakCount / totalCount) * 100 : 0;

  // Trend render helper
  const renderTrendIcon = (trend: string) => {
    switch (trend.toLowerCase()) {
      case "improving":
        return <TrendingUp className="h-4 w-4 text-emerald-400 shrink-0" />;
      case "declining":
        return <TrendingDown className="h-4 w-4 text-red-400 shrink-0" />;
      default:
        return <Minus className="h-4 w-4 text-white/40 shrink-0" />;
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Custom SVG Bar Chart */}
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 lg:col-span-2 space-y-6">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-white/60" />
            Topic Performance Breakdown
          </h3>
          <p className="text-xs text-white/50">Average score (%) achieved across all technical categories.</p>
        </div>

        {allTopics.length === 0 ? (
          <div className="flex h-48 items-center justify-center text-xs text-white/40 italic">
            Insufficient topic score details.
          </div>
        ) : (
          <div className="relative">
            <svg 
              viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
              className="w-full h-auto overflow-visible select-none"
            >
              <defs>
                {/* Score gradient styling */}
                <linearGradient id="bar-green" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#059669" stopOpacity="0.8" />
                </linearGradient>
                <linearGradient id="bar-orange" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#d97706" stopOpacity="0.8" />
                </linearGradient>
                <linearGradient id="bar-red" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#dc2626" stopOpacity="0.8" />
                </linearGradient>
                {/* Background Grid Pattern */}
                <pattern id="grid-chart" width="10" height="10" patternUnits="userSpaceOnUse">
                  <line x1="0" y1="0" x2="10" y2="0" stroke="rgba(255, 255, 255, 0.05)" />
                </pattern>
              </defs>

              {/* Grid Background */}
              <rect x={paddingX} y={paddingY} width={chartWidth} height={chartHeight} fill="url(#grid-chart)" />

              {/* Grid Lines at 0, 50, 80, 100 */}
              {[0, 50, 80, 100].map((score) => {
                const y = svgHeight - paddingY - (score / 100) * chartHeight;
                return (
                  <g key={score}>
                    <line 
                      x1={paddingX} 
                      y1={y} 
                      x2={svgWidth - paddingX} 
                      y2={y} 
                      stroke="rgba(255, 255, 255, 0.1)" 
                      strokeDasharray="4 4" 
                    />
                    <text 
                      x={paddingX - 10} 
                      y={y + 4} 
                      textAnchor="end" 
                      fill="rgba(255,255,255,0.4)" 
                      className="font-mono text-[10px]"
                    >
                      {score}%
                    </text>
                  </g>
                );
              })}

              {/* Rendering Columns */}
              {bars.map((bar) => {
                const isStrong = bar.average_score >= 80;
                const isModerate = bar.average_score >= 60;
                const fillUrl = isStrong ? "url(#bar-green)" : isModerate ? "url(#bar-orange)" : "url(#bar-red)";
                
                return (
                  <g key={bar.topic}>
                    <rect
                      x={bar.x}
                      y={bar.y}
                      width={bar.w}
                      height={bar.h}
                      rx="4"
                      fill={fillUrl}
                      className="cursor-pointer transition-all duration-150 hover:brightness-125"
                      onMouseEnter={() => 
                        setHoveredBar({ 
                          topic: bar.topic, 
                          score: bar.average_score, 
                          attempts: bar.attempts,
                          x: bar.x + bar.w / 2, 
                          y: bar.y 
                        })
                      }
                      onMouseLeave={() => setHoveredBar(null)}
                    />
                    {/* Topic labels */}
                    <text
                      x={bar.x + bar.w / 2}
                      y={svgHeight - paddingY + 18}
                      textAnchor="middle"
                      fill="rgba(255,255,255,0.5)"
                      className="font-semibold text-[9px] max-w-[50px] truncate"
                    >
                      {bar.topic.length > 8 ? `${bar.topic.substring(0, 7)}…` : bar.topic}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Hover Tooltip */}
            {hoveredBar && (
              <div 
                className="absolute z-10 rounded-lg border border-white/10 bg-black/90 p-2 text-xs font-mono font-bold text-white shadow-xl pointer-events-none -translate-x-1/2 -translate-y-full"
                style={{ 
                  left: `${(hoveredBar.x / svgWidth) * 100}%`, 
                  top: `${(hoveredBar.y / svgHeight) * 100 - 4}%` 
                }}
              >
                <div>{hoveredBar.topic}</div>
                <div className="text-emerald-400">Avg Score: {hoveredBar.score}%</div>
                <div className="text-white/60 font-normal">Attempts: {hoveredBar.attempts}</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Side Details Panel: Strength Distribution & Topic Gaps */}
      <div className="space-y-6">
        {/* Strength Distribution Card */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4">
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Strength Distribution</h4>
            <p className="text-xs text-white/50">Classification of mock readiness competencies.</p>
          </div>

          <div className="space-y-3">
            {/* Horizontal Stacked Bar */}
            <div className="h-4 w-full rounded-full bg-white/10 overflow-hidden flex">
              {strongPct > 0 && (
                <div 
                  className="h-full bg-emerald-500 transition-all duration-300" 
                  style={{ width: `${strongPct}%` }} 
                  title={`Strong: ${strongCount} topics`}
                />
              )}
              {moderatePct > 0 && (
                <div 
                  className="h-full bg-amber-500 transition-all duration-300" 
                  style={{ width: `${moderatePct}%` }}
                  title={`Moderate: ${moderateCount} topics`}
                />
              )}
              {weakPct > 0 && (
                <div 
                  className="h-full bg-red-500 transition-all duration-300" 
                  style={{ width: `${weakPct}%` }}
                  title={`Weak: ${weakCount} topics`}
                />
              )}
            </div>

            {/* Labels Legend */}
            <div className="grid grid-cols-3 gap-1 text-[10px] text-white/70 text-center font-semibold">
              <div className="flex flex-col items-center">
                <span className="flex items-center gap-1 text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Strong
                </span>
                <span className="font-mono text-white/50">{Math.round(strongPct)}%</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="flex items-center gap-1 text-amber-400">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  Mod
                </span>
                <span className="font-mono text-white/50">{Math.round(moderatePct)}%</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="flex items-center gap-1 text-red-400">
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                  Weak
                </span>
                <span className="font-mono text-white/50">{Math.round(weakPct)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Priority Gaps List */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              Critical Topic Gaps
            </h4>
            <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-bold text-red-400 border border-red-500/20">
              {weakCount}
            </span>
          </div>

          <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
            {weakTopics.length === 0 ? (
              <p className="text-xs text-white/40 italic py-2">No critical topic gaps detected.</p>
            ) : (
              weakTopics.map((item) => (
                <div key={item.topic} className="flex items-center justify-between bg-white/[0.02] border border-white/5 p-2 rounded-xl text-xs hover:bg-white/[0.04] transition">
                  <div className="space-y-0.5 min-w-0">
                    <p className="font-semibold text-white truncate">{item.topic}</p>
                    <p className="text-[10px] text-white/40">Attempts: {item.attempts}</p>
                  </div>
                  <div className="flex items-center gap-2 font-mono font-bold text-red-400 bg-red-500/5 px-2 py-1 rounded-lg border border-red-500/10 shrink-0">
                    {item.average_score}%
                    {renderTrendIcon(item.recent_trend)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
