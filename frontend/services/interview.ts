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
