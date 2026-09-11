"use client";

import React, { useState } from "react";
import { Problem, AtomicTask, Stage2Card } from "@/types";
import { 
  Code2, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Sparkles, 
  Loader2, 
  HelpCircle,
  Lightbulb,
  CornerDownLeft,
  Flame
} from "lucide-react";

interface Stage2AtomicMappingProps {
  problem: Problem;
  atomicTasks: AtomicTask[];
  cards: Stage2Card[];
  setCards: React.Dispatch<React.SetStateAction<Stage2Card[]>>;
  onProceedToAssembly: (compiledSnippets: string) => void;
  apiKey: string;
}

export const Stage2AtomicMapping: React.FC<Stage2AtomicMappingProps> = ({
  problem,
  atomicTasks,
  cards,
  setCards,
  onProceedToAssembly,
  apiKey,
}) => {
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [loadingIndex, setLoadingIndex] = useState<number | null>(null);

  // Initialize cards if empty
  React.useEffect(() => {
    if (cards.length === 0 && atomicTasks.length > 0) {
      const initialCards: Stage2Card[] = atomicTasks.map((task) => ({
        id: task.id,
        taskTitle: task.title,
        taskDescription: task.description,
        userCode: "",
        isCorrect: false,
        feedback: "",
        hint: "",
        attempts: 0,
      }));
      setCards(initialCards);
    }
  }, [atomicTasks, cards.length, setCards]);

  const handleCodeChange = (index: number, value: string) => {
    setCards((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], userCode: value };
      return copy;
    });
  };

  const handleValidateCard = async (index: number) => {
    const card = cards[index];
    if (!card.userCode.trim()) return;

    setLoadingIndex(index);
    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "validate-stage2",
          problemId: problem.id,
          stepIndex: index,
          userCode: card.userCode,
          apiKey,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to validate atomic line");
      }

      const data = await response.json();
      setCards((prev) => {
        const copy = [...prev];
        copy[index] = {
          ...copy[index],
          isCorrect: data.isCorrect,
          feedback: data.feedback,
          hint: data.hint || "",
          attempts: copy[index].attempts + 1,
        };
        return copy;
      });

      // Auto advance to next unsolved card if correct
      if (data.isCorrect && index < cards.length - 1) {
        setActiveCardIndex(index + 1);
      }
    } catch (err: any) {
      setCards((prev) => {
        const copy = [...prev];
        copy[index] = {
          ...copy[index],
          feedback: err.message || "Could not validate snippet.",
          isCorrect: false,
        };
        return copy;
      });
    } finally {
      setLoadingIndex(null);
    }
  };

  const allCardsApproved = cards.length > 0 && cards.every((c) => c.isCorrect);

  const handleBuildAssembly = () => {
    // Generate initial assembly code from all validated user snippets
    const snippets = cards.map((c) => c.userCode).join("\n\n");
    onProceedToAssembly(snippets);
  };

  const handleLoadSampleLines = () => {
    if (problem.id === "fuel") {
      const sampleLines = [
        `fraction = input("Fraction: ")`,
        `parts = fraction.split("/")\nx = int(parts[0])\ny = int(parts[1])`,
        `if x > y or x < 0 or y <= 0:\n    continue`,
        `percentage = round((x / y) * 100)`,
        `if percentage <= 1:\n    print("E")\nelif percentage >= 99:\n    print("F")\nelse:\n    print(f"{percentage}%")`,
      ];

      setCards((prev) =>
        prev.map((c, idx) => ({
          ...c,
          userCode: sampleLines[idx] || c.userCode,
          isCorrect: true,
          feedback: "Verified pattern matches CS50 requirements.",
          hint: "",
        }))
      );
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold mb-3">
            <Code2 className="w-3.5 h-3.5" />
            <span>Stage 2: Atomic Syntax Mapping</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Write Isolated Python Snippets
          </h1>
          <p className="text-neutral-400 text-sm mt-1 max-w-2xl">
            Don’t worry about `while` loops, indentation, or error handlers yet. Focus purely on writing the 1–2 lines of code that perform each isolated task.
          </p>
        </div>

        <button
          onClick={handleLoadSampleLines}
          className="text-xs text-neutral-400 hover:text-rose-400 transition-colors underline self-start sm:self-center"
        >
          Auto-fill sample snippets
        </button>
      </div>

      {/* Progress tracker */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-8">
        {cards.map((card, idx) => (
          <button
            key={card.id}
            onClick={() => setActiveCardIndex(idx)}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              activeCardIndex === idx
                ? "bg-rose-500/15 border-rose-500/50 shadow-md"
                : card.isCorrect
                ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-300"
                : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-mono font-bold">Step {idx + 1}</span>
              {card.isCorrect ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-neutral-700" />
              )}
            </div>
            <p className="text-[11px] truncate text-neutral-300">{card.taskDescription}</p>
          </button>
        ))}
      </div>

      {/* Active Card Workspace */}
      {cards[activeCardIndex] && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-neutral-800 text-rose-400 font-mono text-xs font-bold">
                  Step {activeCardIndex + 1} of {cards.length}
                </span>
                {cards[activeCardIndex].isCorrect && (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Validated
                  </span>
                )}
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white pt-2">
                {cards[activeCardIndex].taskDescription}
              </h2>
            </div>
          </div>

          {/* Code Input Box */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Your Python Line(s)
            </label>
            <div className="relative">
              <textarea
                rows={3}
                value={cards[activeCardIndex].userCode}
                onChange={(e) => handleCodeChange(activeCardIndex, e.target.value)}
                placeholder="Write your line of Python code here..."
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-sm font-mono text-emerald-400 focus:outline-none focus:border-rose-500 leading-relaxed resize-y custom-scrollbar"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    handleValidateCard(activeCardIndex);
                  }
                }}
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <span className="text-xs text-neutral-500 flex items-center gap-1 font-mono">
                <CornerDownLeft className="w-3 h-3" /> Tip: Ctrl + Enter to quickly check line
              </span>

              <button
                onClick={() => handleValidateCard(activeCardIndex)}
                disabled={loadingIndex === activeCardIndex || !cards[activeCardIndex].userCode.trim()}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20 cursor-pointer"
              >
                {loadingIndex === activeCardIndex ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Line...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Check Line</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Feedback & Hint Box */}
          {cards[activeCardIndex].feedback && (
            <div
              className={`mt-6 p-4 rounded-xl border transition-all ${
                cards[activeCardIndex].isCorrect
                  ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-300"
                  : "bg-amber-950/20 border-amber-500/30 text-amber-300"
              }`}
            >
              <div className="flex items-start gap-3">
                {cards[activeCardIndex].isCorrect ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <p className="text-sm font-medium">{cards[activeCardIndex].feedback}</p>
                  {cards[activeCardIndex].hint && (
                    <p className="text-xs text-amber-400/90 flex items-center gap-1.5 pt-1">
                      <Lightbulb className="w-3.5 h-3.5 shrink-0" />
                      <span>{cards[activeCardIndex].hint}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Complete Banner to Stage 3 */}
      {allCardsApproved && (
        <div className="mt-8 bg-linear-to-r from-emerald-950/40 via-neutral-900 to-emerald-950/40 border border-emerald-500/50 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">All Atomic Snippets Verified!</h3>
              <p className="text-neutral-400 text-sm">
                You’ve created the building blocks. Now bring them together into the Assembly Canvas.
              </p>
            </div>
          </div>

          <button
            onClick={handleBuildAssembly}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-xl shadow-emerald-600/30 cursor-pointer"
          >
            <span>Proceed to Stage 3: Assembly Canvas</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
