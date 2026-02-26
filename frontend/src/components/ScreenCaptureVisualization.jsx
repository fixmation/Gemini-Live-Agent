/**
 * ScreenCaptureVisualization.jsx
 * Shows screen capture with highlighted UI elements
 * Displays target coordinates and confidence
 */

import React, { useEffect, useRef } from 'react';
import '../styles/screen-capture-viz.css';

export const ScreenCaptureVisualization = ({ 
  image = null,
  screenWidth = 1920,
  screenHeight = 1080,
  targetX = null,
  targetY = null,
  targetLabel = '',
  confidence = null,
  highlight = true
}) => {
  const containerRef = useRef(null);
  
  // Calculate scaling for display
  const maxWidth = 600;
  const maxHeight = 400;
  let displayWidth = maxWidth;
  let displayHeight = maxHeight;
  
  if (screenWidth && screenHeight) {
    const aspectRatio = screenWidth / screenHeight;
    if (aspectRatio > maxWidth / maxHeight) {
      displayWidth = maxWidth;
      displayHeight = maxWidth / aspectRatio;
    } else {
      displayHeight = maxHeight;
      displayWidth = maxHeight * aspectRatio;
    }
  }

  // Normalize coordinates from screen space to display space
  const displayX = targetX ? (targetX / screenWidth) * displayWidth : null;
  const displayY = targetY ? (targetY / screenHeight) * displayHeight : null;

  return (
    <div className="screen-capture-viz">
      <div className="screen-container" ref={containerRef}>
        {image ? (
          <div className="screen-image-wrapper">
            <img 
              src={`data:image/jpeg;base64,${image}`}
              alt="Screen Capture"
              className="screen-image"
              style={{
                width: `${displayWidth}px`,
                height: `${displayHeight}px`,
              }}
            />
            
            {/* Highlight Target Element */}
            {highlight && targetX !== null && targetY !== null && (
              <>
                {/* Crosshair Cursor */}
                <div 
                  className="crosshair"
                  style={{
                    left: `${displayX}px`,
                    top: `${displayY}px`,
                  }}
                >
                  <div className="crosshair-h"></div>
                  <div className="crosshair-v"></div>
                </div>

                {/* Highlight Circle (pulse animation) */}
                <div 
                  className="highlight-circle animated-pulse"
                  style={{
                    left: `${displayX}px`,
                    top: `${displayY}px`,
                  }}
                />

                {/* Label Card */}
                {targetLabel && (
                  <div 
                    className="target-label"
                    style={{
                      left: `${displayX + 20}px`,
                      top: `${displayY - 30}px`,
                    }}
                  >
                    <div className="label-text">{targetLabel}</div>
                    {confidence && (
                      <div className={`label-confidence ${confidence >= 0.8 ? 'high' : 'medium'}`}>
                        {Math.round(confidence * 100)}%
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="screen-placeholder">
            <div className="placeholder-icon">📸</div>
            <div className="placeholder-text">No screen capture yet</div>
            <div className="placeholder-hint">Capture your screen to begin</div>
          </div>
        )}
      </div>

      {/* Coordinate Display */}
      {targetX !== null && targetY !== null && (
        <div className="coordinate-info">
          <div className="coord-label">Recommended Position</div>
          <div className="coord-values">
            <span className="coord-x">X: {Math.round(targetX)}</span>
            <span className="coord-sep">•</span>
            <span className="coord-y">Y: {Math.round(targetY)}</span>
            <span className="coord-res"> @ {screenWidth}×{screenHeight}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScreenCaptureVisualization;
