/**
 * React hooks for Gemini Live features
 * Integrates WebSocket, audio, and screen capture
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { LiveAudioClient, LiveNavigationClient, LiveStoryClient } from "./websocketClient";
import { MicrophoneCapture, AudioPlayer, VoiceActivityDetector } from "./audioUtils";
import { ScreenCaptureStream } from "./screenCapture";

/**
 * Hook for live audio conversation with Gemini
 */
export function useLiveAudio() {
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [reconnecting, setReconnecting] = useState(false);

  const clientRef = useRef(null);
  const micRef = useRef(null);
  const playerRef = useRef(null);
  const vadRef = useRef(null);

  const connect = useCallback(async () => {
    try {
      // Initialize clients
      if (!clientRef.current) {
        clientRef.current = new LiveAudioClient();
      }
      if (!micRef.current) {
        micRef.current = new MicrophoneCapture();
      }
      if (!playerRef.current) {
        playerRef.current = new AudioPlayer();
        await playerRef.current.init();
      }
      if (!vadRef.current) {
        vadRef.current = new VoiceActivityDetector();
        vadRef.current.onSpeechStart = () => setIsSpeaking(true);
        vadRef.current.onSpeechEnd = () => setIsSpeaking(false);
      }

      // Connect WebSocket
      clientRef.current.onResponse = (resp) => {
        setResponse(resp);
        
        // Play audio response if present
        for (const part of resp.parts || []) {
          if (part.type === "audio" && part.data) {
            playerRef.current.enqueue(part.data, part.mime_type);
          }
        }
      };

      clientRef.current.onError = (err) => setError(err.message || "Connection error");
      
      await clientRef.current.connect();
      setIsConnected(true);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to connect");
      setIsConnected(false);
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      micRef.current.onAudioChunk = (chunk) => {
        // Send to Gemini Live
        clientRef.current.sendAudio(chunk);
        
        // Process for VAD
        vadRef.current.process(chunk);
      };

      await micRef.current.start();
      setIsRecording(true);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to start recording");
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (micRef.current) {
      micRef.current.stop();
      setIsRecording(false);
      setIsSpeaking(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.close();
    }
    if (micRef.current) {
      micRef.current.stop();
    }
    if (playerRef.current) {
      playerRef.current.close();
    }
    setIsConnected(false);
    setIsRecording(false);
    setIsSpeaking(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    isRecording,
    isSpeaking,
    response,
    error,
    reconnecting,
    connect,
    startRecording,
    stopRecording,
    disconnect,
  };
}

/**
 * Hook for live UI navigation with voice + screen
 */
export function useLiveNavigation() {
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [action, setAction] = useState(null);
  const [error, setError] = useState(null);
  const [goal, setGoal] = useState("");
  const [reconnecting, setReconnecting] = useState(false);

  const clientRef = useRef(null);
  const micRef = useRef(null);
  const screenRef = useRef(null);
  const playerRef = useRef(null);

  const connect = useCallback(async () => {
    try {
      if (!clientRef.current) {
        clientRef.current = new LiveNavigationClient();
      }
      if (!micRef.current) {
        micRef.current = new MicrophoneCapture();
      }
      if (!playerRef.current) {
        playerRef.current = new AudioPlayer();
        await playerRef.current.init();
      }

      clientRef.current.onAction = (resp) => {
        setAction(resp);
        
        // Play audio responses
        for (const part of resp.parts || []) {
          if (part.type === "audio" && part.data) {
            playerRef.current.enqueue(part.data);
          }
        }
      };

      clientRef.current.onError = (err) => setError(err.message || "Connection error");
      
      await clientRef.current.connect();
      setIsConnected(true);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to connect");
      setIsConnected(false);
    }
  }, []);

  const startNavigation = useCallback(async (navigationGoal) => {
    try {
      // Set goal
      const targetGoal = navigationGoal || goal || "Navigate the UI";
      setGoal(targetGoal);
      clientRef.current.setGoal(targetGoal);

      // Start microphone
      micRef.current.onAudioChunk = (chunk) => {
        clientRef.current.sendAudio(chunk);
      };
      await micRef.current.start();
      setIsRecording(true);

      // Start screen capture
      if (!screenRef.current) {
        screenRef.current = new ScreenCaptureStream(2); // 2 FPS
      }
      screenRef.current.onFrame = (base64Frame) => {
        clientRef.current.sendScreenFrame(base64Frame);
      };
      await screenRef.current.start();
      setIsCapturing(true);

      setError(null);
    } catch (err) {
      setError(err.message || "Failed to start navigation");
    }
  }, [goal]);

  const stopNavigation = useCallback(() => {
    if (micRef.current) {
      micRef.current.stop();
      setIsRecording(false);
    }
    if (screenRef.current) {
      screenRef.current.stop();
      setIsCapturing(false);
    }
  }, []);

  const updateGoal = useCallback((newGoal) => {
    setGoal(newGoal);
    if (clientRef.current && isConnected) {
      clientRef.current.setGoal(newGoal);
    }
  }, [isConnected]);

  const disconnect = useCallback(() => {
    stopNavigation();
    if (clientRef.current) {
      clientRef.current.close();
    }
    if (playerRef.current) {
      playerRef.current.close();
    }
    setIsConnected(false);
  }, [stopNavigation]);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    isRecording,
    isCapturing,
    action,
    error,
    goal,
    reconnecting,
    connect,
    startNavigation,
    stopNavigation,
    updateGoal,
    disconnect,
  };
}

/**
 * Hook for interleaved story generation
 */
export function useLiveStory() {
  const [isConnected, setIsConnected] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [blocks, setBlocks] = useState([]);
  const [error, setError] = useState(null);
  const [reconnecting, setReconnecting] = useState(false);

  const clientRef = useRef(null);
  const playerRef = useRef(null);

  const connect = useCallback(async () => {
    try {
      if (!clientRef.current) {
        clientRef.current = new LiveStoryClient();
      }
      if (!playerRef.current) {
        playerRef.current = new AudioPlayer();
        await playerRef.current.init();
      }

      clientRef.current.onBlock = (block) => {
        setBlocks((prev) => [...prev, block]);
        
        // Auto-play audio blocks
        for (const part of block.parts || []) {
          if (part.type === "audio" && part.data) {
            playerRef.current.enqueue(part.data, part.mime_type);
          }
        }
      };

      clientRef.current.onComplete = () => {
        setIsGenerating(false);
      };

      clientRef.current.onError = (err) => {
        setError(err);
        setIsGenerating(false);
      };
      
      clientRef.current.onReconnecting = (attempt, delay) => {
        setReconnecting(true);
        setError(`Reconnecting (${attempt}/5)...`);
      };
      
      clientRef.current.onClose = () => {
        setIsConnected(false);
        setReconnecting(false);
      };
      
      await clientRef.current.connect();
      setIsConnected(true);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to connect");
      setIsConnected(false);
    }
  }, []);

  const generateStory = useCallback((prompt, mediaTypes = ["text", "image", "audio"]) => {
    if (!isConnected) {
      setError("Not connected");
      return;
    }

    setBlocks([]);
    setIsGenerating(true);
    setError(null);
    clientRef.current.generateStory(prompt, mediaTypes);
  }, [isConnected]);

  const disconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.close();
    }
    if (playerRef.current) {
      playerRef.current.close();
    }
    setIsConnected(false);
    setIsGenerating(false);
  }, []);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    isGenerating,
    blocks,
    error,
    reconnecting,
    connect,
    generateStory,
    disconnect,
  };
}
