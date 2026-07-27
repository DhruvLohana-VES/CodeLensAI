import React from "react";
import { Sparkles, CheckCircle2, ChevronRight } from "lucide-react";

interface RecommendationPanelProps {
  recommendations: string[];
}

export function RecommendationPanel({ recommendations }: RecommendationPanelProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-400" />
            AI-Powered Career & Placement Recommendations
          </h3>
          <p className="text-xs text-white/50">Personalized study orders, expectation guides, and practice recommendations.</p>
        </div>
      </div>

      <div className="space-y-4">
        {recommendations.length === 0 ? (
          <div className="py-8 text-center text-xs text-white/40 italic">
            No recommendations generated. Complete at least one mock interview.
          </div>
        ) : (
          recommendations.map((rec, index) => {
            // Check if there is markdown bolding in recommendations and display it nicely
            const parseBoldText = (text: string) => {
              const parts = text.split(/(\*\*.*?\*\*)/g);
              return parts.map((part, i) => {
                if (part.startsWith("**") && part.endsWith("**")) {
                  return (
                    <strong key={i} className="text-amber-300 font-semibold">
                      {part.slice(2, -2)}
                    </strong>
                  );
                }
                return part;
              });
            };

            return (
              <div 
                key={index} 
                className="group flex gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.04] transition duration-200"
              >
                {/* Step Indicator */}
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono text-sm font-bold shrink-0">
                  {index + 1}
                </div>
                
                {/* Recommendation Content */}
                <div className="space-y-1 pt-0.5 text-sm text-white/80 leading-relaxed">
                  <p>{parseBoldText(rec)}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
