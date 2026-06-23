import { ComingSoon } from "@/components/dashboard/coming-soon";
import { PageHeader } from "@/components/layout/page-header";

export default function RoadmapsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Roadmaps"
        description="Personalized study plans built from resume insights."
      />
      <ComingSoon
        title="Roadmaps"
        message="Roadmap generation will be unlocked in a future release."
      />
    </div>
  );
}
