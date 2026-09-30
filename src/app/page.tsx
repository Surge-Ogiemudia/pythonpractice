"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Problem, AtomicTask, Stage1State, Stage2Card, Stage3Review, UserSettings } from "@/types";
import { Navbar } from "@/components/Navbar";
import { SettingsModal, DEFAULT_MODEL } from "@/components/SettingsModal";
import { ProblemSetup } from "@/components/ProblemSetup";
import { Stage1Comprehension } from "@/components/Stage1Comprehension";
import { Stage2AtomicMapping } from "@/components/Stage2AtomicMapping";
import { Stage3Assembly } from "@/components/Stage3Assembly";

type Stage = 1 | 2 | 3;

interface Session {
  problem: Problem | null;
  currentStage: Stage;
  completedStages: { 1: boolean; 2: boolean; 3: boolean };
  userText: string;
  stage1: Stage1State;
  atomicTasks: AtomicTask[];
  stage2Cards: Stage2Card[];
  stage2Code: string;
  code: string;
  review: Stage3Review | null;
}

const EMPTY_SESSION: Session = {
  problem: null,
  currentStage: 1,
  completedStages: { 1: false, 2: false, 3: false },
  userText: "",
  stage1: { attempts: 0, previousText: "", result: null },
  atomicTasks: [],
  stage2Cards: [],
  stage2Code: "",
  code: "",
  review: null,
};

const SESSION_KEY = "cs50_tutor_session";
const SETTINGS_KEY = "cs50_tutor_settings";

// localStorage can throw (private mode, blocked storage), so progress saving is best-effort
function load<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

export default function Home() {
  const [session, setSession] = useState<Session>(EMPTY_SESSION);
  const [settings, setSettings] = useState<UserSettings>({
    geminiApiKey: "",
    model: DEFAULT_MODEL,
  });
  const [loaded, setLoaded] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Restore saved progress and settings after mount (localStorage isn't available during SSR)
  useEffect(() => {
    const savedSession = load<Session>(SESSION_KEY);
    const savedSettings = load<UserSettings>(SETTINGS_KEY);
    /* eslint-disable react-hooks/set-state-in-effect */
    if (savedSession) setSession({ ...EMPTY_SESSION, ...savedSession });
    if (savedSettings)
      setSettings({
        geminiApiKey: savedSettings.geminiApiKey || "",
        model: savedSettings.model || DEFAULT_MODEL,
      });
    setLoaded(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    if (loaded) save(SESSION_KEY, session);
  }, [session, loaded]);

  const update = useCallback((patch: Partial<Session>) => setSession((prev) => ({ ...prev, ...patch })), []);

  const handleSaveSettings = (next: UserSettings) => {
    setSettings(next);
    save(SETTINGS_KEY, next);
  };

  const handleStart = (problem: Problem) => setSession({ ...EMPTY_SESSION, problem });

  const handleNewProblem = () => {
    if (window.confirm("Start a new problem? Your progress on this one will be cleared.")) {
      setSession(EMPTY_SESSION);
    }
  };

  // Revisiting Stage 1 after passing it just moves on, keeping Stage 2 work
  const handleStage1Approved = (tasks: AtomicTask[]) =>
    setSession((prev) =>
      prev.completedStages[1]
        ? { ...prev, currentStage: 2 }
        : {
            ...prev,
            atomicTasks: tasks,
            stage2Cards: [],
            completedStages: { ...prev.completedStages, 1: true },
            currentStage: 2,
          },
    );

  const handleStage2Done = (program: string) =>
    setSession((prev) => ({
      ...prev,
      stage2Code: program,
      code: program,
      review: null,
      completedStages: { ...prev.completedStages, 2: true },
      currentStage: 3,
    }));

  const setStage2Cards: React.Dispatch<React.SetStateAction<Stage2Card[]>> = useCallback(
    (action) =>
      setSession((prev) => ({
        ...prev,
        stage2Cards: typeof action === "function" ? action(prev.stage2Cards) : action,
      })),
    [],
  );

  const setCode = useCallback((code: string) => update({ code }), [update]);

  const { problem, currentStage } = session;
  const hasApiKey = Boolean(settings.geminiApiKey);
  const aiProps = { apiKey: settings.geminiApiKey, model: settings.model };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col selection:bg-rose-500 selection:text-white">
      <Navbar
        problem={problem}
        onNewProblem={handleNewProblem}
        currentStage={currentStage}
        onSelectStage={(stage) => update({ currentStage: stage })}
        completedStages={session.completedStages}
        onOpenSettings={() => setIsSettingsOpen(true)}
        hasApiKey={hasApiKey}
      />

      <main className="flex-1 pb-16">
        {!loaded ? null : !problem ? (
          <ProblemSetup onStart={handleStart} hasApiKey={hasApiKey} onOpenSettings={() => setIsSettingsOpen(true)} />
        ) : (
          <>
            {currentStage === 1 && (
              <Stage1Comprehension
                problem={problem}
                userText={session.userText}
                setUserText={(userText) => update({ userText })}
                state={session.stage1}
                setState={(stage1) => update({ stage1 })}
                onApprove={handleStage1Approved}
                {...aiProps}
              />
            )}

            {currentStage === 2 && (
              <Stage2AtomicMapping
                problem={problem}
                atomicTasks={session.atomicTasks}
                cards={session.stage2Cards}
                setCards={setStage2Cards}
                onProceedToAssembly={handleStage2Done}
                {...aiProps}
              />
            )}

            {currentStage === 3 && (
              <Stage3Assembly
                problem={problem}
                code={session.code}
                onCodeChange={setCode}
                stage2Code={session.stage2Code}
                review={session.review}
                setReview={(review) => update({ review })}
                onCompleteStage={() =>
                  setSession((prev) => ({
                    ...prev,
                    completedStages: { ...prev.completedStages, 3: true },
                  }))
                }
                {...aiProps}
              />
            )}
          </>
        )}
      </main>

      {isSettingsOpen && (
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          onSave={handleSaveSettings}
          current={settings}
        />
      )}
    </div>
  );
}
