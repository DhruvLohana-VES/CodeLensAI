import React from "react";
import { CheckCircle2, Circle, ArrowRight } from "lucide-react";
import { WeeklyPlan } from "@/services/roadmap";

interface ProgressTimelineProps {
  weeklyPlan: WeeklyPlan[];
  completedWeeks: number[];
  activeWeek: number;
  onSelectWeek: (weekNum: number) => void;
}

export function ProgressTimeline({
  weeklyPlan,
  completedWeeks,
  activeWeek,
  onSelectWeek,
}: ProgressTimelineProps) {
  const totalWeeks = weeklyPlan.length || 4;
  const progressPercent = Math.round((completedWeeks.length / totalWeeks) * 100);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-6 relative overflow-hidden group hover:border-white/20 transition h-fit">
      {/* Overall Progress */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs">
          <span className="uppercase text-white/50 font-bold tracking-wider">Overall Progress</span>
          <span className="font-mono font-bold text-white bg-white/10 px-2 py-0.5 rounded">
            {progressPercent}%
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Vertical Steps */}
      <div className="relative pl-1 pr-1 space-y-5">
        {weeklyPlan.map((plan, index) => {
          const wNum = plan.week;
          const isCompleted = completedWeeks.includes(wNum);
          const isActive = activeWeek === wNum;
          const isLast = index === weeklyPlan.length - 1;

          return (
            <div key={wNum} className="relative flex gap-4 group/step">
              {/* Connector Line */}
              {!isLast && (
                <div
                  className={`absolute left-[9px] top-[22px] w-[2px] h-[calc(100%+20px)] transition-all duration-300 ${
                    isCompleted ? "bg-emerald-500/50" : "bg-white/10"
                  }`}
                />
              )}

              {/* Status Circle */}
              <button
                onClick={() => onSelectWeek(wNum)}
                className="relative z-10 flex h-5 w-5 items-center justify-center rounded-full shrink-0 cursor-pointer outline-none focus:ring-1 focus:ring-white/30"
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 bg-black rounded-full" />
                ) : isActive ? (
                  <div className="h-5 w-5 rounded-full border border-blue-400 bg-blue-400/20 flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
                  </div>
                ) : (
                  <Circle className="h-5 w-5 text-white/20 hover:text-white/40 bg-black rounded-full" />
                )}
              </button>

              {/* Text Description */}
              <button
                onClick={() => onSelectWeek(wNum)}
                className="flex-1 text-left cursor-pointer group-hover/step:translate-x-0.5 transition outline-none"
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-xs font-semibold font-mono ${
                      isCompleted
                        ? "text-emerald-400"
                        : isActive
                        ? "text-blue-400"
                        : "text-white/40"
                    }`}
                  >
                    Week {wNum}
                  </span>
                  {isActive && (
                    <span className="text-[9px] uppercase tracking-wide bg-blue-500/10 text-blue-400 px-1 py-0.5 rounded font-bold">
                      Current
                    </span>
                  )}
                </div>
                <p
                  className={`text-xs font-bold leading-tight mt-0.5 truncate max-w-[200px] ${
                    isCompleted
                      ? "text-white/60 line-through decoration-white/20"
                      : isActive
                      ? "text-white"
                      : "text-white/45"
                  }`}
                >
                  {plan.title}
                </p>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
