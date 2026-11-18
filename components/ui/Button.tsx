"use client";

import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "outline" | "accent";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  className,
  disabled,
  ...rest
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 font-semibold rounded-[var(--radius-md)] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--bg)] active:scale-[0.98]";

  const variants: Record<string, string> = {
    primary:
      "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)] focus:ring-[var(--color-primary)] shadow-sm hover:shadow-md",
    accent:
      "bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-dark)] focus:ring-[var(--color-accent)] shadow-sm",
    secondary:
      "bg-[var(--surface-2)] text-[var(--text)] hover:bg-[var(--primary-tint)] hover:text-[var(--color-primary)] focus:ring-[var(--color-primary)]",
    danger:
      "bg-[var(--danger)] text-white hover:bg-[var(--danger-strong)] focus:ring-[var(--danger)] shadow-sm",
    ghost:
      "text-[var(--text)] hover:bg-[var(--surface-2)] hover:text-[var(--color-primary)] focus:ring-[var(--color-primary)]",
    outline:
      "border border-[var(--border)] text-[var(--text)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] hover:bg-[var(--primary-tint)] focus:ring-[var(--color-primary)]",
  };

  const sizes: Record<string, string> = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin-slow" />}
      {children}
    </button>
  );
}
