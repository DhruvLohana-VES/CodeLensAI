"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { 
  BarChart3, 
  Award, 
  BookOpen, 
  Activity, 
  ShieldCheck, 
  AlertTriangle, 
  TrendingUp, 
  RefreshCw,
  PlusCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getAnalytics, AnalyticsResponse } from "@/services/interview";

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [hoveredPoint, setHoveredPoint] = useState<{
    interview: number;
    score: number;
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getAnalytics();
      if (res.success) {
        setData(res);
      }
    } catch (e) {
      console.error("Error loading analytics:", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <PageHeader
          title="Analytics"
          description="Track readiness trends across cohorts and roles."
        />
        <div className="flex flex-col items-center justify-center py-32 space-y-4 text-white/40">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <p className="text-sm">Calculating placement readiness analytics...</p>
        </div>
      </div>
    );
  }

  // Handle empty state if no completed sessions
  if (!data || data.total_sessions === 0) {
    return (
      <div className="space-y-8">
        <PageHeader
          title="Analytics"
          description="Track readiness trends across cohorts and roles."
        />
        <div className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-white/5 p-8 text-center space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-white">
            <BarChart3 className="h-7 w-7" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-white">No Analytics Data Available</h2>
            <p className="text-sm text-white/60">
              Placement readiness analytics are generated once you complete at least one AI mock interview session.
            </p>
          </div>
          <div className="pt-4">
            <Button className="bg-white text-black hover:bg-white/90" asChild>
              <Link href="/interviews">
                <PlusCircle className="mr-2 h-4 w-4" />
                Take Mock Interview
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Performance Trend SVG calculations
  const trend = data.performance_trend;
  const svgWidth = 600;
  const svgHeight = 220;
  const paddingX = 40;
  const paddingY = 30;

  const points = trend.map((item, idx) => {
    const x = trend.length > 1 
      ? paddingX + (idx * (svgWidth - 2 * paddingX)) / (trend.length - 1)
      : svgWidth / 2;
    // Invert Y coordinate since SVG (0,0) is top-left
    const y = svgHeight - paddingY - (item.score * (svgHeight - 2 * paddingY)) / 100;
    return { x, y, ...item };
  });

  // Generate SVG path string
  let linePath = "";
  let areaPath = "";
  if (points.length > 0) {
    linePath = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      linePath += ` L ${points[i].x} ${points[i].y}`;
    }
    // Area path ends by dropping down to baseline
    areaPath = `${linePath} L ${points[points.length - 1].x} ${svgHeight - paddingY} L ${points[0].x} ${svgHeight - paddingY} Z`;
  }

  return (
    <div className="space-y-8 pb-12">
      <PageHeader
        title="Analytics"
        description="Track readiness trends across cohorts and roles."
      />

      {/* KPI Overview Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Average Score */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-2 relative overflow-hidden group hover:border-white/20 transition">
          <div className="flex justify-between items-start">
            <p className="text-xs uppercase tracking-wider text-white/50 font-bold">Average Mock Score</p>
            <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-400 border border-emerald-500/20">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <div className="space-y-0.5">
            <h3 className="text-3xl font-black text-white font-mono">{data.average_score}%</h3>
            <p className="text-xs text-white/40">Aggregated from placement rounds.</p>
          </div>
        </div>

        {/* Sessions Completed */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-2 relative overflow-hidden group hover:border-white/20 transition">
          <div className="flex justify-between items-start">
            <p className="text-xs uppercase tracking-wider text-white/50 font-bold">Sessions Completed</p>
            <div className="rounded-xl bg-blue-500/10 p-2 text-blue-400 border border-blue-500/20">
              <Activity className="h-4 w-4" />
            </div>
          </div>
          <div className="space-y-0.5">
            <h3 className="text-3xl font-black text-white font-mono">{data.total_sessions}</h3>
            <p className="text-xs text-white/40">Active interviews completed.</p>
          </div>
        </div>

        {/* Best Topic */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-2 relative overflow-hidden group hover:border-white/20 transition">
          <div className="flex justify-between items-start">
            <p className="text-xs uppercase tracking-wider text-white/50 font-bold">Strongest Topic</p>
            <div className="rounded-xl bg-amber-500/10 p-2 text-amber-400 border border-amber-500/20">
              <BookOpen className="h-4 w-4" />
            </div>
          </div>
          <div className="space-y-0.5">
            <h3 className="text-xl font-bold text-white truncate pt-1">{data.best_topic || "N/A"}</h3>
            <p className="text-xs text-white/40">
              {data.best_topic ? `Avg. ${data.topic_scores[data.best_topic]}% score` : "No topic records."}
            </p>
          </div>
        </div>

        {/* Weakest Topic */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-2 relative overflow-hidden group hover:border-white/20 transition">
          <div className="flex justify-between items-start">
            <p className="text-xs uppercase tracking-wider text-white/50 font-bold">Weakest Topic</p>
            <div className="rounded-xl bg-red-500/10 p-2 text-red-400 border border-red-500/20">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="space-y-0.5">
            <h3 className="text-xl font-bold text-white truncate pt-1">{data.weakest_topic || "N/A"}</h3>
            <p className="text-xs text-white/40">
              {data.weakest_topic ? `Avg. ${data.topic_scores[data.weakest_topic]}% score` : "No topic records."}
            </p>
          </div>
        </div>
      </div>

      {/* Main Analytics Content Section */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Performance Trend SVG Chart */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-white/60" />
                Performance Score Progression
              </h3>
              <p className="text-xs text-white/50">Chronological history of overall mock interview scores.</p>
            </div>
          </div>

          <div className="relative">
            <svg 
              viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
              className="w-full h-auto overflow-visible select-none"
            >
              <defs>
                {/* Under-line fill gradient */}
                <linearGradient id="chart-area-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgb(255, 255, 255)" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="rgb(255, 255, 255)" stopOpacity="0.0" />
                </linearGradient>
                {/* Grid dashed stroke pattern */}
                <pattern id="grid-pattern" width="10" height="10" patternUnits="userSpaceOnUse">
                  <line x1="0" y1="0" x2="10" y2="0" stroke="rgba(255, 255, 255, 0.05)" />
                </pattern>
              </defs>

              {/* Grid background */}
              <rect x={paddingX} y={paddingY} width={svgWidth - 2 * paddingX} height={svgHeight - 2 * paddingY} fill="url(#grid-pattern)" />

              {/* Score lines at 0, 50, 100 */}
              {[0, 50, 100].map((score) => {
                const y = svgHeight - paddingY - (score * (svgHeight - 2 * paddingY)) / 100;
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
                      {score}
                    </text>
                  </g>
                );
              })}

              {/* Area under the line */}
              {areaPath && (
                <path d={areaPath} fill="url(#chart-area-grad)" />
              )}

              {/* The trend line */}
              {linePath && (
                <path 
                  d={linePath} 
                  fill="none" 
                  stroke="rgba(255, 255, 255, 0.9)" 
                  strokeWidth="2.5" 
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Data points */}
              {points.map((pt) => (
                <circle
                  key={pt.interview}
                  cx={pt.x}
                  cy={pt.y}
                  r={hoveredPoint?.interview === pt.interview ? "6" : "4"}
                  fill="#ffffff"
                  stroke="#000000"
                  strokeWidth="2"
                  className="cursor-pointer transition-all duration-150"
                  onMouseEnter={() => setHoveredPoint({ interview: pt.interview, score: pt.score, x: pt.x, y: pt.y })}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              ))}

              {/* X axis labels (Interviews index) */}
              {points.map((pt) => (
                <text
                  key={pt.interview}
                  x={pt.x}
                  y={svgHeight - paddingY + 18}
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.5)"
                  className="font-mono text-[9px]"
                >
                  Round {pt.interview}
                </text>
              ))}
            </svg>

            {/* Custom interactive tooltip */}
            {hoveredPoint && (
              <div 
                className="absolute z-10 rounded-lg border border-white/10 bg-black/90 p-2 text-xs font-mono font-bold text-white shadow-xl pointer-events-none -translate-x-1/2 -translate-y-full"
                style={{ 
                  left: `${(hoveredPoint.x / svgWidth) * 100}%`, 
                  top: `${(hoveredPoint.y / svgHeight) * 100 - 4}%` 
                }}
              >
                <div>Mock #{hoveredPoint.interview}</div>
                <div className="text-emerald-400">Score: {hoveredPoint.score}%</div>
              </div>
            )}
          </div>
        </div>

        {/* Topic Breakdown List */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-6">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-white/60" />
              Topic Performance
            </h3>
            <p className="text-xs text-white/50">Average scores categorized by placement topic.</p>
          </div>

          <div className="space-y-4">
            {Object.entries(data.topic_scores).map(([topic, score]) => (
              <div key={topic} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs text-white/80">
                  <span className="font-semibold">{topic}</span>
                  <span className="font-mono font-bold">{score}%</span>
                </div>
                {/* Sleek HSL styled progress bar */}
                <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      score >= 70
                        ? "bg-gradient-to-r from-emerald-500/80 to-emerald-400"
                        : score >= 50
                        ? "bg-gradient-to-r from-amber-500/80 to-amber-400"
                        : "bg-gradient-to-r from-red-500/80 to-red-400"
                    }`}
                    style={{ width: `${score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Week 6 Readiness Signals (Strong/Weak Topics Lists) */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Strong Topics */}
        <div className="rounded-3xl border border-emerald-500/10 bg-emerald-500/[0.02] p-6 space-y-4 hover:border-emerald-500/20 transition">
          <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2 uppercase tracking-wider">
            <ShieldCheck className="h-5 w-5" />
            Verified Strong Areas (Score &ge; 70%)
          </h3>
          {data.strong_topics.length === 0 ? (
            <p className="text-xs text-white/40 italic">No topics meet the strength threshold yet.</p>
          ) : (
            <ul className="grid grid-cols-2 gap-2 text-xs text-white/70">
              {data.strong_topics.map((topic) => (
                <li key={topic} className="flex items-center gap-2 bg-emerald-500/[0.05] border border-emerald-500/10 p-2.5 rounded-xl">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                  <span className="font-medium truncate">{topic}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Weak Topics */}
        <div className="rounded-3xl border border-red-500/10 bg-red-500/[0.02] p-6 space-y-4 hover:border-red-500/20 transition">
          <h3 className="text-sm font-bold text-red-400 flex items-center gap-2 uppercase tracking-wider">
            <AlertTriangle className="h-5 w-5" />
            Gaps & Areas for Improvement (Score &lt; 70%)
          </h3>
          {data.weak_topics.length === 0 ? (
            <p className="text-xs text-white/40 italic">No critical gaps detected!</p>
          ) : (
            <ul className="grid grid-cols-2 gap-2 text-xs text-white/70">
              {data.weak_topics.map((topic) => (
                <li key={topic} className="flex items-center gap-2 bg-red-500/[0.05] border border-red-500/10 p-2.5 rounded-xl">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-400 shrink-0" />
                  <span className="font-medium truncate">{topic}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
