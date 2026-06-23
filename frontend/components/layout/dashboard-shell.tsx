import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/sidebar";

export function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col bg-black/40">
        <div className="flex-1 px-6 py-8 lg:px-10">{children}</div>
      </div>
    </div>
  );
}
