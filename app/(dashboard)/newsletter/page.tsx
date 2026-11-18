"use client";

import { useEffect, useState } from "react";
import {
  Mail,
  Send,
  Users,
  UserX,
  Trash2,
  MailCheck,
  CalendarDays,
  Inbox,
} from "lucide-react";
import { api } from "@/lib/api";
import { useI18n } from "@/components/providers/I18nProvider";
import { useToast } from "@/components/ui/Toast";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input, Textarea } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { formatDate } from "@/lib/utils";
import type { Subscriber, Campaign } from "@/types";

export default function NewsletterPage() {
  const { t, lang } = useI18n();
  const { showToast } = useToast();
  const [tab, setTab] = useState<"subs" | "camps">("subs");
  const [subs, setSubs] = useState<Subscriber[]>([]);
  const [camps, setCamps] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSend, setShowSend] = useState(false);
  const [showDelete, setShowDelete] = useState<Subscriber | null>(null);
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    try {
      const [s, c] = await Promise.all([
        api.get<{ data: Subscriber[] }>("/newsletter/subscribers"),
        api.get<{ data: Campaign[] }>("/newsletter/campaigns"),
      ]);
      setSubs(s.data || []);
      setCamps(c.data || []);
    } catch (err) {
      showToast(err instanceof Error ? err.message : t.common.error, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const send = async () => {
    if (!subject.trim() || !content.trim())
      return showToast(t.common.error, "error");
    setBusy(true);
    try {
      await api.post("/newsletter/send", { subject, html: content });
      showToast(t.newsletter.sendSuccess);
      setShowSend(false);
      setSubject("");
      setContent("");
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : t.common.error, "error");
    } finally {
      setBusy(false);
    }
  };

  const removeSub = async () => {
    if (!showDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/newsletter/subscribers/${showDelete._id}`);
      showToast(t.newsletter.deleteSuccess);
      setShowDelete(null);
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : t.common.error, "error");
    } finally {
      setDeleting(false);
    }
  };

  const activeCount = subs.filter((s) => s.status === "active").length;

  const stats = [
    {
      label: t.newsletter.total,
      value: subs.length,
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

  return (
    <div className="space-y-6">
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
        <Button onClick={() => setShowSend(true)} disabled={activeCount === 0}>
          <Send className="w-4 h-4" />
          {t.newsletter.sendNew}
        </Button>
      </div>

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

      <div className="flex gap-2 border-b border-(--border)">
        <button
          onClick={() => setTab("subs")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition inline-flex items-center gap-2 ${
            tab === "subs"
              ? "border-(--color-primary) text-(--color-primary)"
              : "border-transparent text-(--text-muted) hover:text-(--text)"
          }`}
        >
          <Users className="w-4 h-4" />
          {t.newsletter.subscribers}
        </button>
        <button
          onClick={() => setTab("camps")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition inline-flex items-center gap-2 ${
            tab === "camps"
              ? "border-(--color-primary) text-(--color-primary)"
              : "border-transparent text-(--text-muted) hover:text-(--text)"
          }`}
        >
          <Inbox className="w-4 h-4" />
          {t.newsletter.campaigns}
        </button>
      </div>

      <Card>
        <CardBody>
          {loading ? (
            <Spinner />
          ) : tab === "subs" ? (
            subs.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto rounded-full bg-(--color-primary-tint) flex items-center justify-center mb-3">
                  <Users className="w-8 h-8 text-(--color-primary)" />
                </div>
                <p className="text-(--text-muted)">
                  {t.newsletter.noSubscribers}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-start text-(--text-muted) border-b border-(--border)">
                      <th className="text-start p-3">
                        <Mail className="w-4 h-4 inline" />
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
                        <td className="p-3 text-(--text)">{s.email}</td>
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
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => setShowDelete(s)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : camps.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto rounded-full bg-(--color-primary-tint) flex items-center justify-center mb-3">
                <Inbox className="w-8 h-8 text-(--color-primary)" />
              </div>
              <p className="text-(--text-muted)">{t.common.noData}</p>
            </div>
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
                    </div>
                    <div className="flex gap-2 text-xs">
                      <span className="px-2 py-1 rounded inline-flex items-center gap-1 bg-(--success-tint) text-(--success)">
                        <MailCheck className="w-3 h-3" />
                        {c.sent}
                      </span>
                      {c.failed > 0 && (
                        <span className="px-2 py-1 rounded inline-flex items-center gap-1 bg-(--danger-tint) text-(--danger)">
                          <UserX className="w-3 h-3" />
                          {c.failed}
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      {/* Send Modal */}
      <Modal
        open={showSend}
        onClose={() => setShowSend(false)}
        title={t.newsletter.sendNew}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowSend(false)}>
              {t.common.cancel}
            </Button>
            <Button onClick={send} loading={busy}>
              <Send className="w-4 h-4" />
              {t.newsletter.sendNew}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="text-sm text-(--text-muted) flex items-center gap-2">
            <Users className="w-4 h-4" />
            {t.newsletter.sendTo}{" "}
            <strong className="text-(--color-primary)">{activeCount}</strong>{" "}
            {t.newsletter.subscriber}
          </div>
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
            rows={8}
            placeholder="<h1>مرحبًا</h1><p>محتوى النشرة...</p>"
          />
        </div>
      </Modal>

      {/* Delete Subscriber */}
      <Modal
        open={!!showDelete}
        onClose={() => setShowDelete(null)}
        title={t.common.confirm}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowDelete(null)}>
              {t.common.cancel}
            </Button>
            <Button variant="danger" onClick={removeSub} loading={deleting}>
              <Trash2 className="w-4 h-4" />
              {t.common.delete}
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
    </div>
  );
}
