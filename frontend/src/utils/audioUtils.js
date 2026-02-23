/**
 * Audio utilities for microphone capture and playback
 * Handles Web Audio API for Gemini Live integration
 */

/**
 * Microphone Audio Capture
 * Captures audio from user's microphone and provides PCM chunks
 */
export class MicrophoneCapture {
  constructor() {
    this.audioContext = null;
    this.mediaStream = null;
    this.source = null;
    this.processor = null;
    this.isRecording = false;
    this.onAudioChunk = null;
    this.onError = null;
  }

  async start() {
    try {
      // Request microphone permission
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1, // Mono
          sampleRate: 16000, // 16kHz for Gemini Live
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Create audio context
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: 16000,
      });

      this.source = this.audioContext.createMediaStreamSource(this.mediaStream);

      // Create ScriptProcessor or AudioWorklet for processing
      const bufferSize = 4096;
      this.processor = this.audioContext.createScriptProcessor(bufferSize, 1, 1);

      this.processor.onaudioprocess = (event) => {
        if (!this.isRecording) return;

        const inputData = event.inputBuffer.getChannelData(0);
        
        // Convert Float32Array to Int16Array (PCM)
        const pcmData = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          // Clamp to [-1, 1] and convert to 16-bit
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }

        if (this.onAudioChunk) {
          this.onAudioChunk(pcmData.buffer);
        }
      };

      // Connect the audio graph
      this.source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);

      this.isRecording = true;
      console.log("Microphone capture started");
    } catch (error) {
      console.error("Failed to start microphone:", error);
      if (this.onError) {
        this.onError(error);
      }
      throw error;
    }
  }

  stop() {
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }

    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.isRecording = false;
    console.log("Microphone capture stopped");
  }

  getState() {
    return {
      isRecording: this.isRecording,
      sampleRate: this.audioContext?.sampleRate || null,
    };
  }
}

/**
 * Audio Playback Engine
 * Plays audio responses from Gemini Live
 */
export class AudioPlayer {
  constructor() {
    this.audioContext = null;
    this.audioQueue = [];
    this.isPlaying = false;
    this.currentSource = null;
  }

  async init() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  /**
   * Play audio from base64 encoded data
   */
  async playBase64(base64Data, mimeType = "audio/pcm") {
    await this.init();

    try {
      // Decode base64 to array buffer
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      if (mimeType === "audio/pcm") {
        // PCM data - convert to playable format
        await this.playPCM(bytes.buffer);
      } else {
        // Encoded audio (mp3, wav, etc.)
        await this.playEncoded(bytes.buffer);
      }
    } catch (error) {
      console.error("Failed to play audio:", error);
    }
  }

  /**
   * Play PCM audio data
   */
  async playPCM(arrayBuffer) {
    const pcmData = new Int16Array(arrayBuffer);
    const floatData = new Float32Array(pcmData.length);

    // Convert Int16 to Float32
    for (let i = 0; i < pcmData.length; i++) {
      floatData[i] = pcmData[i] / (pcmData[i] < 0 ? 0x8000 : 0x7fff);
    }

    // Create audio buffer
    const audioBuffer = this.audioContext.createBuffer(
      1, // mono
      floatData.length,
      16000 // 16kHz sample rate
    );

    audioBuffer.getChannelData(0).set(floatData);

    // Play the buffer
    await this.playBuffer(audioBuffer);
  }

  /**
   * Play encoded audio (mp3, wav, etc.)
   */
  async playEncoded(arrayBuffer) {
    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
    await this.playBuffer(audioBuffer);
  }

  /**
   * Play an audio buffer
   */
  async playBuffer(audioBuffer) {
    return new Promise((resolve) => {
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);

      source.onended = () => {
        this.isPlaying = false;
        this.currentSource = null;
        resolve();
      };

      this.currentSource = source;
      this.isPlaying = true;
      source.start(0);
    });
  }

  /**
   * Queue audio for sequential playback
   */
  async enqueue(base64Data, mimeType = "audio/pcm") {
    this.audioQueue.push({ base64Data, mimeType });
    
    if (!this.isPlaying) {
      await this.playQueue();
    }
  }

  /**
   * Play queued audio sequentially
   */
  async playQueue() {
    while (this.audioQueue.length > 0) {
      const { base64Data, mimeType } = this.audioQueue.shift();
      await this.playBase64(base64Data, mimeType);
    }
  }

  stop() {
    if (this.currentSource) {
      this.currentSource.stop();
      this.currentSource = null;
    }
    this.audioQueue = [];
    this.isPlaying = false;
  }

  close() {
    this.stop();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

/**
 * Voice Activity Detection (VAD)
 * Detects when user is speaking to enable natural turn-taking
 */
export class VoiceActivityDetector {
  constructor(threshold = 0.01, silenceDuration = 1000) {
    this.threshold = threshold;
    this.silenceDuration = silenceDuration; // ms
    this.lastSpeechTime = 0;
    this.isSpeaking = false;
    this.onSpeechStart = null;
    this.onSpeechEnd = null;
  }

  /**
   * Process audio chunk to detect voice activity
   */
  process(audioData) {
    // Calculate RMS (Root Mean Square) energy
    const float32Data = new Float32Array(audioData);
    let sum = 0;
    for (let i = 0; i < float32Data.length; i++) {
      sum += float32Data[i] * float32Data[i];
    }
    const rms = Math.sqrt(sum / float32Data.length);

    const now = Date.now();

    if (rms > this.threshold) {
      // Speech detected
      this.lastSpeechTime = now;
      
      if (!this.isSpeaking) {
        this.isSpeaking = true;
        if (this.onSpeechStart) {
          this.onSpeechStart();
        }
      }
    } else {
      // Silence detected
      if (this.isSpeaking && now - this.lastSpeechTime > this.silenceDuration) {
        this.isSpeaking = false;
        if (this.onSpeechEnd) {
          this.onSpeechEnd();
        }
      }
    }

    return {
      isSpeaking: this.isSpeaking,
      energy: rms,
    };
  }

  reset() {
    this.lastSpeechTime = 0;
    this.isSpeaking = false;
  }
}
