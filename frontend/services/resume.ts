import { mockResumeAnalysis } from "@/constants/mock-data";
import type { ResumeAnalysis } from "@/types/resume";

export async function getResumeAnalysis(): Promise<ResumeAnalysis> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  try {
    const res = await fetch(`${apiUrl}/api/v1/resume/latest`, {
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      if (data.analysis) {
        return data.analysis;
      }
    }
  } catch (e) {
    console.error("Backend fetch failed, falling back to local storage / mock:", e);
  }

  // Fallback to localStorage (client-side context)
  if (typeof window !== "undefined") {
    const localData = localStorage.getItem("current_resume_analysis");
    if (localData) {
      try {
        return JSON.parse(localData);
      } catch (e) {}
    }
  }

  return mockResumeAnalysis;
}

