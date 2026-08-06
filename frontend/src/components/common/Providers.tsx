"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/auth";
import { useThemeStore } from "@/store/theme";
import { useLocaleStore } from "@/store/locale";
import { ChatDrawer } from "@/components/chat/ChatDrawer";

export function Providers({ children }: { children: React.ReactNode }) {
  const hydrateAuth = useAuthStore((s) => s.hydrate);
  const hydrateTheme = useThemeStore((s) => s.hydrate);
  const hydrateLocale = useLocaleStore((s) => s.hydrate);
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
        },
      }),
  );

  useEffect(() => {
    hydrateTheme();
    hydrateLocale();
    hydrateAuth();
  }, [hydrateAuth, hydrateTheme, hydrateLocale]);

  return (
    <QueryClientProvider client={client}>
      {children}
      <ChatDrawer />
    </QueryClientProvider>
  );
}
