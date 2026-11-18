"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function Modal({ open, onClose, title, children, footer }: ModalProps) {
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) {
      document.addEventListener("keydown", onEsc);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", onEsc);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg bg-(--surface) rounded-(--radius-lg) shadow-(--shadow-lift) border border-(--border) animate-fade-in">
        <div className="flex items-center justify-between p-5 border-b border-(--border)">
          <h3 className="text-lg font-bold text-(--text)">{title}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-sm flex items-center justify-center text-(--text-muted) hover:text-(--text) hover:bg-(--surface-2) transition"
            aria-label="close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 max-h-[70vh] overflow-y-auto">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 p-5 border-t border-(--border)">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
