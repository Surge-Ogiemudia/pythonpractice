"use client";

import React, { useState } from "react";
import { Problem, AtomicTask, Stage2Card } from "@/types";
import { callTutor } from "@/lib/api";
import {
  Code2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Loader2,
  Lightbulb,
  CornerDownLeft,
  Flame,
  Lock,
  Pencil,
  FileCode,
} from "lucide-react";

interface Stage2AtomicMappingProps {
  problem: Problem;
  atomicTasks: AtomicTask[];
  cards: Stage2Card[];
  setCards: React.Dispatch<React.SetStateAction<Stage2Card[]>>;
  onProceedToAssembly: (program: string) => void;
  apiKey: string;
  model: string;
}

// Trim blank lines around a snippet but keep its leading indentation
export function cleanSnippet(code: string): string {
  return code.replace(/^(\s*\n)+/, "").replace(/\s+$/, "");
}

export function joinSnippets(codes: string[]): string {
  return codes.map(cleanSnippet).filter(Boolean).join("\n");
}

export function cardsFromTasks(tasks: AtomicTask[]): Stage2Card[] {
  return tasks.map((task, i) => ({
    id: task.id || `step-${i + 1}`,
    taskTitle: task.title,
    taskDescription: task.description,
    indent: task.indent ?? 0,
    userCode: "",
    isCorrect: false,
    feedback: "",
    hint: "",
    attempts: 0,
  }));
}

// Editor-like keys for a plain textarea: Tab indents 4 spaces, Enter keeps indentation
function handleCodeKeys(e: React.KeyboardEvent<HTMLTextAreaElement>, onChange: (value: string) => void) {
  const el = e.currentTarget;
  const { selectionStart: start, selectionEnd: end, value } = el;

  let insert: string | null = null;
  if (e.key === "Tab" && !e.shiftKey) {
    insert = "    ";
  } else if (e.key === "Enter" && !e.metaKey && !e.ctrlKey) {
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const line = value.slice(lineStart, start);
    const indent = line.match(/^ */)?.[0] ?? "";
    insert = "\n" + indent + (line.trimEnd().endsWith(":") ? "    " : "");
  }
  if (insert === null) return;

  // setRangeText moves the caret in the same tick, so fast typing can't land in the wrong place
  e.preventDefault();
  el.setRangeText(insert, start, end, "end");
  onChange(el.value);
}

