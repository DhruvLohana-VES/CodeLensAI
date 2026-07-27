"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { dashboardNav } from "@/constants/navigation";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-72 flex-col border-r border-white/10 bg-black/70 px-6 py-8 lg:flex">
      <Link href="/" className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-sm font-semibold">
          CL
        </div>
        <div>
          <p className="text-sm font-semibold text-white">CodeLens AI</p>
          <p className="text-xs text-white/60">Dashboard</p>
        </div>
      </Link>
      <div className="mt-8 space-y-2">
        {dashboardNav.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.title}
              href={item.href}
              className={cn(
                "flex items-center justify-between rounded-xl px-3 py-2 text-sm text-white/70 transition",
                active && "bg-white/10 text-white",
              )}
            >
              <span className="flex items-center gap-3">
                <item.icon className="h-4 w-4" />
                {item.title}
              </span>
              {item.status === "coming" && (
                <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-white/50">
                  Soon
                </span>
              )}
            </Link>
          );
        })}
      </div>
      <div className="mt-auto rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-white/60">
        CodeLens Core Services connected and operational.
      </div>
    </aside>
  );
}
