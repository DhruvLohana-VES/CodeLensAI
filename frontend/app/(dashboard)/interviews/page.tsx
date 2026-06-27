"use client";

import { useState, useEffect } from "react";
import { 
  MessageSquare, 
  Play, 
  Sparkles, 
  RefreshCw, 
  Send, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft,
  Award, 
  History, 
  X, 
  BookOpen, 
  AlertCircle 
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { 
  startInterview as apiStartInterview, 
  submitAnswer as apiSubmitAnswer,
  getInterviewHistory,
  getInterviewDetails,
  InterviewHistoryItem,
  InterviewDetailQuestionItem,
  InterviewDetailSession,
  PaginationMetadata
} from "@/services/interview";

type SessionState = {
  sessionId: string;
  role: string;
  currentQuestion: string;
  questionIndex: number;
  totalQuestions: number;
  isComplete: boolean;
};

export default function InterviewsPage() {
  const [activeTab, setActiveTab] = useState<"new" | "history">("new");
  
  // New session states
  const [roleInput, setRoleInput] = useState<string>("Frontend");
  const [session, setSession] = useState<SessionState | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [answer, setAnswer] = useState<string>("");
  const [lastFeedback, setLastFeedback] = useState<{
    feedback: string;
    score: number;
    nextQuestion?: string;
  } | null>(null);
  const [overallScore, setOverallScore] = useState<number | null>(null);

  // History states
  const [historyList, setHistoryList] = useState<InterviewHistoryItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMetadata | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  
  // Details Modal states
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [sessionDetails, setSessionDetails] = useState<{
    interview: InterviewDetailSession;
    questions: InterviewDetailQuestionItem[];
  } | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState<boolean>(false);

  // Load history when tab changes or page changes
  useEffect(() => {
    if (activeTab === "history") {
      loadHistory(currentPage);
    }
  }, [activeTab, currentPage]);

  const loadHistory = async (page: number) => {
    setIsLoadingHistory(true);
    try {
      const data = await getInterviewHistory(page, 5);
      if (data.success) {
        setHistoryList(data.interviews);
        setPagination(data.pagination);
      }
    } catch (e) {
      console.error("Error loading interview history:", e);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const viewDetails = async (id: string) => {
    setSelectedSessionId(id);
    setIsLoadingDetails(true);
    setSessionDetails(null);
    try {
      const data = await getInterviewDetails(id);
      if (data.success) {
        setSessionDetails({
          interview: data.interview,
          questions: data.questions
        });
      }
    } catch (e) {
      console.error("Error fetching details:", e);
      alert("Error loading interview details.");
    } finally {
      setIsLoadingDetails(false);
    }
  };

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

  const formatDate = (dateStr: string) => {
    try {
      const formatted = dateStr.replace(" ", "T");
      const date = new Date(formatted);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <PageHeader
        title="AI Placement Interviews"
        description="Simulate real-world placement rounds. Answer technical questions and receive adaptive scoring."
      />

      {/* Tabs Layout */}
      {!session && (
        <div className="flex border-b border-white/10 gap-6">
          <button
            onClick={() => setActiveTab("new")}
            className={`flex items-center gap-2 pb-4 text-sm font-semibold transition border-b-2 px-1 ${
              activeTab === "new"
                ? "border-white text-white"
                : "border-transparent text-white/50 hover:text-white/80"
            }`}
          >
            <Play className="h-4 w-4" />
            Start Mock Interview
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-2 pb-4 text-sm font-semibold transition border-b-2 px-1 ${
              activeTab === "history"
                ? "border-white text-white"
                : "border-transparent text-white/50 hover:text-white/80"
            }`}
          >
            <History className="h-4 w-4" />
            Interview History
          </button>
        </div>
      )}

      {!session ? (
        activeTab === "new" ? (
          // Start Session Screen
          <div className="mx-auto max-w-2xl rounded-3xl border border-white/10 bg-white/5 p-8 text-center space-y-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-white">
              <MessageSquare className="h-7 w-7" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-white">Select Target Interview Role</h2>
              <p className="text-sm text-white/60">
                Our AI interviewer will generate a bank of questions calibrated to the chosen track and track topic coverage.
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
                className="w-full bg-white text-black hover:bg-white/90 sm:w-auto font-medium"
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
          // History list Screen
          <div className="mx-auto max-w-4xl space-y-6">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
              <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <History className="h-5 w-5 text-white/60" />
                Previous Placement Mock Sessions
              </h2>

              {isLoadingHistory ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4 text-white/40">
                  <RefreshCw className="h-8 w-8 animate-spin" />
                  <p className="text-sm">Loading history records...</p>
                </div>
              ) : historyList.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl bg-black/20 text-white/50 space-y-3">
                  <AlertCircle className="h-8 w-8 mx-auto text-white/30" />
                  <p className="text-sm">No interviews completed yet.</p>
                  <Button 
                    variant="outline"
                    onClick={() => setActiveTab("new")}
                    className="border-white/10 text-white hover:bg-white/5 text-xs px-3"
                  >
                    Take your first interview
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Table headers */}
                  <div className="grid grid-cols-12 px-6 py-3 text-xs uppercase tracking-wider font-bold text-white/40 border-b border-white/10">
                    <div className="col-span-5">Date Taken</div>
                    <div className="col-span-3">Role / Mode</div>
                    <div className="col-span-2 text-center">Score</div>
                    <div className="col-span-2 text-right">Actions</div>
                  </div>

                  {/* Table rows */}
                  <div className="divide-y divide-white/5">
                    {historyList.map((item) => (
                      <div 
                        key={item.id} 
                        className="grid grid-cols-12 px-6 py-4 items-center hover:bg-white/5 transition duration-150 text-sm text-white/80"
                      >
                        <div className="col-span-5 font-mono text-white/60">
                          {formatDate(item.created_at)}
                        </div>
                        <div className="col-span-3 font-semibold text-white">
                          {item.mode}
                        </div>
                        <div className="col-span-2 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold font-mono ${
                            item.overall_score >= 70
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : item.overall_score >= 50
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              : "bg-red-500/10 text-red-400 border border-red-500/20"
                          }`}>
                            {item.overall_score}%
                          </span>
                        </div>
                        <div className="col-span-2 text-right">
                          <button
                            onClick={() => viewDetails(item.id)}
                            className="text-xs text-white/80 bg-white/10 hover:bg-white/20 border border-white/10 px-3 py-1.5 rounded-lg transition"
                          >
                            Details
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination controls */}
                  {pagination && pagination.total > 5 && (
                    <div className="flex items-center justify-between pt-6 border-t border-white/10 mt-6 text-sm text-white/60">
                      <div>
                        Showing Page {pagination.page} of {Math.ceil(pagination.total / pagination.limit)}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                          disabled={pagination.page <= 1}
                          className="border-white/10 text-white hover:bg-white/5"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage((prev) => prev + 1)}
                          disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
                          className="border-white/10 text-white hover:bg-white/5"
                        >
                          Next
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )
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
            <div className="rounded-3xl border border-white/10 bg-white/5 p-8 space-y-6 animate-fade-up">
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
              <div className="rounded-3xl border border-white/10 bg-white/5 p-8 space-y-6 animate-fade-up">
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
                  onClick={() => {
                    setSession(null);
                    setActiveTab("history");
                    setCurrentPage(1);
                  }}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  View in History
                </Button>
                <Button onClick={startInterview} className="bg-white text-black hover:bg-white/90">
                  Restart Session
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Details Modal (Glassmorphic Overlay) */}
      {selectedSessionId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in">
          <div className="relative w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-3xl border border-white/10 bg-[#0d0d0d] p-6 shadow-2xl text-left space-y-6">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-xs uppercase tracking-wider text-white/50">Mock Placement Session</span>
                {sessionDetails && (
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    {sessionDetails.interview.mode} mock interview
                    <span className="text-xs px-2 py-0.5 rounded bg-white/10 font-mono text-white/60 font-normal">
                      {formatDate(sessionDetails.interview.created_at)}
                    </span>
                  </h3>
                )}
              </div>
              <button
                onClick={() => setSelectedSessionId(null)}
                className="rounded-xl border border-white/10 p-2 hover:bg-white/5 text-white/60 hover:text-white transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {isLoadingDetails ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4 text-white/40">
                <RefreshCw className="h-8 w-8 animate-spin" />
                <p className="text-sm">Retrieving question-level analytics...</p>
              </div>
            ) : sessionDetails ? (
              <div className="space-y-6">
                {/* Score Banner */}
                <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                      <Award className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Aggregated Performance Score</p>
                      <p className="text-xs text-white/50">Calculated as average across all questions in the set.</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-black font-mono text-white">
                      {sessionDetails.interview.overall_score}%
                    </p>
                  </div>
                </div>

                {/* Questions Listing */}
                <div className="space-y-4">
                  <h4 className="text-xs uppercase tracking-wider text-white/50 font-bold flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5" />
                    Question Breakdown
                  </h4>

                  <div className="space-y-4">
                    {sessionDetails.questions.map((q, idx) => (
                      <div 
                        key={q.id} 
                        className="rounded-2xl border border-white/5 bg-white/5 p-5 space-y-4 hover:border-white/10 transition"
                      >
                        {/* Question Header */}
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase font-bold text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded-full bg-amber-500/5">
                              Question {idx + 1}: {q.topic}
                            </span>
                            <h5 className="text-sm font-semibold text-white leading-relaxed pt-1.5">
                              {q.question}
                            </h5>
                          </div>
                          <div className="text-right whitespace-nowrap">
                            <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-xs font-bold text-emerald-300 font-mono">
                              Score: {q.score} / 100
                            </span>
                          </div>
                        </div>

                        {/* User Answer */}
                        <div className="space-y-1 border-l-2 border-white/10 pl-3">
                          <span className="text-[10px] uppercase font-bold text-white/40">Candidate Answer</span>
                          <p className="text-xs text-white/70 italic leading-relaxed">
                            "{q.answer || "No answer provided."}"
                          </p>
                        </div>

                        {/* AI Feedback */}
                        <div className="space-y-1 border-l-2 border-emerald-500/20 pl-3 bg-emerald-500/[0.02] py-2 pr-2 rounded-r-xl">
                          <span className="text-[10px] uppercase font-bold text-emerald-400">AI Evaluation Feedback</span>
                          <p className="text-xs text-white/80 whitespace-pre-wrap leading-relaxed pt-1 font-sans">
                            {q.feedback}
                          </p>
                        </div>

                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 text-white/40">
                <AlertCircle className="h-8 w-8 mx-auto" />
                <p className="text-sm mt-2">Error mapping interview items.</p>
              </div>
            )}

            {/* Modal Footer */}
            <div className="flex justify-end pt-4 border-t border-white/10 mt-6">
              <Button
                onClick={() => setSelectedSessionId(null)}
                className="bg-white text-black hover:bg-white/90"
              >
                Close View
              </Button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
