"use client";

import { useEffect, useState } from "react";
import {
  adminCreateCategory,
  adminCreateContent,
  adminDeleteCategory,
  adminDeleteContent,
  adminListCategories,
  adminListContents,
  adminPublishContent,
  adminUploadContentVideo,
  type Category,
  type ContentItem,
  type ContentModule,
  type ContentType,
} from "@/services/content";
import { StatusBadge, statusTone } from "@/components/ui/StatusBadge";
import {
  AdminEmpty,
  AdminFilterSeg,
  AdminPageHeader,
} from "@/components/admin/AdminChrome";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n/useT";

export default function AdminContentPage() {
  const { t, tr } = useT();
  const MODULES = [
    { value: "psychology", label: t("member.psychology") },
    { value: "daily_analysis", label: t("member.technical") },
    { value: "academy", label: t("nav.academy") },
    { value: "landing", label: t("admin.moduleLanding") },
  ];
  const moduleLabel = (value: string) => MODULES.find((m) => m.value === value)?.label || value;
  const [categories, setCategories] = useState<Category[]>([]);
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [module, setModule] = useState<ContentModule>("psychology");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [catName, setCatName] = useState("");
  const [title, setTitle] = useState("");
  const [type, setType] = useState<ContentType>("article");
  const [body, setBody] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoKey, setVideoKey] = useState<string | null>(null);
  const [premium, setPremium] = useState(true);
  const [categoryId, setCategoryId] = useState("");

  const load = async () => {
    setError(null);
    setLoading(true);
    try {
      const [cRes, tRes] = await Promise.all([
        adminListCategories(module),
        adminListContents({ module }),
      ]);
      if (cRes.success && cRes.data) setCategories(cRes.data);
      if (tRes.success && tRes.data) setContents(tRes.data);
    } catch {
      setError(t("admin.loadFailed"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCategoryId("");
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [module]);

  const resetForm = () => {
    setTitle("");
    setBody("");
    setVideoUrl("");
    setVideoKey(null);
    setType("article");
    setPremium(true);
    setCategoryId("");
  };

  const canSave =
    Boolean(title.trim()) &&
    (type === "article" ? Boolean(body.trim()) : Boolean(videoUrl.trim() || videoKey));

  return (
    <div>
      <AdminPageHeader
        title={t("admin.contentTitle")}
        description={
          loading
            ? t("common.loading")
            : t("admin.contentDesc")
        }
        actions={<AdminFilterSeg value={module} options={MODULES} onChange={(v) => setModule(v as ContentModule)} />}
      />

      {error ? (
        <p className="border-b border-[var(--danger)]/20 bg-[var(--danger)]/5 px-4 py-2 text-sm text-[var(--danger)] md:px-6 lg:px-8">
          {error}
        </p>
      ) : null}

      <div className="grid lg:grid-cols-[minmax(18rem,22rem)_minmax(0,1fr)]">
        <aside className="border-b border-[var(--border)] bg-[var(--card)] lg:border-b-0 lg:border-r">
          <div className="border-b border-[var(--border)] px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">{t("admin.categories")}</p>
            <p className="mt-1 text-xs text-muted">{t("admin.contentModuleHint", { module: moduleLabel(module) })}</p>
            <div className="mt-2 flex gap-2">
              <input
                className="field-input py-2 text-sm"
                placeholder={t("admin.newCategoryPlaceholder")}
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
              />
              <button
                type="button"
                className="btn-primary shrink-0 px-3 py-2 text-sm"
                disabled={busy || !catName.trim()}
                onClick={() =>
                  void (async () => {
                    setBusy(true);
                    setError(null);
                    try {
                      await adminCreateCategory({ module, name: catName.trim() });
                      setCatName("");
                      await load();
                    } catch {
                      setError(t("admin.createFailed"));
                    } finally {
                      setBusy(false);
                    }
                  })()
                }
              >
                {t("admin.add")}
              </button>
            </div>
            <ul className="mt-3 max-h-40 divide-y divide-[var(--border)] overflow-y-auto rounded-lg border border-[var(--border)]">
              {categories.length === 0 ? (
                <li className="px-3 py-2.5 text-xs text-muted">{t("admin.noCategories")}</li>
              ) : (
                categories.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                    <span className="truncate">{c.name}</span>
                    <button
                      type="button"
                      className="shrink-0 text-xs text-[var(--danger)] hover:underline"
                      disabled={busy}
                      onClick={() =>
                        void (async () => {
                          setBusy(true);
                          setError(null);
                          try {
                            await adminDeleteCategory(c.id);
                            await load();
                          } catch {
                            setError(t("admin.deleteFailed"));
                          } finally {
                            setBusy(false);
                          }
                        })()
                      }
                    >
                      {t("common.delete")}
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>

          <div className="px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">{t("admin.createDraft")}</p>
            <p className="mt-1 text-xs text-muted">{t("admin.contentTypeHint")}</p>
            <div className="mt-3 space-y-2.5">
              <input
                className="field-input py-2 text-sm"
                placeholder={t("admin.contentTitleField")}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <select
                className="field-input py-2 text-sm"
                value={type}
                onChange={(e) => setType(e.target.value as ContentType)}
              >
                <option value="article">{t("member.article")}</option>
                <option value="video">{t("member.video")}</option>
              </select>
              <select
                className="field-input py-2 text-sm"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">{t("admin.noCategoryOption")}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              {type === "article" ? (
                <textarea
                  className="field-input min-h-[120px] text-sm"
                  placeholder={t("admin.body")}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                />
              ) : (
                <div className="space-y-2">
                  <input
                    className="field-input py-2 text-sm"
                    placeholder={t("admin.videoUrlPlaceholder")}
                    value={videoUrl}
                    onChange={(e) => {
                      setVideoUrl(e.target.value);
                      setVideoKey(null);
                    }}
                  />
                  <label className="block">
                    <span className="mb-1 block text-xs text-muted">{t("admin.videoUploadHint")}</span>
                    <input
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime"
                      className="block w-full text-xs text-muted file:mr-2 file:rounded-lg file:border-0 file:bg-accent-soft file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-accent"
                      disabled={busy}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        e.target.value = "";
                        if (!file) return;
                        void (async () => {
                          setBusy(true);
                          setError(null);
                          try {
                            const up = await adminUploadContentVideo(file);
                            if (!up.success || !up.data) {
                              setError(up.message || t("admin.saveFailed"));
                              return;
                            }
                            setVideoKey(up.data.key);
                            setVideoUrl(up.data.url);
                          } catch {
                            setError(t("admin.saveFailed"));
                          } finally {
                            setBusy(false);
                          }
                        })();
                      }}
                    />
                  </label>
                  <textarea
                    className="field-input min-h-[72px] text-sm"
                    placeholder={t("admin.videoCaptionOptional")}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                  />
                </div>
              )}

              <label className="flex items-center gap-2 text-sm text-muted">
                <input type="checkbox" checked={premium} onChange={(e) => setPremium(e.target.checked)} />
                {t("status.premium")}
              </label>
              <button
                type="button"
                className="btn-primary w-full py-2.5 text-sm"
                disabled={busy || !canSave}
                onClick={() =>
                  void (async () => {
                    setBusy(true);
                    setError(null);
                    try {
                      await adminCreateContent({
                        module,
                        type,
                        title: title.trim(),
                        body: body.trim() || null,
                        is_premium: premium,
                        status: "draft",
                        category_id: categoryId || null,
                        excerpt: (body || title).slice(0, 120),
                        ...(type === "video"
                          ? videoKey
                            ? { video_key: videoKey, video_url: videoUrl || null }
                            : { video_url: videoUrl.trim() }
                          : { video_url: null }),
                      });
                      resetForm();
                      await load();
                    } catch {
                      setError(t("admin.saveFailed"));
                    } finally {
                      setBusy(false);
                    }
                  })()
                }
              >
                {t("admin.saveDraft")}
              </button>
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-2.5 md:px-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
              {moduleLabel(module)} · {contents.length} {t("admin.items")}
            </p>
          </div>
          <div className="hidden grid-cols-[1.6fr_0.6fr_0.7fr_0.7fr_auto] gap-3 border-b border-[var(--border)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted md:grid md:px-6">
            <span>{t("admin.contentTitleField")}</span>
            <span>{t("admin.type")}</span>
            <span>{t("admin.access")}</span>
            <span>{t("common.status")}</span>
            <span className="text-right">{t("common.actions")}</span>
          </div>

          {loading ? (
            <div className="space-y-2 p-4 md:p-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded-lg bg-[var(--surface-2)]" />
              ))}
            </div>
          ) : contents.length === 0 ? (
            <AdminEmpty
              title={t("admin.noContentTitle")}
              description={t("admin.nothingInModule", { module: moduleLabel(module) })}
            />
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {contents.map((item) => (
                <li
                  key={item.id}
                  className="grid gap-2 px-4 py-3 transition hover:bg-[var(--surface-2)] md:grid-cols-[1.6fr_0.6fr_0.7fr_0.7fr_auto] md:items-center md:gap-3 md:px-6"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{item.title}</p>
                    <p className="mt-0.5 truncate text-xs text-muted">
                      {item.category_name || t("admin.uncategorized")}
                      {item.published_at ? ` · ${tr(item.published_at)}` : ""}
                    </p>
                  </div>
                  <p className="text-sm capitalize text-muted">
                    {item.type === "video" ? t("member.video") : t("member.article")}
                  </p>
                  <div>
                    <StatusBadge
                      label={item.is_premium ? "premium" : "free"}
                      tone={item.is_premium ? "warn" : "muted"}
                    />
                  </div>
                  <div>
                    <StatusBadge label={item.status} tone={statusTone(item.status)} />
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm md:justify-end">
                    {item.status !== "published" ? (
                      <button
                        type="button"
                        className="font-medium text-accent hover:underline"
                        disabled={busy}
                        onClick={() =>
                          void (async () => {
                            setBusy(true);
                            setError(null);
                            try {
                              await adminPublishContent(item.id);
                              await load();
                            } catch {
                              setError(t("admin.publishFailed"));
                            } finally {
                              setBusy(false);
                            }
                          })()
                        }
                      >
                        {t("admin.publish")}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className={cn("font-medium text-[var(--danger)] hover:underline")}
                      disabled={busy}
                      onClick={() =>
                        void (async () => {
                          setBusy(true);
                          setError(null);
                          try {
                            await adminDeleteContent(item.id);
                            await load();
                          } catch {
                            setError(t("admin.deleteFailed"));
                          } finally {
                            setBusy(false);
                          }
                        })()
                      }
                    >
                      {t("common.delete")}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
