"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  Plus,
  RefreshCw,
  Trash2,
  Image as ImageIcon,
  Upload,
  Pencil,
  BookOpen,
  Video,
  Link as LinkIcon,
} from "lucide-react";
import { api, revalidateWebsite } from "@/lib/api";
import { useI18n } from "@/components/providers/I18nProvider";
import { useToast } from "@/components/ui/Toast";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input, Textarea } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import type { HeroImage, DownloadFile } from "@/types";

type Badge = "" | "new" | "featured" | "video";

export default function HeroPage() {
  const { t } = useI18n();
  const { showToast } = useToast();

  const [images, setImages] = useState<HeroImage[]>([]);
  const [files, setFiles] = useState<DownloadFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Modals
  const [showUpload, setShowUpload] = useState(false);
  const [showEdit, setShowEdit] = useState<HeroImage | null>(null);
  const [showDelete, setShowDelete] = useState<HeroImage | null>(null);

  // Upload form
  const [alt, setAlt] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [badge, setBadge] = useState<Badge>("");
  const [fileId, setFileId] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [ctaLabel, setCtaLabel] = useState("");
  const [ctaHref, setCtaHref] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Edit form
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editAlt, setEditAlt] = useState("");
  const [editBadge, setEditBadge] = useState<Badge>("");
  const [editFileId, setEditFileId] = useState("");
  const [editVideoUrl, setEditVideoUrl] = useState("");
  const [editCtaLabel, setEditCtaLabel] = useState("");
  const [editCtaHref, setEditCtaHref] = useState("");

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

  const loadFiles = async () => {
    try {
      const res = await api.get<{ data: DownloadFile[] }>("/files?limit=100");
      setFiles(res.data || []);
    } catch {
      // silent
    }
  };

  useEffect(() => {
    load();
    loadFiles();
  }, []);

  const resetUploadForm = () => {
    setAlt("");
    setTitle("");
    setDescription("");
    setBadge("");
    setFileId("");
    setVideoUrl("");
    setCtaLabel("");
    setCtaHref("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const upload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return showToast(t.common.error, "error");
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      fd.append("alt", alt);
      fd.append("title", title);
      fd.append("description", description);
      fd.append("badge", badge);
      if (fileId) fd.append("fileId", fileId);
      fd.append("videoUrl", videoUrl);
      fd.append("ctaLabel", ctaLabel);
      fd.append("ctaHref", ctaHref);

      await api.post("/hero", fd);
      await revalidateWebsite("hero");
      showToast(t.hero.uploadSuccess);
      setShowUpload(false);
      resetUploadForm();
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : t.common.error, "error");
    } finally {
      setBusy(false);
    }
  };

  const openEdit = (img: HeroImage) => {
    setShowEdit(img);
    setEditTitle(img.title || "");
    setEditDescription(img.description || "");
    setEditAlt(img.alt || "");
    setEditBadge((img.badge as Badge) || "");
    setEditFileId(
      typeof img.fileId === "string" ? img.fileId : img.fileId?._id || "",
    );
    setEditVideoUrl(img.videoUrl || "");
    setEditCtaLabel(img.ctaLabel || "");
    setEditCtaHref(img.ctaHref || "");
  };

  const saveEdit = async () => {
    if (!showEdit) return;
    setBusy(true);
    try {
      await api.patch(`/hero/${showEdit._id}`, {
        title: editTitle,
        description: editDescription,
        alt: editAlt,
        badge: editBadge,
        fileId: editFileId || null,
        videoUrl: editVideoUrl,
        ctaLabel: editCtaLabel,
        ctaHref: editCtaHref,
      });
      await revalidateWebsite("hero");
      showToast(t.common.success);
      setShowEdit(null);
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
      {/* Header */}
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
          subtitle={`${images.length}`}
          icon={<ImageIcon className="w-5 h-5" />}
        />
        <CardBody>
          {loading ? (
            <Spinner />
          ) : images.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-(--text-muted)">{t.common.noData}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {images.map((img, index) => {
                const linkedFile =
                  typeof img.fileId === "object" ? img.fileId : null;
                return (
                  <div
                    key={img._id}
                    className="border border-(--border) rounded-lg overflow-hidden bg-(--surface-2) hover:border-(--color-primary) transition"
                  >
                    <div className="relative aspect-video">
                      <Image
                        src={img.url}
                        alt={img.alt || "hero"}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 33vw"
                        priority={index === 0}
                      />
                      {img.badge && (
                        <span className="absolute top-2 inset-s-2 px-2 py-0.5 rounded-full bg-(--color-primary) text-white text-[10px] font-semibold">
                          {img.badge}
                        </span>
                      )}
                    </div>
                    <div className="p-3 space-y-2">
                      {img.title && (
                        <p className="text-sm font-medium text-(--text) line-clamp-1">
                          {img.title}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-1 text-[10px] text-(--text-muted)">
                        {linkedFile && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-(--color-primary-tint) text-(--color-primary)">
                            <BookOpen className="w-3 h-3" />
                            {linkedFile.title}
                          </span>
                        )}
                        {img.videoUrl && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-(--color-primary-tint) text-(--color-primary)">
                            <Video className="w-3 h-3" />
                            فيديو
                          </span>
                        )}
                        {img.ctaHref && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-(--surface)">
                            <LinkIcon className="w-3 h-3" />
                            CTA
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-(--text-muted)">
                        <span>👁 {img.views || 0}</span>
                        <span>👆 {img.clicks || 0}</span>
                      </div>
                      <div className="flex items-center gap-1 pt-2 border-t border-(--border)">
                        <label className="cursor-pointer">
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-(--surface) border border-(--border) hover:border-(--color-primary)">
                            <RefreshCw className="w-3 h-3" />
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
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(img)}
                        >
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => setShowDelete(img)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
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
          <div>
            <label className="block text-sm font-medium text-(--text) mb-1.5">
              الصورة
            </label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="w-full text-sm file:me-3 file:px-3 file:py-2 file:rounded-md file:border-0 file:bg-(--color-primary) file:text-white"
            />
          </div>
          <Input
            label="العنوان (اختياري)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Textarea
            label="الوصف (اختياري)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
          <Input
            label="Alt text"
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
          />
          <div>
            <label className="block text-sm font-medium text-(--text) mb-1.5">
              Badge
            </label>
            <select
              value={badge}
              onChange={(e) => setBadge(e.target.value as Badge)}
              className="w-full px-3 py-2 rounded-md border border-(--border) bg-(--surface)"
            >
              <option value="">بدون</option>
              <option value="new">جديد</option>
              <option value="featured">مميز</option>
              <option value="video">فيديو</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-(--text) mb-1.5">
              اربط بملف (اختياري)
            </label>
            <select
              value={fileId}
              onChange={(e) => setFileId(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-(--border) bg-(--surface)"
            >
              <option value="">بدون ربط</option>
              {files.map((f) => (
                <option key={f._id} value={f._id}>
                  {f.title} ({f.format})
                </option>
              ))}
            </select>
          </div>
          <Input
            label="رابط فيديو YouTube/Vimeo (اختياري)"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
          />
          <Input
            label="نص CTA (اختياري)"
            value={ctaLabel}
            onChange={(e) => setCtaLabel(e.target.value)}
            placeholder="اعرف أكثر"
          />
          <Input
            label="رابط CTA (اختياري)"
            value={ctaHref}
            onChange={(e) => setCtaHref(e.target.value)}
            placeholder="/ar/about"
          />
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={!!showEdit}
        onClose={() => setShowEdit(null)}
        title="تعديل الصورة"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowEdit(null)}>
              {t.common.cancel}
            </Button>
            <Button onClick={saveEdit} loading={busy}>
              {t.common.save}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="العنوان"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
          />
          <Textarea
            label="الوصف"
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            rows={2}
          />
          <Input
            label="Alt text"
            value={editAlt}
            onChange={(e) => setEditAlt(e.target.value)}
          />
          <div>
            <label className="block text-sm font-medium mb-1.5">Badge</label>
            <select
              value={editBadge}
              onChange={(e) => setEditBadge(e.target.value as Badge)}
              className="w-full px-3 py-2 rounded-md border border-(--border) bg-(--surface)"
            >
              <option value="">بدون</option>
              <option value="new">جديد</option>
              <option value="featured">مميز</option>
              <option value="video">فيديو</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">
              الملف المرتبط
            </label>
            <select
              value={editFileId}
              onChange={(e) => setEditFileId(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-(--border) bg-(--surface)"
            >
              <option value="">بدون ربط</option>
              {files.map((f) => (
                <option key={f._id} value={f._id}>
                  {f.title} ({f.format})
                </option>
              ))}
            </select>
          </div>
          <Input
            label="رابط فيديو"
            value={editVideoUrl}
            onChange={(e) => setEditVideoUrl(e.target.value)}
          />
          <Input
            label="نص CTA"
            value={editCtaLabel}
            onChange={(e) => setEditCtaLabel(e.target.value)}
          />
          <Input
            label="رابط CTA"
            value={editCtaHref}
            onChange={(e) => setEditCtaHref(e.target.value)}
          />
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
        <p className="text-sm">{t.hero.confirmDelete}</p>
      </Modal>
    </div>
  );
}
