import { LintError } from "@/types";

// Quick beginner-mistake checks. Real correctness is checked by the tutor review and check50.
export function analyzePythonCode(code: string): LintError[] {
  const errors: LintError[] = [];
  const lines = code.split("\n");
  const trimmedCode = code.trim();

  if (!trimmedCode) {
    errors.push({
      id: "empty-code",
      message: "The code editor is empty.",
      severity: "error",
      fixHint: "Your approved Stage 2 code should appear here."
    });
    return errors;
  }

  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;

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

  return errors;
}
