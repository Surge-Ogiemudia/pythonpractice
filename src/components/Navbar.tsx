"use client";

import React from "react";
import { CS50_PROBLEMS } from "@/data/problems";
import { Problem } from "@/types";
import { Sparkles, Terminal, Key, CheckCircle2, ChevronRight, BookOpen } from "lucide-react";

interface NavbarProps {
  currentProblem: Problem;
  onSelectProblem: (problem: Problem) => void;
  currentStage: 1 | 2 | 3;
  onSelectStage: (stage: 1 | 2 | 3) => void;
  completedStages: { 1: boolean; 2: boolean; 3: boolean };
  onOpenSettings: () => void;
  hasApiKey: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentProblem,
  onSelectProblem,
  currentStage,
  onSelectStage,
  completedStages,
  onOpenSettings,
  hasApiKey,
}) => {
  return (
    <header className="bg-neutral-900 border-b border-neutral-800 text-neutral-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo & Problem dropdown */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 font-mono font-bold text-lg text-rose-500">
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <Terminal className="w-4 h-4" />
            </div>
            <span>CS50P<span className="text-white">.Tutor</span></span>
          </div>

          <div className="h-5 w-px bg-neutral-800" />

          {/* Problem Selector */}
          <div className="relative flex items-center">
            <label htmlFor="problem-select" className="sr-only">Choose Problem</label>
            <select
              id="problem-select"
              value={currentProblem.id}
              onChange={(e) => {
                const found = CS50_PROBLEMS.find((p) => p.id === e.target.value);
                if (found) onSelectProblem(found);
              }}
              className="bg-neutral-950/80 border border-neutral-800 text-neutral-200 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-rose-500 font-medium cursor-pointer"
            >
              {CS50_PROBLEMS.map((p) => (
                <option key={p.id} value={p.id} className="bg-neutral-900 text-neutral-200">
                  {p.title} ({p.filename}) - {p.week.split(":")[0]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 3-Stage Funnel Progress */}
        <div className="hidden md:flex items-center gap-2 bg-neutral-950/60 p-1.5 rounded-xl border border-neutral-800/80">
          <button
            onClick={() => onSelectStage(1)}
            className={`flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              currentStage === 1
                ? "bg-rose-500/20 text-rose-300 border border-rose-500/30 shadow-sm"
                : completedStages[1]
                ? "text-emerald-400 hover:bg-neutral-800/50"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            {completedStages[1] ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <span className="w-4 h-4 rounded-full bg-neutral-800 text-xs flex items-center justify-center font-mono">1</span>
            )}
            <span>1. Plain English</span>
          </button>

          <ChevronRight className="w-3 h-3 text-neutral-600" />

          <button
            onClick={() => onSelectStage(2)}
            disabled={!completedStages[1]}
            className={`flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              !completedStages[1]
                ? "text-neutral-600 cursor-not-allowed"
                : currentStage === 2
                ? "bg-rose-500/20 text-rose-300 border border-rose-500/30 shadow-sm"
                : completedStages[2]
                ? "text-emerald-400 hover:bg-neutral-800/50"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            {completedStages[2] ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <span className="w-4 h-4 rounded-full bg-neutral-800 text-xs flex items-center justify-center font-mono">2</span>
            )}
            <span>2. Atomic Syntax</span>
          </button>

          <ChevronRight className="w-3 h-3 text-neutral-600" />

          <button
            onClick={() => onSelectStage(3)}
            disabled={!completedStages[2]}
            className={`flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              !completedStages[2]
                ? "text-neutral-600 cursor-not-allowed"
                : currentStage === 3
                ? "bg-rose-500/20 text-rose-300 border border-rose-500/30 shadow-sm"
                : completedStages[3]
                ? "text-emerald-400 hover:bg-neutral-800/50"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            {completedStages[3] ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <span className="w-4 h-4 rounded-full bg-neutral-800 text-xs flex items-center justify-center font-mono">3</span>
            )}
            <span>3. Assembly & Tests</span>
          </button>
        </div>

        {/* Right tools / settings */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSettings}
            className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg border transition-all ${
              hasApiKey
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                : "bg-neutral-800/80 border-neutral-700 text-neutral-300 hover:bg-neutral-700/80 hover:text-white"
            }`}
            title="Configure Gemini API Key"
          >
            <Key className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{hasApiKey ? "AI Connected" : "Connect AI Key"}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
