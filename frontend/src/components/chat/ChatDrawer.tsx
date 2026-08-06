"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { MessageCircle, Send, Ticket } from "lucide-react";
import { sendChat } from "@/services/ai";
import { ROUTES } from "@/constants";
import { Sheet } from "@/components/ui/Sheet";

type Bubble = {
  id: string;
  role: "user" | "assistant";
  text: string;
  redirectPath?: string | null;
  needHuman?: boolean;
  topic?: string | null;
};

const SESSION_KEY = "ib_ai_session";
const SUGGESTIONS = ["How to deposit?", "MT5 verification", "Telegram group", "Where are signals?"];

export function ChatDrawer() {
  const pathname = usePathname();
  const hideOnAdmin = pathname?.startsWith("/admin");
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [sessionKey, setSessionKey] = useState("");
  const [telegram] = useState("https://t.me/ibcommunity");
  const [messages, setMessages] = useState<Bubble[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Hai! Saya IB AI Assistant. Tanya soal IB, MT5, deposit, verifikasi, atau navigasi modul.",
    },
  ]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const existing = localStorage.getItem(SESSION_KEY);
    if (existing) setSessionKey(existing);
  }, []);

  useEffect(() => {
    if (!open) return;
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const send = async (preset?: string) => {
    const text = (preset ?? input).trim();
    if (!text || busy) return;
    if (!preset) setInput("");
    setBusy(true);
    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: "user", text }]);
    try {
      const res = await sendChat(text, sessionKey || undefined);
      if (res.success && res.data) {
        if (res.data.session_key) {
          setSessionKey(res.data.session_key);
          localStorage.setItem(SESSION_KEY, res.data.session_key);
        }
        setMessages((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            role: "assistant",
            text: res.data.reply,
            redirectPath: res.data.redirect_path,
            needHuman: res.data.need_human,
            topic: res.data.suggested_ticket_topic,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { id: `e-${Date.now()}`, role: "assistant", text: res.message || "Gagal membalas." },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: `e-${Date.now()}`, role: "assistant", text: "Koneksi gagal. Coba lagi." },
      ]);
    } finally {
      setBusy(false);
    }
  };

  if (hideOnAdmin) return null;

  return (
    <>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-lg transition hover:opacity-90"
          aria-label="Open AI support"
        >
          <MessageCircle className="h-5 w-5" />
        </button>
      ) : null}

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        side="right"
        title="IB AI Assistant"
        description="Rule-based help · escalate anytime"
        widthClassName="w-full max-w-full sm:max-w-[560px]"
      >
        <div className="grid h-full min-h-0 flex-1 grid-cols-1 md:grid-cols-[1.2fr_0.8fr]">
          <div className="flex min-h-0 flex-col border-[var(--border)] md:border-r">
            <div className="flex flex-wrap gap-2 border-b border-[var(--border)] px-4 py-3">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-muted hover:border-accent/40 hover:text-accent"
                  onClick={() => void send(s)}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[90%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      m.role === "user" ? "bg-accent text-white" : "bg-[var(--surface-2)] text-[var(--foreground)]"
                    }`}
                  >
                    <p>{m.text}</p>
                    {m.redirectPath ? (
                      <Link
                        href={m.redirectPath}
                        className="mt-2 inline-flex rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white"
                        onClick={() => setOpen(false)}
                      >
                        Open Page
                      </Link>
                    ) : null}
                    {m.needHuman ? (
                      <Link
                        href={`${ROUTES.support}?topic=${encodeURIComponent(m.topic || "General support")}`}
                        className="mt-2 block text-xs font-medium text-accent underline"
                        onClick={() => setOpen(false)}
                      >
                        Need human assistance?
                      </Link>
                    ) : null}
                  </div>
                </div>
              ))}
              <div ref={endRef} />
            </div>
            <form
              className="border-t border-[var(--border)] p-3"
              onSubmit={(e) => {
                e.preventDefault();
                void send();
              }}
            >
              <div className="flex gap-2">
                <input
                  className="field-input"
                  placeholder={busy ? "Thinking…" : "Ask something…"}
                  value={input}
                  disabled={busy}
                  onChange={(e) => setInput(e.target.value)}
                />
                <button type="submit" className="btn-primary shrink-0" disabled={busy}>
                  Send
                </button>
              </div>
            </form>
          </div>

          <aside className="hidden flex-col gap-3 bg-[var(--surface-2)] p-4 md:flex">
            <p className="font-display text-sm font-semibold">Didn&apos;t find an answer?</p>
            <p className="text-xs leading-relaxed text-muted">
              Escalate to a human agent or reach the private community channel.
            </p>
            <Link
              href={`${ROUTES.support}?topic=AI%20escalation`}
              className="btn-primary inline-flex items-center justify-center gap-2"
              onClick={() => setOpen(false)}
            >
              <Ticket className="h-4 w-4" />
              Create Support Ticket
            </Link>
            <a
              href={telegram}
              target="_blank"
              rel="noreferrer"
              className="btn-ghost inline-flex items-center justify-center gap-2"
            >
              <Send className="h-4 w-4" />
              Contact on Telegram
            </a>
          </aside>
        </div>
      </Sheet>
    </>
  );
}

export const ChatWidget = ChatDrawer;
