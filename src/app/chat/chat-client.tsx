"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { SideNav } from "@/components/side-nav";
import { MobileBar } from "@/components/mobile-bar";
import { Markdown } from "@/components/markdown";
import { Check, Collapse, Paperclip, Send, Spark } from "@/components/icons";

export function ChatClient({ hostname }: { hostname: string | null }) {
  return <ChatPage hostname={hostname} />;
}

type Message = { role: "user" | "assistant"; content: string };

const SEED_THREAD: Message[] = [
  {
    role: "assistant",
    content:
      "Hey — I'm watching your network. Ask me what's happening, what's been suspicious, or what a specific connection is up to. I'll pull real numbers and explain plainly.",
  },
];

const FOLLOWUP_PROMPTS = [
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

function ChatPage({ hostname }: { hostname: string | null }) {
  const [thread, setThread] = useState<Message[]>(SEED_THREAD);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState<string>(""); // partial assistant text
  const [toolLabels, setToolLabels] = useState<string[]>([]); // active tool indicators
  const [pending, setPending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scroller.current?.scrollTo({ top: 999999, behavior: "smooth" });
  }, [thread, streaming, toolLabels]);

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

    let accumulated = "";

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextThread }),
      });

      if (!res.ok || !res.body) {
        throw new Error(`Request failed: ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // SSE messages are separated by \n\n
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
            accumulated += evt.delta;
            setStreaming(accumulated);
          } else if (evt.type === "tool_start") {
            setToolLabels((labels) => [...labels, evt.label]);
          } else if (evt.type === "tool_done") {
            // keep them visible — they fade with the final answer
          } else if (evt.type === "error") {
            setErrorMsg(evt.message);
            break;
          } else if (evt.type === "done") {
            // committed below after loop
          }
        }
      }

      if (accumulated) {
        setThread((t) => [...t, { role: "assistant", content: accumulated }]);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setErrorMsg(message);
    } finally {
      setStreaming("");
      setToolLabels([]);
      setPending(false);
    }
  }

  return (
    <div className="grain ambient relative flex min-h-screen w-full">
      <SideNav active={null} />

      <div className="relative z-10 flex min-h-screen flex-1 flex-col">
        <MobileBar active="chat" />
        {/* header */}
        <header className="flex items-center justify-between border-b border-white/[0.06] bg-[#0a0d13]/50 px-7 py-4 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-ng-teal/15 text-ng-teal">
              <Spark className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[15px] font-semibold tracking-[-0.01em]">NetGuard AI</p>
              <p className="flex items-center gap-1.5 text-[11.5px] text-ng-faint">
                <span className="h-1.5 w-1.5 rounded-full bg-ng-teal" />{" "}
                {hostname
                  ? `Connected to ${hostname} · Powered by Claude`
                  : "Awaiting agent · Powered by Claude"}
              </p>
            </div>
          </div>
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-[12.5px] text-ng-sub transition hover:bg-white/[0.06] hover:text-ng-ink"
          >
            <Collapse className="h-3.5 w-3.5" /> Collapse to drawer
          </Link>
        </header>

        {/* thread */}
        <div ref={scroller} className="flex-1 overflow-y-auto px-6 py-8">
          <div className="mx-auto flex w-full max-w-[720px] flex-col gap-6">
            {thread.map((m, i) => (
              <MessageView key={i} m={m} />
            ))}

            {(toolLabels.length > 0 || streaming) && (
              <motion.div
                className="flex gap-3"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: [0.2, 0.8, 0.4, 1] }}
              >
                <Avatar />
                <div className="min-w-0 flex-1 space-y-2.5">
                  {toolLabels.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      <AnimatePresence initial={false}>
                        {toolLabels.map((label, i) => (
                          <motion.span
                            key={`${i}-${label}`}
                            initial={{ opacity: 0, scale: 0.92 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="flex items-center gap-1.5 rounded-full border border-white/[0.07] bg-white/[0.03] px-2.5 py-1 font-mono text-[11.5px] text-ng-sub"
                          >
                            {i === toolLabels.length - 1 && !streaming ? (
                              <span className="h-3 w-3 rounded-full border-2 border-ng-teal/30 border-t-ng-teal animate-spin" />
                            ) : (
                              <Check className="h-3 w-3 text-ng-teal/70" />
                            )}
                            {label}
                          </motion.span>
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                  {streaming && (
                    <motion.div
                      className="rounded-2xl rounded-tl-md border border-white/[0.07] bg-white/[0.03] px-4 py-3.5"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Markdown>{streaming}</Markdown>
                      <span className="-mt-1 ml-0.5 inline-block h-4 w-1.5 translate-y-1 animate-pulse bg-ng-teal" />
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}

            {errorMsg && (
              <div className="rounded-xl border border-ng-red/20 bg-ng-red/[0.06] px-4 py-3 text-[13px] text-ng-red">
                {errorMsg.includes("ANTHROPIC_API_KEY")
                  ? "Chat isn't connected yet — server is missing ANTHROPIC_API_KEY."
                  : `Something went wrong: ${errorMsg}`}
              </div>
            )}
          </div>
        </div>

        {/* composer */}
        <div className="border-t border-white/[0.06] bg-[#0a0d13]/50 px-6 py-4 backdrop-blur-xl">
          <div className="mx-auto w-full max-w-[720px]">
            <div className="mb-3 flex flex-wrap gap-2">
              {FOLLOWUP_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => ask(p)}
                  disabled={pending}
                  className="rounded-full border border-white/[0.08] bg-white/[0.025] px-3.5 py-1.5 text-[12.5px] text-ng-sub transition hover:border-ng-teal/30 hover:bg-ng-teal/[0.06] hover:text-ng-ink disabled:opacity-40"
                >
                  {p}
                </button>
              ))}
            </div>
            <div className="flex items-end gap-2.5 rounded-2xl border border-white/[0.09] bg-[#0a0d13] px-3.5 py-3 focus-within:border-ng-teal/30">
              <button
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-white/[0.08] text-ng-faint transition hover:text-ng-sub"
                title="Include a connection"
              >
                <Paperclip className="h-4 w-4" />
              </button>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    ask(input);
                  }
                }}
                disabled={pending}
                className="min-w-0 flex-1 bg-transparent py-1 text-[14px] text-ng-ink placeholder:text-ng-faint focus:outline-none disabled:opacity-50"
                placeholder="Ask about a connection, process, or host…"
              />
              <button
                onClick={() => ask(input)}
                disabled={pending || !input.trim()}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-ng-teal text-ng-canvas transition hover:bg-ng-teal/90 disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 px-1 text-center text-[11px] text-ng-faint">
              NetGuard reads metadata only — it can explain and recommend, but won&apos;t act without your go-ahead.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageView({ m }: { m: Message }) {
  if (m.role === "user") {
    return (
      <motion.div
        className="flex justify-end"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.2, 0.8, 0.4, 1] }}
      >
        <div className="max-w-[80%] rounded-2xl rounded-tr-md bg-white/[0.07] px-4 py-2.5 text-[14px] leading-relaxed text-ng-ink">
          {m.content}
        </div>
      </motion.div>
    );
  }
  return (
    <motion.div
      className="flex gap-3"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.2, 0.8, 0.4, 1] }}
    >
      <Avatar />
      <div className="min-w-0 flex-1">
        <div className="rounded-2xl rounded-tl-md border border-white/[0.07] bg-white/[0.03] px-4 py-3.5">
          <Markdown>{m.content}</Markdown>
        </div>
      </div>
    </motion.div>
  );
}

function Avatar() {
  return (
    <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-ng-teal/25 to-emerald-700/20 text-ng-teal">
      <Spark className="h-4 w-4" />
    </span>
  );
}
