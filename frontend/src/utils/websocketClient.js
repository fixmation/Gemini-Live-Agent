/**
 * WebSocket client for Gemini Live API communication
 * Handles audio streaming, navigation, and story generation
 */

const getWebSocketUrl = (endpoint) => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";
  const wsProtocol = backendUrl.startsWith("https") ? "wss" : "ws";
  const wsBase = backendUrl.replace(/^https?:\/\//, "");
  return `${wsProtocol}://${wsBase}${endpoint}`;
};

/**
 * Live Audio Streaming Client
 * Handles bidirectional audio communication with Gemini Live
 */
export class LiveAudioClient {
  constructor() {
    this.ws = null;
    this.isConnected = false;
    this.onResponse = null;
    this.onError = null;
    this.onClose = null;
  }

  connect() {
    return new Promise((resolve, reject) => {
      const url = getWebSocketUrl("/ws/live/audio");
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.isConnected = true;
        console.log("Live audio WebSocket connected");
        resolve();
      };

      this.ws.onmessage = (event) => {
        try {
          const response = JSON.parse(event.data);
          if (this.onResponse) {
            this.onResponse(response);
          }
        } catch (error) {
          console.error("Failed to parse response:", error);
        }
      };

      this.ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        if (this.onError) {
          this.onError(error);
        }
        reject(error);
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        console.log("Live audio WebSocket closed");
        if (this.onClose) {
          this.onClose();
        }
      };
    });
  }

  sendAudio(audioChunk) {
    if (this.isConnected && this.ws) {
      this.ws.send(audioChunk);
    }
  }

  sendControl(message) {
    if (this.isConnected && this.ws) {
      this.ws.send(JSON.stringify(message));
    }
  }

  close() {
    if (this.ws) {
      this.sendControl({ type: "close" });
      this.ws.close();
      this.isConnected = false;
    }
  }
}

/**
 * Live Navigation Client
 * Handles voice commands + screen capture for UI navigation
 */
export class LiveNavigationClient {
  constructor() {
    this.ws = null;
    this.isConnected = false;
    this.onAction = null;
    this.onError = null;
    this.onClose = null;
  }

  connect() {
    return new Promise((resolve, reject) => {
      const url = getWebSocketUrl("/ws/live/navigate");
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.isConnected = true;
        console.log("Live navigation WebSocket connected");
        resolve();
      };

      this.ws.onmessage = (event) => {
        try {
          const response = JSON.parse(event.data);
          if (this.onAction) {
            this.onAction(response);
          }
        } catch (error) {
          console.error("Failed to parse navigation action:", error);
        }
      };

      this.ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        if (this.onError) {
          this.onError(error);
        }
        reject(error);
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        console.log("Live navigation WebSocket closed");
        if (this.onClose) {
          this.onClose();
        }
      };
    });
  }

  sendAudio(audioChunk) {
    if (this.isConnected && this.ws) {
      this.ws.send(audioChunk);
    }
  }

  sendScreenFrame(imageData) {
    if (this.isConnected && this.ws) {
      this.ws.send(
        JSON.stringify({
          type: "screen_frame",
          data: imageData, // base64 encoded
        })
      );
    }
  }

  setGoal(goal) {
    if (this.isConnected && this.ws) {
      this.ws.send(
        JSON.stringify({
          type: "set_goal",
          goal: goal,
        })
      );
    }
  }

  close() {
    if (this.ws) {
      this.ws.send(JSON.stringify({ type: "close" }));
      this.ws.close();
      this.isConnected = false;
    }
  }
}

/**
 * Live Story Generation Client
 * Handles interleaved multimodal story generation
 */
export class LiveStoryClient {
  constructor() {
    this.ws = null;
    this.isConnected = false;
    this.onBlock = null;
    this.onComplete = null;
    this.onError = null;
    this.onClose = null;
  }

  connect() {
    return new Promise((resolve, reject) => {
      const url = getWebSocketUrl("/ws/live/story");
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.isConnected = true;
        console.log("Live story WebSocket connected");
        resolve();
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          if (message.type === "story_block" && this.onBlock) {
            this.onBlock(message);
          } else if (message.type === "complete" && this.onComplete) {
            this.onComplete();
          } else if (message.type === "error" && this.onError) {
            this.onError(message.message);
          }
        } catch (error) {
          console.error("Failed to parse story block:", error);
        }
      };

      this.ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        if (this.onError) {
          this.onError(error);
        }
        reject(error);
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        console.log("Live story WebSocket closed");
        if (this.onClose) {
          this.onClose();
        }
      };
    });
  }

  generateStory(prompt, mediaTypes = ["text", "image", "audio"]) {
    if (this.isConnected && this.ws) {
      this.ws.send(
        JSON.stringify({
          prompt: prompt,
          media_types: mediaTypes,
        })
      );
    }
  }

  close() {
    if (this.ws) {
      this.ws.close();
      this.isConnected = false;
    }
  }
}
