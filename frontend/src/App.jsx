import React, { useCallback, useEffect, useMemo, useState } from "react";
import { LiveAudioPanel, LiveNavigationPanel, LiveStoryPanel } from "./components/LivePanels";
import OnboardingTour from "./components/OnboardingTour";

const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

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

const STORAGE_KEY = "ui-navigator-state-v1";

function App() {
  const [sessionId, setSessionId] = useState(() => crypto.randomUUID());
  const [globalGoal, setGlobalGoal] = useState("");
  const [currentGoal, setCurrentGoal] = useState("");
  const [context, setContext] = useState(initialContext);
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [screenshotPreview, setScreenshotPreview] = useState(null);
  const [viewportWidth, setViewportWidth] = useState(1920);
  const [viewportHeight, setViewportHeight] = useState(1080);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [backendHealth, setBackendHealth] = useState("unknown"); // unknown | ok | error
  const [backendHealthMessage, setBackendHealthMessage] = useState("");
  const [plannedSteps, setPlannedSteps] = useState([]); // {id, text}
  const [currentPlannedIndex, setCurrentPlannedIndex] = useState(0);
  const [newStepText, setNewStepText] = useState("");
  const [showExport, setShowExport] = useState(false);
  const [exportCopied, setExportCopied] = useState(false);
  const [mode, setMode] = useState("story"); // story | navigator | live
  const [storyBrief, setStoryBrief] = useState("Launch a playful teaser for a new productivity app");
  const [storyTone, setStoryTone] = useState("Cinematic + Playful");
  const [storyBeatInput, setStoryBeatInput] = useState("");
  const [storyBeats, setStoryBeats] = useState([
    { id: "beat-1", text: "Open with a cold start view of the dashboard" },
    { id: "beat-2", text: "Zoom into the smart checklist and celebrate completion" },
    { id: "beat-3", text: "Close on a hero shot with CTA and confetti" },
  ]);
  const [interleaveFlags, setInterleaveFlags] = useState({
    text: true,
    image: true,
    audio: true,
    video: true,
  });
  const [storyLoading, setStoryLoading] = useState(false);
  const [storyOutput, setStoryOutput] = useState(null);

  const canCall = useMemo(
    () => Boolean(backendUrl && currentGoal.trim() && screenshotFile),
    [backendUrl, currentGoal, screenshotFile],
  );

  // Load state from localStorage on first mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed.sessionId) {
        setSessionId(parsed.sessionId);
      }
      if (parsed.globalGoal) {
        setGlobalGoal(parsed.globalGoal);
      }
      if (parsed.context) {
        setContext({ ...initialContext, ...parsed.context });
      }
      if (parsed.plannedSteps && Array.isArray(parsed.plannedSteps)) {
        setPlannedSteps(parsed.plannedSteps);
      }
      if (typeof parsed.currentPlannedIndex === "number") {
        setCurrentPlannedIndex(parsed.currentPlannedIndex);
      }
    } catch (e) {
      console.error("Failed to restore state", e);
    }
  }, []);

  // Persist state to localStorage whenever it changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const payload = {
        sessionId,
        globalGoal,
        context,
        plannedSteps,
        currentPlannedIndex,
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.error("Failed to persist state", e);
    }
  }, [sessionId, globalGoal, context, plannedSteps]);

  // Health check for backend
  useEffect(() => {
    if (!backendUrl) {
      setBackendHealth("unknown");
      setBackendHealthMessage("Backend URL is not configured");
      return;
    }

    let cancelled = false;

    const check = async () => {
      try {
        const res = await fetch(`${backendUrl}/api/health`, { method: "GET" });
        if (cancelled) return;
        if (!res.ok) {
          setBackendHealth("error");
          setBackendHealthMessage(`Health check failed: ${res.status}`);
          return;
        }
        const data = await res.json();
        setBackendHealth("ok");
        setBackendHealthMessage(
          data && data.model
            ? `Online • ${data.provider || "gemini"}/${data.model}`
            : "Online",
        );
      } catch (e) {
        if (cancelled) return;
        setBackendHealth("error");
        setBackendHealthMessage("Health check error");
      }
    };

    check();

    return () => {
      cancelled = true;
    };
  }, [backendUrl]);

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

  const handleMarkExecution = useCallback((isSuccess) => {
    setContext((prev) => {
      if (!prev.recent_history || prev.recent_history.length === 0) return prev;
      const history = [...prev.recent_history];
      const lastIndex = history.length - 1;
      const last = {
        ...history[lastIndex],
        execution_result: {
          success: isSuccess,
          details: isSuccess
            ? "Marked as success from UI Navigator Studio."
            : "Marked as failure from UI Navigator Studio.",
        },
      };
      history[lastIndex] = last;

      const nextErrorState = isSuccess
        ? {
            has_error: false,
            last_error_message: null,
            retry_count_for_current_goal: 0,
          }
        : {
            ...prev.error_state,
            has_error: true,
            last_error_message:
              "Last step marked as failure from UI Navigator Studio.",
            retry_count_for_current_goal:
              (prev.error_state?.retry_count_for_current_goal || 0) + 1,
          };

      return {
        ...prev,
        recent_history: history,
        error_state: nextErrorState,
      };
    });

    if (isSuccess && plannedSteps.length) {
      setCurrentPlannedIndex((prevIndex) => {
        const nextIndex = Math.min(prevIndex + 1, plannedSteps.length - 1);
        const nextStep = plannedSteps[nextIndex];
        if (nextStep) {
          setCurrentGoal(nextStep.text);
        }
        return nextIndex;
      });
    }
  }, [plannedSteps]);

  const pixelCoords = useMemo(() => {
    if (!result?.coords || !viewportWidth || !viewportHeight) return null;
    const { x, y } = result.coords;
    return {
      x: Math.round((x / 1000) * viewportWidth),
      y: Math.round((y / 1000) * viewportHeight),
    };
  }, [result, viewportWidth, viewportHeight]);

  const pyautoguiSnippet = useMemo(() => {
    if (!pixelCoords) return "";
    return `import pyautogui\n\npyautogui.click(${pixelCoords.x}, ${pixelCoords.y})`;
  }, [pixelCoords]);

  const seleniumSnippet = useMemo(() => {
    if (!pixelCoords) return "";
    return `from selenium.webdriver.common.action_chains import ActionChains\n\nactions = ActionChains(driver)\nactions.move_by_offset(${pixelCoords.x}, ${pixelCoords.y}).click().perform()`;
  }, [pixelCoords]);

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
            text_input: data.text_input,
            sent_goal: currentGoal,
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

  const handleTimelineSelect = useCallback((step) => {
    if (!step) return;
    setResult({
      plan: step.plan || "",
      action: step.action,
      target: step.target,
      coords: step.coords,
      text_input: step.text_input || "",
      status: step.status,
    });
    if (step.sent_goal) {
      setCurrentGoal(step.sent_goal);
    }
  }, []);

  const handleAddPlannedStep = useCallback(() => {
    const text = newStepText.trim();
    if (!text) return;
    setPlannedSteps((prev) => [...prev, { id: crypto.randomUUID(), text }]);
    setNewStepText("");
  }, [newStepText]);

  const handleUsePlannedStep = useCallback((step, index) => {
    setCurrentPlannedIndex(index);
    setCurrentGoal(step.text);
  }, []);

  const handleDeletePlannedStep = useCallback((id) => {
    setPlannedSteps((prev) => prev.filter((step) => step.id !== id));
  }, []);

  const handleUseNextPlannedStep = useCallback(() => {
    if (!plannedSteps.length) return;
    const index = Math.min(currentPlannedIndex, plannedSteps.length - 1);
    const step = plannedSteps[index];
    if (!step) return;
    setCurrentGoal(step.text);
  }, [plannedSteps, currentPlannedIndex]);

  const handleAddStoryBeat = useCallback(() => {
    const text = storyBeatInput.trim();
    if (!text) return;
    setStoryBeats((prev) => [...prev, { id: crypto.randomUUID(), text }]);
    setStoryBeatInput("");
  }, [storyBeatInput]);

  const handleRemoveStoryBeat = useCallback((id) => {
    setStoryBeats((prev) => prev.filter((beat) => beat.id !== id));
  }, []);

  const handleGenerateStory = useCallback(() => {
    setStoryLoading(true);
    const timestamp = new Date().toLocaleTimeString();
    const blocks = [];

    if (interleaveFlags.text) {
      blocks.push({
        id: crypto.randomUUID(),
        type: "text",
        label: "Narration",
        content: storyBrief || "Narrate the scene",
      });
    }

    if (interleaveFlags.image) {
      blocks.push({
        id: crypto.randomUUID(),
        type: "image",
        label: "Illustration",
        content: storyTone,
        meta: storyBeats.map((b, i) => `Frame ${i + 1}: ${b.text}`).join(" | "),
      });
    }

    if (interleaveFlags.audio) {
      blocks.push({
        id: crypto.randomUUID(),
        type: "audio",
        label: "Voiceover",
        content: "30s voiceover aligned to beats",
      });
    }

    if (interleaveFlags.video) {
      blocks.push({
        id: crypto.randomUUID(),
        type: "video",
        label: "Storyboard clip",
        content: "Stitched motion of key frames with captions",
      });
    }

    setTimeout(() => {
      setStoryOutput({
        title: storyBrief || "Interleaved concept",
        tone: storyTone,
        beats: storyBeats,
        generatedAt: timestamp,
        blocks,
      });
      setStoryLoading(false);
    }, 280);
  }, [storyBrief, storyTone, storyBeats, interleaveFlags]);

  const interleavedBlocks = useMemo(() => {
    if (storyOutput?.blocks?.length) return storyOutput.blocks;
    return [
      {
        id: "sample-text",
        type: "text",
        label: "Narration",
        content: "Gemini drafts the opener, setting scene and intent in one pass.",
      },
      {
        id: "sample-image",
        type: "image",
        label: "Illustration",
        content: "Wide shot of the UI with focus glow on CTA and multi-layer gradients.",
        meta: "Generated illustration cue",
      },
      {
        id: "sample-audio",
        type: "audio",
        label: "Voiceover",
        content: "15s upbeat narration describing the action on screen.",
      },
    ];
  }, [storyOutput]);

  const exportPayload = useMemo(
    () => ({
      session_id: sessionId,
      global_goal: globalGoal,
      viewport: { width: viewportWidth, height: viewportHeight },
      backend_url: backendUrl || null,
      planned_steps: plannedSteps,
      context,
      history: context.recent_history || [],
    }),
    [sessionId, globalGoal, viewportWidth, viewportHeight, backendUrl, plannedSteps, context],
  );

  const exportJson = useMemo(() => JSON.stringify(exportPayload, null, 2), [exportPayload]);

  const handleCopyExport = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.clipboard) return;
    navigator.clipboard
      .writeText(exportJson)
      .then(() => {
        setExportCopied(true);
        setTimeout(() => setExportCopied(false), 1500);
      })
      .catch((e) => {
        console.error("Failed to copy export", e);
      });
  }, [exportJson]);

  const handleDownloadExport = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      const blob = new Blob([exportJson], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ui-workflow-${sessionId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Failed to download export", e);
    }
  }, [exportJson, sessionId]);

  const backendStatus = useMemo(() => {
    if (!backendUrl) return "Backend URL is not configured";
    return backendHealthMessage || `Backend: ${backendUrl}`;
  }, [backendUrl, backendHealthMessage]);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 grid-overlay opacity-40 pointer-events-none" />
      <div className="absolute -top-28 right-[-16%] w-[520px] h-[520px] rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="absolute bottom-[-28%] left-[-10%] w-[520px] h-[520px] rounded-full bg-emerald-500/10 blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-4 sm:space-y-6">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-sky-500/10 border border-sky-500/30 px-3 py-1 text-xs text-sky-100 flex-wrap">
              <span className="whitespace-nowrap">Gemini Multimodal Studio</span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
              <span className="text-emerald-200 whitespace-nowrap">Interleaved output ready</span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight" data-testid="app-title">
              Multimodal Storytelling × UI Navigator
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl" data-testid="app-subtitle">
              Design, generate, and validate flows where Gemini delivers text, images, audio, and video inline
              while a visual agent executes on-screen. Built for creative directors and automation engineers.
            </p>
            <div className="flex flex-wrap gap-2 text-[11px] text-slate-400" data-testid="app-tagline">
              <span className="px-2 py-1 rounded-full bg-slate-800/60 border border-slate-700 whitespace-nowrap">Mixed-media stories</span>
              <span className="px-2 py-1 rounded-full bg-slate-800/60 border border-slate-700 whitespace-nowrap">Visual UI control</span>
              <span className="px-2 py-1 rounded-full bg-slate-800/60 border border-slate-700 whitespace-nowrap">Cloud-ready</span>
            </div>
          </div>
          <div className="glass-surface rounded-xl px-4 py-3 w-full md:w-80 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-300" data-testid="backend-status">
              <div className="flex items-center gap-2">
                <span
                  data-testid="backend-health-indicator"
                  className={`inline-block h-2.5 w-2.5 rounded-full border ${
                    backendHealth === "ok"
                      ? "bg-emerald-400 border-emerald-500"
                      : backendHealth === "error"
                        ? "bg-rose-500 border-rose-500"
                        : "bg-slate-700 border-slate-600"
                  }`}
                />
                <span className="truncate max-w-[180px]">{backendStatus}</span>
              </div>
              <span className="text-[11px] text-slate-400">Step {context.loop_step || 1}</span>
            </div>
            <div className="text-[11px] text-slate-500" data-testid="backend-url-hint">
              {backendUrl ? backendUrl : "Set VITE_BACKEND_URL to connect the navigator."}
            </div>
            <div className="flex gap-2 mode-switcher">
              <button
                type="button"
                onClick={() => setMode("story")}
                className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium border transition-colors ${
                  mode === "story"
                    ? "bg-sky-500 text-slate-950 border-sky-400"
                    : "border-slate-700 text-slate-200 hover:border-sky-400"
                }`}
              >
                Story Director
              </button>
              <button
                type="button"
                onClick={() => setMode("navigator")}
                className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium border transition-colors ${
                  mode === "navigator"
                    ? "bg-emerald-400 text-slate-950 border-emerald-300"
                    : "border-slate-700 text-slate-200 hover:border-emerald-300"
                }`}
              >
                UI Navigator
              </button>
              <button
                type="button"
                onClick={() => setMode("live")}
                className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium border transition-colors ${
                  mode === "live"
                    ? "bg-purple-500 text-white border-purple-400"
                    : "border-slate-700 text-slate-200 hover:border-purple-400"
                }`}
              >
                🎙️ Live
              </button>
            </div>
          </div>
        </header>

        <div className="grid gap-4 lg:grid-cols-3 items-start">
          <section className="glass-surface rounded-2xl p-3 sm:p-5 space-y-4 lg:col-span-2">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Command Panel</p>
                <h2 className="text-lg sm:text-xl font-semibold">
                  {mode === "story" ? "Build interleaved stories" : mode === "navigator" ? "Orchestrate screen actions" : "Live Gemini Agent"}
                </h2>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span className="h-2 w-2 rounded-full bg-sky-400 shrink-0" />
                <span className="text-xs sm:text-[11px] line-clamp-2">
                  {mode === "story" ? "Gemini interleaves text/image/audio/video" : mode === "navigator" ? "Gemini spots UI targets visually" : "Real-time audio & screen streaming"}
                </span>
              </div>
            </div>

            {mode === "live" ? (
              <div className="space-y-4" data-testid="live-mode">
                <div className="text-sm text-white/80 mb-4">
                  <p className="mb-2">🚀 <strong>Gemini Live Agent</strong> - Real-time multimodal streaming</p>
                  <p className="text-xs text-white/60">Choose a Live mode below to interact with Gemini using voice, screen capture, or multimodal story generation.</p>
                </div>
                <div className="grid gap-4">
                  <LiveAudioPanel />
                  <LiveNavigationPanel />
                  <LiveStoryPanel />
                </div>
              </div>
            ) : mode === "story" ? (
              <div className="space-y-4" data-testid="story-director">
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="space-y-2 story-brief-input">
                    <label className="text-xs text-slate-300" htmlFor="story-brief-input">Story brief</label>
                    <textarea
                      id="story-brief-input"
                      rows={3}
                      className="w-full rounded-lg bg-slate-900/70 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
                      value={storyBrief}
                      onChange={(e) => setStoryBrief(e.target.value)}
                      placeholder="e.g. Interactive storybook about a UI agent guiding a user"
                    />
                  </div>
                  <div className="space-y-2 story-tone-select">
                    <label className="text-xs text-slate-300" htmlFor="story-tone-input">Tone & pacing</label>
                    <input
                      id="story-tone-input"
                      type="text"
                      className="w-full rounded-lg bg-slate-900/70 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
                      value={storyTone}
                      onChange={(e) => setStoryTone(e.target.value)}
                      placeholder="Cinematic, warm, confident"
                    />
                    <div className="text-[11px] text-slate-500">Controls narration cadence and visual styling.</div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-xs text-slate-300">Media tracks</label>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {[
                        { key: "text", label: "Narration" },
                        { key: "image", label: "Illustrations" },
                        { key: "audio", label: "Voiceover" },
                        { key: "video", label: "Storyboard" },
                      ].map((item) => (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() =>
                            setInterleaveFlags((prev) => ({ ...prev, [item.key]: !prev[item.key] }))
                          }
                          className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors ${
                            interleaveFlags[item.key]
                              ? "border-sky-400 bg-sky-500/10 text-sky-100"
                              : "border-slate-700 bg-slate-900/60 text-slate-300 hover:border-slate-500"
                          }`}
                        >
                          <span>{item.label}</span>
                          <span className={`h-2 w-2 rounded-full ${interleaveFlags[item.key] ? "bg-emerald-400" : "bg-slate-600"}`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-slate-300">Story beats</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="flex-1 rounded-lg bg-slate-900/70 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
                        value={storyBeatInput}
                        onChange={(e) => setStoryBeatInput(e.target.value)}
                        placeholder="Add a scene or visual moment"
                      />
                      <button
                        type="button"
                        onClick={handleAddStoryBeat}
                        className="rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-sm text-slate-50 hover:border-sky-400"
                      >
                        Add
                      </button>
                    </div>
                    {storyBeats.length > 0 && (
                      <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                        {storyBeats.map((beat, index) => (
                          <div
                            key={beat.id}
                            className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1 text-[11px] text-slate-100"
                          >
                            <span className="text-slate-400">{index + 1}.</span>
                            <span className="truncate max-w-[200px]">{beat.text}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveStoryBeat(beat.id)}
                              className="text-slate-500 hover:text-rose-300"
                              aria-label="Remove beat"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleGenerateStory}
                    className="generate-story-button inline-flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-sm hover:bg-sky-400 disabled:opacity-60"
                    disabled={storyLoading}
                  >
                    {storyLoading ? "Weaving..." : "Generate interleaved output"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowExport((v) => !v)}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:border-sky-400"
                  >
                    {showExport ? "Hide export" : "Export JSON"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4" data-testid="control-panel">
                <div className="grid md:grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-[0.14em] text-slate-400">Session</label>
                    <div className="flex items-center gap-2">
                      <input
                        data-testid="session-id-input"
                        type="text"
                        className="flex-1 rounded-lg bg-slate-900/70 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400 focus:border-emerald-400"
                        value={sessionId}
                        onChange={(e) => setSessionId(e.target.value)}
                      />
                      <button
                        data-testid="session-id-regenerate-button"
                        type="button"
                        className="text-xs px-3 py-2 rounded-lg border border-slate-700 hover:border-emerald-400 hover:text-emerald-200"
                        onClick={() => setSessionId(crypto.randomUUID())}
                      >
                        New
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2 viewport-settings">
                    <label className="text-xs uppercase tracking-[0.14em] text-slate-400">Viewport</label>
                    <div className="flex items-center gap-2 text-sm">
                      <input
                        type="number"
                        min={320}
                        max={7680}
                        value={viewportWidth}
                        onChange={(e) => setViewportWidth(Number(e.target.value) || 0)}
                        className="w-24 rounded-lg bg-slate-900/70 border border-slate-700 px-2 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                        data-testid="viewport-width-input"
                      />
                      <span className="text-slate-500">×</span>
                      <input
                        type="number"
                        min={200}
                        max={4320}
                        value={viewportHeight}
                        onChange={(e) => setViewportHeight(Number(e.target.value) || 0)}
                        className="w-24 rounded-lg bg-slate-900/70 border border-slate-700 px-2 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                        data-testid="viewport-height-input"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-[0.14em] text-slate-400">Step timer</label>
                    <p className="text-sm text-slate-300">Use the timeline to jump to any prior action.</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-3">
                  <div className="space-y-2 global-goal-input">
                    <label className="text-xs font-medium text-slate-200" htmlFor="global-goal-input">
                      Global goal
                    </label>
                    <input
                      id="global-goal-input"
                      data-testid="global-goal-input"
                      type="text"
                      placeholder="Log into the dashboard as the test user"
                      className="w-full rounded-lg bg-slate-900/70 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400 focus:border-emerald-400"
                      value={globalGoal}
                      onChange={(e) => setGlobalGoal(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-200" htmlFor="current-goal-input">
                      Current step goal
                    </label>
                    <textarea
                      id="current-goal-input"
                      data-testid="current-goal-input"
                      rows={3}
                      placeholder="Describe what the agent should do on this screen"
                      className="w-full rounded-lg bg-slate-900/70 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400 focus:border-emerald-400"
                      value={currentGoal}
                      onChange={(e) => setCurrentGoal(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-200" htmlFor="planned-step-input">
                    Planned workflow steps
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="planned-step-input"
                      data-testid="planned-step-input"
                      type="text"
                      placeholder="Open login, fill email, click Login"
                      className="flex-1 rounded-lg bg-slate-900/70 border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400 focus:border-emerald-400"
                      value={newStepText}
                      onChange={(e) => setNewStepText(e.target.value)}
                    />
                    <button
                      type="button"
                      data-testid="planned-step-add-button"
                      onClick={handleAddPlannedStep}
                      className="rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-sm text-slate-50 hover:border-emerald-400"
                    >
                      Add
                    </button>
                  </div>
                  {plannedSteps.length > 0 && (
                    <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto" data-testid="planned-steps-list">
                      {plannedSteps.map((step, index) => (
                        <div
                          key={step.id}
                          className="flex items-center gap-2 rounded-full bg-slate-900/70 border border-slate-700 px-3 py-1 text-[11px] text-slate-100"
                        >
                          <span className="text-slate-500">#{index + 1}</span>
                          <span className="truncate max-w-[180px]">{step.text}</span>
                          <button
                            type="button"
                            data-testid={`planned-step-use-${index + 1}`}
                            onClick={() => handleUsePlannedStep(step, index)}
                            className="text-emerald-200 hover:text-emerald-100"
                          >
                            Use
                          </button>
                          <button
                            type="button"
                            data-testid={`planned-step-delete-${index + 1}`}
                            onClick={() => handleDeletePlannedStep(step.id)}
                            className="text-slate-500 hover:text-rose-300"
                            aria-label="Remove planned step"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-3">
                  <div className="space-y-2 screenshot-upload">
                    <label className="text-xs font-medium text-slate-200" htmlFor="screenshot-input">
                      Screenshot
                    </label>
                    <input
                      id="screenshot-input"
                      data-testid="screenshot-input"
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="block w-full text-xs text-slate-300 file:mr-2 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-slate-800 file:text-slate-50 hover:file:bg-slate-700"
                      onChange={handleScreenshotChange}
                    />
                    <p className="text-[11px] text-slate-500" data-testid="screenshot-helper">
                      Use the latest viewport screenshot from your automation run.
                    </p>
                  </div>
                  <div className="space-y-3">
                    {plannedSteps.length > 0 && (
                      <button
                        type="button"
                        data-testid="use-next-planned-step-button"
                        onClick={handleUseNextPlannedStep}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-slate-800 px-3 py-2 text-sm font-medium text-slate-100 border border-slate-600 hover:border-emerald-400"
                      >
                        Use next planned step (#{Math.min(currentPlannedIndex + 1, plannedSteps.length)})
                      </button>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <button
                        data-testid="call-multipart-button"
                        type="button"
                        disabled={!canCall || isLoading}
                        onClick={() => handleCallNavigate("multipart")}
                        className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg bg-emerald-400 px-3 py-2 text-sm font-semibold text-slate-950 shadow-sm hover:bg-emerald-300 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {isLoading ? "Running..." : "Call /navigate (multipart)"}
                      </button>
                      <button
                        data-testid="call-base64-button"
                        type="button"
                        disabled={!canCall || isLoading}
                        onClick={() => handleCallNavigate("base64")}
                        className="flex-1 inline-flex items-center justify-center gap-1 rounded-lg bg-slate-800 px-3 py-2 text-sm font-semibold text-slate-100 border border-slate-600 hover:border-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {isLoading ? "Running..." : "Call /navigate/base64"}
                      </button>
                    </div>
                    {error && (
                      <div
                        data-testid="error-banner"
                        className="rounded-lg border border-rose-500/60 bg-rose-950/40 px-3 py-2 text-xs text-rose-100"
                      >
                        {error}
                      </div>
                    )}
                    <div className="text-[11px] text-slate-500" data-testid="global-hints">
                      Session, planned steps, and context persist locally for multi-step workflows.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>

          <section className="glass-surface rounded-2xl p-3 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Live Canvas</p>
                <h3 className="text-base sm:text-lg font-semibold">What Gemini sees</h3>
              </div>
              <div className="text-[11px] text-slate-400">{viewportWidth} × {viewportHeight}</div>
            </div>
            <div
              className="relative aspect-video w-full overflow-hidden rounded-xl border border-slate-800/70 bg-slate-900/80 flex items-center justify-center"
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
                      <div className="relative w-full h-full border border-sky-500/40 rounded-lg" style={{ boxSizing: "border-box" }}>
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
                  Drop a screenshot to let the navigator reason on pixels.
                </div>
              )}
            </div>
            <div className="text-[11px] text-slate-400">
              Gemini processes the screenshot, reasons visually, and emits an action plus normalized coords.
            </div>
          </section>
        </div>

        <div className="grid gap-4 lg:grid-cols-3 items-start">
          <section className="glass-surface rounded-2xl p-3 sm:p-5 space-y-4 lg:col-span-2 output-stream-section">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Output Stream</p>
                <h3 className="text-lg sm:text-xl font-semibold">Interleaved narrative + UI actions</h3>
              </div>
              <div className="flex flex-wrap gap-2 text-[11px] text-slate-400">
                <span className="px-2 py-1 rounded-full bg-slate-800/60 border border-slate-700 whitespace-nowrap">Mixed media</span>
                <span className="px-2 py-1 rounded-full bg-slate-800/60 border border-slate-700 whitespace-nowrap">Executable steps</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" data-testid="interleaved-output">
              {interleavedBlocks.map((block) => (
                <div
                  key={block.id}
                  className={`rounded-xl border px-3 sm:px-4 py-3 space-y-2 ${
                    block.type === "image"
                      ? "border-cyan-400/50 bg-cyan-500/10"
                      : block.type === "audio"
                        ? "border-emerald-400/50 bg-emerald-500/10"
                        : block.type === "video"
                          ? "border-indigo-400/50 bg-indigo-500/10"
                          : "border-slate-700 bg-slate-900/70"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-200">
                    <span className="uppercase tracking-[0.14em] text-[10px] text-slate-300 truncate">{block.label}</span>
                    <span className="rounded-full bg-slate-900/60 px-2 py-0.5 border border-slate-700 text-[10px] text-slate-300 shrink-0">
                      {block.type}
                    </span>
                  </div>
                  <div className="text-sm text-slate-50 leading-relaxed break-words">{block.content}</div>
                  {block.meta && <div className="text-[11px] text-slate-300 break-words">{block.meta}</div>}
                </div>
              ))}
            </div>

            <div className="border-t border-slate-800/60 pt-3 space-y-3" data-testid="output-interactive-panel">
              {result ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2 rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3">
                    <div className="text-[10px] uppercase tracking-[0.14em] text-slate-400">Action</div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="rounded-lg bg-slate-800 px-2 py-1 text-sm font-semibold text-sky-100 border border-sky-500/60">
                        {result.action}
                      </span>
                      <span className="rounded-lg bg-slate-800 px-2 py-1 text-xs text-slate-100 border border-slate-700">
                        {result.status}
                      </span>
                    </div>
                    <div className="text-sm text-slate-200" data-testid="output-target">{result.target}</div>
                  </div>

                  <div className="space-y-2 rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3">
                    <div className="text-[10px] uppercase tracking-[0.14em] text-slate-400">Coords</div>
                    <div className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-2 py-1 border border-slate-700" data-testid="output-coords">
                      <span>x: {result.coords?.x}</span>
                      <span>y: {result.coords?.y}</span>
                    </div>
                    {pixelCoords && (
                      <div className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-2 py-1 border border-slate-800" data-testid="output-pixel-coords">
                        <span>x: {pixelCoords.x}</span>
                        <span>y: {pixelCoords.y}</span>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        data-testid="mark-success-button"
                        onClick={() => handleMarkExecution(true)}
                        className="flex-1 rounded-lg bg-emerald-500/90 hover:bg-emerald-400 text-slate-950 px-3 py-2 text-sm"
                      >
                        Mark success
                      </button>
                      <button
                        type="button"
                        data-testid="mark-failure-button"
                        onClick={() => handleMarkExecution(false)}
                        className="flex-1 rounded-lg bg-rose-600/90 hover:bg-rose-500 text-slate-50 px-3 py-2 text-sm"
                      >
                        Mark failure
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3">
                    <div className="text-[10px] uppercase tracking-[0.14em] text-slate-400">Plan</div>
                    <div className="text-sm text-slate-200" data-testid="output-plan">{result.plan}</div>
                  </div>

                  {result.text_input && (
                    <div className="space-y-2 rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3" data-testid="output-text-input">
                      <div className="text-[10px] uppercase tracking-[0.14em] text-slate-400">Text input</div>
                      <div className="text-sm text-slate-200">{result.text_input}</div>
                    </div>
                  )}

                  {pyautoguiSnippet && (
                    <div className="space-y-2 rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3" data-testid="pyautogui-snippet-block">
                      <div className="text-[10px] uppercase tracking-[0.14em] text-slate-400">PyAutoGUI</div>
                      <pre className="bg-slate-950 border border-slate-800 rounded-md px-2 py-1 overflow-x-auto text-[11px] text-slate-100">
                        {pyautoguiSnippet}
                      </pre>
                    </div>
                  )}

                  {seleniumSnippet && (
                    <div className="space-y-2 rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3" data-testid="selenium-snippet-block">
                      <div className="text-[10px] uppercase tracking-[0.14em] text-slate-400">Selenium</div>
                      <pre className="bg-slate-950 border border-slate-800 rounded-md px-2 py-1 overflow-x-auto text-[11px] text-slate-100">
                        {seleniumSnippet}
                      </pre>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-sm text-slate-400" data-testid="output-empty-state">
                  Run the navigator to populate actions, coordinates, and code snippets.
                </div>
              )}
            </div>
          </section>

          <section className="glass-surface rounded-2xl p-3 sm:p-5 space-y-4 context-export-section">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Context & Export</p>
                <h3 className="text-base sm:text-lg font-semibold">Shareable state</h3>
              </div>
              <button
                type="button"
                data-testid="export-workflow-button"
                onClick={() => setShowExport((v) => !v)}
                className="px-3 py-2 text-xs rounded-lg border border-slate-700 text-slate-200 hover:border-sky-400 shrink-0"
              >
                {showExport ? "Hide" : "Show"} JSON
              </button>
            </div>

            {showExport && (
              <div className="text-xs space-y-2" data-testid="export-panel">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="text-slate-400 uppercase tracking-[0.16em] text-[10px]">Workflow JSON</div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      data-testid="export-copy-button"
                      onClick={handleCopyExport}
                      className="rounded-md bg-slate-800 px-2 py-1 text-[10px] text-slate-100 border border-slate-700 hover:border-sky-500 hover:text-sky-300 whitespace-nowrap"
                    >
                      {exportCopied ? "Copied" : "Copy"}
                    </button>
                    <button
                      type="button"
                      data-testid="export-download-button"
                      onClick={handleDownloadExport}
                      className="rounded-md bg-slate-800 px-2 py-1 text-[10px] text-slate-100 border border-slate-700 hover:border-sky-500 hover:text-sky-300 whitespace-nowrap"
                    >
                      Download
                    </button>
                  </div>
                </div>
                <pre className="max-h-48 overflow-x-auto overflow-y-auto rounded-md bg-slate-950 border border-slate-800 px-2 py-2 text-[10px] sm:text-[11px] leading-snug text-slate-200 whitespace-pre-wrap break-all">
                  {exportJson}
                </pre>
              </div>
            )}

            <div className="text-xs" data-testid="output-context-panel">
              <div className="text-[10px] uppercase tracking-[0.14em] text-slate-400 mb-1">Context</div>
              <pre className="max-h-48 overflow-x-auto overflow-y-auto rounded-md bg-slate-950 border border-slate-800 px-2 py-2 text-[10px] sm:text-[11px] leading-snug text-slate-200 whitespace-pre-wrap break-all">
                {buildContextString()}
              </pre>
            </div>

            <div
              className="text-xs max-h-48 overflow-auto rounded-md bg-slate-950 border border-slate-800 px-2 py-2 space-y-1"
              data-testid="output-timeline-panel"
            >
              {context.recent_history && context.recent_history.length > 0 ? (
                context.recent_history
                  .slice()
                  .reverse()
                  .map((step, index) => (
                    <button
                      type="button"
                      key={step.step}
                      onClick={() => handleTimelineSelect(step)}
                      className="w-full text-left flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3 rounded-md bg-slate-900/80 px-2 py-1.5 border border-slate-800 hover:border-sky-500/80 hover:bg-slate-900"
                      data-testid={`timeline-item-${step.step}`}
                    >
                      <div className="space-y-0.5 flex-1 min-w-0">
                        <div className="text-[10px] sm:text-[11px] text-slate-400 break-words">
                          Step {step.step} • {step.action} • {step.status}
                        </div>
                        <div className="text-[10px] sm:text-[11px] text-slate-100 break-words" data-testid="timeline-target">
                          {step.target}
                        </div>
                        {step.plan && (
                          <div className="text-[10px] text-slate-500 break-words" data-testid="timeline-plan">
                            {step.plan}
                          </div>
                        )}
                        {typeof index === "number" && plannedSteps[index] && (
                          <div className="text-[10px] text-slate-500 break-words" data-testid="timeline-planned-label">
                            Planned: {plannedSteps[index].text}
                          </div>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 whitespace-nowrap shrink-0" data-testid="timeline-coords">
                        x:{step.coords?.x} y:{step.coords?.y}
                      </div>
                    </button>
                  ))
              ) : (
                <div className="text-xs text-slate-500" data-testid="timeline-empty-state">
                  No steps recorded yet. Run the agent to build a timeline.
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Interactive Onboarding Tour */}
      <OnboardingTour currentMode={mode} />
    </div>
  );
}

export default App;
