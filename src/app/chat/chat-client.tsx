"use client";

// Chat — Variant B (Expressive) ported from the v3 design package.
// Real Supabase auth + real Claude API + real DB queries underneath.
// Visual layer: aurora, AvatarB, typewriter cursor, shimmer tool pills,
// particle burst on completion, glow-on-done bubble.

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MobileBar } from "@/components/mobile-bar";
import { Markdown } from "@/components/markdown";
import { Aurora, AvatarB, NetGuardGlyph, Particles } from "@/components/v3";

type Message = { role: "user" | "assistant"; content: string };

const SEED_THREAD: Message[] = [];

const SUGGESTIONS = [
  "What's been happening today?",
  "Anything suspicious right now?",
  "Why is my laptop talking to RO?",
];

type StreamEvent =
  | { type: "text"; delta: string }
  | { type: "tool_start"; name: string; label: string }
  | { type: "tool_done"; name: string }
  | { type: "done" }
  | { type: "error"; message: string };

export function ChatClient({ hostname }: { hostname: string | null }) {
  return <ChatPage hostname={hostname} />;
}

function ChatPage({ hostname }: { hostname: string | null }) {
  const [thread, setThread] = useState<Message[]>(SEED_THREAD);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState<string>("");
  const [toolLabels, setToolLabels] = useState<string[]>([]);
  const [pending, setPending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [glowKey, setGlowKey] = useState(0);
  const scroller = useRef<HTMLElement>(null);
  const prevPendingRef = useRef(false);

  useEffect(() => {
    scroller.current?.scrollTo({ top: 999999, behavior: "smooth" });
  }, [thread, streaming, toolLabels]);

  useEffect(() => {
    if (prevPendingRef.current && !pending) setGlowKey((k) => k + 1);
    prevPendingRef.current = pending;
  }, [pending]);

  async function ask(q: string) {
    if (pending) return;
    const text = q.trim();
    if (!text) return;

    setInput("");
    setErrorMsg(null);
    setStreaming("");
    setToolLabels([]);
    setPending(true);

    const nextThread: Message[] = [...thread, { role: "user", content: text }];
    setThread(nextThread);

    // Typewriter buffer: server text arrives in word-sized chunks; we
    // reveal it char-by-char at a steady cadence so the bubble actually
    // *types*. `target` is what we've received, `shown` is what's
    // currently rendered. The interval closes the gap.
    let target = "";
    let shown = "";
    let streamDone = false;

    const TYPE_MS = 16;
    const typer = setInterval(() => {
      if (shown.length >= target.length) return;
      const gap = target.length - shown.length;
      // Stay one char at a time until we're more than ~80 chars behind;
      // then catch up proportionally so we never lag forever.
      const step = gap > 80 ? Math.ceil(gap / 30) : 1;
      shown = target.slice(0, shown.length + step);
      setStreaming(shown);
    }, TYPE_MS);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextThread }),
      });
      if (!res.ok || !res.body) throw new Error(`Request failed: ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          const line = part.split("\n").find((l) => l.startsWith("data: "));
          if (!line) continue;
          const payload = line.slice(6).trim();
          if (!payload) continue;
          let evt: StreamEvent;
          try {
            evt = JSON.parse(payload) as StreamEvent;
          } catch {
            continue;
          }
          if (evt.type === "text") {
            target += evt.delta;
          } else if (evt.type === "tool_start") {
            setToolLabels((labels) => [...labels, evt.label]);
          } else if (evt.type === "error") {
            setErrorMsg(evt.message);
            break;
          }
        }
      }

      streamDone = true;

      // Wait for the typewriter to finish revealing the last chars before
      // we flip the bubble from "streaming preview" to a committed thread
      // message — otherwise the user sees a jump from mid-sentence to full.
      await new Promise<void>((resolve) => {
        const check = setInterval(() => {
          if (shown.length >= target.length) {
            clearInterval(check);
            resolve();
          }
        }, 30);
      });

      if (target) setThread((t) => [...t, { role: "assistant", content: target }]);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      clearInterval(typer);
      // If we bailed early (error path), don't leave a half-typed bubble.
      if (!streamDone) setStreaming("");
      else setStreaming("");
      setToolLabels([]);
      setPending(false);
    }
  }

  const empty = thread.length === 0 && !pending && !streaming;

  return (
    <div className="relative flex h-full min-h-screen flex-col overflow-hidden bg-pitch text-cream font-display antialiased">
      <Aurora />
      <MobileBar active="chat" />

      {/* desktop header */}
      <header className="ng-rise relative z-10 hidden items-center justify-between px-6 py-4 sm:px-8 md:flex">
        <div className="flex items-center gap-3">
          <AvatarB size={30} />
          <div className="leading-tight">
            <div className="flex items-center gap-2 text-[14px] font-semibold tracking-tight">
              NetGuard AI
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-cream/10 bg-cream/[0.03] px-3 py-1.5 text-[12px] text-cream/55">
          <span className="h-1.5 w-1.5 rounded-full bg-teal ng-livedot" />
          <span className="font-mono">{hostname ?? "awaiting agent"}</span>
        </div>
      </header>

      <main ref={scroller} className="ng-scroll relative z-10 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[720px] px-5 sm:px-8">
          {empty ? (
            <Empty onPick={ask} />
          ) : (
            <Thread
              thread={thread}
              streaming={streaming}
              toolLabels={toolLabels}
              pending={pending}
              glowKey={glowKey}
            />
          )}
          {errorMsg && (
            <div className="mb-6 rounded-xl border border-danger/30 bg-danger/[0.08] px-4 py-3 text-[13px] text-danger">
              {errorMsg.includes("ANTHROPIC_API_KEY")
                ? "Chat isn't connected yet — server is missing ANTHROPIC_API_KEY."
                : `Something went wrong: ${errorMsg}`}
            </div>
          )}
        </div>
      </main>

      <Composer
        input={input}
        setInput={setInput}
        pending={pending}
        empty={empty}
        onSubmit={() => ask(input)}
      />
    </div>
  );
}

/* ─── EMPTY STATE — typewriter greeting + suggestion chips ─── */
function Empty({ onPick }: { onPick: (q: string) => void }) {
  const greeting = "Hey, I'm watching your network.";
  const [out, setOut] = useState("");
  const [done, setDone] = useState(false);
  const [showChips, setShowChips] = useState(false);

  useEffect(() => {
    const reduced =
      typeof matchMedia !== "undefined" &&
      matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setOut(greeting);
      setDone(true);
      setShowChips(true);
      return;
    }
    setOut("");
    setDone(false);
    setShowChips(false);
    let i = 0;
    const id = setInterval(() => {
      const step = greeting[i] === " " ? 2 : 1;
      i = Math.min(greeting.length, i + step);
      setOut(greeting.slice(0, i));
      if (i >= greeting.length) {
        clearInterval(id);
        setDone(true);
        setTimeout(() => setShowChips(true), 200);
      }
    }, 38);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="relative mb-7 ng-pop">
        <AvatarB size={62} thinking={!done} />
        {done && <Particles origin="center" />}
      </div>
      <h1 className="min-h-[1.2em] text-[clamp(26px,4vw,40px)] font-semibold leading-tight tracking-[-0.025em]">
        {out}
        {!done && (
          <span className="ml-0.5 inline-block h-[0.95em] w-[3px] translate-y-[0.12em] rounded-full bg-teal align-middle ng-caret" />
        )}
      </h1>
      <p className="mx-auto mt-4 max-w-[430px] text-[15px] leading-relaxed text-cream/55">
        Ask anything about what your machine is doing online. I&apos;ll pull real
        numbers and explain them plainly.
      </p>
      <div
        className={
          "mt-9 flex flex-wrap justify-center gap-2.5 transition-all duration-500 " +
          (showChips ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3")
        }
      >
        {SUGGESTIONS.map((s, i) => (
          <button
            key={s}
            onClick={() => onPick(s)}
            style={{ transitionDelay: `${i * 70}ms` }}
            className="ng-focus group flex items-center gap-2 rounded-full border border-cream/12 bg-cream/[0.04] px-4 py-2 text-[13.5px] text-cream/75 transition-all hover:border-teal/40 hover:bg-teal/[0.08] hover:text-cream"
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-teal/70 transition-transform group-hover:scale-110">
              <path d="M12 3l1.4 4.1L17.5 8.5 13.4 9.9 12 14l-1.4-4.1L6.5 8.5l4.1-1.4L12 3Z" fill="currentColor" />
            </svg>
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── THREAD ─── */
function Thread({
  thread,
  streaming,
  toolLabels,
  pending,
  glowKey,
}: {
  thread: Message[];
  streaming: string;
  toolLabels: string[];
  pending: boolean;
  glowKey: number;
}) {
  return (
    <div className="py-7 sm:py-9">
      {thread.map((m, i) => {
        const isLastAssistant = i === thread.length - 1 && m.role === "assistant";
        return (
          <MessageView
            key={i}
            m={m}
            glowKey={isLastAssistant ? glowKey : 0}
            delay={Math.min(i * 40, 200)}
          />
        );
      })}

      {(toolLabels.length > 0 || streaming || pending) && (
        <Assistant thinking={pending && !streaming} delay={0}>
          {toolLabels.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {toolLabels.map((label, idx) => (
                <ToolPill
                  key={`${idx}-${label}`}
                  label={label}
                  state={idx === toolLabels.length - 1 && !streaming ? "running" : "done"}
                />
              ))}
            </div>
          )}
          {streaming && (
            <div className="text-[15.5px] leading-[1.65] text-cream/90">
              <Markdown>{streaming}</Markdown>
              <span className="ml-0.5 inline-block h-[1.05em] w-[2.5px] translate-y-[0.15em] rounded-full bg-teal align-middle ng-caret" />
            </div>
          )}
        </Assistant>
      )}
    </div>
  );
}

function MessageView({
  m,
  glowKey,
  delay,
}: {
  m: Message;
  glowKey: number;
  delay: number;
}) {
  if (m.role === "user") {
    return (
      <div className="ng-rise mb-7 flex justify-end" style={{ animationDelay: `${delay}ms` }}>
        <div className="max-w-[80%] rounded-2xl rounded-tr-md border border-cream/[0.08] bg-cream/[0.05] px-4 py-2.5 text-[15.5px] leading-relaxed text-cream/90">
          {m.content}
        </div>
      </div>
    );
  }
  return (
    <Assistant delay={delay} complete={glowKey > 0}>
      <div
        key={`bubble-${glowKey}`}
        className={glowKey > 0 ? "ng-glow-done rounded-2xl" : ""}
      >
        <div className="text-[15.5px] leading-[1.65] text-cream/90">
          <Markdown>{m.content}</Markdown>
        </div>
      </div>
    </Assistant>
  );
}

function Assistant({
  children,
  thinking,
  complete,
  delay = 0,
}: {
  children: React.ReactNode;
  thinking?: boolean;
  complete?: boolean;
  delay?: number;
}) {
  return (
    <div
      className="ng-rise relative mb-7 flex gap-3.5"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="relative pt-0.5">
        <AvatarB size={34} thinking={thinking} />
        {complete && <Particles origin="avatar" />}
      </div>
      <div className="min-w-0 flex-1 pt-0.5">{children}</div>
    </div>
  );
}

function ToolPill({
  label,
  state,
}: {
  label: string;
  state: "running" | "done";
}) {
  const running = state === "running";
  return (
    <span
      className={
        "relative inline-flex items-center gap-2 overflow-hidden rounded-full border px-3 py-1.5 text-[12.5px] " +
        (running
          ? "border-teal/30 bg-teal/[0.06] text-cream/80"
          : "border-cream/10 bg-cream/[0.04] text-cream/55")
      }
    >
      {running && <span aria-hidden="true" className="ng-shimmer absolute inset-0" />}
      <span className="relative flex items-center gap-2">
        {running ? (
          <span className="ng-spin h-3 w-3 rounded-full border-[1.5px] border-teal/30 border-t-teal" />
        ) : (
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-teal" fill="none">
            <path d="M5 13l4 4 10-11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
        <span className={running ? "font-medium text-cream" : ""}>
          {label}
          {running ? "…" : ""}
        </span>
      </span>
    </span>
  );
}

function Composer({
  input,
  setInput,
  pending,
  empty,
  onSubmit,
}: {
  input: string;
  setInput: (v: string) => void;
  pending: boolean;
  empty: boolean;
  onSubmit: () => void;
}) {
  return (
    <div
      className="relative z-10 ng-rise px-5 pt-3 sm:px-8"
      style={{
        animationDelay: empty ? "120ms" : "260ms",
        paddingBottom: "max(20px, env(safe-area-inset-bottom))",
      }}
    >
      <form
        className="mx-auto w-full max-w-[720px]"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <div className="group flex items-end gap-2 rounded-2xl border border-cream/10 bg-cream/[0.04] p-2 pl-3.5 backdrop-blur-md transition-all focus-within:border-teal/50 focus-within:bg-cream/[0.06] focus-within:shadow-[0_0_0_1px_rgba(61,220,151,0.25),0_18px_50px_-20px_rgba(61,220,151,0.4)]">
          <button
            type="button"
            aria-label="Attach a log file"
            className="ng-focus mb-1 rounded-lg p-1.5 text-cream/40 transition-colors hover:text-cream/70"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
              <path
                d="M9 12.5v-4a3 3 0 0 1 6 0v6a5 5 0 0 1-10 0V7"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <textarea
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSubmit();
              }
            }}
            disabled={pending}
            placeholder="Ask about a connection, process, or host…"
            aria-label="Message NetGuard"
            className="ng-focus-none max-h-32 flex-1 resize-none self-center bg-transparent py-2 text-[15.5px] leading-relaxed text-cream placeholder:text-cream/35 outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            aria-label="Send message"
            disabled={pending || !input.trim()}
            className="ng-focus grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-teal text-pitch transition-all hover:scale-105 active:scale-95 disabled:bg-cream/10 disabled:text-cream/30"
          >
            <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none">
              <path
                d="M12 19V6M6 12l6-6 6 6"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
        <p className="mt-2 px-1 text-center text-[11px] text-cream/35">
          NetGuard reads metadata only — it can explain and recommend, but won&apos;t act without your go-ahead.
        </p>
      </form>
    </div>
  );
}
