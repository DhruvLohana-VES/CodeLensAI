"use client";

import { useState } from "react";
import { Play, Sparkles, Terminal, Code2, AlertCircle, RefreshCw, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { executeCode as apiExecuteCode, getCodeFeedback as apiGetCodeFeedback } from "@/services/code";

type Challenge = {
  id: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  description: string;
  templates: {
    python: string;
    javascript: string;
  };
};

const CHALLENGES: Challenge[] = [
  {
    id: "two-sum",
    title: "Two Sum",
    difficulty: "Easy",
    description: "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.",
    templates: {
      python: "def twoSum(nums, target):\n    # Write your Python code here\n    # Example: return [0, 1]\n    seen = {}\n    for i, num in enumerate(nums):\n        diff = target - num\n        if diff in seen:\n            return [seen[diff], i]\n        seen[num] = i\n    return []\n\nprint(twoSum([2, 7, 11, 15], 9))",
      javascript: "function twoSum(nums, target) {\n    // Write your JavaScript code here\n    const seen = {};\n    for (let i = 0; i < nums.length; i++) {\n        const diff = target - nums[i];\n        if (diff in seen) {\n            return [seen[diff], i];\n        }\n        seen[nums[i]] = i;\n    }\n    return [];\n}\n\nconsole.log(twoSum([2, 7, 11, 15], 9));"
    }
  },
  {
    id: "valid-parentheses",
    title: "Valid Parentheses",
    difficulty: "Easy",
    description: "Given a string `s` containing just the characters `(`, `)`, `{`, `}`, `[` and `]`, determine if the input string is valid.\n\nAn input string is valid if brackets close in the correct order and are of the same type.",
    templates: {
      python: "def isValid(s):\n    # Write your Python code here\n    stack = []\n    mapping = {\")\": \"(\", \"}\": \"{\", \"]\": \"[\"}\n    for char in s:\n        if char in mapping:\n            top = stack.pop() if stack else '#'\n            if mapping[char] != top:\n                return False\n        else:\n            stack.append(char)\n    return not stack\n\nprint(isValid(\"()[]{}\"))",
      javascript: "function isValid(s) {\n    // Write your JavaScript code here\n    const stack = [];\n    const mapping = { ')': '(', '}': '{', ']': '[' };\n    for (let i = 0; i < s.length; i++) {\n        const char = s[i];\n        if (char in mapping) {\n            const top = stack.length ? stack.pop() : '#';\n            if (mapping[char] !== top) return false;\n        } else {\n            stack.push(char);\n        }\n    }\n    return stack.length === 0;\n}\n\nconsole.log(isValid(\"()[]{}\"));"
    }
  }
];

export default function CodingPage() {
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge>(CHALLENGES[0]);
  const [language, setLanguage] = useState<"python" | "javascript">("python");
  const [code, setCode] = useState<string>(CHALLENGES[0].templates.python);
  
  // Execution state
  const [isRunning, setIsRunning] = useState(false);
  const [runResult, setRunResult] = useState<{ success: boolean; output: string; error: string } | null>(null);

  // Feedback state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [feedbackResult, setFeedbackResult] = useState<{
    feedback: string;
    timeComplexity: string;
    spaceComplexity: string;
    refactoredCode?: string;
  } | null>(null);

  const handleChallengeChange = (challenge: Challenge) => {
    setSelectedChallenge(challenge);
    setCode(language === "python" ? challenge.templates.python : challenge.templates.javascript);
    setRunResult(null);
    setFeedbackResult(null);
  };

  const handleLanguageChange = (lang: "python" | "javascript") => {
    setLanguage(lang);
    setCode(lang === "python" ? selectedChallenge.templates.python : selectedChallenge.templates.javascript);
    setRunResult(null);
    setFeedbackResult(null);
  };

  const runCode = async () => {
    setIsRunning(true);
    setRunResult(null);

    try {
      const data = await apiExecuteCode(code, language);
      setRunResult({ success: data.success, output: data.output, error: data.error });
    } catch (e: any) {
      setRunResult({
        success: false,
        output: "",
        error: e.message || "Network error. Make sure backend is running.",
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getFeedback = async () => {
    setIsAnalyzing(true);
    setFeedbackResult(null);

    try {
      const data = await apiGetCodeFeedback(code, selectedChallenge.title);
      setFeedbackResult(data);
    } catch (e) {
      alert("Network error or server error analyzing code. Verify server is running.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Coding Workspace"
        description="Write and run code sandboxed on the backend, then generate structural AI feedback."
      />

      <div className="grid gap-6 lg:grid-cols-[0.4fr_0.6fr]">
        {/* Left Side: Challenge Picker & Details */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white/50">
              Select Challenge
            </h2>
            <div className="mt-4 space-y-3">
              {CHALLENGES.map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => handleChallengeChange(ch)}
                  className={`w-full rounded-xl border p-4 text-left transition-all ${
                    selectedChallenge.id === ch.id
                      ? "border-white bg-white/10 text-white"
                      : "border-white/10 bg-transparent text-white/60 hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{ch.title}</span>
                    <span className="text-xs uppercase tracking-wide px-2 py-0.5 rounded bg-white/10 font-bold">
                      {ch.difficulty}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4">
            <div className="flex items-center gap-2 text-white">
              <Code2 className="h-5 w-5" />
              <h3 className="font-semibold">{selectedChallenge.title} Description</h3>
            </div>
            <div className="text-sm text-white/70 space-y-2 whitespace-pre-wrap leading-relaxed">
              {selectedChallenge.description}
            </div>
          </div>
        </div>

        {/* Right Side: Code Editor & Execution Panels */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-white/5 overflow-hidden">
            {/* Editor Top Bar */}
            <div className="flex items-center justify-between border-b border-white/10 bg-black/40 px-6 py-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleLanguageChange("python")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wide ${
                    language === "python" ? "bg-white text-black" : "text-white/60 hover:text-white"
                  }`}
                >
                  Python
                </button>
                <button
                  onClick={() => handleLanguageChange("javascript")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold uppercase tracking-wide ${
                    language === "javascript" ? "bg-white text-black" : "text-white/60 hover:text-white"
                  }`}
                >
                  JavaScript
                </button>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={runCode}
                  disabled={isRunning}
                  className="border-white/20 text-white hover:bg-white/10 flex items-center gap-1"
                >
                  {isRunning ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                  Run
                </Button>
                <Button
                  size="sm"
                  onClick={getFeedback}
                  disabled={isAnalyzing}
                  className="bg-white text-black hover:bg-white/90 flex items-center gap-1"
                >
                  {isAnalyzing ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                  AI Review
                </Button>
              </div>
            </div>

            {/* Code Textarea */}
            <div className="p-4 bg-black/50">
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full h-80 font-mono text-sm bg-transparent text-emerald-400 focus:outline-none resize-none leading-relaxed"
                spellCheck={false}
              />
            </div>
          </div>

          {/* Execution Output Panel */}
          {runResult && (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-3">
              <div className="flex items-center gap-2 text-white">
                <Terminal className="h-5 w-5" />
                <h3 className="font-semibold">Execution Output</h3>
              </div>
              <div className="rounded-xl bg-black/60 p-4 font-mono text-xs leading-relaxed overflow-x-auto">
                {runResult.error ? (
                  <div className="text-red-400">
                    <div className="flex items-center gap-1.5 font-bold mb-1">
                      <AlertCircle className="h-4 w-4" />
                      Runtime Error:
                    </div>
                    {runResult.error}
                  </div>
                ) : (
                  <div className="text-emerald-400">
                    <div className="flex items-center gap-1.5 font-bold mb-1 text-white">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      Run Succeeded:
                    </div>
                    {runResult.output || "(No console output returned)"}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* AI Feedback Panel */}
          {feedbackResult && (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4">
              <div className="flex items-center gap-2 text-white">
                <Sparkles className="h-5 w-5 text-amber-300" />
                <h3 className="font-semibold text-lg">AI Structural Feedback</h3>
              </div>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-wide text-white/50">Time Complexity</p>
                  <p className="mt-1 font-mono text-xl font-bold text-white">{feedbackResult.timeComplexity}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-wide text-white/50">Space Complexity</p>
                  <p className="mt-1 font-mono text-xl font-bold text-white">{feedbackResult.spaceComplexity}</p>
                </div>
              </div>

              <div className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap rounded-xl border border-white/10 bg-white/5 p-4">
                {feedbackResult.feedback}
              </div>

              {feedbackResult.refactoredCode && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-white/60">Suggested Refactoring</h4>
                  <pre className="rounded-xl bg-black/60 p-4 font-mono text-xs leading-relaxed overflow-x-auto text-emerald-300">
                    {feedbackResult.refactoredCode}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
