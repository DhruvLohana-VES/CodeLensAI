import Link from "next/link";
import {
  Brain,
  FileText,
  Map,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { FeatureCard } from "@/components/marketing/feature-card";
import { landingFeatures } from "@/constants/navigation";

const icons = [Sparkles, Brain, FileText, Map];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="relative flex-1 overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-40" />
        <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 py-16">
          <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-6 animate-fade-up">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs text-white/70">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                AI Interview & Resume Intelligence Platform
              </div>
              <h1 className="text-4xl font-semibold leading-tight text-white md:text-5xl">
                CodeLens AI helps students walk into placements prepared.
              </h1>
              <p className="max-w-xl text-base leading-relaxed text-white/70">
                Upload a resume and instantly see structured insights, skill gaps,
                and readiness signals. Built for career services, students, and
                recruiters who need clarity fast.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button className="bg-white text-black hover:bg-white/90" asChild>
                  <Link href="/resume/upload">Upload Resume</Link>
                </Button>
                <Button
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                  asChild
                >
                  <Link href="/resume/analysis">View Analysis Demo</Link>
                </Button>
              </div>
              <div className="flex items-center gap-6 text-xs text-white/50">
                <span>Built for placement readiness</span>
                <span>Dark mode by default</span>
                <span>FastAPI-ready UI</span>
              </div>
            </div>
            <div
              className="relative rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/40 animate-fade-up"
              style={{ animationDelay: "140ms" }}
            >
              <div className="space-y-6">
                <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
                  <p className="text-xs uppercase tracking-wide text-white/50">
                    Resume Intelligence Snapshot
                  </p>
                  <div className="mt-4 grid gap-4">
                    <div className="flex items-center justify-between text-sm text-white">
                      <span>Parsing accuracy</span>
                      <span className="font-semibold">98%</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/10">
                      <div className="h-full w-[88%] rounded-full bg-emerald-400" />
                    </div>
                    <div className="flex items-center justify-between text-sm text-white">
                      <span>Readiness score</span>
                      <span className="font-semibold">78 / 100</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs text-white/60">
                      <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                        Strengths: UI Engineering
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                        Gaps: System Design
                      </div>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 via-transparent to-white/5 p-5">
                  <p className="text-sm text-white/70">
                    Upcoming: AI interview drills tailored to weak topics.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">
                What CodeLens AI delivers
              </h2>
              <Link className="text-sm text-white/60" href="/dashboard">
                Explore dashboard
              </Link>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {landingFeatures.map((feature, index) => {
                const Icon = icons[index];
                return (
                  <FeatureCard
                    key={feature.title}
                    title={feature.title}
                    description={feature.description}
                    icon={<Icon className="h-5 w-5" />}
                  />
                );
              })}
            </div>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
