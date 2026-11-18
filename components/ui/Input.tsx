"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
}

export function Input({
  label,
  error,
  hint,
  icon,
  className,
  id,
  ...rest
}: InputProps) {
  const generatedId = useId();
  const inputId = id || rest.name || generatedId;
  const hasIcon = Boolean(icon);

  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-(--text)"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {hasIcon && (
          <span className="absolute inset-y-0 inset-s-3 flex items-center text-(--text-muted) pointer-events-none">
            {icon}
          </span>
        )}
        <input
          id={inputId}
          className={cn(
            "w-full px-3 py-2 rounded-md border bg-(--surface) text-(--text) placeholder:text-(--text-muted) focus:outline-none focus:ring-2 focus:ring-(--color-primary) focus:border-(--color-primary) transition",
            hasIcon && "ps-10",
            error ? "border-(--danger)" : "border-(--border)",
            className,
          )}
          {...rest}
        />
      </div>
      {hint && !error && <p className="text-xs text-(--text-muted)">{hint}</p>}
      {error && <p className="text-xs text-(--danger)">{error}</p>}
    </div>
  );
}

export function Textarea({
  label,
  error,
  className,
  id,
  ...rest
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  error?: string;
}) {
  const generatedId = useId();
  const inputId = id || rest.name || generatedId;

  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-(--text)"
        >
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        className={cn(
          "w-full px-3 py-2 rounded-md border bg-(--surface) text-(--text) placeholder:text-(--text-muted) focus:outline-none focus:ring-2 focus:ring-(--color-primary) focus:border-(--color-primary) transition resize-y",
          error ? "border-(--danger)" : "border-(--border)",
          className,
        )}
        {...rest}
      />
      {error && <p className="text-xs text-(--danger)">{error}</p>}
    </div>
  );
}
