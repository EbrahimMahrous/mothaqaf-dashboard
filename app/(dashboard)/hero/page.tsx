"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  Plus,
  RefreshCw,
  Trash2,
  Image as ImageIcon,
  Upload,
} from "lucide-react";
import { api, revalidateWebsite } from "@/lib/api";
import { useI18n } from "@/components/providers/I18nProvider";
import { useToast } from "@/components/ui/Toast";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import type { HeroImage } from "@/types";

export default function HeroPage() {
  const { t } = useI18n();
  const { showToast } = useToast();
  const [images, setImages] = useState<HeroImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [showDelete, setShowDelete] = useState<HeroImage | null>(null);
  const [alt, setAlt] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    try {
      const res = await api.get<{ data: HeroImage[] }>("/hero");
      setImages(res.data || []);
    } catch (err) {
      showToast(err instanceof Error ? err.message : t.common.error, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const upload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return showToast(t.common.error, "error");
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      fd.append("alt", alt);
      await api.post("/hero", fd);
      await revalidateWebsite("hero");
      showToast(t.hero.uploadSuccess);
      setShowUpload(false);
      setAlt("");
      if (fileRef.current) fileRef.current.value = "";
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : t.common.error, "error");
    } finally {
      setBusy(false);
    }
  };

  const replace = async (id: string, file: File) => {
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      await api.patch(`/hero/${id}/replace`, fd);
      await revalidateWebsite("hero");
      showToast(t.hero.uploadSuccess);
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : t.common.error, "error");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!showDelete) return;
    setDeletingId(showDelete._id);
    try {
      await api.delete(`/hero/${showDelete._id}`);
      await revalidateWebsite("hero");
      showToast(t.hero.deleteSuccess);
      setShowDelete(null);
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : t.common.error, "error");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-(--color-primary-tint) flex items-center justify-center">
            <ImageIcon className="w-5 h-5 text-(--color-primary)" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-(--text)">{t.hero.title}</h1>
            <p className="text-sm text-(--text-muted) mt-0.5">
              {t.hero.subtitle}
            </p>
          </div>
        </div>
        <Button onClick={() => setShowUpload(true)}>
          <Plus className="w-4 h-4" />
          {t.hero.uploadNew}
        </Button>
      </div>

      <Card>
        <CardHeader
          title={t.hero.title}
          subtitle={`${images.length} ${t.common.all}`}
          icon={<ImageIcon className="w-5 h-5" />}
        />
        <CardBody>
          {loading ? (
            <Spinner />
          ) : images.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto rounded-full bg-(--color-primary-tint) flex items-center justify-center mb-3">
                <ImageIcon className="w-8 h-8 text-(--color-primary)" />
              </div>
              <p className="text-(--text-muted)">{t.common.noData}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {images.map((img, index) => (
                <div
                  key={img._id}
                  className="border border-(--border) rounded-(--radius-lg) overflow-hidden bg-(--surface-2) group hover:border-(--color-primary) transition"
                >
                  <div className="relative aspect-video">
                    <Image
                      src={img.url}
                      alt={img.alt || "hero"}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 33vw"
                      priority={index === 0}
                      loading={index === 0 ? "eager" : "lazy"}
                    />
                  </div>
                  <div className="p-3 flex items-center justify-between gap-2">
                    <p className="text-xs text-(--text-muted) truncate">
                      {img.alt || "—"}
                    </p>
                    <div className="flex items-center gap-1">
                      <label className="cursor-pointer">
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-1.5 rounded-sm bg-(--surface) border border-(--border) hover:border-(--color-primary) hover:text-(--color-primary) transition">
                          <RefreshCw className="w-3 h-3" />
                          {t.hero.replace}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) replace(img._id, f);
                          }}
                        />
                      </label>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setShowDelete(img)}
                        aria-label="delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Upload Modal */}
      <Modal
        open={showUpload}
        onClose={() => setShowUpload(false)}
        title={t.hero.uploadNew}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowUpload(false)}>
              {t.common.cancel}
            </Button>
            <Button onClick={upload} loading={busy}>
              <Upload className="w-4 h-4" />
              {t.common.upload}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label={t.hero.altText}
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
            placeholder="صورة الغلاف الرئيسية"
          />
          <div>
            <label className="block text-sm font-medium text-(--text) mb-1.5">
              {t.hero.uploadNew}
            </label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="w-full text-sm text-(--text) file:me-3 file:px-3 file:py-2 file:rounded-md file:border-0 file:bg-(--color-primary) file:text-white file:font-medium file:cursor-pointer"
            />
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        open={!!showDelete}
        onClose={() => setShowDelete(null)}
        title={t.common.confirm}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowDelete(null)}>
              {t.common.cancel}
            </Button>
            <Button variant="danger" onClick={remove} loading={!!deletingId}>
              <Trash2 className="w-4 h-4" />
              {t.common.delete}
            </Button>
          </>
        }
      >
        <p className="text-sm text-(--text)">{t.hero.confirmDelete}</p>
      </Modal>
    </div>
  );
}
