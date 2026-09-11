"use client";

import React, { useState } from "react";
import { Problem, Stage1Response, AtomicTask } from "@/types";
import { 
  FileText, 
  HelpCircle, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Sparkles, 
  Loader2, 
  Lightbulb,
  ShieldCheck,
  ListOrdered
} from "lucide-react";

interface Stage1ComprehensionProps {
  problem: Problem;
  userText: string;
  setUserText: (text: string) => void;
  onApprove: (atomicTasks: AtomicTask[]) => void;
  apiKey: string;
}

export const Stage1Comprehension: React.FC<Stage1ComprehensionProps> = ({
  problem,
  userText,
  setUserText,
  onApprove,
  apiKey,
}) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Stage1Response | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleEvaluate = async () => {
    if (!userText.trim()) {
      setErrorMsg("Please type your plain-English interpretation before submitting.");
      return;
    }
    setErrorMsg(null);
    setLoading(true);

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "validate-stage1",
          problemId: problem.id,
          userText,
          apiKey,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to evaluate explanation");
      }

      const data: Stage1Response = await response.json();
      setResult(data);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to reach AI evaluation service");
    } finally {
      setLoading(false);
    }
  };

  const handleLoadSample = () => {
    if (problem.id === "fuel") {
      setUserText(
`1. The program prompts the user for a fraction formatted as X/Y.
2. In the fraction, X must be a non-negative integer (X >= 0) and Y must be a positive integer (Y > 0).
3. The program converts the fraction to a percentage rounded to the nearest integer.
4. If the percentage is 1% or less, print 'E' for empty.
5. If the percentage is 99% or more, print 'F' for full.
6. Otherwise, print the rounded percentage followed by '%' with no space.
7. Wrap in an infinite loop and prompt again if X or Y is not an integer, if X > Y, or if Y is 0.
8. Catch ValueError and ZeroDivisionError to prevent crashing.`
      );
    } else {
      setUserText(
`1. Prompt user for input in a loop.
2. Check for terminating conditions or invalid data.
3. Apply transformations and calculate results.
4. Format output cleanly according to CS50 requirements.
5. Catch expected exceptions without crashing.`
      );
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Title & Philosophy Banner */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold mb-3">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Stage 1: The Comprehension Gate</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Deconstruct {problem.title} ({problem.filename})
        </h1>
        <p className="text-neutral-400 text-sm mt-2 max-w-3xl">
          Before writing any Python code, describe every step, constraint, and edge case in plain English. 
          The tutor will review your breakdown to make sure no blind spots trip you up later.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Problem Brief */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 text-white font-semibold mb-3 text-sm">
              <FileText className="w-4 h-4 text-rose-400" />
              <span>Problem Prompt</span>
            </div>
            <div className="prose prose-invert prose-sm text-neutral-300 whitespace-pre-line text-xs sm:text-sm leading-relaxed max-h-96 overflow-y-auto pr-2 custom-scrollbar">
              {problem.description}
            </div>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 text-white font-semibold mb-3 text-sm">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <span>Key Requirements to Keep in Mind</span>
            </div>
            <ul className="space-y-2 text-xs sm:text-sm text-neutral-400">
              {problem.requirements.map((req, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-2 shrink-0" />
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Column: User Plain English Workspace */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-white font-semibold text-sm">
                <ListOrdered className="w-4 h-4 text-rose-400" />
                <span>Your Plain English Interpretation</span>
              </div>
              <button
                onClick={handleLoadSample}
                className="text-xs text-neutral-400 hover:text-rose-400 transition-colors underline"
              >
                Insert sample breakdown
              </button>
            </div>

            <p className="text-xs text-neutral-400 mb-4">
              Write down your steps as a numbered list. Be sure to describe inputs, loop behavior, edge cases (like negatives or division by zero), and output formats.
            </p>

            <textarea
              rows={9}
              value={userText}
              onChange={(e) => setUserText(e.target.value)}
              placeholder="1. The program should prompt the user for...&#10;2. Then it splits the string into...&#10;3. If the user types invalid data like...&#10;4. Next, calculate the percentage by...&#10;5. Finally, print..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-sm text-neutral-200 focus:outline-none focus:border-rose-500 font-mono leading-relaxed resize-y custom-scrollbar"
            />

            {errorMsg && (
              <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="mt-4 flex items-center justify-end">
              <button
                onClick={handleEvaluate}
                disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-sm font-semibold transition-all flex items-center gap-2 shadow-lg shadow-rose-600/20 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing Mental Model...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Verify My Interpretation</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Evaluation Results Card */}
          {result && (
            <div
              className={`rounded-2xl border p-6 transition-all ${
                result.allClear
                  ? "bg-emerald-950/20 border-emerald-500/40"
                  : "bg-amber-950/20 border-amber-500/40"
              }`}
            >
              <div className="flex items-start gap-3">
                {result.allClear ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
                )}
                <div className="space-y-3 flex-1">
                  <h3 className={`text-base font-bold ${result.allClear ? "text-emerald-300" : "text-amber-300"}`}>
                    {result.allClear ? "Comprehension Gate Cleared! 🎉" : "Almost there — Missed Edge Cases"}
                  </h3>
                  <p className="text-sm text-neutral-300 leading-relaxed">{result.feedback}</p>

                  {result.missingCases && result.missingCases.length > 0 && (
                    <div className="bg-neutral-900/80 rounded-xl p-4 border border-neutral-800 space-y-2 mt-3">
                      <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                        Consider adding these points:
                      </span>
                      <ul className="space-y-1.5 text-xs text-neutral-300">
                        {result.missingCases.map((c, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-amber-400">•</span>
                            <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.allClear && (
                    <div className="pt-2">
                      <div className="bg-neutral-900/80 rounded-xl p-4 border border-neutral-800 mb-4">
                        <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block mb-2">
                          Verified Atomic Steps for Stage 2:
                        </span>
                        <ol className="space-y-1 text-xs text-neutral-300 list-decimal list-inside">
                          {result.atomicTasks.map((t) => (
                            <li key={t.id} className="py-0.5">
                              {t.description}
                            </li>
                          ))}
                        </ol>
                      </div>

                      <button
                        onClick={() => onApprove(result.atomicTasks)}
                        className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer"
                      >
                        <span>Proceed to Stage 2: Atomic Syntax</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
