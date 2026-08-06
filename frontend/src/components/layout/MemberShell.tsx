"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Bell, Lock, LogOut, Menu } from "lucide-react";
import { ROUTES } from "@/constants";
import { useAuthStore } from "@/store/auth";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { AppLogo } from "@/components/layout/AppLogo";
import { Sheet } from "@/components/ui/Sheet";
import { listNotifications, type NotificationItem } from "@/services/notifications";
import { cn } from "@/lib/utils";

const nav = [
  { href: ROUTES.member, label: "Home", exact: true },
  { href: ROUTES.academy, label: "Academy", locked: true },
  { href: ROUTES.analysis, label: "Analysis", locked: true },
  { href: ROUTES.signals, label: "Signals", locked: true },
  { href: ROUTES.journal, label: "Journal", locked: true },
  { href: ROUTES.bonus, label: "Bonus", locked: true },
  { href: ROUTES.support, label: "Support" },
];

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MemberShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);
  const verified = user?.status === "verified" || user?.role === "admin" || user?.role === "super_admin";
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notes, setNotes] = useState<NotificationItem[]>([]);
  const [openNotes, setOpenNotes] = useState(false);

  useEffect(() => {
    document.body.classList.add("app-shell");
    return () => document.body.classList.remove("app-shell");
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setOpenNotes(false);
  }, [pathname]);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      try {
        const res = await listNotifications();
        if (res.success && res.data) setNotes(res.data);
      } catch {
        /* ignore */
      }
    })();
  }, [user, pathname]);

  const initials =
    user?.profile?.full_name
      ?.split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "IB";

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-white/85 backdrop-blur-xl dark:bg-[var(--header)]">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 md:px-6">
          <button
            type="button"
            className="rounded-lg p-2 text-muted hover:bg-accent-soft lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <AppLogo href={ROUTES.member} />

          <nav className="ml-2 hidden items-center gap-0.5 lg:flex">
            {nav.map((item) => {
              const active = isActive(pathname, item.href, item.exact);
              const locked = item.locked && !verified;
              return (
                <Link
                  key={item.href + item.label}
                  href={item.href}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition",
                    active
                      ? "bg-accent-soft font-medium text-accent"
                      : "text-muted hover:bg-[var(--surface-2)] hover:text-[var(--foreground)]",
                  )}
                >
                  {item.label}
                  {locked ? <Lock className="h-3 w-3 opacity-50" /> : null}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <div className="relative">
              <button
                type="button"
                className="relative rounded-xl p-2 text-muted transition hover:bg-accent-soft hover:text-accent"
                onClick={() => setOpenNotes((v) => !v)}
                aria-label="Notifications"
              >
                <Bell className="h-4 w-4" />
                {notes.length > 0 ? (
                  <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-accent" />
                ) : null}
              </button>
              {openNotes ? (
                <div className="absolute right-0 z-20 mt-2 w-72 rounded-2xl border border-[var(--border)] bg-[var(--card-solid)] p-2 shadow-[var(--shadow)]">
                  {notes.length === 0 ? (
                    <p className="px-3 py-4 text-xs text-muted">No notifications yet</p>
                  ) : (
                    notes.slice(0, 6).map((n) => (
                      <Link
                        key={n.id}
                        href={n.link || ROUTES.support}
                        className="block rounded-xl px-3 py-2.5 text-xs hover:bg-accent-soft"
                        onClick={() => setOpenNotes(false)}
                      >
                        <p className="font-medium">{n.title}</p>
                        <p className="mt-0.5 text-muted">{n.body}</p>
                      </Link>
                    ))
                  )}
                </div>
              ) : null}
            </div>
            <ThemeToggle />
            <Link
              href={ROUTES.profile}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-[11px] font-semibold text-white shadow-sm"
              title={user?.email}
            >
              {initials}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl animate-fade px-4 py-6 md:px-6 md:py-8">{children}</main>

      <Sheet
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        side="left"
        title="Menu"
        description={verified ? "Verified member" : "Modules locked"}
        widthClassName="w-[min(20rem,88vw)]"
      >
        <nav className="space-y-1 p-3">
          {nav.map((item) => {
            const active = isActive(pathname, item.href, item.exact);
            const locked = item.locked && !verified;
            return (
              <Link
                key={item.href + item.label}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center justify-between rounded-xl px-3 py-2.5 text-sm",
                  active ? "bg-accent-soft font-medium text-accent" : "text-muted hover:bg-accent-soft",
                )}
              >
                <span>{item.label}</span>
                {locked ? <Lock className="h-3.5 w-3.5" /> : null}
              </Link>
            );
          })}
          <Link
            href={ROUTES.profile}
            onClick={() => setMobileOpen(false)}
            className="flex rounded-xl px-3 py-2.5 text-sm text-muted hover:bg-accent-soft"
          >
            My Account
          </Link>
          <button
            type="button"
            className="mt-4 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-muted hover:bg-accent-soft"
            onClick={() => {
              clearSession();
              window.location.href = ROUTES.login;
            }}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </nav>
      </Sheet>
    </div>
  );
}