export const Stage2AtomicMapping: React.FC<Stage2AtomicMappingProps> = ({
  problem,
  atomicTasks,
  cards,
  setCards,
  onProceedToAssembly,
  apiKey,
  model,
}) => {
  const [loading, setLoading] = useState(false);

  // Initialize cards from the Stage 1 steps
  React.useEffect(() => {
    if (cards.length === 0 && atomicTasks.length > 0) {
      setCards(cardsFromTasks(atomicTasks));
    }
  }, [atomicTasks, cards.length, setCards]);

  // Steps are done strictly in order: the active step is the first unapproved one
  const firstOpen = cards.findIndex((c) => !c.isCorrect);
  const activeIndex = firstOpen === -1 ? cards.length : firstOpen;
  const active = cards[activeIndex];
  const allApproved = cards.length > 0 && firstOpen === -1;

  const approvedCode = joinSnippets(cards.slice(0, activeIndex).map((c) => c.userCode));

  const updateCard = (index: number, patch: Partial<Stage2Card>) => {
    setCards((prev) => prev.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  };

  // Reopening a step also reopens every step after it, since they build on it
  const reopenFrom = (index: number) => {
    setCards((prev) =>
      prev.map((c, i) => (i >= index ? { ...c, isCorrect: false, feedback: "", hint: "" } : c))
    );
  };

  const handleValidate = async () => {
    if (!active || !active.userCode.trim()) return;
    setLoading(true);
    const index = activeIndex;
    try {
      const data = await callTutor<{ isCorrect: boolean; feedback: string; hint: string }>({
        action: "stage2",
        problemText: problem.text,
        steps: cards.map((c) => ({ title: c.taskTitle, description: c.taskDescription, indent: c.indent })),
        stepIndex: index,
        codeSoFar: approvedCode,
        userCode: cleanSnippet(active.userCode),
        apiKey,
        model,
      });
      updateCard(index, {
        isCorrect: Boolean(data.isCorrect),
        feedback: data.feedback,
        hint: data.hint || "",
        attempts: active.attempts + 1,
      });
    } catch (err: unknown) {
      updateCard(index, {
        isCorrect: false,
        feedback: err instanceof Error ? err.message : "Could not reach the tutor.",
        hint: "",
      });
    } finally {
      setLoading(false);
    }
  };

  // The whole file as it stands: approved steps, the step being written, then what's left
  const previewLines: { text: string; kind: "done" | "current" | "todo" }[] = [];
  cards.forEach((card, i) => {
    if (i < activeIndex) {
      cleanSnippet(card.userCode)
        .split("\n")
        .forEach((text) => previewLines.push({ text, kind: "done" }));
    } else if (i === activeIndex) {
      const draft = cleanSnippet(card.userCode);
      const lines = draft ? draft.split("\n") : [" ".repeat(card.indent) + `# step ${i + 1} goes here`];
      lines.forEach((text) => previewLines.push({ text, kind: "current" }));
    } else {
      previewLines.push({ text: " ".repeat(card.indent) + `# step ${i + 1}: ${card.taskTitle}`, kind: "todo" });
    }
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold mb-3">
          <Code2 className="w-3.5 h-3.5" />
          <span>Stage 2: Write It Step by Step</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Build {problem.filename} from the top down</h1>
        <p className="text-neutral-400 text-sm mt-1 max-w-3xl">
          Each step is the next few lines of the file, in order, with the indentation they will have in the finished
          program. When every step is approved, your steps stacked together are the program.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Step list + active step */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex flex-wrap gap-2">
            {cards.map((card, idx) => (
              <div
                key={card.id}
                title={card.taskTitle}
                className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold flex items-center gap-1.5 ${
                  idx === activeIndex
                    ? "bg-rose-500/15 border-rose-500/50 text-rose-300"
                    : card.isCorrect
                    ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-300"
                    : "bg-neutral-900 border-neutral-800 text-neutral-500"
                }`}
              >
                {card.isCorrect ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : idx > activeIndex ? (
                  <Lock className="w-3 h-3" />
                ) : null}
                <span>{idx + 1}</span>
              </div>
            ))}
          </div>

          {active && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-md bg-neutral-800 text-rose-400 font-mono text-xs font-bold">
                  Step {activeIndex + 1} of {cards.length}
                </span>
                <span className="px-2.5 py-0.5 rounded-md bg-neutral-800 text-neutral-400 font-mono text-xs">
                  starts at {active.indent} spaces
                </span>
              </div>
              <h2 className="text-lg font-bold text-white">{active.taskTitle}</h2>
              <p className="text-sm text-neutral-300 mt-1">{active.taskDescription}</p>

              <textarea
                rows={5}
                value={active.userCode}
                onChange={(e) => updateCard(activeIndex, { userCode: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    handleValidate();
                    return;
                  }
                  handleCodeKeys(e, (v) => updateCard(activeIndex, { userCode: v }));
                }}
                spellCheck={false}
                placeholder={" ".repeat(active.indent) + "# your line(s) here, indented as in the final file"}
                className="mt-4 w-full bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-sm font-mono text-emerald-400 focus:outline-none focus:border-rose-500 leading-relaxed resize-y custom-scrollbar whitespace-pre"
              />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3">
                <span className="text-xs text-neutral-500 flex items-center gap-1 font-mono">
                  <CornerDownLeft className="w-3 h-3" /> Tab = 4 spaces · Ctrl + Enter to check
                </span>
                <button
                  onClick={handleValidate}
                  disabled={loading || !active.userCode.trim()}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Checking...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Check step</span>
                    </>
                  )}
                </button>
              </div>

              {active.feedback && (
                <div className="mt-5 p-4 rounded-xl border bg-amber-950/20 border-amber-500/30 text-amber-300">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium break-words">{active.feedback}</p>
                      {active.hint && (
                        <p className="text-xs text-amber-400/90 flex items-start gap-1.5 pt-1">
                          <Lightbulb className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          <span>{active.hint}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Approved steps, newest first, with the tutor's note */}
          {cards
            .map((card, idx) => ({ card, idx }))
            .filter(({ card }) => card.isCorrect)
            .reverse()
            .map(({ card, idx }) => (
              <div key={card.id} className="bg-emerald-950/10 border border-emerald-500/20 rounded-xl p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Step {idx + 1}: {card.taskTitle}
                  </span>
                  <button
                    onClick={() => reopenFrom(idx)}
                    className="text-[11px] text-neutral-400 hover:text-rose-400 flex items-center gap-1 cursor-pointer"
                    title="Edit this step (steps after it will need re-checking)"
                  >
                    <Pencil className="w-3 h-3" /> Edit
                  </button>
                </div>
                <p className="text-xs text-neutral-400 mt-1">{card.feedback}</p>
              </div>
            ))}
        </div>

        {/* The file as it will be assembled */}
        <div className="lg:col-span-5 lg:sticky lg:top-24">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
            <div className="bg-neutral-950 px-4 py-2.5 border-b border-neutral-800 flex items-center gap-2 text-xs font-mono text-neutral-400">
              <FileCode className="w-3.5 h-3.5 text-rose-400" />
              <span>{problem.filename}: your program so far</span>
            </div>
            <div className="p-4 font-mono text-xs leading-relaxed overflow-x-auto max-h-[32rem] overflow-y-auto custom-scrollbar">
              {previewLines.map((line, i) => (
                <div key={i} className="flex">
                  <span className="w-8 shrink-0 text-right pr-3 text-neutral-600 select-none">{i + 1}</span>
                  <pre
                    className={`whitespace-pre ${
                      line.kind === "done"
                        ? "text-neutral-200"
                        : line.kind === "current"
                        ? "text-rose-300 bg-rose-500/10 w-full"
                        : "text-neutral-600 italic"
                    }`}
                  >
                    {line.text || " "}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {allApproved && (
        <div className="mt-8 bg-linear-to-r from-emerald-950/40 via-neutral-900 to-emerald-950/40 border border-emerald-500/50 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Every step approved</h3>
              <p className="text-neutral-400 text-sm">Your steps, stacked in order, are the whole program. Time to run it.</p>
            </div>
          </div>
          <button
            onClick={() => onProceedToAssembly(joinSnippets(cards.map((c) => c.userCode)))}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Go to Stage 3: Run &amp; review</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
