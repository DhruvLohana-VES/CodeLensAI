import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Your placement readiness overview. Most sections are coming soon."
        action={
          <Button className="bg-white text-black hover:bg-white/90" asChild>
            <Link href="/resume/analysis">View Resume Analysis</Link>
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <p className="text-xs uppercase tracking-wide text-white/50">
            Latest Resume
          </p>
          <p className="mt-2 text-lg font-semibold text-white">Aarav Mehta</p>
          <p className="text-sm text-white/60">Analysis updated 2 hours ago</p>
          <div className="mt-4 h-2 rounded-full bg-white/10">
            <div className="h-full w-[78%] rounded-full bg-emerald-400" />
          </div>
          <p className="mt-2 text-xs text-white/50">Readiness score: 78%</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <p className="text-xs uppercase tracking-wide text-white/50">
            Upcoming Interviews
          </p>
          <p className="mt-3 text-sm text-white/70">Coming Soon</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <p className="text-xs uppercase tracking-wide text-white/50">
            Analytics
          </p>
          <p className="mt-3 text-sm text-white/70">Coming Soon</p>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
        <h2 className="text-lg font-semibold text-white">What happens next</h2>
        <p className="mt-2 text-sm text-white/60">
          When you connect FastAPI, this space will show interview readiness
          signals, targeted roadmaps, and recruiter-facing insights.
        </p>
      </div>
    </div>
  );
}
