"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Mail, Lock, LogIn } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useI18n } from "@/components/providers/I18nProvider";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function LoginPage() {
  const { login, admin, loading } = useAuth();
  const { t } = useI18n();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && admin) router.replace("/dashboard");
  }, [admin, loading, router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : t.auth.invalidCredentials);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-(--bg) bg-blueprint">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto rounded-(--radius-lg) bg-(--surface) border border-(--color-primary-border) shadow-(--shadow-card) flex items-center justify-center overflow-hidden">
            <Image
              src="/mothaqaf-logo.png"
              alt="مثقف"
              width={80}
              height={80}
              className="object-contain"
              priority
            />
          </div>
          {/* <h1 className="mt-4 text-2xl font-bold text-[var(--text)]">
            {t.common.appName}
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            {t.common.dashboard}
          </p> */}
        </div>

        <form
          onSubmit={onSubmit}
          className="bg-(--surface) border border-(--border) rounded-(--radius-lg) p-6 shadow-(--shadow-card) space-y-4"
        >
          <h2 className="text-xl font-bold text-(--text) text-center mb-2">
            {t.auth.login}
          </h2>

          <Input
            label={t.auth.email}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@mosaqaf.com"
            required
            autoComplete="email"
            icon={<Mail className="w-4 h-4" />}
          />
          <Input
            label={t.auth.password}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            icon={<Lock className="w-4 h-4" />}
          />

          {error && (
            <div className="bg-(--danger-tint) text-(--danger) text-sm p-3 rounded-md">
              {error}
            </div>
          )}

          <Button
            type="submit"
            loading={submitting}
            className="w-full"
            size="lg"
          >
            <LogIn className="w-4 h-4" />
            {submitting ? t.auth.loggingIn : t.auth.loginButton}
          </Button>
        </form>
      </div>
    </div>
  );
}
