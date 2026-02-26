import React, { useCallback, useEffect, useState } from "react";
import StreamingIndicator from "./components/StreamingIndicator";
import ConfidenceIndicator from "./components/ConfidenceIndicator";
import ConversationContext from "./components/ConversationContext";
import ScreenCaptureVisualization from "./components/ScreenCaptureVisualization";
import ResponseDisplay from "./components/ResponseDisplay";
import { LiveAudioPanel, LiveNavigationPanel, LiveStoryPanel } from "./components/LivePanels";
import { SettingsModal } from "./components/SettingsModal";
import "./styles/immersive-layout.css";

const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

function AppImmersive() {
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  // Current mode: "audio" | "navigate" | "story"
  const [mode, setMode] = useState("audio");

  // Settings modal visibility
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Connection state
  const [wsConnected, setWsConnected] = useState(false);
  const [streamingState, setStreamingState] = useState("idle"); // idle | listening | thinking | speaking | connecting | error

  // Streaming feedback
  const [currentResponse, setCurrentResponse] = useState(null);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [turnNumber, setTurnNumber] = useState(0);

  // Navigator mode state
  const [navigationGoal, setNavigationGoal] = useState("");
  const [actionHistory, setActionHistory] = useState([]);
  const [screenCapture, setScreenCapture] = useState(null); // base64
  const [screenDimensions, setScreenDimensions] = useState({ width: 0, height: 0 });
  const [lastAction, setLastAction] = useState(null); // { action, coords, confidence, explanation, etc. }

  // Audio mode state
  const [isListening, setIsListening] = useState(false);

  // ============================================================================
  // MODE SWITCHING
  // ============================================================================

  const switchMode = useCallback((newMode) => {
    setMode(newMode);
    // Reset mode-specific state
    setStreamingState("idle");
    setCurrentResponse(null);
    setLastAction(null);
  }, []);

  // ============================================================================
  // STREAMING STATE MANAGEMENT
  // ============================================================================

  // Update streaming indicator based on WebSocket activity
  const handleStreamingStateChange = useCallback((newState) => {
    setStreamingState(newState);
  }, []);

  // Update conversation history when responses arrive
  const handleResponseReceived = useCallback((response) => {
    setCurrentResponse(response);
    setTurnNumber((prev) => prev + 1);

    // Add to conversation history
    if (response.explanation) {
      setConversationHistory((prev) => [
        ...prev,
        {
          role: "assistant",
          content: response.explanation,
          confidence: response.confidence,
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  }, []);

  // Navigator mode: handle screen capture
  const handleScreenCapture = useCallback(async () => {
    try {
      // Get current window dimensions
      const width = window.innerWidth;
      const height = window.innerHeight;
      setScreenDimensions({ width, height });

      console.log("Screen capture requested:", { width, height });
    } catch (error) {
      console.error("Screen capture error:", error);
    }
  }, []);

  // Navigator mode: handle action recommendation
  const handleActionReceived = useCallback((action) => {
    setLastAction(action);
    setActionHistory((prev) => [
      ...prev,
      {
        action: action.action,
        target: action.target,
        confidence: action.confidence,
        timestamp: new Date().toISOString(),
      },
    ]);
  }, []);

  // ============================================================================
  // RENDER: Mode-Specific Content
  // ============================================================================

  const renderModePanel = () => {
    switch (mode) {
      case "audio":
        return (
          <LiveAudioPanel
            backendUrl={backendUrl}
            onStreamingStateChange={handleStreamingStateChange}
            onResponseReceived={handleResponseReceived}
            onHistory={setConversationHistory}
          />
        );

      case "navigate":
        return (
          <LiveNavigationPanel
            backendUrl={backendUrl}
            goal={navigationGoal}
            onGoalChange={setNavigationGoal}
            onStreamingStateChange={handleStreamingStateChange}
            onActionReceived={handleActionReceived}
            onScreenCapture={handleScreenCapture}
            screenCapture={screenCapture}
            screenDimensions={screenDimensions}
          />
        );

      case "story":
        return (
          <LiveStoryPanel
            backendUrl={backendUrl}
            onStreamingStateChange={handleStreamingStateChange}
            onResponseReceived={handleResponseReceived}
          />
        );

      default:
        return null;
    }
  };

  // ============================================================================
  // RENDER: Visualization Area (Immersive)
  // ============================================================================

  const renderVisualization = () => {
    switch (mode) {
      case "audio":
        return (
          <div className="visualization-panel audio-mode">
            <StreamingIndicator
              state={streamingState}
              message={
                streamingState === "listening"
                  ? "Listening to your voice..."
                  : streamingState === "thinking"
                  ? "Understanding your words..."
                  : streamingState === "speaking"
                  ? "Generating response..."
                  : ""
              }
            />

            {/* Audio Visualizer would go here */}
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ textAlign: "center", color: "#9ca3af" }}>
                <div style={{ fontSize: "48px", marginBottom: "12px" }}>🎙️</div>
                <div>Audio visualization panel</div>
              </div>
            </div>

            {/* Response Display */}
            {currentResponse && (
              <ResponseDisplay
                explanation={currentResponse.explanation}
                visualEvidence={currentResponse.visual_evidence}
                alternatives={currentResponse.alternatives}
                showAlternatives={currentResponse.confidence < 0.7}
                animate={true}
                turnNumber={turnNumber}
              />
            )}

            {/* Confidence Indicator */}
            {currentResponse && (
              <ConfidenceIndicator
                overall={currentResponse.confidence}
                animated={streamingState === "speaking"}
              />
            )}
          </div>
        );

      case "navigate":
        return (
          <div className="visualization-panel navigator-mode">
            <StreamingIndicator
              state={streamingState}
              message={
                streamingState === "listening"
                  ? "Listening to command..."
                  : streamingState === "thinking"
                  ? "Analyzing screen..."
                  : streamingState === "speaking"
                  ? "Recommending action..."
                  : ""
              }
            />

            {/* Screen Capture Visualization */}
            <ScreenCaptureVisualization
              image={screenCapture}
              screenWidth={screenDimensions.width}
              screenHeight={screenDimensions.height}
              targetX={lastAction?.coords?.x}
              targetY={lastAction?.coords?.y}
              targetLabel={lastAction?.target}
              confidence={lastAction?.confidence}
              highlight={true}
            />

            {/* Response Display */}
            {lastAction && (
              <ResponseDisplay
                explanation={lastAction.explanation}
                visualEvidence={lastAction.visual_evidence}
                alternatives={lastAction.alternatives}
                showAlternatives={lastAction.confidence < 0.7}
                animate={true}
                turnNumber={turnNumber}
              />
            )}

            {/* Confidence Indicator (Visual + Overall) */}
            {lastAction && (
              <ConfidenceIndicator
                overall={lastAction.confidence}
                visual={lastAction.visual_confidence}
                animated={streamingState === "thinking"}
              />
            )}
          </div>
        );

      case "story":
        return (
          <div className="visualization-panel story-mode">
            <StreamingIndicator
              state={streamingState}
              message={
                streamingState === "thinking"
                  ? "Generating story..."
                  : streamingState === "speaking"
                  ? "Streaming narrative..."
                  : ""
              }
            />

            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Story Visualization Area */}
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ textAlign: "center", color: "#9ca3af" }}>
                  <div style={{ fontSize: "48px", marginBottom: "12px" }}>📖</div>
                  <div>Story visualization panel</div>
                </div>
              </div>

              {/* Response Display */}
              {currentResponse && (
                <ResponseDisplay
                  explanation={currentResponse.explanation}
                  visualEvidence={currentResponse.visual_evidence}
                  animate={true}
                  turnNumber={turnNumber}
                />
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // ============================================================================
  // RENDER: Context Sidebar
  // ============================================================================

  const renderContextSidebar = () => {
    switch (mode) {
      case "audio":
        return (
          <ConversationContext
            goal=""
            history={conversationHistory.map((h) => ({
              action: h.content.substring(0, 50) + (h.content.length > 50 ? "..." : ""),
              confidence: h.confidence,
            }))}
            turnNumber={turnNumber}
            contextLength={conversationHistory.length}
            mode="audio"
          />
        );

      case "navigate":
        return (
          <ConversationContext
            goal={navigationGoal}
            history={actionHistory}
            turnNumber={turnNumber}
            contextLength={actionHistory.length}
            mode="navigate"
          />
        );

      case "story":
        return (
          <ConversationContext
            goal=""
            history={conversationHistory.map((h) => ({
              action: h.content.substring(0, 50) + (h.content.length > 50 ? "..." : ""),
              confidence: h.confidence,
            }))}
            turnNumber={turnNumber}
            contextLength={conversationHistory.length}
            mode="story"
          />
        );

      default:
        return null;
    }
  };

  // ============================================================================
  // RENDER: Main App
  // ============================================================================

  return (
    <div className={`app-container ${mode}-mode`}>
      {/* Header */}
      <header className="app-header">
        <div className="header-title">
          <span className="header-title-emoji">🤖</span>
          <span>Gemini Live Agent</span>
        </div>
        <div className="header-status">
          <div className={`status-dot ${wsConnected ? "" : "disconnected"}`} />
          <span>{wsConnected ? "Connected" : "Disconnected"}</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {/* Main Panel with Mode Selector & Visualization */}
        <div className="main-panel">
          {/* Mode Selector */}
          <div className="mode-selector">
            <button
              className={`mode-button ${mode === "audio" ? "active" : ""}`}
              onClick={() => switchMode("audio")}
            >
              🎤 Audio
            </button>
            <button
              className={`mode-button ${mode === "navigate" ? "active" : ""}`}
              onClick={() => switchMode("navigate")}
            >
              🖱️ Navigate
            </button>
            <button
              className={`mode-button ${mode === "story" ? "active" : ""}`}
              onClick={() => switchMode("story")}
            >
              📖 Story
            </button>
          </div>

          {/* Immersive Visualization */}
          {renderVisualization()}

          {/* Mode-Specific Panel (hidden, provides WebSocket connection) */}
          <div style={{ display: "none" }}>{renderModePanel()}</div>
        </div>

        {/* Context Sidebar */}
        <aside className="context-sidebar">{renderContextSidebar()}</aside>
      </main>

      {/* Control Bar */}
      <footer className="control-bar">
        {streamingState !== "idle" && (
          <button className="btn btn-danger btn-stop">⏹ STOP</button>
        )}

        {mode === "audio" && (
          <button className={`btn ${isListening ? "btn-danger" : "btn-primary"}`}>
            {isListening ? "⏹ Stop Speaking" : "🎤 Speak"}
          </button>
        )}

        {mode === "navigate" && (
          <>
            <button className="btn btn-capture-screen" onClick={handleScreenCapture}>
              📸 Capture Screen
            </button>
            <button className="btn btn-primary">🎙️ Give Command</button>
          </>
        )}

        {mode === "story" && (
          <button className="btn btn-primary">📝 Continue Story</button>
        )}

        <button className="btn btn-secondary" onClick={() => setIsSettingsOpen(true)}>⚙️ Settings</button>
      </footer>

      {/* Settings Modal */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}

export default AppImmersive;
