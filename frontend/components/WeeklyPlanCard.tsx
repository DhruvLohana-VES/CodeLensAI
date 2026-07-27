import React, { useState, useEffect } from "react";
import { CheckCircle2, Circle, GraduationCap, Laptop, Sparkles, Trophy } from "lucide-react";
import { WeeklyPlan } from "@/services/roadmap";

interface WeeklyPlanCardProps {
  plan: WeeklyPlan;
  isActive: boolean;
  onToggleWeekCompleted: (weekNum: number) => void;
  isWeekCompleted: boolean;
}

export function WeeklyPlanCard({
  plan,
  isActive,
  onToggleWeekCompleted,
  isWeekCompleted,
}: WeeklyPlanCardProps) {
  const { week, title, difficulty, estimated_hours, topics, learning_objectives, practice_tasks, mock_goal } = plan;

  // Local storage keys for tasks and objectives checklists
  const taskStorageKey = `codelens_roadmap_tasks_week_${week}`;
  const objStorageKey = `codelens_roadmap_obj_week_${week}`;

  const [checkedTasks, setCheckedTasks] = useState<boolean[]>([]);
  const [checkedObjs, setCheckedObjs] = useState<boolean[]>([]);

  // Initialize checklists state from localStorage or default to false
  useEffect(() => {
    try {
      const savedTasks = localStorage.getItem(taskStorageKey);
      if (savedTasks) {
        setCheckedTasks(JSON.parse(savedTasks));
      } else {
        setCheckedTasks(new Array(practice_tasks.length).fill(false));
      }

      const savedObjs = localStorage.getItem(objStorageKey);
      if (savedObjs) {
        setCheckedObjs(JSON.parse(savedObjs));
      } else {
        setCheckedObjs(new Array(learning_objectives.length).fill(false));
      }
    } catch (e) {
      setCheckedTasks(new Array(practice_tasks.length).fill(false));
      setCheckedObjs(new Array(learning_objectives.length).fill(false));
    }
  }, [practice_tasks.length, learning_objectives.length, taskStorageKey, objStorageKey]);

  const toggleTask = (index: number) => {
    const updated = [...checkedTasks];
    updated[index] = !updated[index];
    setCheckedTasks(updated);
    localStorage.setItem(taskStorageKey, JSON.stringify(updated));
  };

  const toggleObj = (index: number) => {
    const updated = [...checkedObjs];
    updated[index] = !updated[index];
    setCheckedObjs(updated);
    localStorage.setItem(objStorageKey, JSON.stringify(updated));
  };

  // Difficulty styling helper
  const getDifficultyStyles = (diff: string) => {
    const d = diff.toLowerCase();
    if (d === "easy") {
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    } else if (d === "hard") {
      return "bg-red-500/10 text-red-400 border-red-500/20";
    }
    return "bg-amber-500/10 text-amber-400 border-amber-500/20";
  };

  return (
    <div
      className={`rounded-2xl border transition duration-300 overflow-hidden relative ${
        isWeekCompleted
          ? "border-emerald-500/30 bg-emerald-500/[0.02]"
          : isActive
          ? "border-white/20 bg-white/5 ring-1 ring-white/10"
          : "border-white/10 bg-white/[0.02] hover:border-white/15"
      } ${!isActive && !isWeekCompleted ? "opacity-75" : ""}`}
    >
      {/* Top Banner indicating status */}
      {isWeekCompleted && (
        <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-6 py-2 flex items-center gap-2 text-xs font-semibold text-emerald-400">
          <CheckCircle2 className="h-4 w-4" />
          <span>Week Completed</span>
        </div>
      )}

      <div className="p-6 space-y-6">
        {/* Header Section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-white/40 font-mono">
              Week {week} of 4
            </span>
            <h3 className="text-lg font-bold text-white leading-snug">{title}</h3>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <span className={`rounded-lg border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${getDifficultyStyles(difficulty)}`}>
              {difficulty}
            </span>
            <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs font-mono text-white/60">
              {estimated_hours} Hours
            </span>
          </div>
        </div>

        {/* Topics List */}
        <div className="flex flex-wrap gap-1.5">
          {topics.map((topic) => (
            <span
              key={topic}
              className="rounded-md border border-white/5 bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-white/50"
            >
              {topic}
            </span>
          ))}
        </div>

        {/* Content Columns */}
        <div className="grid gap-6 md:grid-cols-2 pt-2">
          {/* Learning Objectives Column */}
          <div className="space-y-3">
            <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/60">
              <GraduationCap className="h-4 w-4 text-blue-400" />
              Learning Objectives
            </h4>
            <div className="space-y-2">
              {learning_objectives.map((objective, i) => {
                const checked = checkedObjs[i] || false;
                return (
                  <button
                    key={i}
                    onClick={() => toggleObj(i)}
                    className="flex items-start gap-2.5 w-full text-left text-xs leading-relaxed text-white/80 group py-0.5 transition cursor-pointer"
                  >
                    {checked ? (
                      <CheckCircle2 className="h-4 w-4 text-blue-400 shrink-0 mt-0.5 transition scale-110" />
                    ) : (
                      <Circle className="h-4 w-4 text-white/30 group-hover:text-white/50 shrink-0 mt-0.5 transition" />
                    )}
                    <span className={checked ? "line-through text-white/40" : ""}>
                      {objective}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Practice Tasks Column */}
          <div className="space-y-3">
            <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/60">
              <Laptop className="h-4 w-4 text-purple-400" />
              Practice & Tasks
            </h4>
            <div className="space-y-2">
              {practice_tasks.map((task, i) => {
                const checked = checkedTasks[i] || false;
                return (
                  <button
                    key={i}
                    onClick={() => toggleTask(i)}
                    className="flex items-start gap-2.5 w-full text-left text-xs leading-relaxed text-white/80 group py-0.5 transition cursor-pointer"
                  >
                    {checked ? (
                      <CheckCircle2 className="h-4 w-4 text-purple-400 shrink-0 mt-0.5 transition scale-110" />
                    ) : (
                      <Circle className="h-4 w-4 text-white/30 group-hover:text-white/50 shrink-0 mt-0.5 transition" />
                    )}
                    <span className={checked ? "line-through text-white/40" : ""}>
                      {task}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Mock Checkpoint */}
        <div className="rounded-xl border border-white/5 bg-white/5 p-4 flex gap-3.5 items-start mt-2">
          <div className="rounded-lg bg-amber-500/10 p-2 text-amber-400 border border-amber-500/20 shrink-0">
            <Trophy className="h-4 w-4" />
          </div>
          <div className="space-y-1">
            <h5 className="text-xs font-bold uppercase text-amber-400 flex items-center gap-1.5">
              Mock Interview Checkpoint
              <Sparkles className="h-3 w-3 animate-pulse" />
            </h5>
            <p className="text-xs text-white/70 leading-relaxed">
              {mock_goal}
            </p>
          </div>
        </div>

        {/* Complete Week Toggle */}
        <div className="pt-2 border-t border-white/5 flex justify-end">
          <button
            onClick={() => onToggleWeekCompleted(week)}
            className={`flex items-center justify-center gap-2 rounded-xl text-xs font-semibold px-4 py-2 border transition cursor-pointer active:scale-95 ${
              isWeekCompleted
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                : "bg-white/5 text-white/80 border-white/10 hover:bg-white/10 hover:text-white"
            }`}
          >
            {isWeekCompleted ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Completed
              </>
            ) : (
              "Mark Week as Complete"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
