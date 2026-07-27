export interface TopicDetails {
  topic: string;
  average_score: number;
  highest_score: number;
  lowest_score: number;
  attempts: number;
  recent_trend: string;
  last_score: number | null;
  prev_score: number | null;
  improvement_percent: number | null;
}

export interface AnalysisMetadata {
  total_topics: number;
  total_questions: number;
  strongest_topic: string | null;
  weakest_topic: string | null;
  analysis_timestamp: string;
}

export interface WeaknessAnalysisResponse {
  success: boolean;
  overall_score: number;
  strong_topics: TopicDetails[];
  moderate_topics: TopicDetails[];
  weak_topics: TopicDetails[];
  recommendations: string[];
  metadata: AnalysisMetadata;
}

export async function getWeaknessAnalysis(): Promise<WeaknessAnalysisResponse> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const res = await fetch(`${apiUrl}/api/v1/weakness-analysis`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch weakness analysis: ${res.status}`);
  }
  return res.json();
}
