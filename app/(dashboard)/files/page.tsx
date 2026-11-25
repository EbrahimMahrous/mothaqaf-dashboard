"use client";

import { useEffect, useRef, useState } from "react";
import {
  FileText,
  Upload,
  Download,
  Eye,
  Trash2,
  Plus,
  Search,
  Pencil,
  FileUp,
  BarChart3,
  HardDrive,
  TrendingUp,
  Star,
  Sparkles,
  Image as ImageIcon,
  Video,
  X,
} from "lucide-react";
import { api, fetchFilesStats, type FilesStats } from "@/lib/api";
import { useI18n } from "@/components/providers/I18nProvider";
import { useToast } from "@/components/ui/Toast";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input, Textarea } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { formatBytes } from "@/lib/utils";
import type { DownloadFile } from "@/types";

type Category = DownloadFile["category"];

const CATEGORIES: Category[] = [
  "management",
  "career",
  "business",
  "decision",
  "other",
];

export default function FilesPage() {
  const { t } = useI18n();
  const { showToast } = useToast();

  // ── State ──────────────────────────────────────────────
  const [files, setFiles] = useState<DownloadFile[]>([]);
  const [stats, setStats] = useState<FilesStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [category, setCategory] = useState<Category | "all">("all");
  const [sort, setSort] = useState("-createdAt");

  // Modals
  const [showUpload, setShowUpload] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [showEdit, setShowEdit] = useState<DownloadFile | null>(null);
  const [showDelete, setShowDelete] = useState<DownloadFile | null>(null);

  // Upload form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [uploadCategory, setUploadCategory] = useState<Category>("other");
  const [tags, setTags] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [isNewFlag, setIsNewFlag] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Bulk upload
  const bulkRef = useRef<HTMLInputElement>(null);
  const [bulkCategory, setBulkCategory] = useState<Category>("other");

  // Edit state
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState<Category>("other");
  const [editTags, setEditTags] = useState("");
  const [editCover, setEditCover] = useState("");
  const [editVideoUrl, setEditVideoUrl] = useState("");
  const [editIsNew, setEditIsNew] = useState(false);
  const [editIsFeatured, setEditIsFeatured] = useState(false);
  const [editIsPublished, setEditIsPublished] = useState(true);

  // ── Cover upload state ─────────────────────────────────
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // ── Debounce search ────────────────────────────────────
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQ(q), 350);
    return () => clearTimeout(id);
  }, [q]);

  // ── Loaders ────────────────────────────────────────────
  const load = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (debouncedQ.trim()) params.set("q", debouncedQ.trim());
      if (category !== "all") params.set("category", category);
      params.set("sort", sort);
      params.set("limit", "100");

      const res = await api.get<{ data: DownloadFile[] }>(`/files?${params}`);
      setFiles(res.data || []);
    } catch (err) {
      showToast(err instanceof Error ? err.message : t.common.error, "error");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const res = await fetchFilesStats();
      setStats(res.data);
    } catch {
      // Silent — stats optional
    }
  };

  useEffect(() => {
    load();
  }, [debouncedQ, category, sort]);
  useEffect(() => {
    loadStats();
  }, []);

  // ── Cover uploader ─────────────────────────────────────
  const uploadCover = async (fileId: string, file: File) => {
    setUploadingCover(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await api.post<{ data: DownloadFile }>(
        `/files/${fileId}/cover`,
        fd,
      );
      showToast(t.files.coverUploaded);

      // Update local list so the grid reflects immediately
      setFiles((prev) =>
        prev.map((f) =>
          f._id === fileId ? { ...f, coverImage: res.data.coverImage } : f,
        ),
      );

      // Update the open Edit modal state too
      setEditCover(res.data.coverImage || "");

      // Clear preview state
      setCoverFile(null);
      setCoverPreview(null);
      if (coverInputRef.current) coverInputRef.current.value = "";
    } catch (err) {
      showToast(err instanceof Error ? err.message : t.common.error, "error");
    } finally {
      setUploadingCover(false);
    }
  };

  const handleCoverSelect = (file: File | null) => {
    setCoverFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setCoverPreview(url);
      if (showEdit?._id) uploadCover(showEdit._id, file);
    } else {
      setCoverPreview(null);
    }
  };

  const clearCover = () => {
    setCoverFile(null);
    setCoverPreview(null);
    if (coverInputRef.current) coverInputRef.current.value = "";
  };

  // ── Actions ────────────────────────────────────────────
  const upload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file || !title.trim()) {
      return showToast(t.common.error, "error");
    }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("title", title.trim());
      fd.append("description", description);
      fd.append("category", uploadCategory);
      fd.append("tags", tags);
      fd.append("coverImage", coverImage);
      fd.append("videoUrl", videoUrl);
      fd.append("isNew", String(isNewFlag));
      fd.append("isFeatured", String(isFeatured));

      await api.post("/files", fd);
      showToast(t.files.uploadSuccess);
      setShowUpload(false);
      resetUploadForm();
      load();
      loadStats();
    } catch (err) {
      showToast(err instanceof Error ? err.message : t.common.error, "error");
    } finally {
      setBusy(false);
    }
  };

  const bulkUpload = async () => {
    const files = bulkRef.current?.files;
    if (!files || files.length === 0) return showToast(t.common.error, "error");
    setBusy(true);
    try {
      const fd = new FormData();
      for (const f of Array.from(files)) fd.append("files", f);
      fd.append("category", bulkCategory);

      await api.post("/files/bulk", fd);
      showToast(t.files.uploadSuccess);
      setShowBulkUpload(false);
      if (bulkRef.current) bulkRef.current.value = "";
      load();
      loadStats();
    } catch (err) {
      showToast(err instanceof Error ? err.message : t.common.error, "error");
    } finally {
      setBusy(false);
    }
  };

  const saveEdit = async () => {
    if (!showEdit) return;
    try {
      await api.patch(`/files/${showEdit._id}`, {
        title: editTitle,
        description: editDescription,
        category: editCategory,
        tags: editTags,
        // coverImage is uploaded separately via /files/:id/cover
        videoUrl: editVideoUrl,
        isNew: String(editIsNew),
        isFeatured: String(editIsFeatured),
        isPublished: String(editIsPublished),
      });
      showToast(t.files.updateSuccess);
      setShowEdit(null);
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : t.common.error, "error");
    }
  };

  const remove = async () => {
    if (!showDelete) return;
    try {
      await api.delete(`/files/${showDelete._id}`);
      showToast(t.files.deleteSuccess);
      setShowDelete(null);
      load();
      loadStats();
    } catch (err) {
      showToast(err instanceof Error ? err.message : t.common.error, "error");
    }
  };

  const resetUploadForm = () => {
    setTitle("");
    setDescription("");
    setUploadCategory("other");
    setTags("");
    setCoverImage("");
    setVideoUrl("");
    setIsNewFlag(false);
    setIsFeatured(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const openEdit = (file: DownloadFile) => {
    setShowEdit(file);
    setEditTitle(file.title);
    setEditDescription(file.description || "");
    setEditCategory(file.category);
    setEditTags(file.tags?.join(", ") || "");
    setEditCover(file.coverImage || "");
    setEditVideoUrl(file.videoUrl || "");
    setEditIsNew(!!file.isNew);
    setEditIsFeatured(!!file.isFeatured);
    setEditIsPublished(file.isPublished !== false);

    // Reset cover upload state
    setCoverFile(null);
    setCoverPreview(null);
    if (coverInputRef.current) coverInputRef.current.value = "";
  };

  // ── Derived ────────────────────────────────────────────
  const statsCards = stats
    ? [
        {
          label: t.files.stats.totalFiles,
          value: stats.totalFiles,
          Icon: FileText,
          color: "var(--color-primary)",
          bg: "var(--color-primary-tint)",
        },
        {
          label: t.files.stats.totalDownloads,
          value: stats.totalDownloads,
          Icon: Download,
          color: "var(--success)",
          bg: "var(--success-tint)",
        },
        {
          label: t.files.stats.totalViews,
          value: stats.totalViews,
          Icon: Eye,
          color: "var(--info, #0284c7)",
          bg: "rgba(2,132,199,0.1)",
        },
        {
          label: t.files.stats.totalSize,
          value: formatBytes(stats.totalSize),
          Icon: HardDrive,
          color: "var(--color-accent)",
          bg: "var(--accent-tint)",
        },
      ]
    : [];

  // ─────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-(--color-primary-tint) flex items-center justify-center">
            <FileText className="w-5 h-5 text-(--color-primary)" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-(--text)">
              {t.files.title}
            </h1>
            <p className="text-sm text-(--text-muted) mt-0.5">
              {t.files.subtitle}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowBulkUpload(true)}>
            <FileUp className="w-4 h-4" /> {t.files.uploadMany}
          </Button>
          <Button onClick={() => setShowUpload(true)}>
            <Plus className="w-4 h-4" /> {t.files.uploadNew}
          </Button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {statsCards.map((s) => (
            <Card key={s.label}>
              <CardBody>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-(--text-muted)">{s.label}</div>
                    <div className="text-2xl font-bold text-(--text) mt-1">
                      {s.value}
                    </div>
                  </div>
                  <div
                    className="w-10 h-10 rounded-md flex items-center justify-center"
                    style={{ background: s.bg, color: s.color }}
                  >
                    <s.Icon className="w-5 h-5" />
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Top files + categories row */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <Card>
            <CardHeader
              title={t.files.topFiles}
              icon={<TrendingUp className="w-5 h-5" />}
            />
            <CardBody>
              {stats.topFiles.length === 0 ? (
                <p className="text-sm text-(--text-muted) text-center py-4">
                  {t.common.noData}
                </p>
              ) : (
                <ul className="space-y-2">
                  {stats.topFiles.map((f) => (
                    <li
                      key={f._id}
                      className="flex items-center justify-between gap-2 text-sm"
                    >
                      <span className="truncate text-(--text)">{f.title}</span>
                      <span className="inline-flex items-center gap-1 text-xs text-(--text-muted) shrink-0">
                        <Download className="w-3 h-3" /> {f.downloads}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title={t.files.category}
              icon={<BarChart3 className="w-5 h-5" />}
            />
            <CardBody>
              <div className="flex flex-wrap gap-2">
                {Object.entries(stats.byCategory).map(([cat, count]) => (
                  <span
                    key={cat}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-(--color-primary-tint) text-(--color-primary)"
                  >
                    {t.files.categories[cat as Category] || cat} · {count}
                  </span>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardBody>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute inset-y-0 inset-s-3 my-auto w-4 h-4 text-(--text-muted)" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t.files.searchPlaceholder}
                className="w-full ps-10 pe-3 py-2 rounded-md border border-(--border) bg-(--surface) text-(--text) text-sm focus:outline-none focus:ring-2 focus:ring-(--color-primary)"
              />
            </div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category | "all")}
              className="px-3 py-2 rounded-md border border-(--border) bg-(--surface) text-(--text) text-sm"
            >
              <option value="all">{t.files.allCategories}</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {t.files.categories[c]}
                </option>
              ))}
            </select>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="px-3 py-2 rounded-md border border-(--border) bg-(--surface) text-(--text) text-sm"
            >
              <option value="-createdAt">{t.files.sortOptions.newest}</option>
              <option value="-downloads">
                {t.files.sortOptions.mostDownloaded}
              </option>
              <option value="-views">{t.files.sortOptions.mostViewed}</option>
            </select>
          </div>
        </CardBody>
      </Card>

      {/* Files grid */}
      <Card>
        <CardBody>
          {loading ? (
            <Spinner />
          ) : files.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto rounded-full bg-(--color-primary-tint) flex items-center justify-center mb-3">
                <FileText className="w-8 h-8 text-(--color-primary)" />
              </div>
              <p className="text-(--text-muted)">{t.files.noFiles}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {files.map((f) => (
                <div
                  key={f._id}
                  className="border border-(--border) rounded-lg overflow-hidden bg-(--surface-2) hover:border-(--color-primary) transition group"
                >
                  {/* Cover */}
                  <div className="relative aspect-video bg-(--color-primary-tint) flex items-center justify-center">
                    {f.coverImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={f.coverImage}
                        alt={f.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <FileText className="w-10 h-10 text-(--color-primary)" />
                    )}
                    {f.isNew && (
                      <span className="absolute top-2 inset-s-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-(--color-accent) text-white text-[10px] font-semibold">
                        <Sparkles className="w-3 h-3" /> {t.files.isNew}
                      </span>
                    )}
                    {f.isFeatured && (
                      <span className="absolute top-2 inset-e-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-(--color-primary) text-white text-[10px] font-semibold">
                        <Star className="w-3 h-3" /> {t.files.isFeatured}
                      </span>
                    )}
                  </div>

                  {/* Body */}
                  <div className="p-3">
                    <h3 className="font-medium text-(--text) text-sm line-clamp-2">
                      {f.title}
                    </h3>
                    <p className="text-xs text-(--text-muted) mt-1 line-clamp-1">
                      {t.files.categories[f.category]} · {formatBytes(f.size)}
                    </p>

                    <div className="flex items-center justify-between mt-3 text-xs text-(--text-muted)">
                      <span className="inline-flex items-center gap-1">
                        <Download className="w-3 h-3" /> {f.downloads}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Eye className="w-3 h-3" /> {f.views}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <ImageIcon className="w-3 h-3" /> {f.format || "—"}
                      </span>
                    </div>

                    {f.videoUrl && (
                      <div className="mt-2 inline-flex items-center gap-1 text-[11px] text-(--color-primary)">
                        <Video className="w-3 h-3" />
                        {t.files.videoAttached}
                      </div>
                    )}

                    <div className="flex items-center gap-1 mt-3">
                      <a
                        href={f.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1"
                      >
                        <Button variant="outline" size="sm" className="w-full">
                          <Download className="w-3.5 h-3.5" />{" "}
                          {t.files.download}
                        </Button>
                      </a>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEdit(f)}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setShowDelete(f)}
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

      {/* ── Upload Modal ──────────────────────────────────── */}
      <Modal
        open={showUpload}
        onClose={() => setShowUpload(false)}
        title={t.files.uploadNew}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowUpload(false)}>
              {t.common.cancel}
            </Button>
            <Button onClick={upload} loading={busy}>
              <Upload className="w-4 h-4" /> {t.common.upload}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label={t.files.fileTitle}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <Textarea
            label={t.files.description}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
          <div>
            <label className="block text-sm font-medium text-(--text) mb-1.5">
              {t.files.category}
            </label>
            <select
              value={uploadCategory}
              onChange={(e) => setUploadCategory(e.target.value as Category)}
              className="w-full px-3 py-2 rounded-md border border-(--border) bg-(--surface) text-(--text)"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {t.files.categories[c]}
                </option>
              ))}
            </select>
          </div>
          <Input
            label={t.files.tags}
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="tag1, tag2"
          />
          <Input
            label={t.files.coverImage}
            value={coverImage}
            onChange={(e) => setCoverImage(e.target.value)}
            placeholder="https://..."
          />
          <Input
            label={t.files.videoUrl}
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
          />
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-(--text)">
              <input
                type="checkbox"
                checked={isNewFlag}
                onChange={(e) => setIsNewFlag(e.target.checked)}
              />{" "}
              {t.files.isNew}
            </label>
            <label className="flex items-center gap-2 text-sm text-(--text)">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
              />{" "}
              {t.files.isFeatured}
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-(--text) mb-1.5">
              {t.files.selectFile}
            </label>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.doc,.docx,.zip,.rar,.txt,.xlsx"
              className="w-full text-sm file:me-3 file:px-3 file:py-2 file:rounded-md file:border-0 file:bg-(--color-primary) file:text-white file:font-medium file:cursor-pointer"
            />
          </div>
        </div>
      </Modal>

      {/* ── Bulk Upload Modal ─────────────────────────────── */}
      <Modal
        open={showBulkUpload}
        onClose={() => setShowBulkUpload(false)}
        title={t.files.uploadMany}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setShowBulkUpload(false)}
            >
              {t.common.cancel}
            </Button>
            <Button onClick={bulkUpload} loading={busy}>
              <Upload className="w-4 h-4" /> {t.common.upload}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-(--text) mb-1.5">
              {t.files.category}
            </label>
            <select
              value={bulkCategory}
              onChange={(e) => setBulkCategory(e.target.value as Category)}
              className="w-full px-3 py-2 rounded-md border border-(--border) bg-(--surface) text-(--text)"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {t.files.categories[c]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-(--text) mb-1.5">
              {t.files.selectFiles}
            </label>
            <input
              ref={bulkRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.zip,.rar,.txt,.xlsx"
              className="w-full text-sm file:me-3 file:px-3 file:py-2 file:rounded-md file:border-0 file:bg-(--color-primary) file:text-white file:font-medium file:cursor-pointer"
            />
          </div>
        </div>
      </Modal>

      {/* ── Edit Modal ────────────────────────────────────── */}
      <Modal
        open={!!showEdit}
        onClose={() => {
          setShowEdit(null);
          clearCover();
        }}
        title={t.files.edit}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setShowEdit(null);
                clearCover();
              }}
            >
              {t.common.cancel}
            </Button>
            <Button onClick={saveEdit}>{t.common.save}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label={t.files.fileTitle}
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
          />
          <Textarea
            label={t.files.description}
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            rows={3}
          />
          <div>
            <label className="block text-sm font-medium text-(--text) mb-1.5">
              {t.files.category}
            </label>
            <select
              value={editCategory}
              onChange={(e) => setEditCategory(e.target.value as Category)}
              className="w-full px-3 py-2 rounded-md border border-(--border) bg-(--surface) text-(--text)"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {t.files.categories[c]}
                </option>
              ))}
            </select>
          </div>
          <Input
            label={t.files.tags}
            value={editTags}
            onChange={(e) => setEditTags(e.target.value)}
          />

          {/* Cover image uploader (file from computer) */}
          <div>
            <label className="block text-sm font-medium text-(--text) mb-1.5">
              {t.files.coverImage}
            </label>
            <p className="text-xs text-(--text-muted) mb-2">
              {t.files.coverImageHint}
            </p>

            <div className="flex items-start gap-3">
              {/* Preview */}
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-(--border) bg-(--surface-2)">
                {coverPreview || editCover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={coverPreview || editCover}
                    alt="cover"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-(--text-muted)">
                    <ImageIcon className="h-6 w-6" />
                  </div>
                )}

                {(coverPreview || editCover) && (
                  <button
                    type="button"
                    onClick={() => {
                      clearCover();
                      setEditCover("");
                    }}
                    className="absolute top-1 inset-e-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                    aria-label={t.files.removeCover}
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              {/* File input */}
              <div className="flex-1 space-y-2">
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null;
                    handleCoverSelect(f);
                  }}
                  className="w-full text-sm file:me-3 file:px-3 file:py-2 file:rounded-md file:border-0 file:bg-(--color-primary) file:text-white file:font-medium file:cursor-pointer"
                />
                {uploadingCover && (
                  <p className="text-xs text-(--text-muted)">
                    {t.files.uploadingCover}
                  </p>
                )}
                {!uploadingCover && coverFile && (
                  <p className="text-xs text-green-600">
                    ✓ {t.files.coverUploaded}
                  </p>
                )}
                {!showEdit?._id && (
                  <p className="text-xs text-(--text-muted)">
                    {t.files.saveFirst}
                  </p>
                )}
              </div>
            </div>
          </div>

          <Input
            label={t.files.videoUrl}
            value={editVideoUrl}
            onChange={(e) => setEditVideoUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
          />
          <div className="flex items-center gap-4 flex-wrap">
            <label className="flex items-center gap-2 text-sm text-(--text)">
              <input
                type="checkbox"
                checked={editIsNew}
                onChange={(e) => setEditIsNew(e.target.checked)}
              />{" "}
              {t.files.isNew}
            </label>
            <label className="flex items-center gap-2 text-sm text-(--text)">
              <input
                type="checkbox"
                checked={editIsFeatured}
                onChange={(e) => setEditIsFeatured(e.target.checked)}
              />{" "}
              {t.files.isFeatured}
            </label>
            <label className="flex items-center gap-2 text-sm text-(--text)">
              <input
                type="checkbox"
                checked={editIsPublished}
                onChange={(e) => setEditIsPublished(e.target.checked)}
              />{" "}
              {t.files.isPublished}
            </label>
          </div>
        </div>
      </Modal>

      {/* ── Delete Modal ─────────────────────────────────── */}
      <Modal
        open={!!showDelete}
        onClose={() => setShowDelete(null)}
        title={t.common.confirm}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowDelete(null)}>
              {t.common.cancel}
            </Button>
            <Button variant="danger" onClick={remove}>
              <Trash2 className="w-4 h-4" /> {t.common.delete}
            </Button>
          </>
        }
      >
        <p className="text-sm text-(--text)">{t.files.confirmDelete}</p>
      </Modal>
    </div>
  );
}
