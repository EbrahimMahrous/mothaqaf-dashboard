"use client";

import { Menu, Sun, Moon, LogOut, Globe } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useI18n } from "@/components/providers/I18nProvider";
import { useTheme } from "@/components/providers/ThemeProvider";

export function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const { admin, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { lang, toggleLang, t } = useI18n();

  return (
    <header className="h-16 glass border-b border-(--border) flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden w-9 h-9 rounded-sm hover:bg-(--surface-2) flex items-center justify-center text-(--text) transition"
          aria-label="menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-sm sm:text-base font-semibold text-(--text)">
          {t.common.welcome}،{" "}
          <span className="text-(--color-primary)">{admin?.name}</span>
        </h1>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={toggleLang}
          className="h-9 px-3 rounded-sm hover:bg-(--surface-2) flex items-center gap-1.5 text-sm font-medium text-(--text) transition"
          aria-label="toggle language"
        >
          <Globe className="w-4 h-4 text-(--text-muted)" />
          {lang === "ar" ? "EN" : "ع"}
        </button>
        <button
          onClick={toggleTheme}
          className="w-9 h-9 rounded-sm hover:bg-(--surface-2) flex items-center justify-center text-(--text) transition"
          aria-label="toggle theme"
        >
          {theme === "dark" ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </button>
        <button
          onClick={logout}
          className="h-9 px-3 rounded-sm bg-(--danger-tint) text-(--danger) text-sm font-medium hover:bg-(--danger) hover:text-white flex items-center gap-1.5 transition"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">{t.common.logout}</span>
        </button>
      </div>
    </header>
  );
}
