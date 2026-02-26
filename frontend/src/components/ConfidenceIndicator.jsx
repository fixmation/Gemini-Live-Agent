/**
 * ConfidenceIndicator.jsx
 * Shows real-time confidence scores with visual indicators
 * Displays overall, visual, and certainty metrics
 */

import React from 'react';
import '../styles/confidence-indicator.css';

export const ConfidenceIndicator = ({ 
  overall = 0.75, 
  visual = null,
  animated = false,
  showLabel = true 
}) => {
  // Convert 0-1 to 0-100
  const overallPct = Math.round(overall * 100);
  const visualPct = visual ? Math.round(visual * 100) : null;

  // Determine color based on confidence level
  const getConfidenceColor = (value) => {
    if (value >= 80) return 'green';
    if (value >= 60) return 'yellow';
    if (value >= 40) return 'orange';
    return 'red';
  };

  const getConfidenceEmoji = (value) => {
    if (value >= 80) return '✓';
    if (value >= 60) return '⚠️';
    if (value >= 40) return '❓';
    return '✗';
  };

  const overallColor = getConfidenceColor(overallPct);
  const visualColor = visualPct ? getConfidenceColor(visualPct) : null;

  return (
    <div className="confidence-indicator">
      {/* Overall Confidence */}
      <div className="confidence-metric">
        <div className="metric-label">
          <span className="metric-emoji">⭐</span>
          Overall Confidence
        </div>
        <div className={`confidence-bar ${overallColor} ${animated ? 'animate-fill' : ''}`}>
          <div 
            className="confidence-fill" 
            style={{ width: `${overallPct}%` }}
          />
        </div>
        <div className="metric-value">
          {getConfidenceEmoji(overallPct)} {overallPct}%
        </div>
      </div>

      {/* Visual Confidence (Navigator mode) */}
      {visualPct !== null && (
        <div className="confidence-metric">
          <div className="metric-label">
            <span className="metric-emoji">👁️</span>
            Visual Confidence
          </div>
          <div className={`confidence-bar ${visualColor} ${animated ? 'animate-fill' : ''}`}>
            <div 
              className="confidence-fill" 
              style={{ width: `${visualPct}%` }}
            />
          </div>
          <div className="metric-value">
            {getConfidenceEmoji(visualPct)} {visualPct}%
          </div>
        </div>
      )}

      {/* Certainty Status */}
      <div className="certainty-status">
        {overallPct >= 80 && (
          <div className="status-message high">
            ✓ High confidence in this response
          </div>
        )}
        {overallPct >= 60 && overallPct < 80 && (
          <div className="status-message medium">
            ⚠️ Moderately confident - see alternatives if available
          </div>
        )}
        {overallPct < 60 && (
          <div className="status-message low">
            ❓ Low confidence - consider alternatives or retry
          </div>
        )}
      </div>
    </div>
  );
};

export default ConfidenceIndicator;
