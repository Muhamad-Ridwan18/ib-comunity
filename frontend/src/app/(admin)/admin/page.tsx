"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge, statusTone } from "@/components/ui/StatusBadge";
import { listAdminVerifications, type VerificationRequest } from "@/services/onboarding";
import { adminListTickets, type Ticket } from "@/services/tickets";

export default function AdminDashboardPage() {
  const [verifs, setVerifs] = useState<VerificationRequest[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [openTickets, setOpenTickets] = useState(0);

  useEffect(() => {
    void (async () => {
      try {
        const [v, t, open] = await Promise.all([
          listAdminVerifications({ status: "pending", page: 1 }),
          adminListTickets({ page: 1 }),
          adminListTickets({ status: "open", page: 1 }),
        ]);
        if (v.success && v.data) {
          setVerifs(v.data.slice(0, 5));
          setPendingCount(v.meta?.total ?? v.data.length);
        }
        if (t.success && t.data) setTickets(t.data.slice(0, 5));
        if (open.success) setOpenTickets(open.meta?.total ?? open.data?.length ?? 0);
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const kpis = [
    { label: "Pending Verifications", value: pendingCount, href: "/admin/verifications" },
    { label: "Open Tickets", value: openTickets, href: "/admin/tickets" },
    { label: "Recent Queue", value: verifs.length, href: "/admin/verifications" },
    { label: "Support Inbox", value: tickets.length, href: "/admin/tickets" },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        kicker="Admin"
        title="Dashboard"
        description="Linear-style ops overview for verification and support."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <Link key={k.label} href={k.href} className="surface-panel p-5 transition hover:border-accent/30">
            <p className="text-xs uppercase tracking-wide text-muted">{k.label}</p>
            <p className="mt-3 font-display text-3xl font-semibold">{k.value}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <section className="surface-panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
            <h2 className="font-display text-base font-semibold">Recent Verifications</h2>
            <Link href="/admin/verifications" className="text-xs text-accent">
              View all
            </Link>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="text-muted">
              <tr>
                <th className="px-5 py-3 font-medium">MT5</th>
                <th className="px-5 py-3 font-medium">Server</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {verifs.map((v) => (
                <tr key={v.id} className="border-t border-[var(--border)]">
                  <td className="px-5 py-3">{v.mt5_account}</td>
                  <td className="px-5 py-3">{v.broker_server}</td>
                  <td className="px-5 py-3">
                    <StatusBadge label={v.status} tone={statusTone(v.status)} />
                  </td>
                </tr>
              ))}
              {verifs.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-5 py-8 text-muted">
                    No pending verifications
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </section>

        <div className="space-y-4">
          <section className="surface-panel overflow-hidden">
            <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
              <h2 className="font-display text-base font-semibold">Recent Tickets</h2>
              <Link href="/admin/tickets" className="text-xs text-accent">
                View all
              </Link>
            </div>
            <ul className="divide-y divide-[var(--border)]">
              {tickets.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                  <div>
                    <p className="font-medium">{t.topic}</p>
                    <p className="text-xs text-muted">{t.name}</p>
                  </div>
                  <StatusBadge label={t.status} tone={statusTone(t.status)} />
                </li>
              ))}
              {tickets.length === 0 ? <li className="px-5 py-8 text-sm text-muted">No tickets</li> : null}
            </ul>
          </section>

          <section className="surface-panel p-5">
            <h2 className="font-display text-base font-semibold">AI Activity</h2>
            <p className="mt-2 text-sm text-muted">
              Conversations are stored for review. Escalate from the assistant when fail threshold is hit.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-[var(--surface-2)] p-3">
                <p className="text-xs text-muted">Fail threshold</p>
                <p className="mt-1 font-semibold">3</p>
              </div>
              <div className="rounded-xl bg-[var(--surface-2)] p-3">
                <p className="text-xs text-muted">Escalation</p>
                <p className="mt-1 font-semibold">Support ticket</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
