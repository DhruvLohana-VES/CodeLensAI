"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { AnalysisCard } from "@/components/resume/analysis-card";
import { TagPill } from "@/components/resume/tag-pill";
import { getResumeAnalysis } from "@/services/resume";
import type { ResumeAnalysis } from "@/types/resume";

export default function ResumeAnalysisPage() {
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalysis() {
      try {
        const data = await getResumeAnalysis();
        setAnalysis(data);
      } catch (err) {
        console.error("Failed to load resume analysis:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalysis();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-400" />
        <p className="text-sm text-white/60">Fetching resume intelligence report...</p>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="space-y-8">
        <PageHeader
          title="Resume Analysis"
          description="Insights preview and placement readiness indicators."
          action={
            <Button className="bg-white text-black hover:bg-white/90" asChild>
              <Link href="/resume/upload">Upload new resume</Link>
            </Button>
          }
        />
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center text-white/60">
          No analysis data found. Please try uploading a resume first.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Resume Analysis"
        description="Insights preview and placement readiness indicators."
        action={
          <Button className="bg-white text-black hover:bg-white/90" asChild>
            <Link href="/resume/upload">Upload new resume</Link>
          </Button>
        }
      />

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <p className="text-xs uppercase tracking-wide text-white/50">
            Candidate
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            {analysis.candidateName}
          </h2>
          <p className="text-sm text-white/60">{analysis.role}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {analysis.skills.map((skill) => (
              <TagPill key={skill}>{skill}</TagPill>
            ))}
          </div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-transparent to-white/5 p-6">
          <p className="text-xs uppercase tracking-wide text-white/50">
            Placement Readiness
          </p>
          <div className="mt-4 flex items-end gap-3">
            <span className="text-4xl font-semibold text-white">
              {analysis.readinessScore}
            </span>
            <span className="text-sm text-white/60">/ 100</span>
          </div>
          <div className="mt-4 h-2 rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-emerald-400"
              style={{ width: `${analysis.readinessScore}%` }}
            />
          </div>
          <p className="mt-3 text-sm text-white/60">
            Strong placement readiness with room for deeper systems exposure.
          </p>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <AnalysisCard title={analysis.experience.title || "Experience"}>
          <ul className="space-y-2">
            {analysis.experience.items.map((item) => (
              <li key={item} className="text-sm text-white/70">
                {item}
              </li>
            ))}
          </ul>
        </AnalysisCard>
        <AnalysisCard title={analysis.projects.title}>
          <ul className="space-y-2">
            {analysis.projects.items.map((item) => (
              <li key={item} className="text-sm text-white/70">
                {item}
              </li>
            ))}
          </ul>
        </AnalysisCard>
        <AnalysisCard title={analysis.education.title}>
          <ul className="space-y-2">
            {analysis.education.items.map((item) => (
              <li key={item} className="text-sm text-white/70">
                {item}
              </li>
            ))}
          </ul>
        </AnalysisCard>
        <AnalysisCard title={analysis.achievements.title}>
          <ul className="space-y-2">
            {analysis.achievements.items.map((item) => (
              <li key={item} className="text-sm text-white/70">
                {item}
              </li>
            ))}
          </ul>
        </AnalysisCard>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <AnalysisCard title="Strength Areas">
          <div className="space-y-2">
            {analysis.strengths.map((item) => (
              <div key={item} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" />
                <span className="text-sm text-white/70">{item}</span>
              </div>
            ))}
          </div>
        </AnalysisCard>
        <AnalysisCard title="Weak Areas">
          <div className="space-y-2">
            {analysis.weaknesses.map((item) => (
              <div key={item} className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-300" />
                <span className="text-sm text-white/70">{item}</span>
              </div>
            ))}
          </div>
        </AnalysisCard>
      </section>
    </div>
  );
}
