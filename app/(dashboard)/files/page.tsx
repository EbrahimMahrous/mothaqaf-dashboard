"use client";

import { useEffect, useRef, useState } from "react";
import {
  Plus,
  Download,
  Trash2,
  FileText,
  Upload,
  Calendar,
} from "lucide-react";
import { api, revalidateWebsite } from "@/lib/api";
import { useI18n } from "@/components/providers/I18nProvider";
import { useToast } from "@/components/ui/Toast";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input, Textarea } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { formatBytes, formatDate } from "@/lib/utils";
import type { DownloadFile } from "@/types";

export default function FilesPage() {
  const { t, lang } = useI18n();
  const { showToast } = useToast();
  const [files, setFiles] = useState<DownloadFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [showDelete, setShowDelete] = useState<DownloadFile | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    try {
      const res = await api.get<{ data: DownloadFile[] }>("/files");
      setFiles(res.data || []);
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
    if (!file || !title.trim()) return showToast(t.common.error, "error");
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("title", title);
      fd.append("description", description);
      await api.post("/files", fd);
      await revalidateWebsite("files");
      showToast(t.files.uploadSuccess);
      setShowUpload(false);
      setTitle("");
      setDescription("");
      if (fileRef.current) fileRef.current.value = "";
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : t.common.error, "error");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!showDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/files/${showDelete._id}`);
      await revalidateWebsite("files");
      showToast(t.files.deleteSuccess);
      setShowDelete(null);
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : t.common.error, "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
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
        <Button onClick={() => setShowUpload(true)}>
          <Plus className="w-4 h-4" />
          {t.files.uploadNew}
        </Button>
      </div>

      <Card>
        <CardHeader
          title={t.files.title}
          subtitle={`${files.length} ${t.common.all}`}
          icon={<FileText className="w-5 h-5" />}
        />
        <CardBody>
          {loading ? (
            <Spinner />
          ) : files.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto rounded-full bg-(--color-primary-tint) flex items-center justify-center mb-3">
                <FileText className="w-8 h-8 text-(--color-primary)" />
              </div>
              <p className="text-(--text-muted)">{t.common.noData}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-start text-(--text-muted) border-b border-(--border)">
                    <th className="text-start p-3">{t.files.fileTitle}</th>
                    <th className="text-start p-3 hidden sm:table-cell">
                      {t.files.format}
                    </th>
                    <th className="text-start p-3 hidden sm:table-cell">
                      {t.files.size}
                    </th>
                    <th className="text-start p-3">{t.files.downloads}</th>
                    <th className="text-start p-3 hidden md:table-cell">
                      <Calendar className="w-4 h-4 inline" />
                    </th>
                    <th className="text-start p-3">{t.common.actions}</th>
                  </tr>
                </thead>
                <tbody>
                  {files.map((f) => (
                    <tr
                      key={f._id}
                      className="border-b border-(--border) hover:bg-(--color-primary-tint) transition"
                    >
                      <td className="p-3">
                        <div className="font-medium text-(--text)">
                          {f.title}
                        </div>
                        {f.description && (
                          <div className="text-xs text-(--text-muted) mt-0.5">
                            {f.description}
                          </div>
                        )}
                      </td>
                      <td className="p-3 hidden sm:table-cell uppercase text-xs">
                        <span className="inline-block px-2 py-0.5 rounded bg-(--color-primary-tint) text-(--color-primary) font-semibold">
                          {f.format || "—"}
                        </span>
                      </td>
                      <td className="p-3 hidden sm:table-cell text-xs">
                        {formatBytes(f.size)}
                      </td>
                      <td className="p-3">
                        <span className="inline-flex items-center gap-1 text-(--text)">
                          <Download className="w-3.5 h-3.5 text-(--text-muted)" />
                          {f.downloads}
                        </span>
                      </td>
                      <td className="p-3 hidden md:table-cell text-xs">
                        {formatDate(
                          f.createdAt,
                          lang === "ar" ? "ar-EG" : "en-US",
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <a href={f.url} target="_blank" rel="noreferrer">
                            <Button variant="outline" size="sm">
                              <Download className="w-3.5 h-3.5" />
                            </Button>
                          </a>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => setShowDelete(f)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Upload Modal */}
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
              <Upload className="w-4 h-4" />
              {t.common.upload}
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
              {t.files.uploadNew}
            </label>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.doc,.docx,.zip,.rar,.txt,.xlsx"
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
            <Button variant="danger" onClick={remove} loading={deleting}>
              <Trash2 className="w-4 h-4" />
              {t.common.delete}
            </Button>
          </>
        }
      >
        <p className="text-sm text-(--text)">{t.files.confirmDelete}</p>
      </Modal>
    </div>
  );
}
