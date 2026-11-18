"use client";

import { useState } from "react";
import { AuthGuard } from "@/components/guards/AuthGuard";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { ToastProvider } from "@/components/ui/Toast";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <AuthGuard>
      <ToastProvider>
        <div className="min-h-screen flex bg-(--bg)">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block">
            <Sidebar />
          </div>

          {/* Mobile Sidebar */}
          {mobileOpen && (
            <>
              <div
                className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                onClick={() => setMobileOpen(false)}
              />
              <div className="fixed top-0 inset-s-0 bottom-0 z-50 lg:hidden">
                <Sidebar onClose={() => setMobileOpen(false)} />
              </div>
            </>
          )}

          <div className="flex-1 min-w-0 flex flex-col">
            <Header onMenuClick={() => setMobileOpen(true)} />
            <main className="flex-1 p-4 lg:p-6 animate-fade-in">
              {children}
            </main>
          </div>
        </div>
      </ToastProvider>
    </AuthGuard>
  );
}
