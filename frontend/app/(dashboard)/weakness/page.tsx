"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { RefreshCw, AlertCircle, ArrowRight, MessageSquareCode, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getWeaknessAnalysis, WeaknessAnalysisResponse } from "@/services/weakness";
import { WeaknessCard } from "@/components/weakness/WeaknessCard";
import { SkillGapChart } from "@/components/weakness/SkillGapChart";
import { RecommendationPanel } from "@/components/weakness/RecommendationPanel";

export default function WeaknessAnalysisPage() {
  const [data, setData] = useState<WeaknessAnalysisResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getWeaknessAnalysis();
      if (res.success) {
        setData(res);
      } else {
        setError("Failed to load weakness analysis.");
      }
    } catch (e: any) {
      console.error("Error loading weakness analysis:", e);
      setError(e.message || "Could not connect to the backend service.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 pb-12">
        <PageHeader
          title="Weakness Detection"
          description="Identify technical skill gaps and track placement preparation insights."
        />
        <div className="flex flex-col items-center justify-center py-32 space-y-4 text-white/40">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <p className="text-sm">Analyzing interview history and compiling skill gaps...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8 pb-12">
        <PageHeader
          title="Weakness Detection"
          description="Identify technical skill gaps and track placement preparation insights."
        />
        <div className="mx-auto max-w-md rounded-3xl border border-red-500/10 bg-red-500/[0.02] p-8 text-center space-y-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-400">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-white">Analysis Sync Error</h2>
            <p className="text-sm text-white/60">
              {error}
            </p>
          </div>
          <div className="pt-2">
            <Button onClick={fetchData} className="bg-white text-black hover:bg-white/90">
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry Analysis
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Handle empty state when no interviews have been completed
  const hasNoData = !data || (
    data.strong_topics.length === 0 && 
    data.moderate_topics.length === 0 && 
    data.weak_topics.length === 0
  );

  if (hasNoData) {
    return (
      <div className="space-y-8 pb-12">
        <PageHeader
          title="Weakness Detection"
          description="Identify technical skill gaps and track placement preparation insights."
        />
        <div className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-white/5 p-8 text-center space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-white">
            <MessageSquareCode className="h-7 w-7 text-white/70" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-white">No Interview History Found</h2>
            <p className="text-sm text-white/60">
              The Weakness Detection Engine audits topic trends across your completed interviews. Take at least one interactive AI mock interview to generate your performance map.
            </p>
          </div>
          <div className="pt-4">
            <Button className="bg-white text-black hover:bg-white/90" asChild>
              <Link href="/interviews">
                Start Mock Interview
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 transition-all duration-300">
      <PageHeader
        title="Weakness Detection"
        description="Identify technical skill gaps and track placement preparation insights."
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

      {/* Metrics Cards */}
      <WeaknessCard data={data!} />

      {/* Interactive Charts & Gap Analysis */}
      <SkillGapChart 
        strongTopics={data!.strong_topics} 
        moderateTopics={data!.moderate_topics} 
        weakTopics={data!.weak_topics} 
      />

      {/* AI Placement Prep Recommendations */}
      <RecommendationPanel recommendations={data!.recommendations} />
    </div>
  );
}
