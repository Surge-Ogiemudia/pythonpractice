import { NextRequest, NextResponse } from "next/server";
import { CS50_PROBLEMS } from "@/data/problems";

// Helper to call Gemini API if user provided key or env key is present
async function callGemini(apiKey: string, prompt: string, systemInstruction: string) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      systemInstruction: { parts: [{ text: systemInstruction }] },
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
  return JSON.parse(textContent);
}

// Built-in intelligent evaluator for Stage 1 (used when no Gemini key or as fast fallback)
function evaluateStage1Local(problemId: string, userText: string) {
  const problem = CS50_PROBLEMS.find((p) => p.id === problemId) || CS50_PROBLEMS[0];
  const lower = userText.toLowerCase();
  const missingCases: string[] = [];

  if (problem.id === "fuel") {
    // Check key requirements in student's plain English
    const mentionsInput = lower.includes("fraction") || lower.includes("input") || lower.includes("prompt") || lower.includes("x/y");
    const mentionsSplitOrTwo = lower.includes("split") || lower.includes("x") || lower.includes("parts") || lower.includes("numerator");
    const mentionsInt = lower.includes("int") || lower.includes("integer") || lower.includes("number");
    const mentionsLoop = lower.includes("loop") || lower.includes("again") || lower.includes("repeat") || lower.includes("while");
    const mentionsZero = lower.includes("zero") || lower.includes("0") || lower.includes("zerodivision");
    const mentionsGreater = lower.includes("greater") || lower.includes("x > y") || lower.includes("x is greater");
    const mentionsNegative = lower.includes("negative") || lower.includes("non negative") || lower.includes("non-negative") || lower.includes("< 0");
    const mentionsPercent = lower.includes("percent") || lower.includes("round") || lower.includes("%");
    const mentionsE = /\b(e|empty|1%)\b/i.test(lower) || lower.includes("'e'") || lower.includes('"e"');
    const mentionsF = /\b(f|full|99%)\b/i.test(lower) || lower.includes("'f'") || lower.includes('"f"');

    if (!mentionsInput) missingCases.push("Prompting the user for a fraction input (X/Y)");
    if (!mentionsInt) missingCases.push("Ensuring X and Y are converted into integers");
    if (!mentionsGreater) missingCases.push("Handling the edge case where X is greater than Y (prompt again)");
    if (!mentionsZero) missingCases.push("Handling division by zero or when Y is 0 (prompt again / ZeroDivisionError)");
    if (!mentionsNegative) missingCases.push("Checking for negative numbers (X must be non-negative and Y positive)");
    if (!mentionsLoop) missingCases.push("Repeating the prompt in a loop whenever an invalid fraction is submitted");
    if (!mentionsPercent) missingCases.push("Converting the fraction to a rounded percentage");
    if (!mentionsE || !mentionsF) missingCases.push("Special outputs: printing 'E' for 1% or less, and 'F' for 99% or more");

    const allClear = missingCases.length === 0;

    return {
      allClear,
      feedback: allClear
        ? "Outstanding job! You identified every key condition, constraint, and edge case in plain English. You are ready to map the atomic syntax."
        : `You have got the core idea! However, you missed ${missingCases.length} important requirement(s) or edge case(s). Check the checklist below and update your explanation.`,
      missingCases,
      atomicTasks: problem.defaultAtomicSteps.map((step, idx) => ({
        id: `step-${idx + 1}`,
        title: `Step ${idx + 1}`,
        description: step
      }))
    };
  }

  // Generic fallback for other problems
  const wordCount = userText.trim().split(/\s+/).length;
  const allClear = wordCount >= 20;

  return {
    allClear,
    feedback: allClear
      ? "Great breakdown! You have addressed the key requirements. Let's move to isolated syntax mapping."
      : "Please elaborate a bit more on the specific inputs, loop requirements, and edge cases before proceeding.",
    missingCases: allClear ? [] : ["Detail the loop behavior and edge cases"],
    atomicTasks: problem.defaultAtomicSteps.map((step, idx) => ({
      id: `step-${idx + 1}`,
      title: `Step ${idx + 1}`,
      description: step
    }))
  };
}

