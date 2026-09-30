// A problem set pasted in by the student
export interface Problem {
  title: string;
  filename: string;
  text: string;
}

export interface AtomicTask {
  id: string;
  title: string;
  description: string;
  // Spaces this step's first line starts at in the final program
  indent: number;
}

export interface Stage1Response {
  allClear: boolean;
  feedback: string;
  missingPoints: string[];
  orderIssues: string[];
  // The full solution plan in the order the code runs, in plain English
  correctOrder: string[];
  atomicTasks: AtomicTask[];
}

export interface Stage1State {
  attempts: number;
  previousText: string;
  result: Stage1Response | null;
}

export interface Stage2Card {
  id: string;
  taskTitle: string;
  taskDescription: string;
  indent: number;
  userCode: string;
  isCorrect: boolean;
  feedback: string;
  hint: string;
  attempts: number;
}

export interface Stage3Review {
  isCorrect: boolean;
  feedback: string;
  issues: string[];
  betterVersion: string;
  betterExplanation: string;
}

export interface LintError {
  id: string;
  message: string;
  severity: "error" | "warning";
  line?: number;
  fixHint?: string;
}

export interface UserSettings {
  geminiApiKey: string;
  model: string;
}
