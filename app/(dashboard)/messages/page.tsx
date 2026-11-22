"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Mail,
  Clock,
  Search,
  RefreshCw,
  CheckCheck,
  Archive,
  MessageSquareReply,
  Inbox,
  AlertCircle,
} from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { useI18n } from "@/components/providers/I18nProvider";
import {
  fetchContactMessages,
  updateContactStatus,
  type ContactMessage,
  type ContactStatus,
} from "@/lib/api";

// ─────────────────────────────────────────────────────────────
// Status → translation key + color mapping
// ─────────────────────────────────────────────────────────────
const STATUS_TABS: Array<{ key: ContactStatus | "all"; labelKey: string }> = [
  { key: "all", labelKey: "common.all" },
  { key: "new", labelKey: "messages.status.new" },
  { key: "read", labelKey: "messages.status.read" },
  { key: "replied", labelKey: "messages.status.replied" },
  { key: "archived", labelKey: "messages.status.archived" },
];

const statusStyle: Record<ContactStatus, string> = {
  new: "bg-(--color-primary-tint) text-(--color-primary)",
  read: "bg-(--surface-2) text-(--text-muted)",
  replied: "bg-green-100 text-green-700",
  archived: "bg-gray-100 text-gray-500",
};

const formatDateTime = (iso: string) => {
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
};

export default function MessagesPage() {
  const { t } = useI18n();

  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<ContactStatus | "all">("all");
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  // ── Load messages from backend ─────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetchContactMessages({
        status: activeTab,
        limit: 50,
      });
      setMessages(res.data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.common.error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, t.common.error]);

  useEffect(() => {
    load();
  }, [load]);

  // ── Change message status ──────────────────────────────────
  const changeStatus = async (id: string, status: ContactStatus) => {
    setBusyId(id);
    try {
      const res = await updateContactStatus(id, status);
      setMessages((prev) => prev.map((m) => (m._id === id ? res.data : m)));
    } catch (e) {
      alert(e instanceof Error ? e.message : t.common.error);
    } finally {
      setBusyId(null);
    }
  };

  // ── Filter by search query (name / email / message) ────────
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return messages;
    return messages.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.message.toLowerCase().includes(q),
    );
  }, [messages, query]);

  // ── Counts per tab (from current page data) ────────────────
  const counts = useMemo(() => {
    const base: Record<string, number> = { all: messages.length };
    for (const m of messages) {
      base[m.status] = (base[m.status] || 0) + 1;
    }
    return base;
  }, [messages]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-(--text) flex items-center gap-2">
            <Mail className="w-6 h-6 text-(--color-primary)" />
            {t.nav.messages}
          </h1>
          <p className="text-sm text-(--text-muted) mt-1">
            {t.messages?.subtitle || ""}
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-(--border) px-3 py-2 text-sm hover:bg-(--color-primary-tint) disabled:opacity-60"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          {t.messages?.refresh || t.common.search}
        </button>
      </div>

      {/* Tabs + search */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1 rounded-lg border border-(--border) bg-(--surface) p-1">
          {STATUS_TABS.map((tab) => {
            const active = activeTab === tab.key;
            const count = counts[tab.key] ?? 0;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  active
                    ? "bg-(--color-primary) text-white"
                    : "text-(--text) hover:bg-(--color-primary-tint)"
                }`}
              >
                {t.messages?.status?.[tab.key] || tab.labelKey}
                <span
                  className={`ms-1.5 text-xs ${
                    active ? "text-white/80" : "text-(--text-muted)"
                  }`}
                >
                  ({count})
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-(--border) bg-(--surface) px-3 py-2 flex-1 min-w-55">
          <Search className="w-4 h-4 text-(--text-muted) shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.messages?.searchPlaceholder || t.common.search}
            className="bg-transparent text-sm outline-none w-full"
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <Spinner />
      ) : error ? (
        <Card>
          <CardBody>
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <AlertCircle className="w-8 h-8 text-red-500" />
              <p className="text-sm text-red-500">{error}</p>
              <button
                onClick={load}
                className="text-xs text-(--color-primary) hover:underline"
              >
                {t.messages?.retry || "Retry"}
              </button>
            </div>
          </CardBody>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardBody>
            <div className="flex flex-col items-center gap-3 py-14 text-center">
              <Inbox className="w-10 h-10 text-(--text-muted)" />
              <p className="text-sm text-(--text-muted)">
                {t.messages?.empty || t.common.noData}
              </p>
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((m) => (
            <Card key={m._id}>
              <CardBody>
                {/* Top row: sender + status */}
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <p className="font-medium text-(--text)">{m.name}</p>
                    <a
                      href={`mailto:${m.email}`}
                      className="text-xs text-(--color-primary) hover:underline break-all"
                    >
                      {m.email}
                    </a>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full shrink-0 ${statusStyle[m.status]}`}
                  >
                    {t.messages?.status?.[m.status] || m.status}
                  </span>
                </div>

                {/* Message body */}
                <p className="mt-3 text-sm text-(--text) whitespace-pre-wrap leading-relaxed">
                  {m.message}
                </p>

                {/* Footer: date + actions */}
                <div className="mt-4 flex items-center justify-between gap-3 flex-wrap border-t border-(--border) pt-3">
                  <p className="text-xs text-(--text-muted) inline-flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {formatDateTime(m.createdAt)}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {m.status !== "read" && (
                      <button
                        disabled={busyId === m._id}
                        onClick={() => changeStatus(m._id, "read")}
                        className="inline-flex items-center gap-1 rounded-md border border-(--border) px-2 py-1 text-xs hover:bg-(--surface-2) disabled:opacity-50"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        {t.messages?.markRead || "Read"}
                      </button>
                    )}

                    {m.status !== "replied" && (
                      <a
                        href={`mailto:${m.email}?subject=Re: ${encodeURIComponent(
                          m.name,
                        )}`}
                        onClick={() => changeStatus(m._id, "replied")}
                        className="inline-flex items-center gap-1 rounded-md border border-(--border) px-2 py-1 text-xs hover:bg-green-50 disabled:opacity-50"
                      >
                        <MessageSquareReply className="w-3.5 h-3.5 text-green-600" />
                        {t.messages?.reply || "Reply"}
                      </a>
                    )}

                    {m.status !== "archived" && (
                      <button
                        disabled={busyId === m._id}
                        onClick={() => changeStatus(m._id, "archived")}
                        className="inline-flex items-center gap-1 rounded-md border border-(--border) px-2 py-1 text-xs hover:bg-gray-50 disabled:opacity-50"
                      >
                        <Archive className="w-3.5 h-3.5" />
                        {t.messages?.archive || "Archive"}
                      </button>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
