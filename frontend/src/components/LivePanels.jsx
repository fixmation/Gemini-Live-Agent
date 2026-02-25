/**
 * UI components for Gemini Live features
 */

import React from "react";
import { useLiveAudio, useLiveNavigation, useLiveStory } from "../utils/useLiveHooks";
import { useToast } from "./Toast";
import { AudioVisualizer, VoiceActivityIndicator, ConnectionIndicator } from "./AudioVisualizer";

/**
 * Voice conversation panel with Gemini
 */
export function LiveAudioPanel() {
  const {
    isConnected,
    isRecording,
    isSpeaking,
    response,
    error,
    connect,
    startRecording,
    stopRecording,
    disconnect,
  } = useLiveAudio();
  
  const toast = useToast();

  const handleConnect = async () => {
    try {
      await connect();
      toast.showSuccess("Connected to Gemini Live");
    } catch (err) {
      toast.showError(err.message || "Failed to connect");
    }
  };

  const handleStartRecording = async () => {
    try {
      await startRecording();
      toast.showInfo("Recording started");
    } catch (err) {
      toast.showError(err.message || "Microphone access denied");
    }
  };

  const handleDisconnect = () => {
    disconnect();
    toast.showInfo("Disconnected");
  };

  return (
    <div className="live-audio-panel p-6 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl flex flex-col items-center text-center">
      <h3 className="text-xl font-semibold mb-4 text-white">🎙️ Live Voice Conversation</h3>
      
      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-3 mb-4 justify-center">
        {!isConnected ? (
          <button
            onClick={handleConnect}
            className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg hover:shadow-purple-500/50"
          >
            Connect
          </button>
        ) : (
          <>
            <button
              onClick={isRecording ? stopRecording : handleStartRecording}
              className={`px-6 py-2 rounded-lg font-medium transition-all shadow-lg ${
                isRecording
                  ? "bg-red-500 hover:bg-red-600 text-white shadow-red-500/50 animate-pulse"
                  : "bg-green-500 hover:bg-green-600 text-white shadow-green-500/50"
              }`}
            >
              {isRecording ? "🔴 Stop Recording" : "🎤 Start Recording"}
            </button>
            <button
              onClick={handleDisconnect}
              className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-all"
            >
              Disconnect
            </button>
          </>
        )}
      </div>

      {/* Status indicators */}
      <div className="flex flex-wrap gap-3 mb-4 justify-center">
        <ConnectionIndicator status={isConnected ? "connected" : "disconnected"} />
        <VoiceActivityIndicator isActive={isRecording} isSpeaking={isSpeaking} />
      </div>

      {/* Audio visualizer */}
      {isRecording && (
        <div className="mb-4 flex justify-center">
          <AudioVisualizer isActive={isRecording} />
        </div>
      )}

      {/* Response display */}
      {response && (
        <div className="p-4 bg-black/20 rounded-lg border border-white/10 max-h-60 overflow-y-auto text-center">
          <h4 className="text-sm font-semibold text-white/60 mb-2">Latest Response:</h4>
          <div className="text-white space-y-2">
            {response.parts?.map((part, idx) => (
              <div key={idx}>
                {part.type === "text" && <p className="text-sm">{part.text}</p>}
                {part.type === "audio" && (
                  <div className="flex items-center gap-2 text-xs text-purple-300">
                    🔊 Audio response playing...
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Live UI navigation with voice + screen
 */
export function LiveNavigationPanel() {
  const {
    isConnected,
    isRecording,
    isCapturing,
    action,
    error,
    goal,
    connect,
    startNavigation,
    stopNavigation,
    updateGoal,
    disconnect,
  } = useLiveNavigation();

  const toast = useToast();
  const [goalInput, setGoalInput] = React.useState("");

  const handleConnect = async () => {
    try {
      await connect();
      toast.showSuccess("Connected to Live Navigator");
    } catch (err) {
      toast.showError(err.message || "Failed to connect");
    }
  };

  const handleStartNav = async () => {
    try {
      const targetGoal = goalInput || "Navigate the UI";
      updateGoal(targetGoal);
      await startNavigation(targetGoal);
      toast.showInfo("Navigation started");
    } catch (err) {
      toast.showError(err.message || "Failed to start navigation");
    }
  };

  const handleDisconnect = () => {
    disconnect();
    toast.showInfo("Disconnected");
  };



  return (
    <div className="live-navigation-panel p-6 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl flex flex-col items-center text-center">
      <h3 className="text-xl font-semibold mb-4 text-white">🧭 Live UI Navigator</h3>
      
      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
          {error}
        </div>
      )}

      {/* Goal input */}
      <div className="mb-4 flex flex-col items-center">
        <label className="block text-sm font-medium text-white/80 mb-2">
          Navigation Goal:
        </label>
        <input
          type="text"
          value={goalInput}
          onChange={(e) => setGoalInput(e.target.value)}
          placeholder="e.g., Find the settings page"
          className="w-full px-4 py-2 bg-black/20 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-400 transition-colors"
          disabled={isRecording || isCapturing}
        />
      </div>

      <div className="flex flex-wrap gap-3 mb-4 justify-center">
        {!isConnected ? (
          <button
            onClick={handleConnect}
            className="px-6 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-medium hover:from-blue-600 hover:to-cyan-600 transition-all shadow-lg hover:shadow-blue-500/50"
          >
            Connect
          </button>
        ) : (
          <>
            <button
              onClick={isRecording ? stopNavigation : handleStartNav}
              className={`px-6 py-2 rounded-lg font-medium transition-all shadow-lg ${
                isRecording
                  ? "bg-red-500 hover:bg-red-600 text-white shadow-red-500/50"
                  : "bg-green-500 hover:bg-green-600 text-white shadow-green-500/50"
              }`}
              disabled={!goalInput && !goal && !isRecording}
            >
              {isRecording ? "⏹️ Stop Navigation" : "▶️ Start Navigation"}
            </button>
            <button
              onClick={handleDisconnect}
              className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-all"
            >
              Disconnect
            </button>
          </>
        )}
      </div>

      {/* Status indicators */}
      <div className="flex flex-wrap gap-3 mb-4 justify-center">
        <ConnectionIndicator status={isConnected ? "connected" : "disconnected"} />
        {isRecording && (
          <div className="flex items-center gap-2 px-3 py-2 bg-red-900/30 rounded-lg border border-red-500/30 text-xs text-red-300">
            <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
            Recording Voice
          </div>
        )}
        {isCapturing && (
          <div className="flex items-center gap-2 px-3 py-2 bg-blue-900/30 rounded-lg border border-blue-500/30 text-xs text-blue-300">
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            Capturing Screen
          </div>
        )}
      </div>

      {/* Current goal */}
      {goal && (
        <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-center">
          <p className="text-xs text-blue-300 font-medium">Current Goal:</p>
          <p className="text-white text-sm mt-1">{goal}</p>
        </div>
      )}

      {/* Action display */}
      {action && (
        <div className="p-4 bg-black/20 rounded-lg border border-white/10 max-h-60 overflow-y-auto text-center">
          <h4 className="text-sm font-semibold text-white/60 mb-2">Recommended Action:</h4>
          <div className="text-white space-y-2">
            {action.parts?.map((part, idx) => (
              <div key={idx}>
                {part.type === "text" && <p className="text-sm whitespace-pre-wrap">{part.text}</p>}
                {part.type === "code" && (
                  <pre className="text-xs bg-black/30 p-2 rounded overflow-x-auto">
                    <code>{part.code}</code>
                  </pre>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Interleaved story generation panel
 */
export function LiveStoryPanel() {
  const {
    isConnected,
    isGenerating,
    blocks,
    error,
    connect,
    generateStory,
    disconnect,
  } = useLiveStory();

  const toast = useToast();
  const [prompt, setPrompt] = React.useState("");
  const [mediaTypes, setMediaTypes] = React.useState({
    text: true,
    image: true,
    audio: true,
  });

  const handleConnect = async () => {
    try {
      await connect();
      toast.showSuccess("Connected to Story Director");
    } catch (err) {
      toast.showError(err.message || "Failed to connect");
    }
  };

  const handleGenerate = () => {
    if (!prompt.trim()) {
      toast.showWarning("Please enter a story prompt");
      return;
    }
    const enabledTypes = Object.keys(mediaTypes).filter((key) => mediaTypes[key]);
    if (enabledTypes.length === 0) {
      toast.showWarning("Please select at least one media type");
      return;
    }
    generateStory(prompt, enabledTypes);
    toast.showInfo("Generating story...");
  };

  const handleDisconnect = () => {
    disconnect();
    toast.showInfo("Disconnected");
  };



  const toggleMediaType = (type) => {
    setMediaTypes((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  return (
    <div className="live-story-panel p-6 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl flex flex-col items-center text-center">
      <h3 className="text-xl font-semibold mb-4 text-white">📖 Live Story Director</h3>
      
      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
          {error}
        </div>
      )}

      {/* Prompt input */}
      <div className="mb-4 flex flex-col items-center">
        <label className="block text-sm font-medium text-white/80 mb-2">
          Story Prompt:
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter your story idea..."
          rows={3}
          className="w-full px-4 py-2 bg-black/20 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-400 transition-colors resize-none"
          disabled={isGenerating}
        />
      </div>

      {/* Media type selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-white/80 mb-2">
          Include Media Types:
        </label>
        <div className="flex flex-wrap gap-3">
          {["text", "image", "audio"].map((type) => (
            <button
              key={type}
              onClick={() => toggleMediaType(type)}
              disabled={isGenerating}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                mediaTypes[type]
                  ? "bg-purple-500 text-white"
                  : "bg-gray-600 text-gray-300 hover:bg-gray-500"
              }`}
            >
              {type === "text" && "📝"} {type === "image" && "🖼️"} {type === "audio" && "🔊"}
              {" " + type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-4 justify-center">
        {!isConnected ? (
          <button
            onClick={handleConnect}
            className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg hover:shadow-purple-500/50"
          >
            Connect
          </button>
        ) : (
          <>
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-medium hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg hover:shadow-green-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? "⏳ Generating..." : "✨ Generate Story"}
            </button>
            <button
              onClick={handleDisconnect}
              className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-all"
            >
              Disconnect
            </button>
          </>
        )}
      </div>

      {/* Status indicator */}
      <div className="flex flex-wrap gap-3 mb-4 justify-center">
        <ConnectionIndicator status={isConnected ? "connected" : "disconnected"} />
        {isGenerating && (
          <div className="flex items-center gap-2 px-3 py-2 bg-purple-900/30 rounded-lg border border-purple-500/30 text-xs text-purple-300">
            <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
            Generating Story
          </div>
        )}
      </div>

      {/* Story blocks display */}
      {blocks.length > 0 && (
        <div className="space-y-4 max-h-96 overflow-y-auto p-4 bg-black/20 rounded-lg border border-white/10 text-center">
          <h4 className="text-sm font-semibold text-white/60 sticky top-0 bg-black/40 py-2">
            Story Blocks ({blocks.length}):
          </h4>
          {blocks.map((block, idx) => (
            <div key={idx} className="p-3 bg-white/5 rounded-lg border border-white/10">
              <div className="text-xs text-white/40 mb-2">Block {idx + 1}</div>
              <div className="space-y-2">
                {block.parts?.map((part, partIdx) => (
                  <div key={partIdx}>
                    {part.type === "text" && (
                      <p className="text-sm text-white whitespace-pre-wrap">{part.text}</p>
                    )}
                    {part.type === "image" && part.data && (
                      <img
                        src={`data:image/jpeg;base64,${part.data}`}
                        alt={`Story block ${idx + 1}`}
                        className="rounded-lg max-w-full h-auto"
                      />
                    )}
                    {part.type === "audio" && (
                      <div className="flex items-center gap-2 text-xs text-purple-300">
                        🔊 Audio narration playing...
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
