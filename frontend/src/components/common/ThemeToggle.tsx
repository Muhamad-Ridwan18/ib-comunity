"use client";

import { Moon, Sun } from "lucide-react";
import { useThemeStore } from "@/store/theme";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const hydrated = useThemeStore((s) => s.hydrated);

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border)] text-[var(--foreground)] transition hover:bg-accent-soft hover:text-accent",
        className,
      )}
    >
      {!hydrated ? (
        <span className="h-4 w-4" />
      ) : theme === "dark" ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </button>
  );
}
