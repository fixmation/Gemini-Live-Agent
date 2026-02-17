import React, { useCallback, useMemo, useState } from "react";

const backendUrl = import.meta.env.REACT_APP_BACKEND_URL || "";

const initialContext = {
  session_id: "",
  loop_step: 1,
  global_goal: "",
  current_subgoal: "",
  last_screenshot: null,
  last_action: null,
  recent_history: [],
  environment: {
    browser: "chromium",
    os: "linux",
    locale: "en-US",
    test_profile: "default",
  },
  error_state: {
    has_error: false,
    last_error_message: null,
    retry_count_for_current_goal: 0,
  },
};

function App() {
  const [tab, setTab] = useState("interactive");
  const [sessionId, setSessionId] = useState(() => crypto.randomUUID());
  const [globalGoal, setGlobalGoal] = useState("");
  const [currentGoal, setCurrentGoal] = useState("");
  const [context, setContext] = useState(initialContext);
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const canCall = useMemo(
    () => Boolean(backendUrl && currentGoal && screenshotFile),
    [backendUrl, currentGoal, screenshotFile],
  );

  const handleScreenshotChange = (e) => {
    const file = e.target.files?.[0];
    setError("");
    setResult(null);

    if (!file) {
      setScreenshotFile(null);
      setScreenshotPreview(null);
      return;
    }

    setScreenshotFile(file);
    const url = URL.createObjectURL(file);
    setScreenshotPreview(url);
  };

  const buildContextString = useCallback(() => {
    const ctx = {
      ...context,
      session_id: sessionId,
      loop_step: (context.loop_step || 0) + 1,
      global_goal: globalGoal || currentGoal,
      current_subgoal: currentGoal,
    };
    return JSON.stringify(ctx, null, 2);
  }, [context, sessionId, globalGoal, currentGoal]);

  const handleCallNavigate = useCallback(
    async (mode) => {
      if (!backendUrl) {
        setError("Backend URL is not configured.");
        return;
      }
      if (!screenshotFile) {
        setError("Please select a screenshot first.");
        return;
      }
      if (!currentGoal.trim()) {
        setError("Please enter a navigation goal.");
        return;
      }

      setIsLoading(true);
      setError("");
      setResult(null);

      try {
        const ctxString = buildContextString();
        let response;

        if (mode === "multipart") {
          const formData = new FormData();
          formData.append("screenshot", screenshotFile);
          formData.append("goal", currentGoal);
          formData.append("session_id", sessionId);
          formData.append("context", ctxString);

          response = await fetch(`${backendUrl}/navigate`, {
            method: "POST",
            body: formData,
          });
        } else {
          // base64 mode
          const fileArrayBuffer = await screenshotFile.arrayBuffer();
          const base64 = btoa(String.fromCharCode(...new Uint8Array(fileArrayBuffer)));

          const payload = {
            image_base64: base64,
            mime_type: screenshotFile.type || undefined,
            goal: currentGoal,
            session_id: sessionId,
            context: ctxString,
          };

          response = await fetch(`${backendUrl}/navigate/base64`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          });
        }

        const data = await response.json();
        if (!response.ok) {
          setError(typeof data === "string" ? data : data.detail || "Unknown error");
          return;
        }

        setResult(data);
        // update minimal context with latest action
        setContext((prev) => {
          const nextStep = (prev.loop_step || 0) + 1;
          const historyEntry = {
            step: nextStep,
            action: data.action,
            target: data.target,
            coords: data.coords,
            status: data.status,
            plan: data.plan,
          };

          return {
            ...prev,
            loop_step: nextStep,
            last_action: {
              step: nextStep,
              navigation_action: data,
              sent_goal: currentGoal,
            },
            recent_history: [...prev.recent_history.slice(-9), historyEntry],
          };
        });
      } catch (err) {
        console.error(err);
        setError(err.message || "Request failed.");
      } finally {
        setIsLoading(false);
      }
    },
    [backendUrl, screenshotFile, currentGoal, sessionId, buildContextString],
  );

  const backendStatus = useMemo(() => {
    if (!backendUrl) return "Backend URL is not configured";
    return `Backend: ${backendUrl}`;
  }, [backendUrl]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-50">
      <header className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight" data-testid="app-title">
            UI Navigator Studio
          </h1>
          <p className="text-xs text-slate-400" data-testid="app-subtitle">
            Visual agent that becomes your hands on screen.
          </p>
        </div>
        <div className="text-xs text-slate-400" data-testid="backend-status">
          {backendStatus}
        </div>
      </header>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 max-w-7xl mx-auto w-full">
        {/* Left column: control panel */}
        <section
          className="space-y-4 bg-slate-900/60 border border-slate-800 rounded-xl p-4 shadow-lg shadow-slate-950/40"
          data-testid="control-panel"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-[0.16em] text-slate-400">
                Session
              </label>
              <div className="flex items-center gap-2">
                <input
                  data-testid="session-id-input"
                  type="text"
                  className="flex-1 rounded-md bg-slate-900 border border-slate-700 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
                  value={sessionId}
                  onChange={(e) => setSessionId(e.target.value)}
                />
                <button
                  data-testid="session-id-regenerate-button"
                  type="button"
                  className="text-xs px-2 py-1 rounded-md border border-slate-700 hover:border-sky-500 hover:text-sky-300 transition-colors"
                  onClick={() => setSessionId(crypto.randomUUID())}
                >
                  New
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-200" htmlFor="global-goal-input">
              Global Goal
            </label>
            <input
              id="global-goal-input"
              data-testid="global-goal-input"
              type="text"
              placeholder="e.g. Log into the dashboard as the test user"
              className="w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 placeholder:text-slate-500"
              value={globalGoal}
              onChange={(e) => setGlobalGoal(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-200" htmlFor="current-goal-input">
              Current Step Goal
            </label>
            <textarea
              id="current-goal-input"
              data-testid="current-goal-input"
              rows={3}
              placeholder="Describe what the agent should do on THIS screen (e.g. 'Click the blue Login button')."
              className="w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 placeholder:text-slate-500 resize-none"
              value={currentGoal}
              onChange={(e) => setCurrentGoal(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-200" htmlFor="screenshot-input">
              Screenshot
            </label>
            <input
              id="screenshot-input"
              data-testid="screenshot-input"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="block w-full text-xs text-slate-300 file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-slate-800 file:text-slate-50 hover:file:bg-slate-700"
              onChange={handleScreenshotChange}
            />
            <p className="text-[11px] text-slate-500" data-testid="screenshot-helper">
              PNG / JPEG / WEBP only. Use the current browser viewport screenshot from your automation.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 mt-2">
            <button
              data-testid="call-multipart-button"
              type="button"
              disabled={!canCall || isLoading}
              onClick={() => handleCallNavigate("multipart")}
              className="inline-flex items-center justify-center gap-1 rounded-md bg-sky-500 px-3 py-1.5 text-xs font-medium text-slate-950 shadow-sm hover:bg-sky-400 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isLoading ? "Running..." : "Call /api/navigate (multipart)"}
            </button>
            <button
              data-testid="call-base64-button"
              type="button"
              disabled={!canCall || isLoading}
              onClick={() => handleCallNavigate("base64")}
              className="inline-flex items-center justify-center gap-1 rounded-md bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-100 border border-slate-600 hover:border-sky-500 hover:text-sky-300 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isLoading ? "Running..." : "Call /api/navigate/base64"}
            </button>
          </div>

          {error && (
            <div
              data-testid="error-banner"
              className="mt-3 rounded-md border border-rose-500/60 bg-rose-950/40 px-3 py-2 text-xs text-rose-100"
            >
              {error}
            </div>
          )}
        </section>

        {/* Right column: screenshot + output / context */}
        <section className="space-y-4">
          <div
            className="relative aspect-video w-full overflow-hidden rounded-xl border border-slate-800 bg-slate-900/80 flex items-center justify-center"
            data-testid="screenshot-preview-panel"
          >
            {screenshotPreview ? (
              <>
                <img
                  src={screenshotPreview}
                  alt="Screenshot preview"
                  className="h-full w-full object-contain"
                  data-testid="screenshot-preview-image"
                />
                {result?.coords && (
                  <div
                    data-testid="coords-overlay"
                    className="pointer-events-none absolute inset-4 flex items-center justify-center"
                  >
                    <div
                      className="relative w-full h-full border border-sky-500/40 rounded-lg"
                      style={{ boxSizing: "border-box" }}
                    >
                      <div
                        className="absolute w-3 h-3 -mt-1.5 -ml-1.5 rounded-full bg-sky-400 shadow-[0_0_0_3px_rgba(8,47,73,0.85)]"
                        style={{
                          left: `${(result.coords.x / 1000) * 100}%`,
                          top: `${(result.coords.y / 1000) * 100}%`,
                        }}
                      />
                      <div
                        className="absolute text-[10px] px-1.5 py-0.5 rounded bg-slate-900/90 border border-sky-500/60 text-sky-100 shadow-md"
                        style={{
                          left: `${Math.min((result.coords.x / 1000) * 100 + 1, 95)}%`,
                          top: `${Math.max((result.coords.y / 1000) * 100 - 5, 0)}%`,
                          transform: "translate(-50%, -100%)",
                        }}
                        data-testid="coords-overlay-label"
                      >
                        x:{result.coords.x} y:{result.coords.y}
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-xs text-slate-500" data-testid="screenshot-placeholder">
                Screenshot preview will appear here.
              </div>
            )}
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex gap-2" data-testid="output-tabs">
                <button
                  type="button"
                  data-testid="output-tab-interactive"
                  onClick={() => setTab("interactive")}
                  className={`px-2 py-1 text-xs rounded-md border ${
                    tab === "interactive"
                      ? "border-sky-500 bg-sky-500/10 text-sky-200"
                      : "border-transparent text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Action & Coords
                </button>
                <button
                  type="button"
                  data-testid="output-tab-context"
                  onClick={() => setTab("context")}
                  className={`px-2 py-1 text-xs rounded-md border ${
                    tab === "context"
                      ? "border-sky-500 bg-sky-500/10 text-sky-200"
                      : "border-transparent text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Context JSON
                </button>
                <button
                  type="button"
                  data-testid="output-tab-timeline"
                  onClick={() => setTab("timeline")}
                  className={`px-2 py-1 text-xs rounded-md border ${
                    tab === "timeline"
                      ? "border-sky-500 bg-sky-500/10 text-sky-200"
                      : "border-transparent text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Step Timeline
                </button>
              </div>
              <div className="text-[11px] text-slate-500" data-testid="loop-step-indicator">
                Step: {context.loop_step || 1}
              </div>
            </div>

            {tab === "interactive" ? (
              <div className="space-y-2" data-testid="output-interactive-panel">
                {result ? (
                  <>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="space-y-1">
                        <div className="text-slate-400 uppercase tracking-[0.16em] text-[10px]">
                          PLAN
                        </div>
                        <div className="text-slate-100" data-testid="output-plan">
                          {result.plan}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-slate-400 uppercase tracking-[0.16em] text-[10px]">
                          ACTION
                        </div>
                        <div className="flex flex-wrap items-center gap-2" data-testid="output-action-row">
                          <span className="inline-flex items-center rounded-md bg-slate-800 px-2 py-1 text-[11px] font-medium text-sky-200 border border-sky-500/60">
                            {result.action}
                          </span>
                          <span className="inline-flex items-center rounded-md bg-slate-800 px-2 py-1 text-[11px] text-slate-200 border border-slate-700">
                            {result.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs mt-3">
                      <div className="space-y-1">
                        <div className="text-slate-400 uppercase tracking-[0.16em] text-[10px]">
                          TARGET
                        </div>
                        <div className="text-slate-100" data-testid="output-target">
                          {result.target}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-slate-400 uppercase tracking-[0.16em] text-[10px]">
                          COORDS (normalized)
                        </div>
                        <div
                          className="inline-flex items-center gap-2 rounded-md bg-slate-800 px-2 py-1 border border-slate-700"
                          data-testid="output-coords"
                        >
                          <span>x: {result.coords?.x}</span>
                          <span>y: {result.coords?.y}</span>
                        </div>
                      </div>
                    </div>

                    {result.text_input && (
                      <div className="mt-3 text-xs">
                        <div className="text-slate-400 uppercase tracking-[0.16em] text-[10px]">
                          TEXT INPUT
                        </div>
                        <div className="mt-1 rounded-md bg-slate-900 border border-slate-700 px-2 py-1" data-testid="output-text-input">
                          {result.text_input}
                        </div>
                      </div>
                    )}

                    <div className="mt-3 text-[11px] text-slate-500" data-testid="output-integration-hint">
                      Use coords as normalized positions in your automation loop, converting them to pixels for pyautogui or Selenium.
                    </div>
                  </>
                ) : (
                  <div className="text-xs text-slate-500" data-testid="output-empty-state">
                    Run the agent to see the next action, coordinates, and plan here.
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs" data-testid="output-context-panel">
                <pre className="max-h-64 overflow-auto rounded-md bg-slate-950 border border-slate-800 px-2 py-2 text-[11px] leading-snug text-slate-200">
                  {buildContextString()}
                </pre>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
