import Link from "next/link";
import { APP_NAME, ROUTES } from "@/constants";
import { cn } from "@/lib/utils";

type AppLogoProps = {
  href?: string;
  compact?: boolean;
  className?: string;
  markClassName?: string;
};

export function AppLogo({ href = ROUTES.home, compact, className, markClassName }: AppLogoProps) {
  return (
    <Link href={href} className={cn("group flex items-center gap-2.5", className)}>
      <span
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-[11px] font-bold text-[var(--btn-fg)]",
          markClassName,
        )}
      >
        SP
      </span>
      {!compact ? (
        <span className="font-display text-lg font-semibold tracking-tight transition group-hover:text-accent">
          {APP_NAME}
        </span>
      ) : null}
    </Link>
  );
}
