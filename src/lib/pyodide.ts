// In-browser Pyodide runner and test harness

// The small slice of the Pyodide API this app uses
interface Pyodide {
  runPythonAsync: (code: string) => Promise<{ toJs: () => [string, string, string | null] }>;
}

declare global {
  interface Window {
    loadPyodide?: (config: { indexURL: string }) => Promise<Pyodide>;
    pyodideInstance?: Pyodide;
  }
}

let pyodidePromise: Promise<Pyodide> | null = null;

export async function getPyodideInstance(): Promise<Pyodide | null> {
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
 * Runs Python code with mock stdin (one line per input() call)
 */
export async function runPythonWithInput(code: string, stdinText: string, filename = "main.py"): Promise<RunResult> {
  const pyodide = await getPyodideInstance();
  if (!pyodide) {
    throw new Error("Pyodide is not available");
  }

  // Runs the student's code with exec() so it behaves like `python file.py`:
  // __name__ is "__main__", multi-line strings are untouched, and sys.exit() is handled.
  const stdin = stdinText.endsWith("\n") ? stdinText : stdinText + "\n";
  const wrappedCode = `
import sys, io, traceback

_stdin_backup, _stdout_backup, _stderr_backup = sys.stdin, sys.stdout, sys.stderr
sys.stdin = io.StringIO(${JSON.stringify(stdin)})
sys.stdout = io.StringIO()
sys.stderr = io.StringIO()

_err = None
try:
    exec(compile(${JSON.stringify(code)}, ${JSON.stringify(filename)}, "exec"), {"__name__": "__main__"})
except SystemExit as e:
    if e.code not in (None, 0):
        _err = str(e.code)
except EOFError:
    _err = "EOFError: the program asked for more input than was given"
except BaseException:
    _err = traceback.format_exc(limit=-3)
finally:
    _out = sys.stdout.getvalue()
    _err_out = sys.stderr.getvalue()
    sys.stdin, sys.stdout, sys.stderr = _stdin_backup, _stdout_backup, _stderr_backup

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
  } catch (err: unknown) {
    return {
      stdout: "",
      stderr: "",
      error: err instanceof Error ? err.message : String(err)
    };
  }
}
