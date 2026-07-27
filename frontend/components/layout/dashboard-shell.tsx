"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { dashboardNav } from "@/constants/navigation";

export function DashboardShell({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Mobile Top Bar Header */}
      <header className="flex h-16 w-full items-center justify-between border-b border-white/10 bg-black/60 px-6 backdrop-blur lg:hidden">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-xs font-semibold">
            CL
          </div>
          <div>
            <p className="text-xs font-semibold text-white">CodeLens AI</p>
            <p className="text-[10px] text-white/60">Dashboard</p>
          </div>
        </Link>
        <button
          onClick={() => setIsOpen(true)}
          className="rounded-lg p-1.5 hover:bg-white/10 text-white transition focus:outline-none focus:ring-1 focus:ring-white/20"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* Mobile Drawer Slide Navigation */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Overlay Background */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu Drawer */}
          <aside className="relative flex w-80 max-w-[85vw] flex-col bg-black/95 border-r border-white/10 px-6 py-8 shadow-2xl animate-fade-in pointer-events-auto h-full overflow-y-auto">
            <div className="flex items-center justify-between mb-8">
              <Link href="/" className="flex items-center gap-3" onClick={() => setIsOpen(false)}>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-sm font-semibold">
                  CL
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">CodeLens AI</p>
                  <p className="text-xs text-white/60">Dashboard</p>
                </div>
              </Link>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1.5 hover:bg-white/10 text-white transition focus:outline-none focus:ring-1 focus:ring-white/20"
                aria-label="Close navigation menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="space-y-2">
              {dashboardNav.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.title}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "flex items-center justify-between rounded-xl px-3 py-2.5 text-sm text-white/70 transition hover:bg-white/5",
                      active && "bg-white/10 text-white hover:bg-white/10",
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <item.icon className="h-4.5 w-4.5" />
                      {item.title}
                    </span>
                    {item.status === "coming" && (
                      <span className="rounded-full border border-white/10 px-2 py-0.5 text-[9px] uppercase tracking-wide text-white/50">
                        Soon
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
            
            <div className="mt-auto pt-6 border-t border-white/5 rounded-2xl bg-white/5 p-4 text-xs text-white/60">
              CodeLens Core Engine v1.0 connected and healthy.
            </div>
          </aside>
        </div>
      )}

      {/* Desktop Sidebar (lg views) */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col bg-black/40 min-w-0">
        <main className="flex-1 px-4 py-6 md:px-6 md:py-8 lg:px-10">{children}</main>
      </div>
    </div>
  );
}
