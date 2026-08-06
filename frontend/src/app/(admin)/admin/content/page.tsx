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
  type Category,
  type ContentItem,
} from "@/services/content";
import { StatusBadge, statusTone } from "@/components/ui/StatusBadge";
import {
  AdminEmpty,
  AdminFilterSeg,
  AdminPageHeader,
  formatRelativeTime,
} from "@/components/admin/AdminChrome";
import { cn } from "@/lib/utils";

const MODULES = [
  { value: "academy", label: "Academy" },
  { value: "psychology", label: "Psychology" },
  { value: "daily_analysis", label: "Daily analysis" },
  { value: "landing", label: "Landing" },
];

export default function AdminContentPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [module, setModule] = useState("academy");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [catName, setCatName] = useState("");
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"article" | "video">("article");
  const [body, setBody] = useState("");
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
      setError("Failed to load admin content");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCategoryId("");
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [module]);

  return (
    <div>
      <AdminPageHeader
        title="Content"
        description={loading ? "Loading…" : `${contents.length} items · ${categories.length} categories`}
        actions={<AdminFilterSeg value={module} options={MODULES} onChange={setModule} />}
      />

      {error ? (
        <p className="border-b border-[var(--danger)]/20 bg-[var(--danger)]/5 px-4 py-2 text-sm text-[var(--danger)] md:px-6 lg:px-8">
          {error}
        </p>
      ) : null}

      <div className="grid lg:grid-cols-[minmax(16rem,19rem)_minmax(0,1fr)]">
        <aside className="border-b border-[var(--border)] bg-[var(--card)] lg:border-b-0 lg:border-r">
          <div className="border-b border-[var(--border)] px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Categories</p>
            <div className="mt-2 flex gap-2">
              <input
                className="field-input py-2 text-sm"
                placeholder="New category"
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
                      setError("Failed to create category");
                    } finally {
                      setBusy(false);
                    }
                  })()
                }
              >
                Add
              </button>
            </div>
            <ul className="mt-3 max-h-40 divide-y divide-[var(--border)] overflow-y-auto rounded-lg border border-[var(--border)]">
              {categories.length === 0 ? (
                <li className="px-3 py-2.5 text-xs text-muted">No categories</li>
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
                            setError("Failed to delete category");
                          } finally {
                            setBusy(false);
                          }
                        })()
                      }
                    >
                      Delete
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>

          <div className="px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Create draft</p>
            <div className="mt-3 space-y-2.5">
              <input
                className="field-input py-2 text-sm"
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <select
                className="field-input py-2 text-sm"
                value={type}
                onChange={(e) => setType(e.target.value as "article" | "video")}
              >
                <option value="article">Article</option>
                <option value="video">Video</option>
              </select>
              <select
                className="field-input py-2 text-sm"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">No category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <textarea
                className="field-input min-h-[100px] text-sm"
                placeholder="Body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
              <label className="flex items-center gap-2 text-sm text-muted">
                <input type="checkbox" checked={premium} onChange={(e) => setPremium(e.target.checked)} />
                Premium
              </label>
              <button
                type="button"
                className="btn-primary w-full py-2.5 text-sm"
                disabled={busy || !title.trim()}
                onClick={() =>
                  void (async () => {
                    setBusy(true);
                    setError(null);
                    try {
                      await adminCreateContent({
                        module,
                        type,
                        title,
                        body,
                        is_premium: premium,
                        status: "draft",
                        category_id: categoryId || null,
                        excerpt: body.slice(0, 120),
                      });
                      setTitle("");
                      setBody("");
                      await load();
                    } catch {
                      setError("Failed to save draft");
                    } finally {
                      setBusy(false);
                    }
                  })()
                }
              >
                Save draft
              </button>
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <div className="hidden grid-cols-[1.6fr_0.6fr_0.7fr_0.7fr_auto] gap-3 border-b border-[var(--border)] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted md:grid md:px-6">
            <span>Title</span>
            <span>Type</span>
            <span>Access</span>
            <span>Status</span>
            <span className="text-right">Actions</span>
          </div>

          {loading ? (
            <div className="space-y-2 p-4 md:p-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded-lg bg-[var(--surface-2)]" />
              ))}
            </div>
          ) : contents.length === 0 ? (
            <AdminEmpty title="No content" description={`Nothing in ${module.replaceAll("_", " ")} yet.`} />
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
                      {item.category_name || "Uncategorized"}
                      {item.published_at ? ` · ${formatRelativeTime(item.published_at)}` : ""}
                    </p>
                  </div>
                  <p className="text-sm capitalize text-muted">{item.type}</p>
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
                              setError("Publish failed");
                            } finally {
                              setBusy(false);
                            }
                          })()
                        }
                      >
                        Publish
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
                            setError("Delete failed");
                          } finally {
                            setBusy(false);
                          }
                        })()
                      }
                    >
                      Delete
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
