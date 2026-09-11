import { LintError, Problem } from "@/types";

export function analyzePythonCode(code: string, problem: Problem): LintError[] {
  const errors: LintError[] = [];
  const lines = code.split("\n");
  const trimmedCode = code.trim();

  if (!trimmedCode) {
    errors.push({
      id: "empty-code",
      message: "The code editor is empty.",
      severity: "error",
      fixHint: "Assemble your validated snippets from Stage 2 into the editor."
    });
    return errors;
  }

  // 1. Indentation & Syntax basic checks
  let insideBlock = false;
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;

    if (insideBlock) {
      if (!line.startsWith(" ") && !line.startsWith("\t") && !trimmed.startsWith("except") && !trimmed.startsWith("elif") && !trimmed.startsWith("else")) {
        // Did we drop indentation unexpectedly?
        // Only if previous line was a block header and not pass/return/break
      }
    }

    if (trimmed.endsWith(":")) {
      insideBlock = true;
    }

    // Check for common typo: '=' instead of '==' in comparisons
    if (/\bif\s+.*\b(?<![=><!])=(?![=><!]).*:/.test(trimmed)) {
      errors.push({
        id: `assignment-in-if-${lineNum}`,
        message: `Line ${lineNum}: Single '=' used in an 'if' condition (use '==' for comparison).`,
        severity: "error",
        line: lineNum,
        fixHint: "Replace '=' with '=='."
      });
    }

    // Check for missing colon after if, while, for, try, except, elif, else, def
    if (/^(if|while|for|elif|else|def|try)\b[^:]*$/.test(trimmed) && !trimmed.endsWith(":")) {
      errors.push({
        id: `missing-colon-${lineNum}`,
        message: `Line ${lineNum}: Missing colon ':' at the end of statement.`,
        severity: "error",
        line: lineNum,
        fixHint: "Add ':' at the end of the line."
      });
    }
  });

  // 2. Specific checks per problem
  if (problem.id === "fuel") {
    // Check 1: Loop
    if (!trimmedCode.includes("while True") && !trimmedCode.includes("while 1")) {
      errors.push({
        id: "fuel-missing-loop",
        message: "Missing re-prompt loop (while True:).",
        severity: "error",
        fixHint: "Wrap your input and validation logic in an infinite 'while True:' loop so it asks again on invalid fraction."
      });
    }

    // Check 2: Try / Except block
    if (!trimmedCode.includes("try:") || !trimmedCode.includes("except")) {
      errors.push({
        id: "fuel-missing-try-except",
        message: "Missing try...except block to catch invalid inputs.",
        severity: "error",
        fixHint: "Enclose input splitting and integer conversion inside a try...except block."
      });
    } else {
      if (!trimmedCode.includes("ValueError")) {
        errors.push({
          id: "fuel-missing-value-error",
          message: "ValueError is not caught in except clause.",
          severity: "error",
          fixHint: "Include ValueError in your except block: 'except (ValueError, ZeroDivisionError):'."
        });
      }
      if (!trimmedCode.includes("ZeroDivisionError") && !trimmedCode.includes("y == 0") && !trimmedCode.includes("y <= 0")) {
        errors.push({
          id: "fuel-missing-zero-error",
          message: "Zero division is not caught or handled.",
          severity: "error",
          fixHint: "Catch ZeroDivisionError in except or guard against y == 0."
        });
      }
    }

    // Check 3: Check x > y
    if (!trimmedCode.includes("x > y") && !trimmedCode.includes("int(x) > int(y)")) {
      errors.push({
        id: "fuel-missing-xy-check",
        message: "Missing check for when numerator X is greater than denominator Y.",
        severity: "warning",
        fixHint: "Add 'if x > y: continue' inside your loop to reprompt when X > Y."
      });
    }

    // Check 4: Check negative numbers
    if (!trimmedCode.includes("< 0") && !trimmedCode.includes("<= 0")) {
      errors.push({
        id: "fuel-missing-negative-check",
        message: "Negative fractions check is missing (e.g., -3/4 should re-prompt, not output 'E').",
        severity: "warning",
        fixHint: "Make sure to check if x < 0 or y <= 0 and continue the loop."
      });
    }

    // Check 5: Formatting space check
    if (/print\s*\(\s*percentage\s*,\s*["']%["']\s*\)/.test(trimmedCode)) {
      errors.push({
        id: "fuel-extra-space-print",
        message: "print(percentage, '%') adds an unwanted space ('75 %' instead of '75%').",
        severity: "error",
        fixHint: "Use an f-string: print(f'{percentage}%') or print(percentage, '%', sep='')."
      });
    }

    // Check 6: Check break
    if (trimmedCode.includes("while True") && !trimmedCode.includes("break")) {
      errors.push({
        id: "fuel-missing-break",
        message: "Loop never breaks out upon valid calculation.",
        severity: "error",
        fixHint: "Add 'break' once a valid percentage has been calculated successfully."
      });
    }

    // Check 7: Output conditions
    if (!trimmedCode.includes('"E"') && !trimmedCode.includes("'E'")) {
      errors.push({
        id: "fuel-missing-e",
        message: "Missing output 'E' for empty tank (<= 1%).",
        severity: "error",
        fixHint: "Add check 'if percentage <= 1: print(\"E\")'."
      });
    }
    if (!trimmedCode.includes('"F"') && !trimmedCode.includes("'F'")) {
      errors.push({
        id: "fuel-missing-f",
        message: "Missing output 'F' for full tank (>= 99%).",
        severity: "error",
        fixHint: "Add check 'elif percentage >= 99: print(\"F\")'."
      });
    }
  }

  if (problem.id === "coke") {
    if (!trimmedCode.includes("while") && !trimmedCode.includes("Amount Due")) {
      errors.push({
        id: "coke-missing-loop",
        message: "Missing loop to track remaining amount due.",
        severity: "error",
        fixHint: "Use a while loop that runs while amount_due > 0."
      });
    }
    if (!trimmedCode.includes("Change Owed")) {
      errors.push({
        id: "coke-missing-change",
        message: "Output must include 'Change Owed:'.",
        severity: "error",
        fixHint: "Print 'Change Owed: {abs(amount_due)}'."
      });
    }
  }

  if (problem.id === "taqueria") {
    if (!trimmedCode.includes("EOFError")) {
      errors.push({
        id: "taqueria-missing-eof",
        message: "Missing catch for EOFError (Ctrl-D).",
        severity: "error",
        fixHint: "Wrap input() in try...except EOFError: break."
      });
    }
    if (!trimmedCode.includes(".title()") && !trimmedCode.includes("title()")) {
      errors.push({
        id: "taqueria-missing-title",
        message: "Menu inputs should be case-insensitive (use .title()).",
        severity: "warning",
        fixHint: "Format user item input with item.title() to match dictionary keys."
      });
    }
  }

  return errors;
}
