"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Image as ImageIcon,
  FileText,
  Mail,
  User,
  Settings as SettingsIcon,
} from "lucide-react";
import { useI18n } from "@/components/providers/I18nProvider";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", key: "dashboard", Icon: LayoutDashboard },
  { href: "/hero", key: "hero", Icon: ImageIcon },
  { href: "/files", key: "files", Icon: FileText },
  { href: "/newsletter", key: "newsletter", Icon: Mail },
  { href: "/profile", key: "profile", Icon: User },
  { href: "/settings", key: "settings", Icon: SettingsIcon },
] as const;

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <aside className="w-64 h-screen sticky top-0 bg-(--surface) border-e border-(--border) flex flex-col">
      {/* Logo */}
      <div className="p-5 border-b border-(--border)">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 group"
          onClick={onClose}
        >
          <div className="w-11 h-11 rounded-md bg-(--color-primary-tint) flex items-center justify-center overflow-hidden ring-1 ring-(--border) group-hover:ring-(--color-primary) transition">
            <Image
              src="/mothaqaf-logo.png"
              alt={t.common.appName}
              width={44}
              height={44}
              className="object-contain"
            />
          </div>
          <div>
            <div className="font-bold text-(--text) leading-tight">
              {t.common.appName}
            </div>
            <div className="text-xs text-(--text-muted)">
              {t.common.dashboard}
            </div>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map(({ href, key, Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition group",
                active
                  ? "bg-(--color-primary) text-white shadow-sm"
                  : "text-(--text) hover:bg-(--color-primary-tint) hover:text-(--color-primary)",
              )}
            >
              <Icon
                className={cn(
                  "w-5 h-5 shrink-0 transition",
                  active
                    ? "text-white"
                    : "text-(--text-muted) group-hover:text-(--color-primary)",
                )}
              />
              <span>{t.nav[key]}</span>
              {active && (
                <span className="ms-auto w-1.5 h-1.5 rounded-full bg-white" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-(--border) text-xs text-(--text-muted) text-center">
        © {new Date().getFullYear()} {t.common.appName}
      </div>
    </aside>
  );
}
