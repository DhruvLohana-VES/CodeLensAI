import type { ReactNode } from "react";

export function AnalysisCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-white/70">
        {title}
      </h3>
      <div className="mt-4 space-y-3 text-sm text-white/80">{children}</div>
    </div>
  );
}
