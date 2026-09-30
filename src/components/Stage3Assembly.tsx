"use client";

import React, { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { Problem, LintError, Stage3Review } from "@/types";
import { analyzePythonCode } from "@/lib/linter";
import { runPythonWithInput } from "@/lib/pyodide";
import { callTutor } from "@/lib/api";
import {
  Play,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Check,
  Terminal as TerminalIcon,
  Sparkles,
  Loader2,
  Copy,
  GraduationCap,
  RotateCcw,
} from "lucide-react";
import confetti from "canvas-confetti";

// Dynamically import Monaco Editor to avoid SSR window issues
const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

interface Stage3AssemblyProps {
  problem: Problem;
  code: string;
  onCodeChange: (code: string) => void;
  stage2Code: string;
  review: Stage3Review | null;
  setReview: (review: Stage3Review | null) => void;
  onCompleteStage: () => void;
  apiKey: string;
  model: string;
}

type Tab = "run" | "review" | "checks";

export const Stage3Assembly: React.FC<Stage3AssemblyProps> = ({
  problem,
  code,
  onCodeChange,
  stage2Code,
  review,
  setReview,
  onCompleteStage,
  apiKey,
  model,
}) => {
  const [activeTab, setActiveTab] = useState<Tab>("run");
  const [copied, setCopied] = useState(false);

  const [stdin, setStdin] = useState("");
  const [runOutput, setRunOutput] = useState<{ stdout: string; error?: string } | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const lintErrors: LintError[] = useMemo(() => analyzePythonCode(code), [code]);

  const handleRun = async () => {
    if (!code.trim()) return;
    setActiveTab("run");
    setIsRunning(true);
    try {
      const result = await runPythonWithInput(code, stdin, problem.filename);
      setRunOutput({ stdout: [result.stdout, result.stderr].filter(Boolean).join("\n"), error: result.error });
    } catch (err: unknown) {
      setRunOutput({ stdout: "", error: err instanceof Error ? err.message : String(err) });
    } finally {
      setIsRunning(false);
    }
  };

  const handleReview = async () => {
    if (!code.trim()) return;
    setActiveTab("review");
    setIsReviewing(true);
    setReviewError(null);
    try {
      const data = await callTutor<Stage3Review>({ action: "stage3", problemText: problem.text, code, apiKey, model });
      setReview(data);
      if (data.isCorrect) {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
        onCompleteStage();
      }
    } catch (err: unknown) {
      setReviewError(err instanceof Error ? err.message : "Could not reach the tutor.");
    } finally {
      setIsReviewing(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tabClass = (tab: Tab) =>
    `px-3 py-2 rounded-t-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
      activeTab === tab ? "bg-neutral-900 text-white border-t border-x border-neutral-800" : "text-neutral-400 hover:text-neutral-200"
    }`;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold mb-2">
            <TerminalIcon className="w-3.5 h-3.5" />
            <span>Stage 3: Run &amp; Review</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{problem.filename}</h1>
          <p className="text-neutral-400 text-xs sm:text-sm mt-1">
            This is exactly the code from your Stage 2 steps. Run it with test inputs, fix anything that breaks, then get it reviewed.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRun}
            disabled={isRunning}
            className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-white text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer"
          >
            {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
            <span>Run</span>
          </button>
          <button
            onClick={handleReview}
            disabled={isReviewing}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer"
          >
            {isReviewing ? <Loader2 className="w-4 h-4 animate-spin" /> : <GraduationCap className="w-4 h-4" />}
            <span>Review my program</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Editor */}
        <div className="lg:col-span-7 bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
          <div className="bg-neutral-950 px-4 py-2.5 border-b border-neutral-800 flex items-center justify-between">
            <span className="text-xs font-mono text-neutral-400 font-medium">{problem.filename}</span>
            <div className="flex items-center gap-2">
              {code !== stage2Code && (
                <button
                  onClick={() => onCodeChange(stage2Code)}
                  className="text-[11px] text-neutral-400 hover:text-rose-400 flex items-center gap-1 px-2 py-1 cursor-pointer"
                  title="Go back to the code exactly as approved in Stage 2"
                >
                  <RotateCcw className="w-3 h-3" /> Reset to Stage 2 code
                </button>
              )}
              <button
                onClick={handleCopyCode}
                className="text-[11px] text-neutral-300 hover:text-white flex items-center gap-1 bg-neutral-800/80 px-2 py-1 rounded-md cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? "Copied!" : "Copy code"}</span>
              </button>
            </div>
          </div>

          <div className="h-[460px] bg-neutral-950 font-mono text-sm">
            <Editor
              height="100%"
              language="python"
              theme="vs-dark"
              value={code}
              onChange={(val) => onCodeChange(val || "")}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                lineNumbers: "on",
                tabSize: 4,
                insertSpaces: true,
                automaticLayout: true,
                scrollBeyondLastLine: false,
                fontFamily: "var(--font-geist-mono), monospace",
              }}
            />
          </div>
        </div>

        {/* Run / Review / Checks */}
        <div className="lg:col-span-5 bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden flex flex-col h-[510px]">
          <div className="bg-neutral-950 px-3 pt-2 border-b border-neutral-800 flex items-center gap-1">
            <button onClick={() => setActiveTab("run")} className={tabClass("run")}>
              <TerminalIcon className="w-3.5 h-3.5 text-rose-400" />
              <span>Run</span>
            </button>
            <button onClick={() => setActiveTab("review")} className={tabClass("review")}>
              <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
              <span>Tutor review</span>
            </button>
            <button onClick={() => setActiveTab("checks")} className={tabClass("checks")}>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Quick checks ({lintErrors.length})</span>
            </button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
            {activeTab === "run" && (
              <div className="space-y-3 font-mono text-xs">
                <label className="block text-neutral-400 font-sans">
                  Input: one line per <code className="text-rose-300">input()</code> call
                </label>
                <textarea
                  rows={4}
                  value={stdin}
                  onChange={(e) => setStdin(e.target.value)}
                  placeholder={"cat/dog\n3/4"}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-neutral-200 focus:outline-none focus:border-rose-500"
                />
                <button
                  onClick={handleRun}
                  disabled={isRunning}
                  className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  {isRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isRunning ? "Running (first run loads Python)..." : `python ${problem.filename}`}</span>
                </button>
                {runOutput && (
                  <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3 space-y-2">
                    <pre className="whitespace-pre-wrap text-neutral-200">{runOutput.stdout || "(no output)"}</pre>
                    {runOutput.error && <pre className="whitespace-pre-wrap text-rose-400">{runOutput.error}</pre>}
                  </div>
                )}
              </div>
            )}

            {activeTab === "review" && (
              <div className="space-y-3 text-sm">
                {isReviewing && (
                  <div className="flex items-center gap-2 text-neutral-400 text-xs">
                    <Loader2 className="w-4 h-4 animate-spin" /> Reviewing against the problem set...
                  </div>
                )}
                {reviewError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span className="break-all">{reviewError}</span>
                  </div>
                )}
                {!review && !isReviewing && !reviewError && (
                  <p className="text-xs text-neutral-400">
                    When your program runs the way you expect, click <strong>Review my program</strong>. The tutor checks it
                    against the problem set. Once it is correct, it shows you a shorter or cleaner way to write it.
                  </p>
                )}
                {review && !isReviewing && (
                  <>
                    <div
                      className={`p-3 rounded-xl border flex items-start gap-2 ${
                        review.isCorrect
                          ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-200"
                          : "bg-amber-950/20 border-amber-500/30 text-amber-200"
                      }`}
                    >
                      {review.isCorrect ? (
                        <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                      ) : (
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                      )}
                      <span>{review.feedback}</span>
                    </div>

                    {review.issues?.length > 0 && (
                      <ul className="space-y-1.5 text-xs text-neutral-300">
                        {review.issues.map((issue, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-amber-400">•</span>
                            <span>{issue}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {review.isCorrect && review.betterVersion && (
                      <div className="space-y-2">
                        <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5" /> A shorter way
                        </span>
                        <pre className="bg-neutral-950 border border-neutral-800 rounded-lg p-3 font-mono text-xs text-neutral-200 overflow-x-auto">
                          {review.betterVersion}
                        </pre>
                        <p className="text-xs text-neutral-300 leading-relaxed">{review.betterExplanation}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {activeTab === "checks" && (
              <div className="space-y-2.5">
                {lintErrors.length === 0 ? (
                  <p className="text-xs text-neutral-400">No common beginner mistakes spotted (missing colons, = instead of ==).</p>
                ) : (
                  lintErrors.map((err) => (
                    <div
                      key={err.id}
                      className={`p-3 rounded-xl border text-xs leading-relaxed space-y-1 ${
                        err.severity === "error"
                          ? "bg-rose-950/20 border-rose-500/30 text-rose-200"
                          : "bg-amber-950/20 border-amber-500/30 text-amber-200"
                      }`}
                    >
                      <div className="font-bold">{err.message}</div>
                      {err.fixHint && <p className="text-[11px] text-neutral-400 font-mono">Fix: {err.fixHint}</p>}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="bg-neutral-950 px-4 py-2.5 border-t border-neutral-800 text-[11px] text-neutral-400">
            Final check: paste into your CS50 codespace and run <span className="font-mono text-neutral-200">check50</span> for this problem.
          </div>
        </div>
      </div>
    </div>
  );
};
