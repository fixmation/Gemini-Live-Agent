/**
 * ConversationContext.jsx
 * Shows conversation history and context awareness
 * Displays goal, previous actions, and turn statistics
 */

import React from 'react';
import '../styles/conversation-context.css';

export const ConversationContext = ({ 
  goal = '',
  history = [],
  turnNumber = 0,
  contextLength = 0,
  mode = 'audio'
}) => {
  const modeEmojis = {
    audio: '🎤',
    navigate: '🖱️',
    story: '📖',
  };

  return (
    <div className="conversation-context">
      {/* Goal Display */}
      {goal && (
        <div className="context-section goal-section">
          <div className="section-header">
            <span className="section-emoji">🎯</span>
            <h3>Current Goal</h3>
          </div>
          <div className="goal-text">{goal}</div>
        </div>
      )}

      {/* Action History Timeline */}
      {history && history.length > 0 && (
        <div className="context-section history-section">
          <div className="section-header">
            <span className="section-emoji">📋</span>
            <h3>Action History</h3>
          </div>
          <div className="history-timeline">
            {history.map((action, idx) => (
              <div 
                key={idx} 
                className={`history-item ${idx === history.length - 1 ? 'current' : 'completed'}`}
              >
                <div className="history-indicator">
                  {idx === history.length - 1 ? '●' : '✓'}
                </div>
                <div className="history-content">
                  <div className="history-action">{action.action || 'Action'}</div>
                  {action.confidence && (
                    <div className="history-confidence">
                      {Math.round(action.confidence * 100)}% confidence
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Context Statistics */}
      <div className="context-section stats-section">
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-label">Turn</div>
            <div className="stat-value">#{turnNumber}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Context</div>
            <div className="stat-value">{contextLength} items</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Mode</div>
            <div className="stat-value">{modeEmojis[mode]}</div>
          </div>
        </div>
      </div>

      {/* Context Status */}
      <div className="context-status">
        {contextLength > 0 && (
          <div className="status-message success">
            ✓ Using {contextLength} prior turn{contextLength !== 1 ? 's' : ''} for context
          </div>
        )}
        {contextLength === 0 && (
          <div className="status-message info">
            ℹ️ First turn - no prior context
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationContext;