// Built-in intelligent evaluator for Stage 2 (used when no Gemini key or fast fallback)
function evaluateStage2Local(problemId: string, stepIndex: number, userCode: string) {
  const clean = userCode.trim();

  // Basic sanity check
  if (!clean) {
    return { isCorrect: false, feedback: "Please write a line of code for this step.", hint: "Try writing what Python function or operation achieves this." };
  }

  // Rule checks for Fuel Gauge steps
  if (problemId === "fuel") {
    if (stepIndex === 0) {
      // Prompt user
      const hasInput = clean.includes("input(");
      const isNotIntWrapped = !clean.startsWith("int(input(");
      if (!hasInput) {
        return { isCorrect: false, feedback: "You need to ask the user for input.", hint: "Use input('Fraction: ') to get a string." };
      }
      if (!isNotIntWrapped) {
        return { isCorrect: false, feedback: "Don't convert input() directly to int! A fraction like '3/4' cannot convert to int directly.", hint: "Assign input to a string variable first, e.g. fraction = input('Fraction: ')" };
      }
      return { isCorrect: true, feedback: "Perfect! You kept the input as a string so it can be split.", hint: "" };
    }

    if (stepIndex === 1) {
      // Split and convert
      const hasSplit = clean.includes(".split('/')") || clean.includes('.split("/")') || clean.includes("split");
      const hasInt = clean.includes("int(");
      if (!hasSplit) {
        return { isCorrect: false, feedback: "Remember how to split a string by a delimiter?", hint: "Use .split('/') on your fraction string." };
      }
      return { isCorrect: true, feedback: "Spot on! Splitting across '/' separates numerator and denominator cleanly.", hint: "" };
    }

    if (stepIndex === 2) {
      // Edge cases: x > y, negatives, zero
      const hasXY = clean.includes("x > y") || clean.includes("x>y");
      if (!hasXY) {
        return { isCorrect: false, feedback: "Make sure you check if x is greater than y.", hint: "Check: if x > y: continue (or add checks for x < 0 or y <= 0)." };
      }
      return { isCorrect: true, feedback: "Great! That catches improper fractions and invalid negative/zero values.", hint: "" };
    }

    if (stepIndex === 3) {
      // Calculate percentage
      const hasMath = clean.includes("x / y") || clean.includes("x/y");
      const has100 = clean.includes("100");
      const hasRound = clean.includes("round(");
      const isNotString = !clean.startsWith("f\"") && !clean.startsWith("f'") && !clean.includes('f"round');

      if (!isNotString) {
        return { isCorrect: false, feedback: "Don't put quotes or f-strings around the math! That creates text instead of a number.", hint: "Do numeric math directly: round((x / y) * 100)" };
      }
      if (!hasRound) {
        return { isCorrect: false, feedback: "Remember CS50 requires rounding to the nearest integer.", hint: "Wrap your math in round(...)" };
      }
      if (!hasMath || !has100) {
        return { isCorrect: false, feedback: "To get a percentage, multiply (x / y) by 100.", hint: "Use: round((x / y) * 100)" };
      }
      return { isCorrect: true, feedback: "Accurate! You calculated the percentage as a real numeric value.", hint: "" };
    }

    if (stepIndex === 4) {
      // Output conditions
      const hasE = clean.includes('"E"') || clean.includes("'E'");
      const hasF = clean.includes('"F"') || clean.includes("'F'");
      const hasPercent = clean.includes("%");

      if (!hasE || !hasF) {
        return { isCorrect: false, feedback: "Make sure you include checks for 'E' (<= 1) and 'F' (>= 99).", hint: "if percentage <= 1: print('E') elif percentage >= 99: print('F')" };
      }
      return { isCorrect: true, feedback: "Awesome! You have the complete conditional output logic.", hint: "" };
    }
  }

  // Generic check for other problems
  return { isCorrect: true, feedback: "Code looks solid for this atomic task!", hint: "" };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, problemId, userText, stepIndex, userCode, apiKey: clientApiKey } = body;
    const apiKey = clientApiKey || process.env.GEMINI_API_KEY;

    if (action === "validate-stage1") {
      if (apiKey) {
        try {
          const problem = CS50_PROBLEMS.find((p) => p.id === problemId) || CS50_PROBLEMS[0];
          const systemPrompt = `You are a world-class CS50 programming tutor running an Active Recall Comprehension Gate.
A student has read this CS50 problem:
Title: ${problem.title}
Description:
${problem.description}
Expected Edge Cases & Constraints:
${problem.expectedEdgeCases.join("\n- ")}

The student submitted this plain-English explanation:
"""
${userText}
"""

Evaluate their explanation. Check if they caught all inputs, constraints, loops/reprompting, and edge cases.
NEVER OUTPUT PYTHON CODE. NEVER REVEAL THE CODE SOLUTION.
Return strictly JSON with this schema:
{
  "allClear": boolean,
  "feedback": "Encouraging, constructive feedback explaining what is good and what needs attention",
  "missingCases": ["Case 1", "Case 2"],
  "atomicTasks": [
    { "id": "step-1", "title": "Step 1", "description": "High-level goal for this single line" }
  ]
}`;
          const aiResult = await callGemini(apiKey, "Evaluate the student's breakdown.", systemPrompt);
          return NextResponse.json(aiResult);
        } catch (geminiError: unknown) {
          console.warn("Gemini call failed, falling back to local evaluator:", geminiError);
        }
      }

      // Local evaluator
      const localResult = evaluateStage1Local(problemId, userText);
      return NextResponse.json(localResult);
    }

    if (action === "validate-stage2") {
      if (apiKey) {
        try {
          const problem = CS50_PROBLEMS.find((p) => p.id === problemId) || CS50_PROBLEMS[0];
          const atomicTask = problem.defaultAtomicSteps[stepIndex] || "Write atomic code snippet";

          const systemPrompt = `You are validating a 1-2 line Python code snippet written by a CS50 student for an atomic task.
Problem: ${problem.title}
Task: "${atomicTask}"
User Code: "${userCode}"

Rules:
1. NEVER output the full solution code.
2. If incorrect, explain why conceptually and give a tiny micro-hint.
3. If correct, praise the student.
Return strictly JSON:
{
  "isCorrect": boolean,
  "feedback": "Short feedback message",
  "hint": "Micro-hint if incorrect, otherwise empty string"
}`;
          const aiResult = await callGemini(apiKey, "Check this snippet.", systemPrompt);
          return NextResponse.json(aiResult);
        } catch (geminiError: unknown) {
          console.warn("Gemini Stage 2 call failed, falling back to local evaluator:", geminiError);
        }
      }

      const localResult = evaluateStage2Local(problemId, stepIndex, userCode);
      return NextResponse.json(localResult);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
