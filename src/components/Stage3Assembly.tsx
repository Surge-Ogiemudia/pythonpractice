"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import { Problem, LintError, TestResult } from "@/types";
import { analyzePythonCode } from "@/lib/linter";
import { runPythonWithInput, getPyodideInstance } from "@/lib/pyodide";
import { 
  Play, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Check, 
  RotateCcw, 
  Terminal as TerminalIcon,
  Sparkles,
  Loader2,
  HelpCircle,
  PartyPopper,
  ExternalLink,
  Copy
} from "lucide-react";
import confetti from "canvas-confetti";

// Dynamically import Monaco Editor to avoid SSR window issues
const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

interface Stage3AssemblyProps {
  problem: Problem;
  initialCode: string;
  onCodeChange: (code: string) => void;
  onCompleteStage: () => void;
}

export const Stage3Assembly: React.FC<Stage3AssemblyProps> = ({
  problem,
  initialCode,
  onCodeChange,
  onCompleteStage,
}) => {
  const [code, setCode] = useState<string>(initialCode || "");
  const [activeTab, setActiveTab] = useState<"errors" | "tests" | "interactive">("errors");
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [copied, setCopied] = useState(false);

  // Interactive terminal state
  const [terminalOutput, setTerminalOutput] = useState<string[]>(["Python 3 WebAssembly Sandbox initialized.", "Type your fraction or test input below:"]);
  const [terminalInput, setTerminalInput] = useState<string>("");
  const [isExecutingInteractive, setIsExecutingInteractive] = useState(false);

  // Keep parent in sync
  useEffect(() => {
    onCodeChange(code);
  }, [code, onCodeChange]);

  // Real-time Static Linter
  const lintErrors: LintError[] = useMemo(() => {
    return analyzePythonCode(code, problem);
  }, [code, problem]);

  const errorCount = lintErrors.filter((e) => e.severity === "error").length;
  const warningCount = lintErrors.filter((e) => e.severity === "warning").length;
  const totalFriction = lintErrors.length;

  // Run automated CS50 test suite
  const handleRunAllTests = async () => {
    if (!code.trim()) return;
    setIsRunningTests(true);
    setActiveTab("tests");

    const results: TestResult[] = [];
    let allPassed = true;

    for (let i = 0; i < problem.testCases.length; i++) {
      const tc = problem.testCases[i];
      try {
        const run = await runPythonWithInput(code, tc.input);
        const passed = run.stdout.trim() === tc.expectedOutput.trim();
        if (!passed) allPassed = false;

        results.push({
          testIndex: i + 1,
          input: tc.input,
          expected: tc.expectedOutput,
          actual: run.stdout || (run.error ? `Error: ${run.error}` : ""),
          passed,
          error: run.error,
        });
      } catch (err: any) {
        allPassed = false;
        results.push({
          testIndex: i + 1,
          input: tc.input,
          expected: tc.expectedOutput,
          actual: `Failed: ${err.message}`,
          passed: false,
          error: err.message,
        });
      }
    }

    setTestResults(results);
    setIsRunningTests(false);

    if (allPassed && results.length > 0) {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });
      onCompleteStage();
    }
  };

  // Run interactive terminal input
  const handleInteractiveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalInput.trim() || isExecutingInteractive) return;

    const userInput = terminalInput;
    setTerminalInput("");
    setIsExecutingInteractive(true);

    setTerminalOutput((prev) => [...prev, `$ python ${problem.filename}`, `Input: ${userInput}`]);

    try {
      const result = await runPythonWithInput(code, userInput);
      if (result.stdout) {
        setTerminalOutput((prev) => [...prev, result.stdout]);
      }
      if (result.error) {
        setTerminalOutput((prev) => [...prev, `Traceback / Error: ${result.error}`]);
      }
    } catch (err: any) {
      setTerminalOutput((prev) => [...prev, `Error: ${err.message}`]);
    } finally {
      setIsExecutingInteractive(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInsertScaffolding = () => {
    if (problem.id === "fuel") {
      const template = `while True:
    try:
        fraction = input("Fraction: ")
        parts = fraction.split("/")
        x = int(parts[0])
        y = int(parts[1])

        if x > y or x < 0 or y <= 0:
            continue

        percentage = round((x / y) * 100)
        break

    except (ValueError, ZeroDivisionError):
        pass

if percentage <= 1:
    print("E")
elif percentage >= 99:
    print("F")
else:
    print(f"{percentage}%")
`;
      setCode(template);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header with live error counter badge */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold mb-2">
            <TerminalIcon className="w-3.5 h-3.5" />
            <span>Stage 3: Assembly Canvas & Live Test Harness</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Assemble, Indent & Test {problem.filename}
          </h1>
          <p className="text-neutral-400 text-xs sm:text-sm mt-1">
            Rearrange your snippets, wrap control flow (`while True`, `try/except`), and eliminate errors before submitting.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Real-time Friction Counter */}
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-mono text-xs font-bold transition-all ${
              totalFriction === 0
                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400 shadow-md shadow-emerald-500/10"
                : errorCount > 0
                ? "bg-rose-500/15 border-rose-500/40 text-rose-400 shadow-md shadow-rose-500/10"
                : "bg-amber-500/15 border-amber-500/40 text-amber-400"
            }`}
          >
            {totalFriction === 0 ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>0 ISSUES • ALL CLEAR!</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>
                  {totalFriction} {totalFriction === 1 ? "ISSUE" : "ISSUES"} REMAINING
                </span>
              </>
            )}
          </div>

          <button
            onClick={handleRunAllTests}
            disabled={isRunningTests}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer"
          >
            {isRunningTests ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Testing...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Run CS50 Tests</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Split Grid: Editor (Left) & Diagnostics/Terminal (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Monaco Editor Pane */}
        <div className="lg:col-span-7 bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="bg-neutral-950 px-4 py-2.5 border-b border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500/80" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="ml-2 text-xs font-mono text-neutral-400 font-medium">
                {problem.filename}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleInsertScaffolding}
                className="text-[11px] text-neutral-400 hover:text-rose-400 font-mono transition-colors"
                title="Format into working structure"
              >
                Structure Hint
              </button>
              <div className="h-3 w-px bg-neutral-800" />
              <button
                onClick={handleCopyCode}
                className="text-[11px] text-neutral-300 hover:text-white flex items-center gap-1 bg-neutral-800/80 px-2 py-1 rounded-md transition-colors"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? "Copied!" : "Copy Code"}</span>
              </button>
            </div>
          </div>

          <div className="h-[460px] bg-neutral-950 font-mono text-sm">
            <Editor
              height="100%"
              language="python"
              theme="vs-dark"
              value={code}
              onChange={(val) => setCode(val || "")}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                lineNumbers: "on",
                tabSize: 4,
                insertSpaces: true,
                automaticLayout: true,
                scrollBeyondLastLine: false,
                wordWrap: "on",
                fontFamily: "var(--font-geist-mono), monospace",
              }}
            />
          </div>
        </div>

        {/* Right Pane: Diagnostics, Automated Tests & Interactive Sandbox */}
        <div className="lg:col-span-5 bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[510px]">
          {/* Tabs */}
          <div className="bg-neutral-950 px-3 pt-2 border-b border-neutral-800 flex items-center gap-1">
            <button
              onClick={() => setActiveTab("errors")}
              className={`px-3 py-2 rounded-t-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === "errors"
                  ? "bg-neutral-900 text-white border-t border-x border-neutral-800"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Issues & Checklist ({totalFriction})</span>
            </button>

            <button
              onClick={() => setActiveTab("tests")}
              className={`px-3 py-2 rounded-t-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === "tests"
                  ? "bg-neutral-900 text-white border-t border-x border-neutral-800"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>CS50 Test Suite</span>
            </button>

            <button
              onClick={() => setActiveTab("interactive")}
              className={`px-3 py-2 rounded-t-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === "interactive"
                  ? "bg-neutral-900 text-white border-t border-x border-neutral-800"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              <TerminalIcon className="w-3.5 h-3.5 text-rose-400" />
              <span>Live Terminal</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
            {/* 1. Errors & Friction Tab */}
            {activeTab === "errors" && (
              <div className="space-y-3">
                {totalFriction === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                      <PartyPopper className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold text-white">No Friction Detected!</h3>
                    <p className="text-xs text-neutral-400 max-w-xs">
                      Your control flow, exception handling, and edge cases look structurally complete. Click <strong>Run CS50 Tests</strong> to verify execution.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {lintErrors.map((err) => (
                      <div
                        key={err.id}
                        className={`p-3 rounded-xl border text-xs leading-relaxed space-y-1 ${
                          err.severity === "error"
                            ? "bg-rose-950/20 border-rose-500/30 text-rose-200"
                            : "bg-amber-950/20 border-amber-500/30 text-amber-200"
                        }`}
                      >
                        <div className="flex items-center gap-2 font-bold">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              err.severity === "error" ? "bg-rose-500" : "bg-amber-500"
                            }`}
                          />
                          <span>{err.message}</span>
                        </div>
                        {err.fixHint && (
                          <p className="text-[11px] text-neutral-400 pl-4 font-mono">
                            Fix: {err.fixHint}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 2. Automated Test Results Tab */}
            {activeTab === "tests" && (
              <div className="space-y-3">
                {testResults.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                    <Play className="w-8 h-8 text-neutral-600" />
                    <p className="text-xs text-neutral-400">
                      Click the green <strong>Run CS50 Tests</strong> button above to test your code against standard test cases!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {testResults.map((r) => (
                      <div
                        key={r.testIndex}
                        className={`p-3 rounded-xl border text-xs flex items-start justify-between gap-3 ${
                          r.passed
                            ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-200"
                            : "bg-rose-950/20 border-rose-500/30 text-rose-200"
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 font-mono font-bold">
                            {r.passed ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <XCircle className="w-4 h-4 text-rose-400" />
                            )}
                            <span>Input: {r.input.replace("\n", "\\n")}</span>
                          </div>
                          <div className="text-[11px] text-neutral-400 pl-6 font-mono">
                            Expected: <span className="text-neutral-200">{r.expected}</span> | Got:{" "}
                            <span className={r.passed ? "text-emerald-300" : "text-rose-300 font-bold"}>
                              {r.actual || "(empty)"}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                            r.passed
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-rose-500/20 text-rose-400"
                          }`}
                        >
                          {r.passed ? "Passed" : "Failed"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 3. Interactive Terminal Tab */}
            {activeTab === "interactive" && (
              <div className="h-full flex flex-col justify-between font-mono text-xs">
                <div className="space-y-1 overflow-y-auto flex-1 pr-1 text-neutral-300 max-h-72">
                  {terminalOutput.map((line, idx) => (
                    <div key={idx} className="leading-relaxed">
                      {line}
                    </div>
                  ))}
                </div>

                <form onSubmit={handleInteractiveSubmit} className="mt-3 flex gap-2 pt-2 border-t border-neutral-800">
                  <span className="text-rose-400 font-bold self-center">&gt;</span>
                  <input
                    type="text"
                    value={terminalInput}
                    onChange={(e) => setTerminalInput(e.target.value)}
                    placeholder="Enter input (e.g. 3/4 or -3/4)..."
                    className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-200 focus:outline-none focus:border-rose-500"
                  />
                  <button
                    type="submit"
                    disabled={isExecutingInteractive}
                    className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold cursor-pointer"
                  >
                    Send
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Footer with cs50 submit command helper */}
          <div className="bg-neutral-950 px-4 py-2.5 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
            <span className="font-mono">submit50 cs50/problems/2022/python/{problem.id}</span>
            <span className="text-[11px] text-emerald-400 font-medium">Ready for CS50 Codespace</span>
          </div>
        </div>
      </div>
    </div>
  );
};
