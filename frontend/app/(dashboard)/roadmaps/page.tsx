"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { RefreshCw, AlertCircle, Sparkles, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getRoadmap, regenerateRoadmap, RoadmapResponse } from "@/services/roadmap";
import { RoadmapOverview } from "@/components/RoadmapOverview";
import { WeeklyPlanCard } from "@/components/WeeklyPlanCard";
import { ProgressTimeline } from "@/components/ProgressTimeline";
import { ResourceRecommendations } from "@/components/ResourceRecommendations";

export default function RoadmapsPage() {
  const [data, setData] = useState<RoadmapResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [regenerating, setRegenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [completedWeeks, setCompletedWeeks] = useState<number[]>([]);

  // Load completed weeks status on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("codelens_roadmap_completed_weeks");
      if (saved) {
        setCompletedWeeks(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Error loading completed weeks:", e);
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getRoadmap();
      if (res.success) {
        setData(res);
      } else {
        setError("Failed to fetch placement roadmap.");
      }
    } catch (e: any) {
      console.error("Error fetching roadmap:", e);
      setError(e.message || "Could not connect to the backend roadmap service.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      const res = await regenerateRoadmap();
      if (res.success) {
        setData(res);
        // Clear saved weekly progress to start fresh
        localStorage.removeItem("codelens_roadmap_completed_weeks");
        for (let w = 1; w <= 4; w++) {
          localStorage.removeItem(`codelens_roadmap_tasks_week_${w}`);
          localStorage.removeItem(`codelens_roadmap_obj_week_${w}`);
        }
        setCompletedWeeks([]);
      } else {
        alert("Failed to regenerate roadmap.");
      }
    } catch (e: any) {
      console.error("Error regenerating roadmap:", e);
      alert(e.message || "Failed to contact the backend service for regeneration.");
    } finally {
      setRegenerating(false);
    }
  };

  const handleToggleWeek = (weekNum: number) => {
    let updated = [...completedWeeks];
    if (updated.includes(weekNum)) {
      updated = updated.filter((w) => w !== weekNum);
    } else {
      updated.push(weekNum);
    }
    setCompletedWeeks(updated);
    localStorage.setItem("codelens_roadmap_completed_weeks", JSON.stringify(updated));
  };

  const handleSelectWeek = (weekNum: number) => {
    const el = document.getElementById(`week-card-${weekNum}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 pb-12">
        <PageHeader
          title="Placement Roadmap"
          description="A structured week-by-week study plan mapped directly to your mock interview history."
        />
        <div className="flex flex-col items-center justify-center py-32 space-y-4 text-white/40">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <p className="text-sm">Synthesizing study recommendations and compiling weekly plan...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8 pb-12">
        <PageHeader
          title="Placement Roadmap"
          description="A structured week-by-week study plan mapped directly to your mock interview history."
        />
        <div className="mx-auto max-w-md rounded-3xl border border-red-500/10 bg-red-500/[0.02] p-8 text-center space-y-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-400">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-white">Roadmap Sync Error</h2>
            <p className="text-sm text-white/60">{error}</p>
          </div>
          <div className="pt-2">
            <Button onClick={fetchData} className="bg-white text-black hover:bg-white/90">
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry Sync
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const activeWeek = [1, 2, 3, 4].find((w) => !completedWeeks.includes(w)) || 4;

  // Check if we are showing a fallback / default roadmap because no mock interviews exist
  const isDefaultRoadmap =
    data &&
    data.priority_topics.includes("Data Structures & Algorithms") &&
    data.priority_topics.includes("System Design") &&
    (data.priority_topics.includes("Operating Systems") || data.priority_topics.includes("Computer Networks"));

  return (
    <div className="space-y-8 pb-12 transition-all duration-300 animate-fade-up">
      <PageHeader
        title="Placement Roadmap"
        description="A structured week-by-week study plan mapped directly to your mock interview history."
        action={
          <Button 
            className="bg-white text-black hover:bg-white/90 flex items-center gap-1.5 no-print"
            onClick={() => window.print()}
          >
            <Printer className="h-4 w-4" />
            Export PDF
          </Button>
        }
      />

      {/* Info banner for empty mock history showing default roadmap */}
      {isDefaultRoadmap && (
        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 px-6 py-4 flex gap-4 items-center">
          <div className="rounded-xl bg-blue-500/10 p-2.5 text-blue-400 border border-blue-500/20 shrink-0">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">General Plan Active</h4>
            <p className="text-xs text-white/60 leading-relaxed">
              No interactive AI mock interviews found yet. We have compiled a generic technical core curriculum.
              Complete mock interviews in the <strong>Interviews</strong> tab to tailor this plan to your exact skill gaps.
            </p>
          </div>
        </div>
      )}

      {/* Roadmap Metrics overview */}
      {data && (
        <RoadmapOverview
          data={data}
          onRegenerate={handleRegenerate}
          regenerating={regenerating}
        />
      )}

      {/* Two Column Layout: Plan cards on left, Progress / checklist on right */}
      {data && (
        <div className="grid gap-8 lg:grid-cols-3 items-start">
          {/* Plan cards */}
          <div className="lg:col-span-2 space-y-6">
            {data.weekly_plan.map((plan) => (
              <div key={plan.week} id={`week-card-${plan.week}`}>
                <WeeklyPlanCard
                  plan={plan}
                  isActive={activeWeek === plan.week}
                  isWeekCompleted={completedWeeks.includes(plan.week)}
                  onToggleWeekCompleted={handleToggleWeek}
                />
              </div>
            ))}
          </div>

          {/* Progress timeline sidebar */}
          <div className="lg:sticky lg:top-6 space-y-6">
            <ProgressTimeline
              weeklyPlan={data.weekly_plan}
              completedWeeks={completedWeeks}
              activeWeek={activeWeek}
              onSelectWeek={handleSelectWeek}
            />
          </div>
        </div>
      )}

      {/* External Study Materials */}
      {data && <ResourceRecommendations priorityTopics={data.priority_topics} />}
    </div>
  );
}
