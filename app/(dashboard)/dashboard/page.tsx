"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Image as ImageIcon,
  FileText,
  Users,
  Mail,
  ArrowUpRight,
  Download,
  Upload,
  Send,
  Sparkles,
} from "lucide-react";
import { api } from "@/lib/api";
import { useI18n } from "@/components/providers/I18nProvider";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";
import type { DownloadFile, Campaign } from "@/types";

interface Stats {
  hero: number;
  files: number;
  subscribers: number;
  campaigns: number;
}

export default function DashboardPage() {
  const { t } = useI18n();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentFiles, setRecentFiles] = useState<DownloadFile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [hero, files, subs, camps] = await Promise.all([
          api.get<{ count: number }>("/hero").catch(() => ({ count: 0 })),
          api
            .get<{ count: number; data: DownloadFile[] }>("/files")
            .catch(() => ({ count: 0, data: [] })),
          api
            .get<{ count: number }>("/newsletter/subscribers")
            .catch(() => ({ count: 0 })),
          api
            .get<{ data: Campaign[] }>("/newsletter/campaigns")
            .catch(() => ({ data: [] })),
        ]);
        setStats({
          hero: hero.count || 0,
          files: files.count || 0,
          subscribers: subs.count || 0,
          campaigns: camps.data?.length || 0,
        });
        setRecentFiles((files.data || []).slice(0, 5));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <Spinner />;

  const cards = [
    {
      label: t.stats.heroImages,
      value: stats?.hero ?? 0,
      Icon: ImageIcon,
      href: "/hero",
    },
    {
      label: t.stats.files,
      value: stats?.files ?? 0,
      Icon: FileText,
      href: "/files",
    },
    {
      label: t.stats.subscribers,
      value: stats?.subscribers ?? 0,
      Icon: Users,
      href: "/newsletter",
    },
    {
      label: t.stats.campaigns,
      value: stats?.campaigns ?? 0,
      Icon: Mail,
      href: "/newsletter",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-md bg-(--color-primary-tint) flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-(--color-primary)" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-(--text)">
            {t.common.dashboard}
          </h1>
          <p className="text-sm text-(--text-muted) mt-0.5">
            {t.common.welcome}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Link key={c.label} href={c.href}>
            <Card className="hover:shadow-(--shadow-lift) hover:-translate-y-0.5 transition cursor-pointer group">
              <CardBody>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-(--text-muted)">{c.label}</div>
                    <div className="text-3xl font-bold text-(--text) mt-1">
                      {c.value}
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-md bg-(--color-primary-tint) text-(--color-primary) flex items-center justify-center group-hover:bg-(--color-primary) group-hover:text-white transition">
                    <c.Icon className="w-6 h-6" />
                  </div>
                </div>
                <div className="mt-3 text-xs text-(--color-primary) inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                  <span>{t.common.edit}</span>
                  <ArrowUpRight className="w-3 h-3" />
                </div>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader
            title={t.stats.quickActions}
            icon={<Sparkles className="w-5 h-5" />}
          />
          <CardBody>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Link href="/hero">
                <Button variant="outline" className="w-full">
                  <Upload className="w-4 h-4" />
                  {t.stats.uploadHero}
                </Button>
              </Link>
              <Link href="/files">
                <Button variant="outline" className="w-full">
                  <FileText className="w-4 h-4" />
                  {t.stats.uploadFile}
                </Button>
              </Link>
              <Link href="/newsletter">
                <Button variant="outline" className="w-full">
                  <Send className="w-4 h-4" />
                  {t.stats.sendNewsletter}
                </Button>
              </Link>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title={t.stats.recent}
            subtitle={t.nav.files}
            icon={<FileText className="w-5 h-5" />}
          />
          <CardBody>
            {recentFiles.length === 0 ? (
              <p className="text-sm text-(--text-muted) text-center py-6">
                {t.common.noData}
              </p>
            ) : (
              <ul className="divide-y divide-(--border)">
                {recentFiles.map((f) => (
                  <li
                    key={f._id}
                    className="py-2.5 flex items-center justify-between gap-2"
                  >
                    <span className="text-sm text-(--text) truncate">
                      {f.title}
                    </span>
                    <span className="text-xs text-(--text-muted) inline-flex items-center gap-1">
                      <Download className="w-3 h-3" />
                      {f.downloads}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
