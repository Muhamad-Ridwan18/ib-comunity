"use client";

import { APP_NAME, ROUTES } from "@/constants";
import Link from "next/link";
import { useT } from "@/i18n/useT";

export function SiteFooter() {
  const { t } = useT();

  return (
    <footer className="border-t border-[var(--border)] py-14">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-display text-xl font-semibold">{APP_NAME}</p>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">{t("landing.footerBody")}</p>
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-muted">
          <Link href="#how" className="hover:text-accent">
            {t("nav.howItWorks")}
          </Link>
          <Link href="#articles" className="hover:text-accent">
            {t("nav.articles")}
          </Link>
          <Link href={ROUTES.register} className="hover:text-accent">
            {t("nav.join")}
          </Link>
          <p className="w-full text-xs md:w-auto">
            © {new Date().getFullYear()} {APP_NAME}
          </p>
        </div>
      </div>
    </footer>
  );
}
