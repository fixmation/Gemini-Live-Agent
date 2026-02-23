/**
 * Toast notification system for user feedback
 */

import React, { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "info", duration = 3000) => {
    const id = crypto.randomUUID();
    const toast = { id, message, type, duration };
    
    setToasts((prev) => [...prev, toast]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showSuccess = useCallback((message, duration) => {
    return addToast(message, "success", duration);
  }, [addToast]);

  const showError = useCallback((message, duration) => {
    return addToast(message, "error", duration);
  }, [addToast]);

  const showInfo = useCallback((message, duration) => {
    return addToast(message, "info", duration);
  }, [addToast]);

  const showWarning = useCallback((message, duration) => {
    return addToast(message, "warning", duration);
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ addToast, removeToast, showSuccess, showError, showInfo, showWarning }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

function Toast({ toast, onClose }) {
  const typeStyles = {
    success: "bg-green-500/90 border-green-400/50 text-white",
    error: "bg-red-500/90 border-red-400/50 text-white",
    warning: "bg-yellow-500/90 border-yellow-400/50 text-slate-900",
    info: "bg-blue-500/90 border-blue-400/50 text-white",
  };

  const icons = {
    success: "✓",
    error: "✕",
    warning: "⚠",
    info: "ℹ",
  };

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-lg border backdrop-blur-lg shadow-lg pointer-events-auto animate-slide-in ${
        typeStyles[toast.type] || typeStyles.info
      }`}
    >
      <div className="text-lg font-bold">{icons[toast.type]}</div>
      <div className="flex-1 text-sm font-medium">{toast.message}</div>
      <button
        onClick={onClose}
        className="text-sm opacity-70 hover:opacity-100 transition-opacity"
        aria-label="Close"
      >
        ✕
      </button>
    </div>
  );
}
