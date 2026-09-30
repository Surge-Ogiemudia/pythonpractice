"use client";

import React, { useState } from "react";
import { Problem } from "@/types";
import { ClipboardPaste, ArrowRight, Key } from "lucide-react";

interface ProblemSetupProps {
  onStart: (problem: Problem) => void;
  hasApiKey: boolean;
  onOpenSettings: () => void;
}

// Guess a title and filename from the pasted text (CS50 pages start with the title
// and name the file, e.g. "In a file called fuel.py")
function parseProblem(text: string): Problem {
  const firstLine = text.split("\n").map((l) => l.trim()).find(Boolean) || "Problem";
  const filenameMatch = text.match(/\b([\w-]+\.py)\b/);
  return {
    title: firstLine.length > 60 ? firstLine.slice(0, 57) + "..." : firstLine,
    filename: filenameMatch ? filenameMatch[1] : "main.py",
    text: text.trim(),
  };
}

export const ProblemSetup: React.FC<ProblemSetupProps> = ({ onStart, hasApiKey, onOpenSettings }) => {
  const [text, setText] = useState("");

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold mb-3">
        <ClipboardPaste className="w-3.5 h-3.5" />
        <span>New Problem</span>
      </div>
      <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Paste your problem set</h1>
      <p className="text-neutral-400 text-sm mt-2">
        Copy the whole problem from the CS50P site, title included, and paste it below. The tutor will take you
        through it: explain it in plain English, write it step by step, then assemble and run it.
      </p>

      {!hasApiKey && (
        <button
          onClick={onOpenSettings}
          className="mt-6 w-full p-4 rounded-xl bg-amber-950/20 border border-amber-500/40 text-amber-300 text-sm flex items-center gap-3 text-left cursor-pointer hover:bg-amber-950/40"
        >
          <Key className="w-5 h-5 shrink-0" />
          <span>The tutor runs on Gemini. Add your free Gemini API key first (click here).</span>
        </button>
      )}

      <textarea
        rows={16}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={"Fuel Gauge\n\nFuel gauges indicate, often with fractions, just how much fuel is in a tank...\n\nIn a file called fuel.py, implement a program that..."}
        className="mt-6 w-full bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-sm text-neutral-200 focus:outline-none focus:border-rose-500 leading-relaxed resize-y custom-scrollbar"
      />

      <div className="mt-4 flex justify-end">
        <button
          onClick={() => onStart(parseProblem(text))}
          disabled={text.trim().length < 40}
          className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-sm font-semibold transition-all flex items-center gap-2 shadow-lg shadow-rose-600/20 cursor-pointer"
        >
          <span>Start</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
