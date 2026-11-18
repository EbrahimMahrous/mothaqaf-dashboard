"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  Settings as SettingsIcon,
  ImagePlus,
  Save,
  Mail,
  Phone,
} from "lucide-react";
import {
  FacebookIcon,
  InstagramIcon,
  TwitterIcon,
  YoutubeIcon,
  TiktokIcon,
  LinkedinIcon,
} from "@/components/icons/social";
import { api, revalidateWebsite } from "@/lib/api";
import { useI18n } from "@/components/providers/I18nProvider";
import { useToast } from "@/components/ui/Toast";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import type { Settings } from "@/types";

export default function SettingsPage() {
  const { t } = useI18n();
  const { showToast } = useToast();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get<{ data: Settings }>("/settings");
        setSettings(res.data);
      } catch (err) {
        showToast(err instanceof Error ? err.message : t.common.error, "error");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [showToast, t.common.error]);

  const save = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await api.put("/settings", {
        social: settings.social,
        whatsapp: settings.whatsapp,
        contactEmail: settings.contactEmail,
      });
      await revalidateWebsite("settings");
      showToast(t.settings.savedSuccess);
    } catch (err) {
      showToast(err instanceof Error ? err.message : t.common.error, "error");
    } finally {
      setSaving(false);
    }
  };

  const uploadLogo = async () => {
    const file = logoRef.current?.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const fd = new FormData();
      fd.append("logo", file);
      const res = await api.put<{ data: Settings }>("/settings/logo", fd);
      await revalidateWebsite("settings");
      setSettings(res.data);
      showToast(t.settings.logoSuccess);
      if (logoRef.current) logoRef.current.value = "";
    } catch (err) {
      showToast(err instanceof Error ? err.message : t.common.error, "error");
    } finally {
      setUploadingLogo(false);
    }
  };

  if (loading) return <Spinner />;
  if (!settings) return null;

  const socials = [
    {
      key: "facebook" as const,
      Icon: FacebookIcon,
      label: t.settings.facebook,
    },
    {
      key: "instagram" as const,
      Icon: InstagramIcon,
      label: t.settings.instagram,
    },
    { key: "twitter" as const, Icon: TwitterIcon, label: t.settings.twitter },
    { key: "youtube" as const, Icon: YoutubeIcon, label: t.settings.youtube },
    { key: "tiktok" as const, Icon: TiktokIcon, label: t.settings.tiktok },
    {
      key: "linkedin" as const,
      Icon: LinkedinIcon,
      label: t.settings.linkedin,
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-md bg-(--color-primary-tint) flex items-center justify-center">
          <SettingsIcon className="w-5 h-5 text-(--color-primary)" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-(--text)">
            {t.settings.title}
          </h1>
          <p className="text-sm text-(--text-muted) mt-0.5">
            {t.settings.subtitle}
          </p>
        </div>
      </div>

      {/* Logo */}
      <Card>
        <CardHeader
          title={t.settings.logo}
          icon={<ImagePlus className="w-5 h-5" />}
        />
        <CardBody>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="w-24 h-24 rounded-md bg-(--surface-2) border border-(--border) flex items-center justify-center overflow-hidden">
              {settings.logo?.url ? (
                <Image
                  src={settings.logo.url}
                  alt="logo"
                  width={96}
                  height={96}
                  className="object-contain"
                />
              ) : (
                <ImagePlus className="w-8 h-8 text-(--text-muted)" />
              )}
            </div>
            <div className="flex-1 min-w-50">
              <p className="text-xs text-(--text-muted) mb-2">
                {t.settings.logoHint}
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <input
                  ref={logoRef}
                  type="file"
                  accept="image/*"
                  className="text-sm text-(--text) file:me-3 file:px-3 file:py-2 file:rounded-md file:border-0 file:bg-(--color-primary) file:text-white file:font-medium file:cursor-pointer"
                />
                <Button onClick={uploadLogo} loading={uploadingLogo}>
                  <ImagePlus className="w-4 h-4" />
                  {t.settings.changeLogo}
                </Button>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Contact */}
      <Card>
        <CardHeader
          title={t.settings.contact}
          icon={<Phone className="w-5 h-5" />}
        />
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={t.settings.whatsapp}
              value={settings.whatsapp}
              onChange={(e) =>
                setSettings({ ...settings, whatsapp: e.target.value })
              }
              hint={t.settings.whatsappHint}
              placeholder="+201234567890"
              icon={<Phone className="w-4 h-4" />}
            />
            <Input
              label={t.settings.contactEmail}
              type="email"
              value={settings.contactEmail}
              onChange={(e) =>
                setSettings({ ...settings, contactEmail: e.target.value })
              }
              placeholder="info@mosaqaf.com"
              icon={<Mail className="w-4 h-4" />}
            />
          </div>
        </CardBody>
      </Card>

      {/* Social */}
      <Card>
        <CardHeader
          title={t.settings.social}
          icon={<FacebookIcon className="w-5 h-5" />}
        />
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {socials.map(({ key, Icon, label }) => (
              <Input
                key={key}
                label={label}
                value={settings.social[key]}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    social: { ...settings.social, [key]: e.target.value },
                  })
                }
                placeholder={`https://${key}.com/username`}
                icon={<Icon className="w-4 h-4" />}
              />
            ))}
          </div>
        </CardBody>
      </Card>

      <div className="flex justify-end">
        <Button onClick={save} loading={saving} size="lg">
          <Save className="w-4 h-4" />
          {t.common.save}
        </Button>
      </div>
    </div>
  );
}
