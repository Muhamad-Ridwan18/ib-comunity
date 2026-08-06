"use client";

import Link from "next/link";
import { AppLogo } from "@/components/layout/AppLogo";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { ROUTES } from "@/constants";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-white/90 backdrop-blur-xl dark:bg-[var(--header)]">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <AppLogo />
        <nav className="hidden items-center gap-1 text-sm md:flex">
          {[
            { href: "#", label: "Home" },
            { href: "#articles", label: "Academy" },
            { href: "#articles", label: "Analysis" },
            { href: "#signals", label: "Signal" },
            { href: "#benefits", label: "Bonus" },
            { href: "#faq", label: "About" },
          ].map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className="rounded-lg px-3 py-2 text-muted transition hover:bg-accent-soft hover:text-[var(--foreground)]"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link href={ROUTES.login} className="hidden text-sm text-muted hover:text-accent sm:inline">
            Login
          </Link>
          <ThemeToggle />
          <Link href={ROUTES.register} className="btn-primary px-4 py-2">
            Join Now
          </Link>
        </div>
      </div>
    </header>
  );
}
