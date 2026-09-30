"use client";

import React from "react";
import { Problem } from "@/types";
import { Terminal, Key, CheckCircle2, ChevronRight, Plus } from "lucide-react";

type Stage = 1 | 2 | 3;

interface NavbarProps {
  problem: Problem | null;
  onNewProblem: () => void;
  currentStage: Stage;
  onSelectStage: (stage: Stage) => void;
  completedStages: { 1: boolean; 2: boolean; 3: boolean };
  onOpenSettings: () => void;
  hasApiKey: boolean;
}

const STAGES: { stage: Stage; label: string }[] = [
  { stage: 1, label: "1. Plain English" },
  { stage: 2, label: "2. Step by Step" },
  { stage: 3, label: "3. Run & Review" },
];

export const Navbar: React.FC<NavbarProps> = ({
  problem,
  onNewProblem,
  currentStage,
  onSelectStage,
  completedStages,
  onOpenSettings,
  hasApiKey,
}) => {
  // A stage is reachable once the one before it is done
  const unlocked = (stage: Stage) => stage === 1 || completedStages[(stage - 1) as Stage];

  return (
    <header className="bg-neutral-900 border-b border-neutral-800 text-neutral-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <div className="flex items-center gap-2 font-mono font-bold text-lg text-rose-500 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <Terminal className="w-4 h-4" />
            </div>
            <span>
              CS50P<span className="text-white">.Tutor</span>
            </span>
          </div>

          {problem && (
            <>
              <div className="h-5 w-px bg-neutral-800 shrink-0" />
              <span className="text-sm font-medium text-neutral-300 truncate">{problem.title}</span>
              <button
                onClick={onNewProblem}
                className="shrink-0 text-xs px-2.5 py-1 rounded-lg border border-neutral-700 text-neutral-400 hover:text-white hover:bg-neutral-800 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" /> New
              </button>
            </>
          )}
        </div>

        {problem && (
          <div className="hidden md:flex items-center gap-2 bg-neutral-950/60 p-1.5 rounded-xl border border-neutral-800/80 shrink-0">
            {STAGES.map(({ stage, label }, i) => (
              <React.Fragment key={stage}>
                {i > 0 && <ChevronRight className="w-3 h-3 text-neutral-600" />}
                <button
                  onClick={() => onSelectStage(stage)}
                  disabled={!unlocked(stage)}
                  className={`flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    !unlocked(stage)
                      ? "text-neutral-600 cursor-not-allowed"
                      : currentStage === stage
                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                      : completedStages[stage]
                      ? "text-emerald-400 hover:bg-neutral-800/50 cursor-pointer"
                      : "text-neutral-400 hover:text-neutral-200 cursor-pointer"
                  }`}
                >
                  {completedStages[stage] && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                  <span>{label}</span>
                </button>
              </React.Fragment>
            ))}
          </div>
        )}

        <button
          onClick={onOpenSettings}
          className={`shrink-0 flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
            hasApiKey
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
              : "bg-neutral-800/80 border-neutral-700 text-neutral-300 hover:bg-neutral-700/80 hover:text-white"
          }`}
          title="Gemini settings"
        >
          <Key className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{hasApiKey ? "AI Connected" : "Connect AI Key"}</span>
        </button>
      </div>
    </header>
  );
};
