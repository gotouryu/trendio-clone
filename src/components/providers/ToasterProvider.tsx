"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export type ToastKind = "success" | "error" | "info";
export type Toast = { id: string; kind: ToastKind; message: string };

type Ctx = {
  toasts: Toast[];
  toast: (message: string, kind?: ToastKind) => void;
  dismiss: (id: string) => void;
};

const ToasterCtx = createContext<Ctx | null>(null);

export function ToasterProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, kind: ToastKind = "success") => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { id, kind, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToasterCtx.Provider value={{ toasts, toast, dismiss }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg border text-sm min-w-[260px] max-w-sm bg-white animate-[fadeIn_0.2s_ease-out] ${
              t.kind === "success"
                ? "border-emerald-200"
                : t.kind === "error"
                  ? "border-red-200"
                  : "border-gray-200"
            }`}
          >
            {t.kind === "success" && (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            )}
            {t.kind === "error" && (
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            )}
            {t.kind === "info" && (
              <Info className="w-4 h-4 text-blue-500 flex-shrink-0" />
            )}
            <span className="flex-1 text-gray-800">{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              className="text-gray-400 hover:text-gray-600"
              aria-label="閉じる"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToasterCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToasterCtx);
  if (!ctx) throw new Error("useToast must be used within ToasterProvider");
  return ctx;
}
