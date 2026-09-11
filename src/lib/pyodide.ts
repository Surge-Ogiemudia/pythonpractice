// In-browser Pyodide runner and test harness

declare global {
  interface Window {
    loadPyodide?: (config: { indexURL: string }) => Promise<any>;
    pyodideInstance?: any;
  }
}

let pyodidePromise: Promise<any> | null = null;

export async function getPyodideInstance(): Promise<any> {
  if (typeof window === "undefined") return null;

  if (window.pyodideInstance) {
    return window.pyodideInstance;
  }

  if (pyodidePromise) {
    return pyodidePromise;
  }

  pyodidePromise = new Promise(async (resolve, reject) => {
    try {
      if (!window.loadPyodide) {
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js";
        script.async = true;
        document.head.appendChild(script);

        await new Promise((res, rej) => {
          script.onload = res;
          script.onerror = rej;
        });
      }

      if (window.loadPyodide) {
        const pyodide = await window.loadPyodide({
          indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/"
        });
        window.pyodideInstance = pyodide;
        resolve(pyodide);
      } else {
        reject(new Error("Failed to load Pyodide script"));
      }
    } catch (err) {
      reject(err);
    }
  });

  return pyodidePromise;
}

export interface RunResult {
  stdout: string;
  stderr: string;
  error?: string;
}

/**
 * Runs Python code with mock stdin inputs (e.g. for testing automated test cases)
 */
export async function runPythonWithInput(code: string, stdinText: string): Promise<RunResult> {
  const pyodide = await getPyodideInstance();
  if (!pyodide) {
    throw new Error("Pyodide is not available");
  }

  // Python wrapper to redirect sys.stdin and sys.stdout safely
  const wrappedCode = `
import sys
import io

_stdin_backup = sys.stdin
_stdout_backup = sys.stdout
_stderr_backup = sys.stderr

sys.stdin = io.StringIO(${JSON.stringify(stdinText.endsWith("\n") ? stdinText : stdinText + "\n")})
sys.stdout = io.StringIO()
sys.stderr = io.StringIO()

_err = None
try:
${code.split("\n").map(line => "    " + line).join("\n")}
except Exception as e:
    _err = str(e)
finally:
    _out = sys.stdout.getvalue()
    _err_out = sys.stderr.getvalue()
    sys.stdin = _stdin_backup
    sys.stdout = _stdout_backup
    sys.stderr = _stderr_backup

(_out, _err_out, _err)
`;

  try {
    const result = await pyodide.runPythonAsync(wrappedCode);
    const [stdout, stderr, runtimeError] = result.toJs();
    return {
      stdout: stdout ? stdout.trim() : "",
      stderr: stderr ? stderr.trim() : "",
      error: runtimeError || undefined
    };
  } catch (err: any) {
    return {
      stdout: "",
      stderr: "",
      error: err?.message || String(err)
    };
  }
}
