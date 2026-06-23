"use client";

import { useState } from "react";
import { MessageSquare, Play, Sparkles, RefreshCw, Send, CheckCircle2, ChevronRight, Award } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { startInterview as apiStartInterview, submitAnswer as apiSubmitAnswer } from "@/services/interview";

type SessionState = {
  sessionId: string;
  role: string;
  currentQuestion: string;
  questionIndex: number;
  totalQuestions: number;
  isComplete: boolean;
};

export default function InterviewsPage() {
  const [roleInput, setRoleInput] = useState<string>("Frontend");
  const [session, setSession] = useState<SessionState | null>(null);
  
  // Loading states
  const [isStarting, setIsStarting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Input answer
  const [answer, setAnswer] = useState<string>("");

  // Feedback from last question
  const [lastFeedback, setLastFeedback] = useState<{
    feedback: string;
    score: number;
    nextQuestion?: string;
  } | null>(null);

  // Overall results
  const [overallScore, setOverallScore] = useState<number | null>(null);

  const startInterview = async () => {
    setIsStarting(true);
    setLastFeedback(null);
    setOverallScore(null);
    setAnswer("");

    try {
      const data = await apiStartInterview(roleInput);
      setSession({
        sessionId: data.session_id,
        role: data.role,
        currentQuestion: data.question,
        questionIndex: data.question_index,
        totalQuestions: data.total_questions,
        isComplete: data.is_complete,
      });
    } catch (e) {
      alert("Error starting mock interview session. Please verify that the backend server is running.");
    } finally {
      setIsStarting(false);
    }
  };

  const submitAnswer = async () => {
    if (!session || !answer.trim()) return;

    setIsSubmitting(true);
    try {
      const data = await apiSubmitAnswer(session.sessionId, answer);
      setLastFeedback({
        feedback: data.feedback,
        score: data.score,
        nextQuestion: data.next_question,
      });
      
      // Update session state
      setSession((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          questionIndex: data.question_index,
          isComplete: data.is_complete,
          currentQuestion: data.next_question || prev.currentQuestion,
        };
      });

      if (data.is_complete && data.overall_score !== undefined) {
        setOverallScore(data.overall_score);
      }
      
      setAnswer("");
    } catch (e) {
      alert("Error submitting response. Please verify that the backend server is running.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadNextQuestion = () => {
    if (!lastFeedback || !session) return;
    setLastFeedback(null);
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="AI Placement Interviews"
        description="Simulate real-world placement rounds. Answer technical questions and receive adaptive scoring."
      />

      {!session ? (
        // Start Session Screen
        <div className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-white/5 p-8 text-center space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-white">
            <MessageSquare className="h-7 w-7" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-white">Select Target Interview Role</h2>
            <p className="text-sm text-white/60">
              Our AI interviewer will select a bank of questions calibrated to the chosen track.
            </p>
          </div>

          <div className="flex justify-center gap-4">
            {["Frontend", "Backend", "Full Stack"].map((role) => (
              <button
                key={role}
                onClick={() => setRoleInput(role)}
                className={`rounded-xl border px-5 py-3 text-sm font-medium transition-all ${
                  roleInput === role
                    ? "border-white bg-white/10 text-white"
                    : "border-white/10 bg-transparent text-white/60 hover:bg-white/5"
                }`}
              >
                {role}
              </button>
            ))}
          </div>

          <div className="pt-4">
            <Button
              className="w-full bg-white text-black hover:bg-white/90 sm:w-auto"
              onClick={startInterview}
              disabled={isStarting}
            >
              {isStarting ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Generating Questions...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Start Mock Interview
                </>
              )}
            </Button>
          </div>
        </div>
      ) : (
        // Interview Session Active Screen
        <div className="mx-auto max-w-3xl space-y-6">
          {/* Progress Header */}
          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-6 py-4">
            <div className="text-sm text-white/60">
              Role: <span className="font-semibold text-white">{session.role}</span>
            </div>
            <div className="text-sm text-white/60">
              Question <span className="font-semibold text-white">{Math.min(session.questionIndex + 1, session.totalQuestions)}</span> of <span className="font-semibold text-white">{session.totalQuestions}</span>
            </div>
          </div>

          {!lastFeedback && !session.isComplete ? (
            // Answer Form Screen
            <div className="rounded-3xl border border-white/10 bg-white/5 p-8 space-y-6">
              <div className="space-y-3">
                <span className="text-xs uppercase tracking-wider text-amber-300 font-bold flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  AI Question
                </span>
                <h3 className="text-lg font-medium text-white leading-relaxed">
                  {session.currentQuestion}
                </h3>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-white/60 uppercase">Your Answer</label>
                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Elaborate your thoughts here. Mention components, logic flow, complexity details, or practical experiences..."
                  className="w-full h-44 rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-white focus:border-white focus:outline-none resize-none leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setSession(null)}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Quit Session
                </Button>
                <Button
                  onClick={submitAnswer}
                  disabled={isSubmitting || !answer.trim()}
                  className="bg-white text-black hover:bg-white/90 flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Evaluating...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Submit Answer
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : lastFeedback ? (
            // Feedback Screen
            <div className="space-y-6">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider text-emerald-300 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" />
                    AI Evaluation Details
                  </span>
                  <div className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-xs font-bold text-emerald-300">
                    Question Score: {lastFeedback.score} / 100
                  </div>
                </div>

                <div className="prose prose-invert text-sm text-white/80 whitespace-pre-wrap leading-relaxed border border-white/10 bg-black/20 p-5 rounded-2xl">
                  {lastFeedback.feedback}
                </div>

                <div className="flex justify-end">
                  {session.isComplete ? (
                    <Button
                      onClick={loadNextQuestion}
                      className="bg-white text-black hover:bg-white/90 flex items-center gap-1"
                    >
                      View Final Report
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      onClick={loadNextQuestion}
                      className="bg-white text-black hover:bg-white/90 flex items-center gap-1"
                    >
                      Next Question
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            // Final Completion Summary Screen
            <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center space-y-6 animate-fade-up">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                <Award className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white">Interview Complete!</h2>
                <p className="text-sm text-white/60">
                  Great job completing the mock round. Here is your aggregated score.
                </p>
              </div>

              <div className="inline-block rounded-2xl border border-white/10 bg-black/40 px-6 py-4">
                <p className="text-xs uppercase tracking-wider text-white/50">Overall Score</p>
                <p className="mt-1 font-mono text-4xl font-extrabold text-white">
                  {overallScore !== null ? `${overallScore}%` : "Calculating..."}
                </p>
              </div>

              <div className="pt-4 flex justify-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => setSession(null)}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Back to Setup
                </Button>
                <Button onClick={startInterview} className="bg-white text-black hover:bg-white/90">
                  Restart Session
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
