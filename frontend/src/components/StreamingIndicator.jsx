/**
 * StreamingIndicator.jsx
 * Real-time visual feedback for streaming states
 * Shows: Listening, Thinking, Speaking with animations
 */

import React from 'react';
import '../styles/streaming-indicator.css';

export const StreamingIndicator = ({ state = 'idle', message = '' }) => {
  const states = {
    idle: {
      emoji: '⏳',
      label: 'Ready',
      color: 'gray',
      animate: false,
    },
    listening: {
      emoji: '🎙️',
      label: 'Listening...',
      color: 'blue',
      animate: true,
      className: 'animate-pulse',
    },
    thinking: {
      emoji: '⚙️',
      label: 'Processing...',
      color: 'purple',
      animate: true,
      className: 'animate-spin',
    },
    speaking: {
      emoji: '🔊',
      label: 'Speaking...',
      color: 'green',
      animate: true,
      className: 'animate-wave',
    },
    connecting: {
      emoji: '🔗',
      label: 'Connecting...',
      color: 'yellow',
      animate: true,
      className: 'animate-pulse',
    },
    error: {
      emoji: '❌',
      label: 'Error',
      color: 'red',
      animate: false,
    },
  };

  const config = states[state] || states.idle;

  return (
    <div className={`streaming-indicator ${config.color}`}>
      <div className={`indicator-emoji ${config.className}`}>
        {config.emoji}
      </div>
      <div className="indicator-text">
        <div className="indicator-label">{config.label}</div>
        {message && <div className="indicator-message">{message}</div>}
      </div>
      {config.animate && (
        <div className="indicator-dots">
          <span className="dot"></span>
          <span className="dot"></span>
          <span className="dot"></span>
        </div>
      )}
    </div>
  );
};

export default StreamingIndicator;
