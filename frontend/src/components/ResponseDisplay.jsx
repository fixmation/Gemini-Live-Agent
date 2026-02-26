/**
 * ResponseDisplay.jsx
 * Shows agent's explanation with animated reveal
 * Displays visual evidence and alternatives
 */

import React, { useEffect, useState } from 'react';
import '../styles/response-display.css';

export const ResponseDisplay = ({ 
  explanation = '',
  visualEvidence = '',
  alternatives = [],
  showAlternatives = false,
  animate = true,
  turnNumber = 0
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [charIndex, setCharIndex] = useState(0);

  // Animated text reveal (character by character)
  useEffect(() => {
    if (!animate || !explanation) {
      setDisplayedText(explanation);
      return;
    }

    if (charIndex < explanation.length) {
      const timer = setTimeout(() => {
        setCharIndex(charIndex + 1);
        setDisplayedText(explanation.slice(0, charIndex + 1));
      }, 20); // 20ms per character = ~50 chars/sec

      return () => clearTimeout(timer);
    }
  }, [charIndex, explanation, animate]);

  // Reset on explanation change
  useEffect(() => {
    setCharIndex(0);
    if (!animate) {
      setDisplayedText(explanation);
    }
  }, [explanation, animate]);

  return (
    <div className="response-display">
      {/* Main Explanation */}
      <div className="response-section">
        <div className="response-text">
          {displayedText}
          {animate && charIndex < explanation.length && (
            <span className="cursor">▌</span>
          )}
        </div>
      </div>

      {/* Visual Evidence */}
      {visualEvidence && (
        <div className={`response-section evidence-section ${animate ? 'fade-in' : ''}`}>
          <div className="evidence-label">
            <span className="evidence-emoji">📸</span>
            Visual Evidence
          </div>
          <div className="evidence-text">{visualEvidence}</div>
        </div>
      )}

      {/* Alternatives (if confidence is low) */}
      {showAlternatives && alternatives && alternatives.length > 0 && (
        <div className={`response-section alternatives-section ${animate ? 'fade-in' : ''}`}>
          <div className="alternatives-label">
            <span className="alternatives-emoji">💡</span>
            Alternatives
          </div>
          <div className="alternatives-list">
            {alternatives.map((alt, idx) => (
              <div key={idx} className="alternative-item">
                <span className="alt-number">{idx + 1}.</span>
                <span className="alt-text">{alt}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metadata */}
      <div className="response-metadata">
        <span className="meta-item">Turn #{turnNumber}</span>
        <span className="meta-separator">•</span>
        <span className="meta-item">Real-time processing</span>
      </div>
    </div>
  );
};

export default ResponseDisplay;
