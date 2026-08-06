"use client";

import Link from "next/link";
import { AppLogo } from "@/components/layout/AppLogo";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { LocaleToggle } from "@/components/common/LocaleToggle";
import { ROUTES } from "@/constants";
import { useT } from "@/i18n/useT";

export function SiteHeader() {
  const { t } = useT();

  const navLinks = [
    { href: "#", key: "nav.home" },
    { href: "#articles", key: "nav.academy" },
    { href: "#articles", key: "nav.analysis" },
    { href: "#signals", key: "nav.signal" },
    { href: "#benefits", key: "nav.bonus" },
    { href: "#faq", key: "nav.about" },
  ] as const;

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-white/90 backdrop-blur-xl dark:bg-[var(--header)]">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <AppLogo />
        <nav className="hidden items-center gap-1 text-sm md:flex">
          {navLinks.map((l) => (
            <Link
              key={l.key}
              href={l.href}
              className="rounded-lg px-3 py-2 text-muted transition hover:bg-accent-soft hover:text-[var(--foreground)]"
            >
              {t(l.key)}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link href={ROUTES.login} className="hidden text-sm text-muted hover:text-accent sm:inline">
            {t("nav.login")}
          </Link>
          <LocaleToggle />
          <ThemeToggle />
          <Link href={ROUTES.register} className="btn-primary px-4 py-2">
            {t("nav.joinNow")}
          </Link>
        </div>
      </div>
    </header>
  );
}
