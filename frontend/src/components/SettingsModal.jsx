/**
 * SettingsModal.jsx
 * Android WebView compatible settings panel with native bridge support
 */

import React, { useState, useEffect } from 'react';
import '../styles/settings-modal.css';

export function SettingsModal({ isOpen, onClose }) {
  const [settings, setSettings] = useState({
    volume: 50,
    microphone: true,
    screenCapture: true,
    darkMode: false,
    autoScroll: true,
    confidence_threshold: 0.7,
    language: 'en',
  });

  const [useNativeAndroid, setUseNativeAndroid] = useState(false);

  // Check for Android WebView bridge
  useEffect(() => {
    if (typeof window !== 'undefined' && window.Android) {
      setUseNativeAndroid(true);
    }
  }, []);

  // Load settings from localStorage or Android
  useEffect(() => {
    if (useNativeAndroid && window.Android?.getSettings) {
      // Call native Android method
      window.Android.getSettings((androidSettings) => {
        if (androidSettings) {
          setSettings(JSON.parse(androidSettings));
        }
      });
    } else {
      // Fall back to localStorage
      const saved = localStorage.getItem('appSettings');
      if (saved) {
        setSettings(JSON.parse(saved));
      }
    }
  }, [useNativeAndroid]);

  const updateSetting = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);

    // Save to localStorage
    localStorage.setItem('appSettings', JSON.stringify(newSettings));

    // Notify Android if available
    if (useNativeAndroid && window.Android?.updateSettings) {
      window.Android.updateSettings(JSON.stringify(newSettings));
    }
  };

  const handleMicrophonePermission = async () => {
    if (useNativeAndroid && window.Android?.requestPermission) {
      // Use Android native permission
      window.Android.requestPermission('android.permission.RECORD_AUDIO', (granted) => {
        if (granted) {
          updateSetting('microphone', true);
        }
      });
    } else {
      // Browser fallback
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
        updateSetting('microphone', true);
      } catch (err) {
        console.error('Microphone permission denied:', err);
        updateSetting('microphone', false);
      }
    }
  };

  const handleScreenCapturePermission = async () => {
    if (useNativeAndroid && window.Android?.requestPermission) {
      // Use Android native permission for screen capture
      window.Android.requestPermission('android.permission.WRITE_EXTERNAL_STORAGE', (granted) => {
        if (granted) {
          updateSetting('screenCapture', true);
        }
      });
    } else {
      // Browser fallback using getDisplayMedia
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        stream.getTracks().forEach((track) => track.stop());
        updateSetting('screenCapture', true);
      } catch (err) {
        console.error('Screen capture permission denied:', err);
        updateSetting('screenCapture', false);
      }
    }
  };

  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'gemini-live-settings.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const resetSettings = () => {
    const defaultSettings = {
      volume: 50,
      microphone: true,
      screenCapture: true,
      darkMode: false,
      autoScroll: true,
      confidence_threshold: 0.7,
      language: 'en',
    };
    setSettings(defaultSettings);
    localStorage.setItem('appSettings', JSON.stringify(defaultSettings));
    if (useNativeAndroid && window.Android?.updateSettings) {
      window.Android.updateSettings(JSON.stringify(defaultSettings));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="settings-modal-overlay">
      <div className="settings-modal">
        {/* Header */}
        <div className="settings-header">
          <h2>⚙️ Settings</h2>
          <button className="settings-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Android Info */}
        {useNativeAndroid && (
          <div className="android-info">
            <span>🤖 Native Android Bridge Active</span>
          </div>
        )}

        {/* Scroll Container */}
        <div className="settings-content">
          {/* Audio Settings */}
          <div className="settings-section">
            <h3>🎙️ Audio Settings</h3>

            <div className="settings-item">
              <label>Volume</label>
              <div className="settings-slider">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.volume}
                  onChange={(e) => updateSetting('volume', parseInt(e.target.value))}
                />
                <span className="slider-value">{settings.volume}%</span>
              </div>
            </div>

            <div className="settings-item">
              <label>Microphone Access</label>
              <button
                className={`settings-btn ${settings.microphone ? 'granted' : 'denied'}`}
                onClick={handleMicrophonePermission}
              >
                {settings.microphone ? '✓ Granted' : '⨯ Denied'}
              </button>
            </div>
          </div>

          {/* Capture Settings */}
          <div className="settings-section">
            <h3>📸 Capture Settings</h3>

            <div className="settings-item">
              <label>Screen Capture Permission</label>
              <button
                className={`settings-btn ${settings.screenCapture ? 'granted' : 'denied'}`}
                onClick={handleScreenCapturePermission}
              >
                {settings.screenCapture ? '✓ Granted' : '⨯ Denied'}
              </button>
            </div>

            <div className="settings-item">
              <label>Auto-scroll in scenes</label>
              <input
                type="checkbox"
                checked={settings.autoScroll}
                onChange={(e) => updateSetting('autoScroll', e.target.checked)}
                className="settings-checkbox"
              />
            </div>
          </div>

          {/* AI Settings */}
          <div className="settings-section">
            <h3>🤖 AI Settings</h3>

            <div className="settings-item">
              <label>Confidence Threshold</label>
              <div className="settings-slider">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={settings.confidence_threshold}
                  onChange={(e) => updateSetting('confidence_threshold', parseFloat(e.target.value))}
                />
                <span className="slider-value">{Math.round(settings.confidence_threshold * 100)}%</span>
              </div>
            </div>

            <div className="settings-item">
              <label>Language</label>
              <select
                value={settings.language}
                onChange={(e) => updateSetting('language', e.target.value)}
                className="settings-select"
              >
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
                <option value="ja">日本語</option>
                <option value="zh">中文</option>
              </select>
            </div>
          </div>

          {/* Display Settings */}
          <div className="settings-section">
            <h3>🎨 Display Settings</h3>

            <div className="settings-item">
              <label>Dark Mode</label>
              <input
                type="checkbox"
                checked={settings.darkMode}
                onChange={(e) => {
                  updateSetting('darkMode', e.target.checked);
                  if (e.target.checked) {
                    document.documentElement.style.colorScheme = 'dark';
                  } else {
                    document.documentElement.style.colorScheme = 'light';
                  }
                }}
                className="settings-checkbox"
              />
            </div>
          </div>

          {/* Data Management */}
          <div className="settings-section">
            <h3>💾 Data Management</h3>

            <div className="settings-button-group">
              <button className="settings-action-btn export" onClick={exportSettings}>
                📥 Export Settings
              </button>
              <button className="settings-action-btn reset" onClick={resetSettings}>
                🔄 Reset to Default
              </button>
            </div>
          </div>

          {/* About */}
          <div className="settings-section about">
            <h3>ℹ️ About</h3>
            <p>Gemini Live Agent v1.0.0</p>
            <p className="about-text">Immersive real-time AI interaction powered by Google Gemini Live API</p>
            <p className="system-info">
              {useNativeAndroid ? '📱 Android WebView' : '🌐 Web Browser'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="settings-footer">
          <button className="btn-close-settings" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

export default SettingsModal;
