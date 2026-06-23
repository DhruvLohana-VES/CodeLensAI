import Link from "next/link";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="border-b border-white/10 bg-black/20 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-sm font-semibold">
            CL
          </div>
          <div>
            <p className="text-sm font-semibold text-white">CodeLens AI</p>
            <p className="text-xs text-white/60">Interview & Resume Intelligence</p>
          </div>
        </Link>
        <div className="hidden items-center gap-4 md:flex">
          <Link className="text-sm text-white/70 hover:text-white" href="/resume/analysis">
            Resume Analysis
          </Link>
          <Link className="text-sm text-white/70 hover:text-white" href="/dashboard">
            Dashboard
          </Link>
          <Button className="bg-white text-black hover:bg-white/90" asChild>
            <Link href="/resume/upload">Upload Resume</Link>
          </Button>
        </div>
        <Button
          className="md:hidden bg-white text-black hover:bg-white/90"
          asChild
        >
          <Link href="/resume/upload">Get Started</Link>
        </Button>
      </div>
    </header>
  );
}
