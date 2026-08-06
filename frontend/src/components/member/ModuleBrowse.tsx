"use client";

import { useEffect, useMemo, useState } from "react";
import { Bookmark, Play } from "lucide-react";
import {
  addBookmark,
  listCategories,
  listContents,
  removeBookmark,
  type Category,
  type ContentItem,
  type ContentModule,
} from "@/services/content";
import { useAuthStore } from "@/store/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { ROUTES } from "@/constants";
import { mediaCoverStyle } from "@/lib/media-cover";
import { membershipCta } from "@/lib/membership";
import Link from "next/link";

const titles: Record<ContentModule, string> = {
  academy: "Academy",
  psychology: "Psychology",
  daily_analysis: "Daily Analysis",
  landing: "Education",
};

export function ModuleBrowse({ module, hrefBase }: { module: ContentModule; hrefBase: string }) {
  const user = useAuthStore((s) => s.user);
  const verified = user?.status === "verified" || user?.role === "admin" || user?.role === "super_admin";
  const cta = membershipCta(user?.status);
  const [items, setItems] = useState<ContentItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [q, setQ] = useState("");
  const [type, setType] = useState<"" | "video" | "article">("");
  const [categoryId, setCategoryId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    void (async () => {
      setLoading(true);
      try {
        const [cRes, tRes] = await Promise.all([
          listCategories(module),
          listContents({
            module,
            q: q || undefined,
            type: type || undefined,
            category_id: categoryId || undefined,
          }),
        ]);
        if (!alive) return;
        if (cRes.success && cRes.data) setCategories(cRes.data);
        if (tRes.success && tRes.data) setItems(tRes.data);
        else setError(tRes.message);
      } catch {
        if (alive) setError("Failed to load content");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [module, q, type, categoryId]);

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const c of categories) map[c.id] = 0;
    for (const item of items) {
      if (item.category_id) map[item.category_id] = (map[item.category_id] || 0) + 1;
    }
    return map;
  }, [categories, items]);

  return (
    <div className="space-y-6">
      <PageHeader
        kicker={verified ? "Unlocked" : "Preview"}
        title={titles[module]}
        description={
          verified
            ? "Browse lessons and articles from the desk."
            : "Premium items stay locked until you become a verified member."
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          className="field-input max-w-md"
          placeholder="Search…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="flex gap-2">
          {(
            [
              ["", "All"],
              ["video", "Video"],
              ["article", "Article"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={label}
              type="button"
              onClick={() => setType(value)}
              className={`rounded-full px-3 py-1.5 text-sm ${
                type === value ? "nav-pill-active" : "border border-[var(--border)] text-muted"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <aside className="surface-panel h-fit p-3">
          <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">Categories</p>
          <button
            type="button"
            onClick={() => setCategoryId("")}
            className={`mb-1 flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${
              !categoryId ? "bg-accent-soft text-accent" : "text-muted hover:bg-accent-soft"
            }`}
          >
            <span>All</span>
            <span className="text-xs">{items.length}</span>
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategoryId(c.id)}
              className={`mb-1 flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${
                categoryId === c.id ? "bg-accent-soft text-accent" : "text-muted hover:bg-accent-soft"
              }`}
            >
              <span>{c.name}</span>
              <span className="text-xs">{counts[c.id] ?? 0}</span>
            </button>
          ))}
        </aside>

        <div className="space-y-3">
          {loading ? (
            <>
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
            </>
          ) : null}
          {!loading && items.length === 0 ? (
            <EmptyState
              title="No content yet"
              description="This library is empty for the selected filters."
              actionLabel={verified ? undefined : cta.label}
              actionHref={verified ? undefined : cta.href}
            />
          ) : null}
          {items.map((item) => (
            <article key={item.id} className="surface-panel flex gap-4 p-3 sm:p-4">
              <Link
                href={`${hrefBase}/${item.slug}`}
                className="relative h-24 w-36 shrink-0 overflow-hidden rounded-xl sm:h-28 sm:w-44"
                style={mediaCoverStyle(item.slug, item.thumbnail_url)}
              >
                {item.type === "video" ? (
                  <span className="absolute inset-0 flex items-center justify-center text-white/90">
                    <Play className="h-6 w-6 fill-current" />
                  </span>
                ) : null}
                {item.duration_sec ? (
                  <span className="absolute bottom-2 right-2 rounded bg-black/50 px-1.5 py-0.5 text-[10px] text-white">
                    {Math.ceil(item.duration_sec / 60)}m
                  </span>
                ) : null}
              </Link>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-muted">
                      {item.category_name || item.type}
                      {item.locked ? " · Locked" : ""}
                    </p>
                    <Link href={`${hrefBase}/${item.slug}`} className="mt-1 block font-display text-lg font-semibold hover:text-accent">
                      {item.title}
                    </Link>
                  </div>
                  <button
                    type="button"
                    className="rounded-lg p-2 text-muted hover:bg-accent-soft hover:text-accent"
                    aria-label="Bookmark"
                    onClick={() =>
                      void (async () => {
                        if (item.bookmarked) await removeBookmark(item.id);
                        else await addBookmark(item.id);
                        setItems((prev) =>
                          prev.map((x) => (x.id === item.id ? { ...x, bookmarked: !x.bookmarked } : x)),
                        );
                      })()
                    }
                  >
                    <Bookmark className={`h-4 w-4 ${item.bookmarked ? "fill-accent text-accent" : ""}`} />
                  </button>
                </div>
                {item.excerpt ? <p className="mt-2 line-clamp-2 text-sm text-muted">{item.excerpt}</p> : null}
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
