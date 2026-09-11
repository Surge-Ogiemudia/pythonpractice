"use client";

import React, { useState, useEffect } from "react";
import { CS50_PROBLEMS } from "@/data/problems";
import { Problem, AtomicTask, Stage2Card } from "@/types";
import { Navbar } from "@/components/Navbar";
import { SettingsModal } from "@/components/SettingsModal";
import { Stage1Comprehension } from "@/components/Stage1Comprehension";
import { Stage2AtomicMapping } from "@/components/Stage2AtomicMapping";
import { Stage3Assembly } from "@/components/Stage3Assembly";

export default function Home() {
  const [currentProblem, setCurrentProblem] = useState<Problem>(CS50_PROBLEMS[0]);
  const [currentStage, setCurrentStage] = useState<1 | 2 | 3>(1);
  const [completedStages, setCompletedStages] = useState<{ 1: boolean; 2: boolean; 3: boolean }>({
    1: false,
    2: false,
    3: false,
  });

  // Stage 1 State
  const [userText, setUserText] = useState<string>("");
  const [atomicTasks, setAtomicTasks] = useState<AtomicTask[]>([]);

  // Stage 2 State
  const [stage2Cards, setStage2Cards] = useState<Stage2Card[]>([]);

  // Stage 3 State
  const [assembledCode, setAssembledCode] = useState<string>("");

  // Settings & Gemini API key
  const [apiKey, setApiKey] = useState<string>("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Load API key from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("cs50_gemini_key");
    if (saved) setApiKey(saved);
  }, []);

  const handleSaveKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem("cs50_gemini_key", key);
  };

  // Reset states when changing problem
  const handleSelectProblem = (problem: Problem) => {
    setCurrentProblem(problem);
    setCurrentStage(1);
    setCompletedStages({ 1: false, 2: false, 3: false });
    setUserText("");
    setAtomicTasks([]);
    setStage2Cards([]);
    setAssembledCode("");
  };

  // When Stage 1 is cleared
  const handleStage1Approved = (tasks: AtomicTask[]) => {
    setAtomicTasks(tasks);
    setCompletedStages((prev) => ({ ...prev, 1: true }));
    setCurrentStage(2);
  };

  // When Stage 2 is cleared
  const handleStage2ProceedToAssembly = (compiledSnippets: string) => {
    setAssembledCode(compiledSnippets);
    setCompletedStages((prev) => ({ ...prev, 2: true }));
    setCurrentStage(3);
  };

  const handleStage3Completed = () => {
    setCompletedStages((prev) => ({ ...prev, 3: true }));
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col selection:bg-rose-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        currentProblem={currentProblem}
        onSelectProblem={handleSelectProblem}
        currentStage={currentStage}
        onSelectStage={(stage) => setCurrentStage(stage)}
        completedStages={completedStages}
        onOpenSettings={() => setIsSettingsOpen(true)}
        hasApiKey={Boolean(apiKey)}
      />

      {/* Main Stage Workspace */}
      <main className="flex-1 pb-16">
        {currentStage === 1 && (
          <Stage1Comprehension
            problem={currentProblem}
            userText={userText}
            setUserText={setUserText}
            onApprove={handleStage1Approved}
            apiKey={apiKey}
          />
        )}

        {currentStage === 2 && (
          <Stage2AtomicMapping
            problem={currentProblem}
            atomicTasks={atomicTasks.length > 0 ? atomicTasks : currentProblem.defaultAtomicSteps.map((s, i) => ({ id: `step-${i+1}`, title: `Step ${i+1}`, description: s }))}
            cards={stage2Cards}
            setCards={setStage2Cards}
            onProceedToAssembly={handleStage2ProceedToAssembly}
            apiKey={apiKey}
          />
        )}

        {currentStage === 3 && (
          <Stage3Assembly
            problem={currentProblem}
            initialCode={assembledCode}
            onCodeChange={setAssembledCode}
            onCompleteStage={handleStage3Completed}
          />
        )}
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSaveKey={handleSaveKey}
        currentKey={apiKey}
      />
    </div>
  );
}
