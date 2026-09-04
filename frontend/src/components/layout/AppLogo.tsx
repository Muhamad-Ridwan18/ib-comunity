"use client";

import Link from "next/link";
import { APP_NAME, ROUTES } from "@/constants";
import { cn } from "@/lib/utils";
import { useBrandingStore } from "@/store/branding";

type AppLogoProps = {
  href?: string;
  compact?: boolean;
  className?: string;
  markClassName?: string;
  nameClassName?: string;
};

export function AppLogo({ href = ROUTES.home, compact, className, markClassName, nameClassName }: AppLogoProps) {
  const logoUrl = useBrandingStore((s) => s.logoUrl);

  return (
    <Link href={href} className={cn("group flex items-center gap-2.5", className)}>
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt={APP_NAME}
          className={cn("h-8 w-8 rounded-lg object-contain", markClassName)}
        />
      ) : (
        <span
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-[11px] font-bold text-[var(--btn-fg)]",
            markClassName,
          )}
        >
          SP
        </span>
      )}
      {!compact ? (
        <span
          className={cn(
            "font-display text-lg font-semibold tracking-tight transition group-hover:text-accent",
            nameClassName,
          )}
        >
          {APP_NAME}
        </span>
      ) : null}
    </Link>
  );
}
