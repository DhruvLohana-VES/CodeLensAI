export interface WeeklyPlan {
  week: number;
  title: string;
  difficulty: string;
  estimated_hours: number;
  topics: string[];
  learning_objectives: string[];
  practice_tasks: string[];
  mock_goal: string;
  completed: boolean;
}

export interface RoadmapResponse {
  success: boolean;
  duration_weeks: number;
  overall_goal: string;
  estimated_hours: number;
  priority_topics: string[];
  weekly_plan: WeeklyPlan[];
  success_metrics: string[];
  generated_at: string;
}

export async function getRoadmap(): Promise<RoadmapResponse> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const res = await fetch(`${apiUrl}/api/v1/roadmap`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch roadmap: ${res.status}`);
  }
  return res.json();
}

export async function regenerateRoadmap(): Promise<RoadmapResponse> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const res = await fetch(`${apiUrl}/api/v1/roadmap/regenerate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    throw new Error(`Failed to regenerate roadmap: ${res.status}`);
  }
  return res.json();
}
