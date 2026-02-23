/**
 * Audio visualizer components for voice activity
 */

import React, { useEffect, useRef, useState } from "react";

/**
 * Simple waveform visualizer using Web Audio API
 */
export function AudioVisualizer({ isActive, audioContext, analyser }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    if (!isActive || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    // Use provided analyser or create a simple animation
    if (analyser) {
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const draw = () => {
        animationRef.current = requestAnimationFrame(draw);
        analyser.getByteFrequencyData(dataArray);

        ctx.fillStyle = "rgba(15, 23, 42, 0.3)";
        ctx.fillRect(0, 0, width, height);

        const barWidth = (width / bufferLength) * 2.5;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * height;
          const hue = (i / bufferLength) * 360;
          ctx.fillStyle = `hsla(${hue}, 70%, 60%, 0.8)`;
          ctx.fillRect(x, height - barHeight, barWidth, barHeight);
          x += barWidth + 1;
        }
      };

      draw();
    } else {
      // Fallback: Simple pulse animation
      let phase = 0;
      const draw = () => {
        animationRef.current = requestAnimationFrame(draw);
        phase += 0.05;

        ctx.fillStyle = "rgba(15, 23, 42, 0.3)";
        ctx.fillRect(0, 0, width, height);

        const centerY = height / 2;
        const segments = 32;
        const segmentWidth = width / segments;

        for (let i = 0; i < segments; i++) {
          const amplitude = Math.sin(phase + i * 0.3) * 20 + 10;
          const x = i * segmentWidth;
          const barHeight = amplitude;

          ctx.fillStyle = `rgba(139, 92, 246, ${0.5 + Math.sin(phase + i * 0.2) * 0.3})`;
          ctx.fillRect(x, centerY - barHeight / 2, segmentWidth - 2, barHeight);
        }
      };

      draw();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, analyser]);

  if (!isActive) return null;

  return (
    <canvas
      ref={canvasRef}
      width={300}
      height={80}
      className="w-full h-20 rounded-lg border border-white/10 bg-slate-950"
    />
  );
}

/**
 * Simple pulsing indicator for voice activity
 */
export function VoiceActivityIndicator({ isActive, isSpeaking }) {
  if (!isActive) return null;

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-slate-900/50 rounded-lg border border-white/10">
      <div className="relative">
        <div
          className={`w-3 h-3 rounded-full transition-colors ${
            isSpeaking ? "bg-green-400" : "bg-gray-500"
          }`}
        />
        {isSpeaking && (
          <>
            <div className="absolute inset-0 w-3 h-3 rounded-full bg-green-400 animate-ping" />
            <div className="absolute inset-0 w-3 h-3 rounded-full bg-green-400 opacity-50 animate-pulse" />
          </>
        )}
      </div>
      <span className="text-xs text-white/80">
        {isSpeaking ? "Speaking..." : "Listening"}
      </span>
    </div>
  );
}

/**
 * Connection quality indicator
 */
export function ConnectionIndicator({ status, quality = "good", latency = null }) {
  const statusConfig = {
    connected: {
      color: "bg-green-400",
      text: "Connected",
      icon: "🟢",
    },
    connecting: {
      color: "bg-yellow-400",
      text: "Connecting...",
      icon: "🟡",
    },
    disconnected: {
      color: "bg-red-400",
      text: "Disconnected",
      icon: "🔴",
    },
    error: {
      color: "bg-red-500",
      text: "Error",
      icon: "❌",
    },
  };

  const qualityConfig = {
    excellent: { bars: 4, color: "bg-green-400" },
    good: { bars: 3, color: "bg-green-400" },
    fair: { bars: 2, color: "bg-yellow-400" },
    poor: { bars: 1, color: "bg-red-400" },
  };

  const config = statusConfig[status] || statusConfig.disconnected;
  const qualityInfo = qualityConfig[quality] || qualityConfig.good;

  return (
    <div className="inline-flex items-center gap-3 px-3 py-2 bg-slate-900/50 rounded-lg border border-white/10">
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${config.color}`} />
        <span className="text-xs text-white/80">{config.text}</span>
      </div>
      
      {status === "connected" && (
        <>
          <div className="w-px h-4 bg-white/10" />
          <div className="flex items-end gap-0.5" title={`Quality: ${quality}`}>
            {[1, 2, 3, 4].map((bar) => (
              <div
                key={bar}
                className={`w-1 rounded-sm transition-all ${
                  bar <= qualityInfo.bars
                    ? `${qualityInfo.color} opacity-100`
                    : "bg-gray-600 opacity-30"
                }`}
                style={{ height: `${bar * 3}px` }}
              />
            ))}
          </div>
        </>
      )}

      {latency !== null && status === "connected" && (
        <>
          <div className="w-px h-4 bg-white/10" />
          <span className="text-[10px] text-white/60">{latency}ms</span>
        </>
      )}
    </div>
  );
}

/**
 * Audio level meter (for recording)
 */
export function AudioLevelMeter({ level = 0, max = 100 }) {
  const percentage = Math.min((level / max) * 100, 100);
  const color = percentage > 80 ? "bg-red-400" : percentage > 50 ? "bg-yellow-400" : "bg-green-400";

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[10px] text-white/60">Input Level</span>
        <span className="text-[10px] text-white/80 font-mono">{Math.round(percentage)}%</span>
      </div>
      <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-white/10">
        <div
          className={`h-full transition-all duration-100 ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
