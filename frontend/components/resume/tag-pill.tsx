import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function TagPill({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: "default" | "strong" | "weak";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs",
        tone === "default" && "border-white/10 bg-white/5 text-white/70",
        tone === "strong" && "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
        tone === "weak" && "border-amber-500/30 bg-amber-500/10 text-amber-100",
      )}
    >
      {children}
    </span>
  );
}
