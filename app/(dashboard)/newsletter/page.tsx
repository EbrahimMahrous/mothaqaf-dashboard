"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Mail,
  Send,
  Users,
  UserX,
  Trash2,
  MailCheck,
  CalendarDays,
  Inbox,
  Search,
  Plus,
  Paperclip,
  X,
  Eye,
  ListPlus,
  Loader2,
  CheckSquare,
  Square,
  Pencil,
} from "lucide-react";
import Image from "next/image";
import { api } from "@/lib/api";
import { useI18n } from "@/components/providers/I18nProvider";
import { useToast } from "@/components/ui/Toast";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input, Textarea } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { formatDate } from "@/lib/utils";
import type {
  Subscriber,
  Campaign,
  SubscriberList,
  CampaignAttachment,
} from "@/types";

type Tab = "subs" | "camps" | "lists";

export default function NewsletterPage() {
  const { t, lang } = useI18n();
  const { showToast } = useToast();

  // ── State ────────────────────────────────────────────────
  const [tab, setTab] = useState<Tab>("subs");
  const [subs, setSubs] = useState<Subscriber[]>([]);
  const [camps, setCamps] = useState<Campaign[]>([]);
  const [lists, setLists] = useState<SubscriberList[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & search
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "" | "active" | "unsubscribed"
  >("");
  const [listFilter, setListFilter] = useState<string>("");
  const [campQuery, setCampQuery] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const allSelected = subs.length > 0 && selectedIds.size === subs.length;

  // Modals
  const [showSend, setShowSend] = useState(false);
  const [showDelete, setShowDelete] = useState<Subscriber | null>(null);
  const [showCreateList, setShowCreateList] = useState(false);
  const [showAddToList, setShowAddToList] = useState(false);
  const [showEditSub, setShowEditSub] = useState<Subscriber | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [previewCampaign, setPreviewCampaign] = useState<Campaign | null>(null);

  // Send state
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [audience, setAudience] = useState<"all" | "lists" | "manual">("all");
  const [audienceListIds, setAudienceListIds] = useState<string[]>([]);
  const [manualEmails, setManualEmails] = useState("");
  const [attachments, setAttachments] = useState<CampaignAttachment[]>([]);
  const [busy, setBusy] = useState(false);
  const [uploadingAttach, setUploadingAttach] = useState(false);
  const attachRef = useRef<HTMLInputElement>(null);

  // Bulk op state
  const [deleting, setDeleting] = useState(false);
  const [bulkListId, setBulkListId] = useState("");

  // List creation state
  const [newListName, setNewListName] = useState("");
  const [newListDesc, setNewListDesc] = useState("");
  const [newListColor, setNewListColor] = useState("#1e6b3a");

  // Import state
  const [importText, setImportText] = useState("");
  const [importListId, setImportListId] = useState("");

  // Edit subscriber state
  const [editName, setEditName] = useState("");
  const [editStatus, setEditStatus] = useState<"active" | "unsubscribed">(
    "active",
  );
  const [editNotes, setEditNotes] = useState("");

  // ── Loaders ──────────────────────────────────────────────
  const loadLists = async () => {
    try {
      const res = await api.get<{ data: SubscriberList[] }>(
        "/newsletter/lists",
      );
      setLists(res.data || []);
    } catch (err) {
      showToast(err instanceof Error ? err.message : t.common.error, "error");
    }
  };

  const buildSubQuery = (p: number) => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (statusFilter) params.set("status", statusFilter);
    if (listFilter) params.set("listId", listFilter);
    params.set("page", String(p));
    params.set("limit", "20");
    return params.toString();
  };

  const loadSubs = async (p = 1, append = false) => {
    try {
      if (append) setLoadingMore(true);
      else setLoading(true);
      const res = await api.get<{
        data: Subscriber[];
        total: number;
        page: number;
        pages: number;
      }>(`/newsletter/subscribers?${buildSubQuery(p)}`);
      setSubs((prev) => (append ? [...prev, ...res.data] : res.data));
      setTotal(res.total || 0);
      setPage(res.page || 1);
      setTotalPages(res.pages || 1);
      if (!append) setSelectedIds(new Set());
    } catch (err) {
      showToast(err instanceof Error ? err.message : t.common.error, "error");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadCamps = async () => {
    try {
      const params = new URLSearchParams();
      if (campQuery.trim()) params.set("q", campQuery.trim());
      const res = await api.get<{ data: Campaign[] }>(
        `/newsletter/campaigns?${params}`,
      );
      setCamps(res.data || []);
    } catch (err) {
      showToast(err instanceof Error ? err.message : t.common.error, "error");
    }
  };

  useEffect(() => {
    loadLists();
  }, []);
  useEffect(() => {
    loadSubs(1, false);
  }, [q, statusFilter, listFilter]);
  useEffect(() => {
    loadCamps();
  }, [campQuery]);
  useEffect(() => {
    setLoading(false);
  }, []);

  // ── Selection helpers ────────────────────────────────────
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const toggleSelectAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else setSelectedIds(new Set(subs.map((s) => s._id)));
  };

  // ── Subscribe actions ────────────────────────────────────
  const deleteSub = async (id: string) => {
    setDeleting(true);
    try {
      await api.delete(`/newsletter/subscribers/${id}`);
      showToast(t.newsletter.deleteSuccess);
      setShowDelete(null);
      loadSubs(1, false);
    } catch (err) {
      showToast(err instanceof Error ? err.message : t.common.error, "error");
    } finally {
      setDeleting(false);
    }
  };

  const bulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setDeleting(true);
    try {
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          api.delete(`/newsletter/subscribers/${id}`),
        ),
      );
      showToast(t.newsletter.deleteSuccess);
      setSelectedIds(new Set());
      loadSubs(1, false);
    } catch (err) {
      showToast(err instanceof Error ? err.message : t.common.error, "error");
    } finally {
      setDeleting(false);
    }
  };

  const bulkAddToList = async () => {
    if (!bulkListId || selectedIds.size === 0) return;
    try {
      await api.post(`/newsletter/lists/${bulkListId}/add`, {
        subscriberIds: Array.from(selectedIds),
      });
      showToast(t.newsletter.listCreated);
      setShowAddToList(false);
      setBulkListId("");
      setSelectedIds(new Set());
      loadSubs(1, false);
    } catch (err) {
      showToast(err instanceof Error ? err.message : t.common.error, "error");
    }
  };

  const saveEditSub = async () => {
    if (!showEditSub) return;
    try {
      await api.patch(`/newsletter/subscribers/${showEditSub._id}`, {
        name: editName,
        status: editStatus,
        notes: editNotes,
      });
      showToast(t.common.success);
      setShowEditSub(null);
      loadSubs(1, false);
    } catch (err) {
      showToast(err instanceof Error ? err.message : t.common.error, "error");
    }
  };

  // ── List actions ─────────────────────────────────────────
  const createList = async () => {
    if (!newListName.trim()) return;
    try {
      await api.post("/newsletter/lists", {
        name: newListName.trim(),
        description: newListDesc,
        color: newListColor,
      });
      showToast(t.newsletter.listCreated);
      setShowCreateList(false);
      setNewListName("");
      setNewListDesc("");
      setNewListColor("#1e6b3a");
      loadLists();
    } catch (err) {
      showToast(err instanceof Error ? err.message : t.common.error, "error");
    }
  };

  const deleteList = async (id: string) => {
    try {
      await api.delete(`/newsletter/lists/${id}`);
      showToast(t.newsletter.listDeleted);
      loadLists();
    } catch (err) {
      showToast(err instanceof Error ? err.message : t.common.error, "error");
    }
  };

  // ── Send campaign ────────────────────────────────────────
  const resetSendForm = () => {
    setSubject("");
    setContent("");
    setAudience("all");
    setAudienceListIds([]);
    setManualEmails("");
    setAttachments([]);
    if (attachRef.current) attachRef.current.value = "";
  };

  const uploadAttachment = async (file: File) => {
    setUploadingAttach(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await api.post<{ data: CampaignAttachment }>(
        "/newsletter/attachments",
        fd,
      );
      setAttachments((prev) => [...prev, res.data]);
    } catch (err) {
      showToast(err instanceof Error ? err.message : t.common.error, "error");
    } finally {
      setUploadingAttach(false);
    }
  };

  const removeAttachment = (idx: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  const canSend = useMemo(() => {
    if (!subject.trim() || !content.trim()) return false;
    if (audience === "lists" && audienceListIds.length === 0) return false;
    if (
      audience === "manual" &&
      !manualEmails.split(/[,\n]/).some((e) => e.trim())
    )
      return false;
    return true;
  }, [subject, content, audience, audienceListIds, manualEmails]);

  const send = async () => {
    if (!canSend) return showToast(t.common.error, "error");
    setBusy(true);
    try {
      await api.post("/newsletter/send", {
        subject: subject.trim(),
        html: content,
        audience,
        listIds: audienceListIds,
        manualEmails:
          audience === "manual"
            ? manualEmails
                .split(/[,\n]/)
                .map((e) => e.trim())
                .filter(Boolean)
            : [],
        attachments,
      });
      showToast(t.newsletter.sendSuccess);
      setShowSend(false);
      resetSendForm();
      loadCamps();
    } catch (err) {
      showToast(err instanceof Error ? err.message : t.common.error, "error");
    } finally {
      setBusy(false);
    }
  };

  // ── Import ───────────────────────────────────────────────
  const importSubs = async () => {
    const emails = importText
      .split(/[\n,]/)
      .map((e) => e.trim())
      .filter(Boolean);
    if (emails.length === 0) return showToast(t.common.error, "error");
    try {
      const res = await api.post<{ data: { added: number; skipped: number } }>(
        "/newsletter/subscribers/import",
        { emails, listId: importListId || undefined },
      );
      showToast(`${t.newsletter.importedSuccess} (${res.data.added} ✓)`);
      setShowImport(false);
      setImportText("");
      setImportListId("");
      loadSubs(1, false);
      loadLists();
    } catch (err) {
      showToast(err instanceof Error ? err.message : t.common.error, "error");
    }
  };

  // ── Derived UI data ──────────────────────────────────────
  const activeCount = subs.filter((s) => s.status === "active").length;
  const stats = [
    {
      label: t.newsletter.total,
      value: total || subs.length,
      Icon: Users,
      color: "var(--color-primary)",
      bg: "var(--color-primary-tint)",
    },
    {
      label: t.newsletter.active,
      value: activeCount,
      Icon: MailCheck,
      color: "var(--success)",
      bg: "var(--success-tint)",
    },
    {
      label: t.newsletter.unsubscribed,
      value: subs.length - activeCount,
      Icon: UserX,
      color: "var(--danger)",
      bg: "var(--danger-tint)",
    },
  ];

  // ─────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-(--color-primary-tint) flex items-center justify-center">
            <Mail className="w-5 h-5 text-(--color-primary)" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-(--text)">
              {t.newsletter.title}
            </h1>
            <p className="text-sm text-(--text-muted) mt-0.5">
              {t.newsletter.subtitle}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowImport(true)}>
            <ListPlus className="w-4 h-4" />
            {t.newsletter.import}
          </Button>
          <Button onClick={() => setShowSend(true)}>
            <Send className="w-4 h-4" />
            {t.newsletter.sendNew}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {stats.map((s) => (
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

      {/* Tabs */}
      <div className="flex gap-2 border-b border-(--border) overflow-x-auto">
        {[
          { key: "subs", label: t.newsletter.subscribers, Icon: Users },
          { key: "camps", label: t.newsletter.campaigns, Icon: Inbox },
          { key: "lists", label: t.newsletter.lists, Icon: ListPlus },
        ].map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key as Tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition inline-flex items-center gap-2 whitespace-nowrap ${
              tab === key
                ? "border-(--color-primary) text-(--color-primary)"
                : "border-transparent text-(--text-muted) hover:text-(--text)"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Toolbar (search + filters) — only for subs */}
      {tab === "subs" && (
        <Card>
          <CardBody>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute inset-y-0 inset-s-3 my-auto w-4 h-4 text-(--text-muted)" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={t.newsletter.searchPlaceholder}
                  className="w-full ps-10 pe-3 py-2 rounded-md border border-(--border) bg-(--surface) text-(--text) text-sm focus:outline-none focus:ring-2 focus:ring-(--color-primary)"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(
                    e.target.value as "" | "active" | "unsubscribed",
                  )
                }
                className="px-3 py-2 rounded-md border border-(--border) bg-(--surface) text-(--text) text-sm"
              >
                <option value="">{t.newsletter.allStatuses}</option>
                <option value="active">{t.newsletter.active}</option>
                <option value="unsubscribed">
                  {t.newsletter.unsubscribed}
                </option>
              </select>
              <select
                value={listFilter}
                onChange={(e) => setListFilter(e.target.value)}
                className="px-3 py-2 rounded-md border border-(--border) bg-(--surface) text-(--text) text-sm"
              >
                <option value="">{t.newsletter.allLists}</option>
                {lists.map((l) => (
                  <option key={l._id} value={l._id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Bulk actions */}
            {selectedIds.size > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm bg-(--color-primary-tint) border border-(--border) rounded-md px-3 py-2">
                <span className="text-(--text)">
                  {selectedIds.size} {t.newsletter.selected}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowAddToList(true)}
                >
                  <ListPlus className="w-4 h-4" /> {t.newsletter.bulkAddToList}
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={bulkDelete}
                  loading={deleting}
                >
                  <Trash2 className="w-4 h-4" /> {t.newsletter.bulkRemove}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedIds(new Set())}
                >
                  {t.newsletter.clearSelection}
                </Button>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Main content */}
      <Card>
        <CardBody>
          {loading ? (
            <Spinner />
          ) : tab === "subs" ? (
            subs.length === 0 ? (
              <EmptyState Icon={Users} label={t.newsletter.noSubscribers} />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-start text-(--text-muted) border-b border-(--border)">
                      <th className="p-3 w-8">
                        <button
                          onClick={toggleSelectAll}
                          className="text-(--text-muted)"
                        >
                          {allSelected ? (
                            <CheckSquare className="w-4 h-4" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </th>
                      <th className="text-start p-3">
                        <Mail className="w-4 h-4 inline" />
                      </th>
                      <th className="text-start p-3">{t.newsletter.name}</th>
                      <th className="text-start p-3 hidden md:table-cell">
                        {t.newsletter.lists}
                      </th>
                      <th className="text-start p-3">Status</th>
                      <th className="text-start p-3 hidden sm:table-cell">
                        <CalendarDays className="w-4 h-4 inline" />
                      </th>
                      <th className="text-start p-3">{t.common.actions}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subs.map((s) => (
                      <tr
                        key={s._id}
                        className="border-b border-(--border) hover:bg-(--color-primary-tint) transition"
                      >
                        <td className="p-3">
                          <button
                            onClick={() => toggleSelect(s._id)}
                            className="text-(--text-muted)"
                          >
                            {selectedIds.has(s._id) ? (
                              <CheckSquare className="w-4 h-4 text-(--color-primary)" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                        <td className="p-3 text-(--text)">{s.email}</td>
                        <td className="p-3 text-(--text)">{s.name || "—"}</td>
                        <td className="p-3 hidden md:table-cell">
                          <div className="flex flex-wrap gap-1">
                            {s.lists?.map((l) => (
                              <span
                                key={l._id}
                                className="text-[10px] px-1.5 py-0.5 rounded-full text-white"
                                style={{
                                  background: l.color || "var(--color-primary)",
                                }}
                              >
                                {l.name}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-3">
                          <span
                            className={`text-xs px-2 py-1 rounded-full inline-flex items-center gap-1 ${
                              s.status === "active"
                                ? "bg-(--success-tint) text-(--success)"
                                : "bg-(--danger-tint) text-(--danger)"
                            }`}
                          >
                            {s.status === "active" ? (
                              <MailCheck className="w-3 h-3" />
                            ) : (
                              <UserX className="w-3 h-3" />
                            )}
                            {s.status === "active"
                              ? t.newsletter.active
                              : t.newsletter.unsubscribed}
                          </span>
                        </td>
                        <td className="p-3 hidden sm:table-cell text-xs">
                          {formatDate(
                            s.createdAt,
                            lang === "ar" ? "ar-EG" : "en-US",
                          )}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setShowEditSub(s);
                                setEditName(s.name || "");
                                setEditStatus(s.status);
                                setEditNotes(s.notes || "");
                              }}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => setShowDelete(s)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {page < totalPages && (
                  <div className="flex justify-center pt-4">
                    <Button
                      variant="outline"
                      onClick={() => loadSubs(page + 1, true)}
                      loading={loadingMore}
                    >
                      {t.newsletter.loadingMore}
                    </Button>
                  </div>
                )}
              </div>
            )
          ) : tab === "camps" ? (
            <>
              <div className="mb-4 relative">
                <Search className="absolute inset-y-0 inset-s-3 my-auto w-4 h-4 text-(--text-muted)" />
                <input
                  value={campQuery}
                  onChange={(e) => setCampQuery(e.target.value)}
                  placeholder={t.newsletter.searchPlaceholder}
                  className="w-full ps-10 pe-3 py-2 rounded-md border border-(--border) bg-(--surface) text-(--text) text-sm"
                />
              </div>
              {camps.length === 0 ? (
                <EmptyState Icon={Inbox} label={t.common.noData} />
              ) : (
                <ul className="space-y-3">
                  {camps.map((c) => (
                    <li
                      key={c._id}
                      className="border border-(--border) rounded-md p-3 hover:border-(--color-primary) transition"
                    >
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div>
                          <div className="font-medium text-(--text)">
                            {c.subject}
                          </div>
                          <div className="text-xs text-(--text-muted) mt-1">
                            {formatDate(
                              c.createdAt,
                              lang === "ar" ? "ar-EG" : "en-US",
                            )}{" "}
                            · {c.recipientsCount} {t.newsletter.recipients}
                          </div>
                          {c.attachments?.length > 0 && (
                            <div className="text-xs text-(--text-muted) mt-1 inline-flex items-center gap-1">
                              <Paperclip className="w-3 h-3" />{" "}
                              {c.attachments.length}{" "}
                              {t.newsletter.attachmentsCount}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 rounded inline-flex items-center gap-1 text-xs bg-(--success-tint) text-(--success)">
                            <MailCheck className="w-3 h-3" /> {c.sent}
                          </span>
                          {c.failed > 0 && (
                            <span className="px-2 py-1 rounded inline-flex items-center gap-1 text-xs bg-(--danger-tint) text-(--danger)">
                              <UserX className="w-3 h-3" /> {c.failed}
                            </span>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPreviewCampaign(c)}
                          >
                            <Eye className="w-3.5 h-3.5" />{" "}
                            {t.newsletter.viewDetails}
                          </Button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <>
              <div className="flex justify-end mb-3">
                <Button onClick={() => setShowCreateList(true)}>
                  <Plus className="w-4 h-4" /> {t.newsletter.createList}
                </Button>
              </div>
              {lists.length === 0 ? (
                <EmptyState Icon={ListPlus} label={t.newsletter.noLists} />
              ) : (
                <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {lists.map((l) => (
                    <li
                      key={l._id}
                      className="border border-(--border) rounded-md p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ background: l.color }}
                          />
                          <span className="font-medium text-(--text)">
                            {l.name}
                          </span>
                        </div>
                        <button
                          onClick={() => deleteList(l._id)}
                          className="text-(--danger) hover:opacity-80"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      {l.description && (
                        <p className="text-xs text-(--text-muted) mt-1">
                          {l.description}
                        </p>
                      )}
                      <div className="text-xs text-(--color-primary) mt-2 font-medium">
                        {l.subscriberCount} {t.newsletter.subscriber}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </CardBody>
      </Card>

      {/* ── Send Modal ────────────────────────────────────── */}
      <Modal
        open={showSend}
        onClose={() => setShowSend(false)}
        title={t.newsletter.sendNew}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowSend(false)}>
              {t.common.cancel}
            </Button>
            <Button onClick={send} loading={busy} disabled={!canSend}>
              <Send className="w-4 h-4" /> {t.newsletter.sendNow}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Audience */}
          <div>
            <label className="block text-sm font-medium text-(--text) mb-2">
              {t.newsletter.audience}
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { v: "all", label: t.newsletter.audienceAll },
                { v: "lists", label: t.newsletter.audienceLists },
                { v: "manual", label: t.newsletter.audienceManual },
              ].map((o) => (
                <button
                  key={o.v}
                  onClick={() => setAudience(o.v as typeof audience)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium border transition ${
                    audience === o.v
                      ? "bg-(--color-primary) text-white border-(--color-primary)"
                      : "border-(--border) text-(--text) hover:border-(--color-primary)"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {audience === "lists" && (
            <div>
              <label className="block text-sm font-medium text-(--text) mb-2">
                {t.newsletter.selectLists}
              </label>
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                {lists.map((l) => {
                  const checked = audienceListIds.includes(l._id);
                  return (
                    <button
                      key={l._id}
                      onClick={() =>
                        setAudienceListIds((prev) =>
                          checked
                            ? prev.filter((x) => x !== l._id)
                            : [...prev, l._id],
                        )
                      }
                      className={`px-2.5 py-1 rounded-full text-xs border ${
                        checked
                          ? "bg-(--color-primary) text-white border-(--color-primary)"
                          : "border-(--border) text-(--text)"
                      }`}
                    >
                      {l.name} ({l.subscriberCount})
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {audience === "manual" && (
            <Textarea
              label={t.newsletter.manualEmails}
              value={manualEmails}
              onChange={(e) => setManualEmails(e.target.value)}
              rows={4}
              placeholder="a@example.com, b@example.com"
            />
          )}

          <Input
            label={t.newsletter.subject}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
          />
          <Textarea
            label={t.newsletter.content}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={10}
            placeholder="<h1>مرحبًا</h1><p>محتوى النشرة...</p>"
          />

          {/* Attachments */}
          <div>
            <label className="block text-sm font-medium text-(--text) mb-2">
              {t.newsletter.attachments}
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {attachments.map((a, i) => (
                <div
                  key={i}
                  className="inline-flex items-center gap-2 px-2 py-1 rounded-md bg-(--surface-2) text-xs"
                >
                  {a.type === "image" ? (
                    <Image
                      src={a.url}
                      alt={a.name}
                      width={20}
                      height={20}
                      className="rounded"
                    />
                  ) : (
                    <Paperclip className="w-3 h-3" />
                  )}
                  <span className="max-w-37.5 truncate">{a.name}</span>
                  <button
                    onClick={() => removeAttachment(i)}
                    className="text-(--danger)"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
            <input
              ref={attachRef}
              type="file"
              accept="image/*,.pdf,.doc,.docx,.zip,.rar,.txt,.xlsx"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadAttachment(f);
              }}
              className="hidden"
              id="attach-file"
            />
            <label
              htmlFor="attach-file"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-dashed border-(--border) text-sm cursor-pointer text-(--text-muted) hover:border-(--color-primary) hover:text-(--color-primary)"
            >
              {uploadingAttach ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Paperclip className="w-4 h-4" />
              )}
              {t.newsletter.uploadAttachment}
            </label>
          </div>
        </div>
      </Modal>

      {/* ── Delete Subscriber ─────────────────────────────── */}
      <Modal
        open={!!showDelete}
        onClose={() => setShowDelete(null)}
        title={t.common.confirm}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowDelete(null)}>
              {t.common.cancel}
            </Button>
            <Button
              variant="danger"
              onClick={() => showDelete && deleteSub(showDelete._id)}
              loading={deleting}
            >
              <Trash2 className="w-4 h-4" /> {t.common.delete}
            </Button>
          </>
        }
      >
        <p className="text-sm text-(--text)">
          {t.common.delete}:{" "}
          <strong className="text-(--color-primary)">
            {showDelete?.email}
          </strong>
          ؟
        </p>
      </Modal>

      {/* ── Create List ───────────────────────────────────── */}
      <Modal
        open={showCreateList}
        onClose={() => setShowCreateList(false)}
        title={t.newsletter.createList}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setShowCreateList(false)}
            >
              {t.common.cancel}
            </Button>
            <Button onClick={createList} disabled={!newListName.trim()}>
              {t.common.save}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label={t.newsletter.listName}
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            required
          />
          <Input
            label={t.newsletter.listDescription}
            value={newListDesc}
            onChange={(e) => setNewListDesc(e.target.value)}
          />
          <div>
            <label className="block text-sm font-medium text-(--text) mb-1.5">
              {t.newsletter.listColor}
            </label>
            <input
              type="color"
              value={newListColor}
              onChange={(e) => setNewListColor(e.target.value)}
              className="w-12 h-10 rounded-md border border-(--border) bg-(--surface) cursor-pointer"
            />
          </div>
        </div>
      </Modal>

      {/* ── Add to List ───────────────────────────────────── */}
      <Modal
        open={showAddToList}
        onClose={() => setShowAddToList(false)}
        title={t.newsletter.bulkAddToList}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowAddToList(false)}>
              {t.common.cancel}
            </Button>
            <Button onClick={bulkAddToList} disabled={!bulkListId}>
              {t.common.save}
            </Button>
          </>
        }
      >
        <select
          value={bulkListId}
          onChange={(e) => setBulkListId(e.target.value)}
          className="w-full px-3 py-2 rounded-md border border-(--border) bg-(--surface) text-(--text)"
        >
          <option value="">— {t.newsletter.selectLists} —</option>
          {lists.map((l) => (
            <option key={l._id} value={l._id}>
              {l.name}
            </option>
          ))}
        </select>
      </Modal>

      {/* ── Edit Subscriber ──────────────────────────────── */}
      <Modal
        open={!!showEditSub}
        onClose={() => setShowEditSub(null)}
        title={t.newsletter.editSubscriber}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowEditSub(null)}>
              {t.common.cancel}
            </Button>
            <Button onClick={saveEditSub}>{t.common.save}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label={t.newsletter.name}
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
          />
          <div>
            <label className="block text-sm font-medium text-(--text) mb-2">
              Status
            </label>
            <div className="flex gap-2">
              {(["active", "unsubscribed"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setEditStatus(s)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium border ${
                    editStatus === s
                      ? "bg-(--color-primary) text-white border-(--color-primary)"
                      : "border-(--border) text-(--text)"
                  }`}
                >
                  {s === "active"
                    ? t.newsletter.active
                    : t.newsletter.unsubscribed}
                </button>
              ))}
            </div>
          </div>
          <Textarea
            label={t.newsletter.notes}
            value={editNotes}
            onChange={(e) => setEditNotes(e.target.value)}
            rows={3}
          />
        </div>
      </Modal>

      {/* ── Import ───────────────────────────────────────── */}
      <Modal
        open={showImport}
        onClose={() => setShowImport(false)}
        title={t.newsletter.import}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowImport(false)}>
              {t.common.cancel}
            </Button>
            <Button onClick={importSubs}>{t.newsletter.import}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-xs text-(--text-muted)">
            {t.newsletter.importHint}
          </p>
          <Textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            rows={8}
            placeholder="a@example.com&#10;b@example.com"
          />
          <select
            value={importListId}
            onChange={(e) => setImportListId(e.target.value)}
            className="w-full px-3 py-2 rounded-md border border-(--border) bg-(--surface) text-(--text)"
          >
            <option value="">— {t.newsletter.selectLists} —</option>
            {lists.map((l) => (
              <option key={l._id} value={l._id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>
      </Modal>

      {/* ── Campaign Preview ─────────────────────────────── */}
      <Modal
        open={!!previewCampaign}
        onClose={() => setPreviewCampaign(null)}
        title={previewCampaign?.subject || ""}
        footer={
          <Button variant="secondary" onClick={() => setPreviewCampaign(null)}>
            {t.common.close}
          </Button>
        }
      >
        {previewCampaign && (
          <div className="space-y-3">
            <div className="text-xs text-(--text-muted)">
              {formatDate(
                previewCampaign.createdAt,
                lang === "ar" ? "ar-EG" : "en-US",
              )}{" "}
              · {previewCampaign.recipientsCount} {t.newsletter.recipients}
            </div>
            <div className="border border-(--border) rounded-md p-3 bg-(--surface-2)">
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: previewCampaign.html }}
              />
            </div>
            {previewCampaign.attachments?.length > 0 && (
              <div>
                <div className="text-sm font-medium text-(--text) mb-2">
                  {t.newsletter.attachments}
                </div>
                <ul className="space-y-1">
                  {previewCampaign.attachments.map((a, i) => (
                    <li key={i} className="text-xs">
                      <a
                        href={a.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-(--color-primary) hover:underline"
                      >
                        {a.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

// ── Empty state helper ─────────────────────────────────────
function EmptyState({
  Icon,
  label,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 mx-auto rounded-full bg-(--color-primary-tint) flex items-center justify-center mb-3">
        <Icon className="w-8 h-8 text-(--color-primary)" />
      </div>
      <p className="text-(--text-muted)">{label}</p>
    </div>
  );
}
