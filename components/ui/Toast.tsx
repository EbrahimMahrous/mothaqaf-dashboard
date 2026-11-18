"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { CheckCircle2, XCircle, Info } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const showToast = useCallback(
    (message: string, type: ToastType = "success") => {
      idRef.current += 1;
      const id = idRef.current;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3500);
    },
    [],
  );

  const config: Record<ToastType, { bg: string; icon: React.ReactNode }> = {
    success: {
      bg: "bg-[var(--success)]",
      icon: <CheckCircle2 className="w-5 h-5" />,
    },
    error: {
      bg: "bg-[var(--danger)]",
      icon: <XCircle className="w-5 h-5" />,
    },
    info: {
      bg: "bg-[var(--color-primary)]",
      icon: <Info className="w-5 h-5" />,
    },
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-100 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`${config[t.type].bg} text-white px-4 py-3 rounded-md shadow-(--shadow-lift) text-sm font-medium min-w-70 flex items-center gap-2 animate-fade-in`}
          >
            {config[t.type].icon}
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
};
