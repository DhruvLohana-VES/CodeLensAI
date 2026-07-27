import React from "react";
import { Calendar, Clock, Target, RotateCw, CheckCircle2, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RoadmapResponse } from "@/services/roadmap";

interface RoadmapOverviewProps {
  data: RoadmapResponse;
  onRegenerate: () => void;
  regenerating: boolean;
}

export function RoadmapOverview({ data, onRegenerate, regenerating }: RoadmapOverviewProps) {
  const { overall_goal, duration_weeks, estimated_hours, priority_topics, success_metrics } = data;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Overall Stats Card */}
      <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/5 p-6 space-y-6 relative overflow-hidden group hover:border-white/20 transition">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wider text-white/50 font-bold">Preparation Goal</p>
            <h2 className="text-xl font-bold text-white md:text-2xl mt-1 leading-snug">
              {overall_goal}
            </h2>
          </div>
          <div className="rounded-xl bg-white/10 p-2.5 text-white border border-white/10 shrink-0">
            <Target className="h-5 w-5" />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-500/10 p-2 text-blue-400 border border-blue-500/20">
              <Calendar className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] uppercase text-white/40">Duration</p>
              <p className="text-sm font-semibold text-white font-mono">{duration_weeks} Weeks</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400 border border-emerald-500/20">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] uppercase text-white/40">Est. Effort</p>
              <p className="text-sm font-semibold text-white font-mono">{estimated_hours} Hours</p>
            </div>
          </div>
        </div>

        {/* Priority Topics */}
        <div className="space-y-2 pt-2 border-t border-white/10">
          <p className="text-xs uppercase tracking-wider text-white/50 font-bold">Priority Focus Areas (Weakest First)</p>
          <div className="flex flex-wrap gap-2">
            {priority_topics.map((topic, i) => (
              <span
                key={topic}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border ${
                  i === 0
                    ? "bg-red-500/10 text-red-400 border-red-500/20"
                    : i === 1
                    ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${
                  i === 0 ? "bg-red-400" : i === 1 ? "bg-amber-400" : "bg-blue-400"
                }`} />
                {topic}
              </span>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <Button
            onClick={onRegenerate}
            disabled={regenerating}
            className="bg-white text-black hover:bg-white/90 font-medium rounded-xl h-9 px-4 transition active:scale-[0.98]"
          >
            <RotateCw className={`mr-2 h-4 w-4 ${regenerating ? "animate-spin" : ""}`} />
            {regenerating ? "Regenerating Study Plan..." : "Regenerate Roadmap"}
          </Button>
        </div>
      </div>

      {/* Success Metrics Card */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4 relative overflow-hidden group hover:border-white/20 transition">
        <div className="flex justify-between items-center">
          <p className="text-xs uppercase tracking-wider text-white/50 font-bold">Success Metrics</p>
          <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-400 border border-emerald-500/20 shrink-0">
            <Award className="h-4 w-4" />
          </div>
        </div>

        <div className="space-y-3 mt-2">
          {success_metrics.map((metric, i) => (
            <div key={i} className="flex items-start gap-3 text-xs leading-relaxed text-white/70">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{metric}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
