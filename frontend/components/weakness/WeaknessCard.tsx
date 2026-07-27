import React from "react";
import { Award, BookOpen, AlertTriangle, ShieldCheck, Activity, Target } from "lucide-react";
import { WeaknessAnalysisResponse } from "@/services/weakness";

interface WeaknessCardProps {
  data: WeaknessAnalysisResponse;
}

export function WeaknessCard({ data }: WeaknessCardProps) {
  const { overall_score, strong_topics, moderate_topics, weak_topics, metadata } = data;

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {/* Overall Score Card */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-2 relative overflow-hidden group hover:border-white/20 transition">
        <div className="flex justify-between items-start">
          <p className="text-xs uppercase tracking-wider text-white/50 font-bold">Readiness Score</p>
          <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-400 border border-emerald-500/20">
            <Award className="h-4 w-4" />
          </div>
        </div>
        <div className="space-y-0.5">
          <h3 className="text-3xl font-black text-white font-mono">{overall_score}%</h3>
          <p className="text-xs text-white/40">Aggregated mock evaluation score.</p>
        </div>
      </div>

      {/* Topics Summary */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-2 relative overflow-hidden group hover:border-white/20 transition">
        <div className="flex justify-between items-start">
          <p className="text-xs uppercase tracking-wider text-white/50 font-bold">Scope of Analysis</p>
          <div className="rounded-xl bg-blue-500/10 p-2 text-blue-400 border border-blue-500/20">
            <BookOpen className="h-4 w-4" />
          </div>
        </div>
        <div className="space-y-0.5">
          <h3 className="text-3xl font-black text-white font-mono">{metadata.total_topics}</h3>
          <p className="text-xs text-white/40">{metadata.total_questions} total responses graded.</p>
        </div>
      </div>

      {/* Strongest Topic Card */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-2 relative overflow-hidden group hover:border-white/20 transition">
        <div className="flex justify-between items-start">
          <p className="text-xs uppercase tracking-wider text-white/50 font-bold">Strongest Topic</p>
          <div className="rounded-xl bg-amber-500/10 p-2 text-amber-400 border border-amber-500/20">
            <ShieldCheck className="h-4 w-4" />
          </div>
        </div>
        <div className="space-y-0.5">
          <h3 className="text-xl font-bold text-white truncate pt-1">
            {metadata.strongest_topic || "None"}
          </h3>
          <p className="text-xs text-white/40">
            {strong_topics.length > 0 
              ? `Category average: ${strong_topics[0].average_score}%`
              : "No strong topic logged yet."}
          </p>
        </div>
      </div>

      {/* Weakest Topic Card */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-2 relative overflow-hidden group hover:border-white/20 transition">
        <div className="flex justify-between items-start">
          <p className="text-xs uppercase tracking-wider text-white/50 font-bold">Weakest Topic</p>
          <div className="rounded-xl bg-red-500/10 p-2 text-red-400 border border-red-500/20">
            <AlertTriangle className="h-4 w-4" />
          </div>
        </div>
        <div className="space-y-0.5">
          <h3 className="text-xl font-bold text-white truncate pt-1">
            {metadata.weakest_topic || "None"}
          </h3>
          <p className="text-xs text-white/40">
            {weak_topics.length > 0 
              ? `Category average: ${weak_topics[weak_topics.length - 1].average_score}%` 
              : "No critical weaknesses found."}
          </p>
        </div>
      </div>
    </div>
  );
}
