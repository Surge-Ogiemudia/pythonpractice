export interface TestCase {
  input: string;
  expectedOutput: string;
  description: string;
}

export interface Problem {
  id: string;
  title: string;
  week: string;
  filename: string;
  description: string;
  requirements: string[];
  expectedEdgeCases: string[];
  hints: string[];
  testCases: TestCase[];
  defaultAtomicSteps: string[];
}

export interface AtomicTask {
  id: string;
  title: string;
  description: string;
  codeHint?: string;
  samplePattern?: string;
}

export interface Stage1Response {
  allClear: boolean;
  feedback: string;
  missingCases: string[];
  atomicTasks: AtomicTask[];
}

export interface Stage2Card {
  id: string;
  taskTitle: string;
  taskDescription: string;
  userCode: string;
  isCorrect: boolean;
  feedback: string;
  hint: string;
  attempts: number;
}

export interface LintError {
  id: string;
  message: string;
  severity: "error" | "warning";
  line?: number;
  fixHint?: string;
}

export interface TestResult {
  testIndex: number;
  input: string;
  expected: string;
  actual: string;
  passed: boolean;
  error?: string;
}

export interface UserSettings {
  geminiApiKey: string;
  model: string;
}
