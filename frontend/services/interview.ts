export interface InterviewStartResponse {
  session_id: string;
  role: string;
  question: string;
  question_index: number;
  total_questions: number;
  is_complete: boolean;
}

export interface AnswerSubmissionResponse {
  feedback: string;
  score: number;
  next_question?: string;
  question_index: number;
  is_complete: boolean;
  overall_score?: number;
}

export interface InterviewHistoryItem {
  id: string;
  mode: string;
  overall_score: number;
  created_at: string;
}

export interface PaginationMetadata {
  page: number;
  limit: number;
  total: number;
}

export interface InterviewHistoryResponse {
  success: boolean;
  interviews: InterviewHistoryItem[];
  pagination: PaginationMetadata;
}

export interface InterviewDetailQuestionItem {
  id: number;
  question: string;
  answer?: string;
  score?: number;
  feedback?: string;
  topic?: string;
  created_at?: string;
}

export interface InterviewDetailSession {
  id: string;
  mode: string;
  overall_score: number;
  created_at: string;
}

export interface InterviewDetailsResponse {
  success: boolean;
  interview: InterviewDetailSession;
  questions: InterviewDetailQuestionItem[];
}

export interface PerformanceTrendItem {
  interview: number;
  score: number;
}

export interface AnalyticsResponse {
  success: boolean;
  average_score: number;
  total_sessions: number;
  best_topic?: string;
  weakest_topic?: string;
  strong_topics: string[];
  weak_topics: string[];
  performance_trend: PerformanceTrendItem[];
  topic_scores: Record<string, number>;
}

export async function startInterview(role: string): Promise<InterviewStartResponse> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const res = await fetch(`${apiUrl}/api/v1/interview/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role }),
  });
  if (!res.ok) {
    throw new Error(`Failed to start interview: ${res.status}`);
  }
  return res.json();
}

export async function submitAnswer(sessionId: string, answer: string): Promise<AnswerSubmissionResponse> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const res = await fetch(`${apiUrl}/api/v1/interview/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id: sessionId, answer }),
  });
  if (!res.ok) {
    throw new Error(`Failed to submit answer: ${res.status}`);
  }
  return res.json();
}

export async function getInterviewHistory(page: number = 1, limit: number = 10): Promise<InterviewHistoryResponse> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const res = await fetch(`${apiUrl}/api/v1/interviews/history?page=${page}&limit=${limit}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch history: ${res.status}`);
  }
  return res.json();
}

export async function getInterviewDetails(id: string): Promise<InterviewDetailsResponse> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const res = await fetch(`${apiUrl}/api/v1/interviews/${id}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch details: ${res.status}`);
  }
  return res.json();
}

export async function getAnalytics(): Promise<AnalyticsResponse> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const res = await fetch(`${apiUrl}/api/v1/analytics`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch analytics: ${res.status}`);
  }
  return res.json();
}
