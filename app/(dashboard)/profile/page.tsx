"use client";

import { useEffect, useState } from "react";
import { User, Mail, Lock, Save, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/components/providers/AuthProvider";
import { useI18n } from "@/components/providers/I18nProvider";
import { useToast } from "@/components/ui/Toast";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import type { Admin } from "@/types";

export default function ProfilePage() {
  const { t } = useI18n();
  const { showToast } = useToast();
  const { admin: authAdmin } = useAuth();

  // ── Profile state (name + email) ──────────────────────────
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // ── Password state ────────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  // ── Load profile once auth admin is available ─────────────
  useEffect(() => {
    if (!authAdmin) return;
    setName(authAdmin.name);
    setEmail(authAdmin.email);

    // Refresh from server (in case data changed elsewhere)
    api
      .get<{ admin: Admin }>("/auth/me")
      .then((res) => {
        setName(res.admin.name);
        setEmail(res.admin.email);
      })
      .catch(() => {
        // Silent — we already have cached values
      });
  }, [authAdmin]);

  // ── Save profile (name + email) ───────────────────────────
  const saveProfile = async () => {
    if (!name.trim() || !email.trim()) {
      return showToast(t.profile.requiredFields, "error");
    }
    setSavingProfile(true);
    try {
      const res = await api.patch<{ admin: Admin }>("/auth/profile", {
        name: name.trim(),
        email: email.trim().toLowerCase(),
      });

      // Update localStorage so header shows the new name
      localStorage.setItem("mosaqaf_admin", JSON.stringify(res.admin));

      showToast(t.profile.profileUpdated);

      // Reload page so AuthProvider picks up the new data
      setTimeout(() => window.location.reload(), 800);
    } catch (err) {
      showToast(err instanceof Error ? err.message : t.common.error, "error");
    } finally {
      setSavingProfile(false);
    }
  };

  // ── Change password ───────────────────────────────────────
  const savePassword = async () => {
    if (!currentPassword || !newPassword) {
      return showToast(t.profile.passwordRequired, "error");
    }
    if (newPassword.length < 6) {
      return showToast(t.profile.passwordTooShort, "error");
    }
    if (newPassword !== confirmPassword) {
      return showToast(t.profile.passwordMismatch, "error");
    }
    setSavingPassword(true);
    try {
      await api.patch("/auth/change-password", {
        currentPassword,
        newPassword,
      });
      showToast(t.profile.passwordUpdated);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      showToast(err instanceof Error ? err.message : t.common.error, "error");
    } finally {
      setSavingPassword(false);
    }
  };

  if (!authAdmin) return <Spinner />;

  const roleLabel =
    authAdmin.role === "superadmin"
      ? t.profile.roleSuperAdmin
      : t.profile.roleAdmin;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-md bg-(--color-primary-tint) flex items-center justify-center">
          <User className="w-5 h-5 text-(--color-primary)" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-(--text)">
            {t.profile.title}
          </h1>
          <p className="text-sm text-(--text-muted) mt-0.5">
            {t.profile.subtitle}
          </p>
        </div>
      </div>

      {/* Role badge */}
      <div className="inline-flex items-center gap-2 rounded-full bg-(--color-primary-tint) border border-(--border) px-3 py-1.5 text-xs font-medium text-(--color-primary)">
        <ShieldCheck className="w-4 h-4" />
        {roleLabel}
      </div>

      {/* ── Profile info card ─────────────────────────────── */}
      <Card>
        <CardHeader
          title={t.profile.accountInfo}
          subtitle={t.profile.accountInfoHint}
          icon={<User className="w-5 h-5" />}
        />
        <CardBody>
          <div className="space-y-4">
            <Input
              label={t.profile.name}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.profile.namePlaceholder}
              icon={<User className="w-4 h-4" />}
            />
            <Input
              label={t.profile.email}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.profile.emailPlaceholder}
              icon={<Mail className="w-4 h-4" />}
            />
          </div>

          <div className="flex justify-end mt-5">
            <Button onClick={saveProfile} loading={savingProfile}>
              <Save className="w-4 h-4" />
              {t.profile.saveProfile}
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* ── Password card ─────────────────────────────────── */}
      <Card>
        <CardHeader
          title={t.profile.changePassword}
          subtitle={t.profile.changePasswordHint}
          icon={<Lock className="w-5 h-5" />}
        />
        <CardBody>
          <div className="space-y-4">
            {/* Current password */}
            <div className="relative">
              <Input
                label={t.profile.currentPassword}
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                icon={<Lock className="w-4 h-4" />}
              />
              <button
                type="button"
                onClick={() => setShowCurrent((v) => !v)}
                className="absolute inset-e-3 top-10.5 text-(--text-muted) hover:text-(--text)"
                aria-label={t.profile.togglePassword}
              >
                {showCurrent ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* New password */}
            <div className="relative">
              <Input
                label={t.profile.newPassword}
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                icon={<Lock className="w-4 h-4" />}
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                className="absolute inset-e-3 top-10.5 text-(--text-muted) hover:text-(--text)"
                aria-label={t.profile.togglePassword}
              >
                {showNew ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Confirm password */}
            <Input
              label={t.profile.confirmPassword}
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              icon={<Lock className="w-4 h-4" />}
            />
          </div>

          <div className="flex justify-end mt-5">
            <Button onClick={savePassword} loading={savingPassword}>
              <Lock className="w-4 h-4" />
              {t.profile.updatePassword}
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* ── Account meta (read-only) ─────────────────────── */}
      <Card>
        <CardBody>
          <div className="flex items-center justify-between text-xs text-(--text-muted)">
            <span>{t.profile.accountId}</span>
            <span className="font-mono">{authAdmin.id}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-(--text-muted) mt-2">
            <span>{t.profile.role}</span>
            <span className="font-medium text-(--color-primary)">
              {roleLabel}
            </span>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
