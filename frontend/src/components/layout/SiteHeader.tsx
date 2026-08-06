"use client";

import Link from "next/link";
import { AppLogo } from "@/components/layout/AppLogo";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { LocaleToggle } from "@/components/common/LocaleToggle";
import { ROUTES } from "@/constants";
import { useT } from "@/i18n/useT";

export function SiteHeader() {
  const { t, locale } = useT();

  const navLinks = [
    { href: "#", key: "nav.home" },
    { href: "#articles", key: "nav.academy" },
    { href: "#articles", key: "nav.analysis" },
    { href: "#signals", key: "nav.signal" },
    { href: "#benefits", key: "nav.bonus" },
    { href: "#faq", key: "nav.about" },
  ] as const;

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-white/80 backdrop-blur-xl dark:bg-[rgba(7,11,20,0.82)]">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <div className="flex items-center gap-2.5">
          <span className="hidden rounded-md border border-[var(--border)] bg-[var(--card)] px-2 py-1 text-[10px] font-semibold text-muted sm:inline-flex">
            {locale === "id" ? "MODE TERANG" : "LIGHT MODE"}
          </span>
          <AppLogo />
        </div>
        <nav className="hidden items-center gap-0.5 text-sm md:flex">
          {navLinks.map((l) => (
            <Link
              key={l.key}
              href={l.href}
              className="rounded-lg px-3 py-2 text-[13px] text-muted transition hover:bg-accent-soft hover:text-[var(--foreground)]"
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
