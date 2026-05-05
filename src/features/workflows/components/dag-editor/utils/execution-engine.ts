import type {
  NodeSettings,
  LogEntry,
  NodeRunResult,
  ExecutionContext,
} from "../types";
import {
  interpolateTemplate,
  interpolateExpression,
} from "./template-interpolation";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Small sleep helper for retry backoff */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Compute backoff delay for a given retry attempt */
export function computeBackoffDelay(
  settings: NodeSettings,
  attempt: number,
): number {
  const base = settings.backoffDelayMs;
  switch (settings.backoffStrategy) {
    case "linear":
      return base * attempt;
    case "exponential":
      return base * Math.pow(2, attempt - 1);
    case "fixed":
    default:
      return base;
  }
}

// ---------------------------------------------------------------------------
// Shared node executor — used by both Add and Edit run flows
// ---------------------------------------------------------------------------

export async function executeNodeByType(
  nodeType: string,
  config: Record<string, unknown>,
  context: ExecutionContext = { variables: {}, inputs: [] },
): Promise<Omit<NodeRunResult, "startedAt"> & { startedAt: string }> {
  const startedAt = new Date().toISOString();
  const startTime = performance.now();
  const logs: LogEntry[] = [];

  const pushLog = (level: LogEntry["level"], message: string) => {
    logs.push({ timestamp: new Date().toISOString(), level, message });
  };

  const finish = (success: boolean, output: unknown): NodeRunResult => ({
    status: success ? "SUCCESS" : "FAILED",
    durationMs: Math.round(performance.now() - startTime),
    startedAt,
    output,
    logs,
  });

  pushLog("info", `Starting ${nodeType} execution...`);

  // ── HTTP Call ──
  if (nodeType === "http_call") {
    const method = String(config.method ?? "GET");
    const urlRaw = String(config.url ?? "");
    const url = interpolateTemplate(urlRaw, context.variables);
    let parsedHeaders: Record<string, string>;

    try {
      const headersRaw = String(config.headers ?? "{}").trim();
      const headersInterpolated = interpolateTemplate(
        headersRaw,
        context.variables,
      );
      // Use Function constructor instead of JSON.parse to allow trailing commas and single quotes
       
      const parseFn = new Function(`return (${headersInterpolated || "{}"})`);
      parsedHeaders = parseFn() as Record<string, string>;
    } catch {
      parsedHeaders = {};
      pushLog("warn", "Could not parse headers JSON, using empty headers");
    }

    pushLog("info", `${method} ${url}`);
    pushLog("info", "Sending request...");

    try {
      const bodyRaw = String(config.body ?? "").trim();
      const body = interpolateTemplate(bodyRaw, context.variables);

      // Auto-set Content-Type if body looks like JSON and not already set
      if (body && method !== "GET" && method !== "HEAD") {
        const hasContentType = Object.keys(parsedHeaders).some(
          (k) => k.toLowerCase() === "content-type",
        );
        if (!hasContentType && (body.startsWith("{") || body.startsWith("["))) {
          parsedHeaders["Content-Type"] = "application/json";
          pushLog("info", "Auto-set Content-Type: application/json");
        }
      }

      const fetchOpts: RequestInit = { method, headers: parsedHeaders };
      if (body && method !== "GET" && method !== "HEAD") {
        fetchOpts.body = body;
      }

      const res = await fetch(url, fetchOpts);

      pushLog(
        res.ok ? "info" : "warn",
        `Received response: ${res.status} ${res.statusText}`,
      );

      let responseBody: unknown;
      const ct = res.headers.get("content-type") ?? "";
      try {
        responseBody = ct.includes("application/json")
          ? await res.json()
          : await res.text();
      } catch {
        responseBody = "(Could not read response body)";
      }

      const resHeaders: Record<string, string> = {};
      res.headers.forEach((v, k) => {
        resHeaders[k] = v;
      });

      pushLog(
        res.ok ? "info" : "error",
        res.ok
          ? "Execution completed successfully"
          : `Request failed with status ${res.status}`,
      );

      return finish(res.ok, {
        statusCode: res.status,
        statusText: res.statusText,
        headers: resHeaders,
        body: responseBody,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      pushLog("error", `Request failed: ${msg}`);
      pushLog("error", "Execution failed");
      return finish(false, { error: true, message: msg });
    }
  }

  // ── Script Execution ──
  if (nodeType === "script_execution") {
    const language = String(config.language ?? "javascript");
    const script = String(config.script ?? "");

    pushLog("info", `Language: ${language}`);

    if (language === "shell") {
      pushLog("error", "Shell execution is not supported in the browser.");
      pushLog("error", "Execution failed");
      return finish(false, {
        error: true,
        message: "Shell requires a backend runtime.",
      });
    }

    if (language === "python") {
      pushLog("info", "Initializing Python runtime (Pyodide)...");

      try {
        // Lazy-load Pyodide
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let pyodide: any = (window as any).__pyodide;
        if (!pyodide) {
          // Load Pyodide script if not already loaded
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if (!(window as any).loadPyodide) {
            await new Promise<void>((resolve, reject) => {
              const s = document.createElement("script");
              s.src =
                "https://cdn.jsdelivr.net/pyodide/v0.29.3/full/pyodide.js";
              s.onload = () => resolve();
              s.onerror = () =>
                reject(new Error("Failed to load Pyodide from CDN"));
              document.head.appendChild(s);
            });
            pushLog("info", "Pyodide script loaded");
          }

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          pyodide = await (window as any).loadPyodide();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (window as any).__pyodide = pyodide;
          pushLog("info", "Python runtime initialized");
        } else {
          pushLog("info", "Using cached Python runtime");
        }

        pushLog("info", "Executing script...");

        // Capture stdout/stderr
         
        pyodide.runPython(`
import sys, io
sys.stdout = io.StringIO()
sys.stderr = io.StringIO()
`);

        // Wrap user script in a function so "return" works at top level
        // (mirrors JavaScript's new Function() behavior)
        const indentedScript = script
          .split("\n")
          .map((line: string) => `    ${line}`)
          .join("\n");

        const wrappedScript = `def __user_fn__():\n${indentedScript}\n__result__ = __user_fn__()`;

        // Run wrapped script
         
        pyodide.runPython(wrappedScript);

        // Get result
         
        const result = pyodide.globals.get("__result__");

        // Get captured output
         
        const stdout = String(pyodide.runPython("sys.stdout.getvalue()") ?? "");
         
        const stderr = String(pyodide.runPython("sys.stderr.getvalue()") ?? "");

        // Reset stdout/stderr
         
        pyodide.runPython(`
sys.stdout = sys.__stdout__
sys.stderr = sys.__stderr__
`);

        if (stdout) {
          for (const line of stdout.split("\n").filter(Boolean)) {
            pushLog("info", `stdout: ${line}`);
          }
        }
        if (stderr) {
          for (const line of stderr.split("\n").filter(Boolean)) {
            pushLog("warn", `stderr: ${line}`);
          }
        }

        pushLog("info", "Execution completed successfully");

        return finish(true, {
          exitCode: 0,
          stdout,
          stderr,
          result:
            result !== undefined && result !== null ? String(result) : null,
        });
      } catch (err: unknown) {
        // Pyodide PythonError — extract the actual traceback
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const errAny = err as any;
         
        let msg: string = errAny?.message || "";
        if (!msg) {
          try {
            msg = String(err);
          } catch {
            msg = "Unknown Python error";
          }
        }
        // If still just the class name, try to get more details
        if (msg === "PythonError" || msg === "[object Object]") {
           
          msg = errAny?.type
            ? `${errAny.type}: ${errAny.message}`
            : "Python execution failed (check Logs tab for details)";
        }
        pushLog("error", `Python error: ${msg}`);
        pushLog("error", "Execution failed");
        return finish(false, { exitCode: 1, error: msg });
      }
    }

    // ── JavaScript ──
    pushLog("info", "Executing script...");

    try {
      const captured: string[] = [];
      const origLog = console.log;
      const origWarn = console.warn;
      const origErr = console.error;

      console.log = (...a: unknown[]) => captured.push(a.map(String).join(" "));
      console.warn = (...a: unknown[]) =>
        captured.push(`[WARN] ${a.map(String).join(" ")}`);
      console.error = (...a: unknown[]) =>
        captured.push(`[ERROR] ${a.map(String).join(" ")}`);

       
      const fn = new Function(script);
      const result = fn();

      console.log = origLog;
      console.warn = origWarn;
      console.error = origErr;

      for (const line of captured) pushLog("info", `stdout: ${line}`);
      pushLog("info", "Execution completed successfully");

      return finish(true, {
        exitCode: 0,
        stdout: captured.join("\n"),
        result: result !== undefined ? result : null,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      pushLog("error", `Script error: ${msg}`);
      pushLog("error", "Execution failed");
      return finish(false, {
        exitCode: 1,
        error: msg,
        stack: err instanceof Error ? err.stack : undefined,
      });
    }
  }

  // ── Delay ──
  if (nodeType === "delay") {
    const durationMs = Number(config.durationMs ?? 1000);
    pushLog("info", `Waiting for ${durationMs}ms...`);

    await new Promise((r) => setTimeout(r, durationMs));

    const actual = Math.round(performance.now() - startTime);
    pushLog("info", "Delay completed");
    pushLog("info", "Execution completed successfully");
    return {
      ...finish(true, {
        waited: true,
        requestedMs: durationMs,
        actualMs: actual,
      }),
      durationMs: actual,
    };
  }

  // ── Conditional ──
  if (nodeType === "conditional") {
    const rawExpression = String(config.expression ?? "").trim() || "false";

    // Interpolate @{{Variable}} templates into JS-safe literals
    const expression = interpolateExpression(rawExpression, context.variables);

    try {
      if (rawExpression !== expression) {
        pushLog("info", `Expression: ${rawExpression}`);
        pushLog("info", `Interpolated: ${expression}`);
      } else {
        pushLog("info", `Evaluating: ${expression}`);
      }

      // Build a function with explicit named parameters instead of `with`
      // (which is forbidden in strict mode / ESM).
       
      const fn = new Function(
        "variables",
        "inputs",
        `return (${expression})`,
      );
      const result = Boolean(fn(context.variables, context.inputs));
      const branch = result
        ? String(config.trueLabel ?? "Yes")
        : String(config.falseLabel ?? "No");

      pushLog("info", `Result: ${result} → branch "${branch}"`);
      pushLog("info", "Execution completed successfully");
      return finish(true, { conditionMet: result, selectedBranch: branch });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      pushLog("error", `Failed to evaluate condition: ${msg}`);
      pushLog("error", "Execution failed");
      return finish(false, { error: true, message: msg });
    }
  }

  // ── Set Variable ──
  if (nodeType === "set_variable") {
    const varName = String(config.variableName ?? "");
    const expression = String(config.expression ?? "");

    pushLog("info", `Variable Name: ${varName}`);
    pushLog("info", `Expression: ${expression}`);

    try {
      const input = context.inputs[0] ?? {};
       
      const fn = new Function("input", `return ${expression}`);
      const value = fn(input);

      pushLog("info", `Extracted value successfully`);
      pushLog("info", "Execution completed successfully");

      return finish(true, { variableName: varName, value });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      pushLog("error", `Failed to evaluate expression: ${msg}`);
      pushLog("error", "Execution failed");
      return finish(false, { error: true, message: msg });
    }
  }

  // ── Unknown ──
  pushLog("error", `Unknown node type: ${nodeType}`);
  return finish(false, {
    error: true,
    message: `Unknown node type: ${nodeType}`,
  });
}
