export interface CodeExecutionResponse {
  success: boolean;
  output: string;
  error: string;
}

export interface CodeFeedbackResponse {
  feedback: string;
  timeComplexity: string;
  spaceComplexity: string;
  refactoredCode?: string;
}

export async function executeCode(code: string, language: string): Promise<CodeExecutionResponse> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const res = await fetch(`${apiUrl}/api/v1/code/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, language }),
  });
  if (!res.ok) {
    throw new Error(`Failed to execute code: ${res.status}`);
  }
  return res.json();
}

export async function getCodeFeedback(code: string, problemName: string): Promise<CodeFeedbackResponse> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const res = await fetch(`${apiUrl}/api/v1/code/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, problem_name: problemName }),
  });
  if (!res.ok) {
    throw new Error(`Failed to get code feedback: ${res.status}`);
  }
  return res.json();
}
