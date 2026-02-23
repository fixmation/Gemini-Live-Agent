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
 * Base WebSocket client with reconnection logic
 */
class BaseWebSocketClient {
  constructor(endpoint) {
    this.endpoint = endpoint;
    this.ws = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // Start with 1 second
    this.reconnectTimer = null;
    this.shouldReconnect = true;
    this.onResponse = null;
    this.onError = null;
    this.onClose = null;
    this.onReconnecting = null;
  }

  connect() {
    return new Promise((resolve, reject) => {
      const url = getWebSocketUrl(this.endpoint);
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
        console.log(`WebSocket connected: ${this.endpoint}`);
        resolve();
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(event);
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
        console.log(`WebSocket closed: ${this.endpoint}`);
        
        if (this.onClose) {
          this.onClose();
        }

        // Auto-reconnect if enabled
        if (this.shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 8000);
          
          if (this.onReconnecting) {
            this.onReconnecting(this.reconnectAttempts, delay);
          }

          this.reconnectTimer = setTimeout(() => {
            console.log(`Reconnecting (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
            this.connect().catch(console.error);
          }, delay);
        }
      };
    });
  }

  handleMessage(event) {
    try {
      const response = JSON.parse(event.data);
      if (this.onResponse) {
        this.onResponse(response);
      }
    } catch (error) {
      console.error("Failed to parse response:", error);
    }
  }

  send(data) {
    if (this.isConnected && this.ws) {
      if (typeof data === "string" || data instanceof ArrayBuffer) {
        this.ws.send(data);
      } else {
        this.ws.send(JSON.stringify(data));
      }
    }
  }

  close() {
    this.shouldReconnect = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
  }
}

/**
 * Live Audio Streaming Client
 * Handles bidirectional audio communication with Gemini Live
 */
export class LiveAudioClient extends BaseWebSocketClient {
  constructor() {
    super("/ws/live/audio");
  }

  sendAudio(audioChunk) {
    if (this.isConnected && this.ws) {
      this.ws.send(audioChunk);
    }
  }

  sendControl(message) {
    this.send(message);
  }
}

/**
 * Live Navigation Client
 * Handles voice commands + screen capture for UI navigation
 */
export class LiveNavigationClient extends BaseWebSocketClient {
  constructor() {
    super("/ws/live/navigate");
    this.onAction = null;
  }

  handleMessage(event) {
    try {
      const response = JSON.parse(event.data);
      if (this.onAction) {
        this.onAction(response);
      }
      if (this.onResponse) {
        this.onResponse(response);
      }
    } catch (error) {
      console.error("Failed to parse navigation action:", error);
    }
  }

  sendAudio(audioChunk) {
    if (this.isConnected && this.ws) {
      this.ws.send(audioChunk);
    }
  }

  sendScreenFrame(imageData) {
    this.send({
      type: "screen_frame",
      data: imageData,
    });
  }

  setGoal(goal) {
    this.send({
      type: "set_goal",
      goal: goal,
    });
  }
}

/**
 * Live Story Generation Client
 * Handles interleaved multimodal story generation
 */
export class LiveStoryClient extends BaseWebSocketClient {
  constructor() {
    super("/ws/live/story");
    this.onBlock = null;
    this.onComplete = null;
  }

  handleMessage(event) {
    try {
      const message = JSON.parse(event.data);

      if (message.type === "story_block" && this.onBlock) {
        this.onBlock(message);
      } else if (message.type === "complete" && this.onComplete) {
        this.onComplete();
      } else if (message.type === "error" && this.onError) {
        this.onError(message.message);
      }
      
      if (this.onResponse) {
        this.onResponse(message);
      }
    } catch (error) {
      console.error("Failed to parse story block:", error);
      if (this.onError) {
        this.onError(error.message);
      }
    }
  }

  generateStory(prompt, mediaTypes = ["text", "image", "audio"]) {
    this.send({
      prompt: prompt,
      media_types: mediaTypes,
    });
  }
}
