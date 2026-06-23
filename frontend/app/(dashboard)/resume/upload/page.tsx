import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { UploadCard } from "@/components/resume/upload-card";

export default function ResumeUploadPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Resume Upload"
        description="Upload a PDF resume to generate a structured analysis summary."
        action={
          <Button
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
            asChild
          >
            <Link href="/resume/analysis">View demo analysis</Link>
          </Button>
        }
      />
      <UploadCard />
    </div>
  );
}
