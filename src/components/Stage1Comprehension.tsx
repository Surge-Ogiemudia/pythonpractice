"use client";

import React, { useState } from "react";
import { Problem, Stage1Response, Stage1State, AtomicTask } from "@/types";
import { callTutor } from "@/lib/api";
import {
  FileText,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Loader2,
  ShieldCheck,
  ListOrdered,
  ArrowDownUp,
  RotateCcw,
} from "lucide-react";

interface Stage1ComprehensionProps {
  problem: Problem;
  userText: string;
  setUserText: (text: string) => void;
  state: Stage1State;
  setState: (state: Stage1State) => void;
  onApprove: (atomicTasks: AtomicTask[]) => void;
  apiKey: string;
  model: string;
}

export const Stage1Comprehension: React.FC<Stage1ComprehensionProps> = ({
  problem,
  userText,
  setUserText,
  state,
  setState,
  onApprove,
  apiKey,
  model,
}) => {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [pasteBlocked, setPasteBlocked] = useState(false);

  const { result, attempts, previousText } = state;
  const needsRewrite = result !== null && !result.allClear;

  const handleEvaluate = async () => {
    if (!userText.trim()) {
      setErrorMsg("Write your plain-English explanation first.");
      return;
    }
    setErrorMsg(null);
    setLoading(true);

    try {
      const data = await callTutor<Stage1Response>({
        action: "stage1",
        problemText: problem.text,
        userText,
        attempts,
        previousOrder: result?.correctOrder ?? [],
        apiKey,
        model,
      });
      setState({ attempts: attempts + 1, previousText: userText, result: data });
      // A failed attempt means writing it again from scratch, in the right order
      if (!data.allClear) setUserText("");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Could not reach the tutor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold mb-3">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Stage 1: Explain It in Plain English</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          {problem.title} <span className="text-neutral-500 font-mono text-xl">({problem.filename})</span>
        </h1>
        <p className="text-neutral-400 text-sm mt-2 max-w-3xl">
          Before any code, explain how you would solve this, step by step, in the order the program should do things.
          Include every input, loop, condition, edge case and output. You pass when nothing is missing and the order is right.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Problem text */}
        <div className="lg:col-span-5">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 lg:sticky lg:top-24">
            <div className="flex items-center gap-2 text-white font-semibold mb-3 text-sm">
              <FileText className="w-4 h-4 text-rose-400" />
              <span>Problem Set</span>
            </div>
            <div className="text-neutral-300 whitespace-pre-line text-xs sm:text-sm leading-relaxed max-h-[32rem] overflow-y-auto pr-2 custom-scrollbar">
              {problem.text}
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 space-y-6">
          {/* Feedback on the last attempt, with the correct order to learn from */}
          {needsRewrite && result && (
            <div className="rounded-2xl border p-6 bg-amber-950/20 border-amber-500/40 space-y-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-base font-bold text-amber-300">Not yet (attempt {attempts})</h3>
                  <p className="text-sm text-neutral-300 leading-relaxed mt-1">{result.feedback}</p>
                </div>
              </div>

              {result.missingPoints?.length > 0 && (
                <div className="bg-neutral-900/80 rounded-xl p-4 border border-neutral-800">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block mb-2">
                    What you missed
                  </span>
                  <ul className="space-y-1.5 text-sm text-neutral-300">
                    {result.missingPoints.map((c, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-amber-400">•</span>
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.orderIssues?.length > 0 && (
                <div className="bg-neutral-900/80 rounded-xl p-4 border border-neutral-800">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                    <ArrowDownUp className="w-3.5 h-3.5" /> Out of order
                  </span>
                  <ul className="space-y-1.5 text-sm text-neutral-300">
                    {result.orderIssues.map((c, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-amber-400">•</span>
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="bg-neutral-950 rounded-xl p-4 border border-emerald-500/30">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <ListOrdered className="w-3.5 h-3.5" /> The right order to solve it
                </span>
                <ol className="space-y-1.5 text-sm text-neutral-200 list-decimal list-outside pl-5">
                  {result.correctOrder.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ol>
              </div>

              <details className="text-xs text-neutral-400">
                <summary className="cursor-pointer hover:text-neutral-200">Show your previous attempt</summary>
                <pre className="mt-2 whitespace-pre-wrap font-sans text-neutral-400 bg-neutral-950/60 rounded-lg p-3 border border-neutral-800">
                  {previousText}
                </pre>
              </details>
            </div>
          )}

          {/* Explanation input (hidden once passed) */}
          {!result?.allClear && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
              <div className="flex items-center gap-2 text-white font-semibold text-sm mb-2">
                {needsRewrite ? <RotateCcw className="w-4 h-4 text-rose-400" /> : <ListOrdered className="w-4 h-4 text-rose-400" />}
                <span>{needsRewrite ? "Now explain it again, in your own words" : "Your plain-English explanation"}</span>
              </div>
              <p className="text-xs text-neutral-400 mb-4">
                {needsRewrite
                  ? "Use the order above, but write it yourself. Every point, in that order. Pasting is turned off."
                  : "Write it as a numbered list, in the order the program should run."}
              </p>

              <textarea
                rows={10}
                value={userText}
                onChange={(e) => setUserText(e.target.value)}
                onPaste={(e) => {
                  if (needsRewrite) {
                    e.preventDefault();
                    setPasteBlocked(true);
                  }
                }}
                onDrop={(e) => needsRewrite && e.preventDefault()}
                placeholder={"1. Keep asking the user for...\n2. ...\n3. ..."}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-sm text-neutral-200 focus:outline-none focus:border-rose-500 leading-relaxed resize-y custom-scrollbar"
              />

              {pasteBlocked && needsRewrite && (
                <p className="mt-2 text-xs text-amber-400">Type it out, since writing it is how the order sticks.</p>
              )}

              {errorMsg && (
                <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="break-all">{errorMsg}</span>
                </div>
              )}

              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleEvaluate}
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-sm font-semibold transition-all flex items-center gap-2 shadow-lg shadow-rose-600/20 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Checking...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Check my explanation</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Passed */}
          {result?.allClear && (
            <div className="rounded-2xl border p-6 bg-emerald-950/20 border-emerald-500/40 space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-base font-bold text-emerald-300">
                    Complete and in the right order{attempts > 1 ? ` (took ${attempts} attempts)` : ""}
                  </h3>
                  <p className="text-sm text-neutral-300 leading-relaxed mt-1">{result.feedback}</p>
                </div>
              </div>

              <div className="bg-neutral-900/80 rounded-xl p-4 border border-neutral-800">
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider block mb-2">Your explanation</span>
                <pre className="whitespace-pre-wrap font-sans text-sm text-neutral-300">{previousText}</pre>
              </div>

              <div className="bg-neutral-900/80 rounded-xl p-4 border border-neutral-800">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block mb-2">
                  Coding steps for Stage 2 (top to bottom of the file)
                </span>
                <ol className="space-y-1 text-sm text-neutral-300 list-decimal list-outside pl-5">
                  {result.atomicTasks.map((t) => (
                    <li key={t.id}>
                      <span className="font-semibold text-neutral-200">{t.title}:</span> {t.description}
                    </li>
                  ))}
                </ol>
              </div>

              <button
                onClick={() => onApprove(result.atomicTasks)}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer"
              >
                <span>Go to Stage 2: Write the code</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
