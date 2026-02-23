/**
 * Screen Capture API utilities
 * Handles continuous screen capture for live navigation
 */

export class ScreenCaptureStream {
  constructor(frameRate = 2) {
    this.mediaStream = null;
    this.video = null;
    this.canvas = null;
    this.ctx = null;
    this.captureInterval = null;
    this.frameRate = frameRate; // Frames per second
    this.isCapturing = false;
    this.onFrame = null;
    this.onError = null;
  }

  async start() {
    try {
      // Request screen capture permission
      this.mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          mediaSource: "screen",
          frameRate: { ideal: this.frameRate, max: 10 },
        },
        audio: false,
      });

      // Create video element to render stream
      this.video = document.createElement("video");
      this.video.srcObject = this.mediaStream;
      this.video.autoplay = true;
      this.video.muted = true;

      // Wait for video metadata to load
      await new Promise((resolve) => {
        this.video.onloadedmetadata = resolve;
      });

      await this.video.play();

      // Create canvas for frame capture
      this.canvas = document.createElement("canvas");
      this.canvas.width = this.video.videoWidth;
      this.canvas.height = this.video.videoHeight;
      this.ctx = this.canvas.getContext("2d");

      // Start capturing frames
      this.isCapturing = true;
      this.captureInterval = setInterval(() => {
        this.captureFrame();
      }, 1000 / this.frameRate);

      console.log("Screen capture started:", {
        width: this.canvas.width,
        height: this.canvas.height,
        frameRate: this.frameRate,
      });

      // Listen for stream end (user stops sharing)
      this.mediaStream.getVideoTracks()[0].addEventListener("ended", () => {
        console.log("User stopped screen sharing");
        this.stop();
      });
    } catch (error) {
      console.error("Failed to start screen capture:", error);
      if (this.onError) {
        this.onError(error);
      }
      throw error;
    }
  }

  captureFrame() {
    if (!this.isCapturing || !this.video || !this.canvas) return;

    // Draw current video frame to canvas
    this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);

    // Get frame as base64 JPEG
    const base64Frame = this.canvas.toDataURL("image/jpeg", 0.8).split(",")[1];

    if (this.onFrame) {
      this.onFrame(base64Frame, {
        width: this.canvas.width,
        height: this.canvas.height,
        timestamp: Date.now(),
      });
    }
  }

  captureOnce() {
    if (!this.isCapturing || !this.video || !this.canvas) {
      throw new Error("Screen capture not started");
    }

    this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
    return this.canvas.toDataURL("image/jpeg", 0.8).split(",")[1];
  }

  stop() {
    if (this.captureInterval) {
      clearInterval(this.captureInterval);
      this.captureInterval = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.video) {
      this.video.pause();
      this.video.srcObject = null;
      this.video = null;
    }

    this.canvas = null;
    this.ctx = null;
    this.isCapturing = false;
    console.log("Screen capture stopped");
  }

  getState() {
    return {
      isCapturing: this.isCapturing,
      width: this.canvas?.width || null,
      height: this.canvas?.height || null,
      frameRate: this.frameRate,
    };
  }
}

/**
 * Utility to capture a single screenshot (no continuous streaming)
 */
export async function captureScreenshot() {
  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: { mediaSource: "screen" },
      audio: false,
    });

    const video = document.createElement("video");
    video.srcObject = stream;
    video.autoplay = true;
    video.muted = true;

    await new Promise((resolve) => {
      video.onloadedmetadata = resolve;
    });

    await video.play();

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Stop the stream immediately
    stream.getTracks().forEach((track) => track.stop());

    // Return as base64
    return {
      base64: canvas.toDataURL("image/jpeg", 0.9).split(",")[1],
      width: canvas.width,
      height: canvas.height,
    };
  } catch (error) {
    console.error("Failed to capture screenshot:", error);
    throw error;
  }
}
