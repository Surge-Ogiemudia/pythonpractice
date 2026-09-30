import { NextRequest, NextResponse } from "next/server";

const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-flash-latest";

const TUTOR_RULES = `You are a patient CS50P (Harvard's Introduction to Programming with Python) tutor.
The student learns by: explaining the problem in plain English, then writing the program one small step at a time, then assembling it.
NEVER write the full solution code unless explicitly told you may. Give hints, not answers.
Keep language simple and encouraging. Respond ONLY with JSON matching the schema you are given.`;

async function callGemini(apiKey: string, model: string, prompt: string) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      systemInstruction: { parts: [{ text: TUTOR_RULES }] },
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${errorText.slice(0, 300)}`);
  }

  const data = await response.json();
  const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!textContent) throw new Error("Gemini returned an empty response. Try again.");
  return JSON.parse(textContent);
}

function stage1Prompt(problemText: string, userText: string, attempts: number, previousOrder: string[]) {
  const retryNote =
    attempts > 0 && previousOrder.length > 0
      ? `This is attempt ${attempts + 1}. On the last attempt the student was shown this correct order:
${previousOrder.map((s, i) => `${i + 1}. ${s}`).join("\n")}
They must now re-explain it IN THEIR OWN WORDS. Wording can differ, but every point must be present and in that order.`
      : "This is the student's first attempt.";

  return `PROBLEM SET:
"""
${problemText}
"""

STUDENT'S PLAIN-ENGLISH EXPLANATION OF HOW TO SOLVE IT:
"""
${userText}
"""

${retryNote}

Judge the explanation strictly on two things:
1. COMPLETENESS: every input, re-prompt loop, condition, edge case, error to catch, and output format the solution needs.
2. ORDER: the points must be in the order the program actually executes them. The order the problem statement describes things is often NOT the order of the solution (for example, the loop and error handling that wrap the input come first even if the problem mentions them last). If the order is wrong, that alone means allClear is false.

allClear is true only if nothing is missing AND the order is right.

"correctOrder" is the complete solution plan as a numbered sequence of plain-English sentences, in execution order. No Python code in it. Always fill it in.

"atomicTasks" is the plan broken into small coding steps for the next stage. Rules for atomicTasks:
- They are in the exact top-to-bottom order of lines in the final program file.
- Each covers 1 to 4 consecutive lines. Block headers like "while True:", "try:", "def main():" can be their own step.
- If you concatenate the code for every step in order, you get the complete, runnable program. Nothing may be missing between steps.
- "indent" is the number of spaces the step's first line starts at in the final program (0, 4, 8, ...).
- "description" says what the lines do in plain English, without giving the code. Mention when the lines sit inside a loop, try block, or function.
Always fill in atomicTasks, even when allClear is false.

"feedback": 2 to 4 sentences. Say what they got right, then what to fix. If allClear is false, tell them to study the correct order and rewrite it in their own words.
"missingPoints": each thing they left out (empty if none).
"orderIssues": each thing that is in the wrong place, saying where it belongs (empty if none).

Return JSON:
{
  "allClear": boolean,
  "feedback": string,
  "missingPoints": string[],
  "orderIssues": string[],
  "correctOrder": string[],
  "atomicTasks": [{ "id": "step-1", "title": "short title", "description": string, "indent": number }]
}`;
}

function stage2Prompt(
  problemText: string,
  steps: { title: string; description: string; indent: number }[],
  stepIndex: number,
  codeSoFar: string,
  userCode: string
) {
  const step = steps[stepIndex];
  return `PROBLEM SET:
"""
${problemText}
"""

THE STUDENT IS BUILDING THE PROGRAM ONE STEP AT A TIME. ALL STEPS:
${steps.map((s, i) => `${i + 1}. ${s.title}: ${s.description} (starts at indent ${s.indent})`).join("\n")}

