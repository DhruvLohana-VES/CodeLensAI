import { ComingSoon } from "@/components/dashboard/coming-soon";
import { PageHeader } from "@/components/layout/page-header";

export default function AnalyticsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Analytics"
        description="Track readiness trends across cohorts and roles."
      />
      <ComingSoon
        title="Analytics"
        message="Insights dashboards will arrive after resume parsing is live."
      />
    </div>
  );
}
