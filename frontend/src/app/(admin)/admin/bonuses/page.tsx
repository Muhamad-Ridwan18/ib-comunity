"use client";

import { useEffect, useState } from "react";
import {
  adminCreateBonus,
  adminDeleteBonus,
  adminListBonuses,
  adminUpdateBonus,
  type BonusItem,
} from "@/services/bonus";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";

export default function AdminBonusesPage() {
  const [items, setItems] = useState<BonusItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [externalUrl, setExternalUrl] = useState("");

  const load = async () => {
    setError(null);
    try {
      const res = await adminListBonuses();
      if (res.success && res.data) setItems(res.data);
      else setError(res.message || "Failed to load");
    } catch {
      setError("Failed to load bonuses");
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader kicker="Admin" title="Bonuses" description="Member resources and external links." />

      {error ? <p className="text-sm text-[var(--danger)]">{error}</p> : null}

      <section className="surface-panel p-5">
        <h2 className="font-display text-lg font-semibold">Add bonus</h2>
        <div className="mt-4 space-y-3">
          <input className="field-input" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <textarea
            className="field-input min-h-[88px]"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <input
            className="field-input"
            placeholder="External URL"
            value={externalUrl}
            onChange={(e) => setExternalUrl(e.target.value)}
          />
          <button
            type="button"
            className="btn-primary"
            onClick={() =>
              void (async () => {
                if (!title.trim()) {
                  setError("Title required");
                  return;
                }
                await adminCreateBonus({
                  title,
                  description: description || null,
                  external_url: externalUrl || null,
                  is_active: true,
                  sort_order: items.length,
                });
                setTitle("");
                setDescription("");
                setExternalUrl("");
                await load();
              })()
            }
          >
            Create
          </button>
        </div>
      </section>

      <section className="space-y-3">
        {items.map((b) => (
          <article key={b.id} className="surface-panel flex flex-wrap items-start justify-between gap-3 p-5">
            <div>
              <p className="font-display text-lg font-semibold">{b.title}</p>
              {b.description ? <p className="mt-1 text-sm text-muted">{b.description}</p> : null}
              <div className="mt-2">
                <StatusBadge label={b.is_active ? "active" : "inactive"} tone={b.is_active ? "accent" : "muted"} />
              </div>
            </div>
            <div className="flex gap-3 text-sm">
              <button
                type="button"
                className="text-accent"
                onClick={() =>
                  void (async () => {
                    await adminUpdateBonus(b.id, {
                      title: b.title,
                      description: b.description,
                      external_url: b.external_url,
                      is_active: !b.is_active,
                      sort_order: b.sort_order,
                    });
                    await load();
                  })()
                }
              >
                {b.is_active ? "Deactivate" : "Activate"}
              </button>
              <button
                type="button"
                className="text-[var(--danger)]"
                onClick={() =>
                  void (async () => {
                    await adminDeleteBonus(b.id);
                    await load();
                  })()
                }
              >
                Delete
              </button>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