CODE ALREADY WRITTEN AND APPROVED (steps 1 to ${stepIndex}), exactly as it appears at the top of the file:
\`\`\`python
${codeSoFar || "# (nothing yet, this is the first step)"}
\`\`\`

CURRENT STEP ${stepIndex + 1}: ${step.title}: ${step.description}
Expected to start at indent ${step.indent}.

STUDENT'S CODE FOR THIS STEP (will be placed directly after the approved code):
\`\`\`python
${userCode}
\`\`\`

Check that:
- It does what this step describes. Not less, and not work that belongs to a later step.
- It is valid Python and correctly indented for where it sits after the approved code.
- It is consistent with names and variables used in the approved code.
Minor style differences are fine if the code is correct.

If wrong, explain the problem conceptually and give a small hint. Do NOT write the corrected code.
If right, briefly say why it works.

Return JSON:
{ "isCorrect": boolean, "feedback": string, "hint": string }
("hint" is an empty string when correct.)`;
}

function stage3Prompt(problemText: string, code: string) {
  return `PROBLEM SET:
"""
${problemText}
"""

THE STUDENT'S COMPLETE PROGRAM:
\`\`\`python
${code}
\`\`\`

Review it as CS50's check50 would: does it meet every requirement of the problem set, including exact output format, re-prompting, edge cases, and exceptions?

If it is NOT correct: set isCorrect false, list each problem in "issues" as a hint (never the fixed code), and leave betterVersion and betterExplanation empty.
If it IS correct: set isCorrect true, and now you MAY show code. Put a shorter or cleaner version of their solution in "betterVersion" and explain in "betterExplanation" what is different and why it is better, so they learn the idioms. If their version is already clean, say so and leave betterVersion empty.

Return JSON:
{ "isCorrect": boolean, "feedback": string, "issues": string[], "betterVersion": string, "betterExplanation": string }`;
}

// Gemini occasionally drops fields; fill them so the UI never crashes on a missing array
const asStrings = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : []);

function normalizeStage1(r: Record<string, unknown>) {
  const tasks = Array.isArray(r.atomicTasks) ? r.atomicTasks : [];
  return {
    allClear: Boolean(r.allClear),
    feedback: String(r.feedback ?? ""),
    missingPoints: asStrings(r.missingPoints),
    orderIssues: asStrings(r.orderIssues),
    correctOrder: asStrings(r.correctOrder),
    atomicTasks: tasks.map((t: Record<string, unknown>, i: number) => ({
      id: `step-${i + 1}`,
      title: String(t.title ?? `Step ${i + 1}`),
      description: String(t.description ?? ""),
      indent: Number(t.indent) || 0,
    })),
  };
}

function normalizeStage2(r: Record<string, unknown>) {
  return { isCorrect: Boolean(r.isCorrect), feedback: String(r.feedback ?? ""), hint: String(r.hint ?? "") };
}

function normalizeStage3(r: Record<string, unknown>) {
  return {
    isCorrect: Boolean(r.isCorrect),
    feedback: String(r.feedback ?? ""),
    issues: asStrings(r.issues),
    betterVersion: String(r.betterVersion ?? ""),
    betterExplanation: String(r.betterExplanation ?? ""),
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, problemText, apiKey: clientApiKey, model: clientModel } = body;
    const apiKey = clientApiKey || process.env.GEMINI_API_KEY;
    const model = clientModel || DEFAULT_MODEL;

    if (!apiKey) {
      return NextResponse.json(
        { error: "No Gemini API key. Add one with the key button in the top right." },
        { status: 400 }
      );
    }
    if (!problemText || typeof problemText !== "string") {
      return NextResponse.json({ error: "Missing problem set text." }, { status: 400 });
    }

    if (action === "stage1") {
      const { userText, attempts = 0, previousOrder = [] } = body;
      const result = await callGemini(apiKey, model, stage1Prompt(problemText, userText, attempts, previousOrder));
      return NextResponse.json(normalizeStage1(result));
    }

    if (action === "stage2") {
      const { steps, stepIndex, codeSoFar, userCode } = body;
      if (!Array.isArray(steps) || !steps[stepIndex]) {
        return NextResponse.json({ error: "Invalid step." }, { status: 400 });
      }
      const result = await callGemini(apiKey, model, stage2Prompt(problemText, steps, stepIndex, codeSoFar, userCode));
      return NextResponse.json(normalizeStage2(result));
    }

    if (action === "stage3") {
      const { code } = body;
      const result = await callGemini(apiKey, model, stage3Prompt(problemText, code));
      return NextResponse.json(normalizeStage3(result));
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
