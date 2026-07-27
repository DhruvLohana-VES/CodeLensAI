"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, [removeToast]);

  const success = useCallback((msg: string) => addToast(msg, "success"), [addToast]);
  const error = useCallback((msg: string) => addToast(msg, "error"), [addToast]);
  const info = useCallback((msg: string) => addToast(msg, "info"), [addToast]);
  const warning = useCallback((msg: string) => addToast(msg, "warning"), [addToast]);

  return (
    <ToastContext.Provider value={{ toast: addToast, success, error, info, warning }}>
      {children}
      {/* Toast Portal Container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 w-full max-w-sm pointer-events-none select-none">
        {toasts.map((t) => {
          const Icon = {
            success: CheckCircle2,
            error: AlertCircle,
            info: Info,
            warning: AlertTriangle,
          }[t.type];

          const colors = {
            success: "border-emerald-500/20 bg-emerald-950/40 text-emerald-300 shadow-emerald-900/10",
            error: "border-red-500/20 bg-red-950/40 text-red-300 shadow-red-900/10",
            info: "border-blue-500/20 bg-blue-950/40 text-blue-300 shadow-blue-900/10",
            warning: "border-amber-500/20 bg-amber-950/40 text-amber-300 shadow-amber-900/10",
          }[t.type];

          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 rounded-2xl border px-4 py-3.5 text-sm backdrop-blur-md shadow-xl transition-all duration-350 transform translate-y-0 scale-100 opacity-100 hover:scale-[1.01] hover:border-white/20 hover:bg-black/60 animate-fade-in ${colors}`}
            >
              <Icon className="h-5 w-5 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium leading-normal">{t.message}</div>
              <button
                onClick={() => removeToast(t.id)}
                className="rounded-lg p-0.5 hover:bg-white/10 transition shrink-0 opacity-60 hover:opacity-100 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
