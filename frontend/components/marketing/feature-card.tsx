import type { ReactNode } from "react";

export function FeatureCard({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 transition hover:border-white/20">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-white">
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-white/60">
        {description}
      </p>
    </div>
  );
}
