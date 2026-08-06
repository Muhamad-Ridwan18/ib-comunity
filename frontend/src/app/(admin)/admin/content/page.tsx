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
import { PageHeader } from "@/components/ui/PageHeader";

export default function AdminContentPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [module, setModule] = useState("academy");
  const [error, setError] = useState<string | null>(null);
  const [catName, setCatName] = useState("");
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"article" | "video">("article");
  const [body, setBody] = useState("");
  const [premium, setPremium] = useState(true);
  const [categoryId, setCategoryId] = useState("");

  const load = async () => {
    setError(null);
    try {
      const [cRes, tRes] = await Promise.all([
        adminListCategories(module),
        adminListContents({ module }),
      ]);
      if (cRes.success && cRes.data) setCategories(cRes.data);
      if (tRes.success && tRes.data) setContents(tRes.data);
    } catch {
      setError("Failed to load admin content");
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [module]);

  return (
    <div className="space-y-6">
      <PageHeader kicker="Admin" title="Content" description="Categories and publish workflow for modules." />

      <div className="flex flex-wrap gap-2">
        {["academy", "psychology", "daily_analysis", "landing"].map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setModule(m)}
            className={`rounded-lg border px-3 py-1.5 text-sm ${
              module === m ? "border-accent bg-accent-soft text-accent" : "border-[var(--border)] text-muted"
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="surface-panel p-5">
          <h2 className="font-display text-lg font-semibold">Categories</h2>
          <div className="mt-4 flex gap-2">
            <input className="field-input" placeholder="New category name" value={catName} onChange={(e) => setCatName(e.target.value)} />
            <button
              type="button"
              className="btn-primary shrink-0"
              onClick={() =>
                void (async () => {
                  await adminCreateCategory({ module, name: catName });
                  setCatName("");
                  await load();
                })()
              }
            >
              Add
            </button>
          </div>
          <ul className="mt-4 space-y-2 text-sm">
            {categories.map((c) => (
              <li key={c.id} className="flex items-center justify-between rounded-xl border border-[var(--border)] px-3 py-2">
                <span>{c.name}</span>
                <button
                  type="button"
                  className="text-[var(--danger)]"
                  onClick={() =>
                    void (async () => {
                      await adminDeleteCategory(c.id);
                      await load();
                    })()
                  }
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="surface-panel p-5">
          <h2 className="font-display text-lg font-semibold">Create content</h2>
          <div className="mt-4 space-y-3">
            <input className="field-input" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <select className="field-input" value={type} onChange={(e) => setType(e.target.value as "article" | "video")}>
              <option value="article">Article</option>
              <option value="video">Video</option>
            </select>
            <select className="field-input" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">No category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <textarea className="field-input min-h-[120px]" placeholder="Body" value={body} onChange={(e) => setBody(e.target.value)} />
            <label className="flex items-center gap-2 text-sm text-muted">
              <input type="checkbox" checked={premium} onChange={(e) => setPremium(e.target.checked)} />
              Premium
            </label>
            <button
              type="button"
              className="btn-primary"
              onClick={() =>
                void (async () => {
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
                })()
              }
            >
              Save draft
            </button>
          </div>
        </section>
      </div>

      <section className="overflow-hidden rounded-[1.25rem] border border-[var(--border)]">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[var(--border)] text-muted">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {contents.map((item) => (
              <tr key={item.id} className="border-b border-[var(--border)]">
                <td className="px-4 py-3">{item.title}</td>
                <td className="px-4 py-3">{item.type}</td>
                <td className="px-4 py-3">{item.status}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {item.status !== "published" ? (
                      <button
                        type="button"
                        className="text-accent"
                        onClick={() =>
                          void (async () => {
                            await adminPublishContent(item.id);
                            await load();
                          })()
                        }
                      >
                        Publish
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="text-[var(--danger)]"
                      onClick={() =>
                        void (async () => {
                          await adminDeleteContent(item.id);
                          await load();
                        })()
                      }
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
