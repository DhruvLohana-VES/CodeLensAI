"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { 
  User, 
  Award, 
  MessageSquare, 
  Map, 
  AlertTriangle, 
  ShieldCheck, 
  PlusCircle, 
  RefreshCw, 
  ArrowRight,
  Sparkles,
  CheckCircle2,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { getResumeAnalysis } from "@/services/resume";
import { getAnalytics, AnalyticsResponse } from "@/services/interview";
import { getWeaknessAnalysis, WeaknessAnalysisResponse } from "@/services/weakness";
import { getRoadmap, RoadmapResponse } from "@/services/roadmap";
import { ResumeAnalysis } from "@/types/resume";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";

export default function DashboardPage() {
  const { error: toastError, success: toastSuccess } = useToast();
  
  // Data states
  const [resume, setResume] = useState<ResumeAnalysis | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [weakness, setWeakness] = useState<WeaknessAnalysisResponse | null>(null);
  const [roadmap, setRoadmap] = useState<RoadmapResponse | null>(null);

  // Loading states
  const [loading, setLoading] = useState(true);

  // Partial failure trackers
  const [failures, setFailures] = useState<{
    resume: boolean;
    analytics: boolean;
    weakness: boolean;
    roadmap: boolean;
  }>({
    resume: false,
    analytics: false,
    weakness: false,
    roadmap: false,
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setFailures({ resume: false, analytics: false, weakness: false, roadmap: false });

    // Fetch resources concurrently using Promise.allSettled
    const [resumeResult, analyticsResult, weaknessResult, roadmapResult] = await Promise.allSettled([
      getResumeAnalysis(),
      getAnalytics(),
      getWeaknessAnalysis(),
      getRoadmap(),
    ]);

    // Handle resume result
    if (resumeResult.status === "fulfilled") {
      setResume(resumeResult.value);
    } else {
      console.error("Resume analysis fetch failed:", resumeResult.reason);
      setFailures((prev) => ({ ...prev, resume: true }));
    }

    // Handle analytics result
    if (analyticsResult.status === "fulfilled") {
      setAnalytics(analyticsResult.value);
    } else {
      console.error("Analytics fetch failed:", analyticsResult.reason);
      setFailures((prev) => ({ ...prev, analytics: true }));
    }

    // Handle weakness result
    if (weaknessResult.status === "fulfilled") {
      setWeakness(weaknessResult.value);
    } else {
      console.error("Weakness analysis fetch failed:", weaknessResult.reason);
      setFailures((prev) => ({ ...prev, weakness: true }));
    }

    // Handle roadmap result
    if (roadmapResult.status === "fulfilled") {
      setRoadmap(roadmapResult.value);
    } else {
      console.error("Roadmap fetch failed:", roadmapResult.reason);
      setFailures((prev) => ({ ...prev, roadmap: true }));
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Retries for individual widgets
  const retryWidget = async (widget: "resume" | "analytics" | "weakness" | "roadmap") => {
    try {
      if (widget === "resume") {
        const data = await getResumeAnalysis();
        setResume(data);
        setFailures((prev) => ({ ...prev, resume: false }));
      } else if (widget === "analytics") {
        const data = await getAnalytics();
        setAnalytics(data);
        setFailures((prev) => ({ ...prev, analytics: false }));
      } else if (widget === "weakness") {
        const data = await getWeaknessAnalysis();
        setWeakness(data);
        setFailures((prev) => ({ ...prev, weakness: false }));
      } else if (widget === "roadmap") {
        const data = await getRoadmap();
        setRoadmap(data);
        setFailures((prev) => ({ ...prev, roadmap: false }));
      }
      toastSuccess(`Successfully reloaded ${widget} data.`);
    } catch (e) {
      toastError(`Failed to reload ${widget} data. Verify backend status.`);
    }
  };

  const hasAnyFailures = Object.values(failures).some(Boolean);

  return (
    <div className="space-y-8 pb-12 transition-all duration-300">
      <PageHeader
        title="Placement Readiness"
        description="Dynamic insights and calibration map extracted from your resume and mock history."
        action={
          <Button className="bg-white text-black hover:bg-white/90" asChild>
            <Link href="/resume/upload">
              <PlusCircle className="mr-2 h-4 w-4" />
              Upload Resume
            </Link>
          </Button>
        }
      />

      {/* Partial Outage Alert Banner */}
      {hasAnyFailures && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 px-6 py-4 flex flex-col sm:flex-row gap-3 justify-between sm:items-center">
          <div className="flex gap-3 items-center">
            <AlertTriangle className="h-5 w-5 text-red-400 shrink-0" />
            <p className="text-xs text-red-200">
              Some services failed to connect. Widgets are displaying fallback data.
            </p>
          </div>
          <Button 
            variant="outline" 
            size="xs" 
            onClick={loadData}
            className="border-red-500/30 text-red-300 hover:bg-red-500/10 shrink-0 self-start sm:self-auto"
          >
            <RefreshCw className="mr-1.5 h-3 w-3 animate-spin" />
            Retry All Connection
          </Button>
        </div>
      )}

      {/* Primary KPI Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Candidate / Resume Status Card */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4 hover:border-white/20 transition relative group">
          <div className="flex justify-between items-start">
            <p className="text-xs uppercase tracking-wide text-white/50 font-bold">Candidate Profile</p>
            <div className="rounded-xl bg-white/10 p-2 text-white/80">
              <User className="h-4 w-4" />
            </div>
          </div>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : failures.resume ? (
            <div className="space-y-2">
              <p className="text-sm text-red-400">Failed to load profile.</p>
              <button onClick={() => retryWidget("resume")} className="text-xs text-white/60 hover:text-white underline flex items-center gap-1">
                <RefreshCw className="h-3 w-3" /> Retry Connection
              </button>
            </div>
          ) : resume ? (
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white leading-snug">{resume.candidateName}</h3>
              <p className="text-xs text-white/60">{resume.role}</p>
              <div className="flex flex-wrap gap-1.5 pt-2">
                {resume.skills.slice(0, 3).map((s) => (
                  <span key={s} className="rounded-md bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] text-white/70">
                    {s}
                  </span>
                ))}
                {resume.skills.length > 3 && (
                  <span className="text-[10px] text-white/40 self-center">+{resume.skills.length - 3} more</span>
                )}
              </div>
            </div>
          ) : (
            <p className="text-xs text-white/50">No resume analyzed yet.</p>
          )}
          <div className="border-t border-white/5 pt-4">
            <Link href="/resume/analysis" className="text-xs font-semibold text-white/60 hover:text-white flex items-center gap-1 transition">
              View Detailed Resume Analysis <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition" />
            </Link>
          </div>
        </div>

        {/* Readiness Score Card */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4 hover:border-white/20 transition relative group">
          <div className="flex justify-between items-start">
            <p className="text-xs uppercase tracking-wide text-white/50 font-bold">Placement Readiness</p>
            <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-400 border border-emerald-500/20">
              <Award className="h-4 w-4" />
            </div>
          </div>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-1/3" />
              <Skeleton className="h-2 w-full" />
            </div>
          ) : failures.resume ? (
            <div className="space-y-2">
              <p className="text-sm text-red-400">Readiness scoring unavailable.</p>
              <button onClick={() => retryWidget("resume")} className="text-xs text-white/60 hover:text-white underline flex items-center gap-1">
                <RefreshCw className="h-3 w-3" /> Retry Connection
              </button>
            </div>
          ) : resume ? (
            <div className="space-y-2">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-white font-mono">{resume.readinessScore}</span>
                <span className="text-xs text-white/40">/ 100</span>
              </div>
              <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
                <div 
                  className="h-full rounded-full bg-emerald-400 transition-all duration-500" 
                  style={{ width: `${resume.readinessScore}%` }} 
                />
              </div>
              <p className="text-[10px] text-white/50 leading-relaxed">
                Calibrated across tech stack experience & target placement metrics.
              </p>
            </div>
          ) : (
            <p className="text-xs text-white/50">Score pending upload.</p>
          )}
          <div className="border-t border-white/5 pt-4">
            <Link href="/analytics" className="text-xs font-semibold text-white/60 hover:text-white flex items-center gap-1 transition">
              Analyze Score Progression <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition" />
            </Link>
          </div>
        </div>

        {/* Mock Interviews Status Card */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4 hover:border-white/20 transition relative group">
          <div className="flex justify-between items-start">
            <p className="text-xs uppercase tracking-wide text-white/50 font-bold">Mock Practice</p>
            <div className="rounded-xl bg-blue-500/10 p-2 text-blue-400 border border-blue-500/20">
              <MessageSquare className="h-4 w-4" />
            </div>
          </div>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-1/4" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ) : failures.analytics ? (
            <div className="space-y-2">
              <p className="text-sm text-red-400">History records offline.</p>
              <button onClick={() => retryWidget("analytics")} className="text-xs text-white/60 hover:text-white underline flex items-center gap-1">
                <RefreshCw className="h-3 w-3" /> Retry Connection
              </button>
            </div>
          ) : analytics ? (
            <div className="space-y-1.5">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-white font-mono">{analytics.total_sessions}</span>
                <span className="text-xs text-white/40">rounds completed</span>
              </div>
              <p className="text-xs text-white/70">
                {analytics.total_sessions > 0 ? (
                  <>Average Score: <strong className="text-white font-mono">{analytics.average_score}%</strong></>
                ) : (
                  "Practice coding & answer evaluation drills."
                )}
              </p>
              <p className="text-[10px] text-white/50">
                {analytics.best_topic ? `Strongest in ${analytics.best_topic}` : "Start mock sessions to log history."}
              </p>
            </div>
          ) : (
            <p className="text-xs text-white/50">No sessions recorded.</p>
          )}
          <div className="border-t border-white/5 pt-4">
            <Link href="/interviews" className="text-xs font-semibold text-white/60 hover:text-white flex items-center gap-1 transition">
              Take AI Mock Interview <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition" />
            </Link>
          </div>
        </div>
      </div>

      {/* Main Grid split: Roadmap and Skill Gap components */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Study Roadmap Summary */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Map className="h-5 w-5 text-white/60" />
                Active Study Roadmap
              </h3>
              <p className="text-xs text-white/50">Your customized weekly curriculum focus.</p>
            </div>
            <Button size="xs" variant="outline" className="border-white/10 text-white hover:bg-white/5" asChild>
              <Link href="/roadmaps">Full Roadmap</Link>
            </Button>
          </div>

          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ) : failures.roadmap ? (
            <div className="space-y-3 p-4 border border-white/5 rounded-2xl bg-black/20 text-center">
              <p className="text-sm text-red-400">Failed to fetch placement study roadmap.</p>
              <Button size="sm" onClick={() => retryWidget("roadmap")} className="bg-white/10 border border-white/10 text-white hover:bg-white/20 mt-2">
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Retry
              </Button>
            </div>
          ) : roadmap ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-black/40 p-4 space-y-2">
                <div className="flex justify-between items-center text-xs font-semibold text-white/80">
                  <span className="text-blue-400">Goal:</span>
                  <span className="text-white/55 font-mono">{roadmap.duration_weeks} Weeks</span>
                </div>
                <p className="text-sm text-white/90 leading-relaxed font-medium">
                  {roadmap.overall_goal}
                </p>
              </div>

              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-white/40 uppercase tracking-wider">Top Priority Subject Areas</h4>
                <div className="flex flex-wrap gap-2">
                  {roadmap.priority_topics.map((topic) => (
                    <span 
                      key={topic}
                      className="rounded-xl border border-blue-500/10 bg-blue-500/[0.03] px-3 py-1.5 text-xs text-blue-300 font-semibold"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>

              {roadmap.weekly_plan.length > 0 && (
                <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-4 flex gap-4 items-center">
                  <div className="rounded-xl bg-blue-500/10 p-2.5 text-blue-400 border border-blue-500/20 shrink-0">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div className="space-y-0.5">
                    <h5 className="text-xs font-bold text-white/80">Week 1 Kickoff Module</h5>
                    <p className="text-xs text-white/60 truncate max-w-[280px] md:max-w-[340px]">
                      {roadmap.weekly_plan[0].title}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-white/40 italic text-sm">
              No study plan generated yet.
            </div>
          )}
        </div>

        {/* Skill Gap Analysis Summary */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-white/60" />
                Technical Gaps & Strengths
              </h3>
              <p className="text-xs text-white/50">Real-time weaknesses flagged during drills.</p>
            </div>
            <Button size="xs" variant="outline" className="border-white/10 text-white hover:bg-white/5" asChild>
              <Link href="/weakness">Full Gaps Report</Link>
            </Button>
          </div>

          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ) : failures.weakness ? (
            <div className="space-y-3 p-4 border border-white/5 rounded-2xl bg-black/20 text-center">
              <p className="text-sm text-red-400">Failed to fetch skill gap analysis data.</p>
              <Button size="sm" onClick={() => retryWidget("weakness")} className="bg-white/10 border border-white/10 text-white hover:bg-white/20 mt-2">
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Retry
              </Button>
            </div>
          ) : weakness ? (
            <div className="space-y-4">
              {/* Strengths */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
                  <ShieldCheck className="h-4 w-4" /> Strong Competencies
                </h4>
                {weakness.strong_topics.length === 0 ? (
                  <p className="text-xs text-white/40 italic">Take interviews to build strength profile.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {weakness.strong_topics.slice(0, 4).map((item) => (
                      <div key={item.topic} className="rounded-xl border border-emerald-500/10 bg-emerald-500/[0.02] p-2 text-xs truncate text-emerald-300 font-medium">
                        {item.topic} ({item.average_score}%)
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Weaknesses */}
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-bold text-red-400 flex items-center gap-1.5 uppercase tracking-wider">
                  <AlertTriangle className="h-4 w-4" /> Priority Areas to Study
                </h4>
                {weakness.weak_topics.length === 0 ? (
                  <p className="text-xs text-emerald-400/80 font-medium flex items-center gap-1 bg-emerald-500/5 p-3 rounded-2xl border border-emerald-500/10">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    No critical weaknesses detected yet. Great job!
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {weakness.weak_topics.slice(0, 4).map((item) => (
                      <div key={item.topic} className="rounded-xl border border-red-500/10 bg-red-500/[0.02] p-2 text-xs truncate text-red-300 font-medium">
                        {item.topic} ({item.average_score}%)
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-white/40 italic text-sm">
              No technical gap data logged.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
