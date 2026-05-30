"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { SideNav } from "@/components/side-nav";
import {
  Check,
  Collapse,
  Dot,
  Paperclip,
  Send,
  Spark,
} from "@/components/icons";

type Block =
  | { kind: "p"; text: string }
  | { kind: "code"; text: string }
  | { kind: "flag"; tone: "alert" | "watch"; title: string; text: string };

type Message =
  | { role: "user"; text: string }
  | { role: "ai"; tools?: string[]; blocks: Block[] };

const SEED_THREAD: Message[] = [
  { role: "user", text: "What's been happening today?" },
  {
    role: "ai",
    tools: ["Scanning today's connections…", "Grouping by destination…"],
    blocks: [
      { kind: "p", text: "Mostly quiet. Two things worth flagging:" },
      {
        kind: "flag",
        tone: "alert",
        title: "SSH brute-force scan — stopped",
        text: "Someone at 185.143.x.x (Romania) tried SSH 47 times in 90 seconds. Looks like an automated scan. They've stopped now and never got in.",
      },
      {
        kind: "flag",
        tone: "watch",
        title: "TV-app tracking spike",
        text: "Your TV-app is calling tracker.adcorp.net 5× more than usual — they may have pushed a tracking update.",
      },
      { kind: "p", text: "Want me to look at either one more closely?" },
    ],
  },
];

const FOLLOWUP_PROMPTS = [
  "Show me the SSH attempts",
  "Block tracker.adcorp.net",
  "Is 185.143.x.x dangerous?",
];

const TOOL_STEPS = [
  "Looking up traffic patterns…",
  "Pulling connections to 185.143.x.x…",
  "Checking threat intel for the IP…",
];

const DEMO_ANSWER: Block[] = [
  {
    kind: "p",
    text: "Here are the 47 attempts from 185.143.x.x — all hit port 22 between 14:01:03 and 14:02:31, then nothing.",
  },
  {
    kind: "code",
    text: "14:01:03  sshd  auth-fail  root\n14:01:05  sshd  auth-fail  admin\n14:01:07  sshd  auth-fail  pi\n…  44 more  …",
  },
  {
    kind: "p",
    text: "Classic dictionary scan against common usernames. None succeeded — your machine refused every one. I'd leave it; want me to silence future alerts from this whole subnet?",
  },
];

type Phase = "idle" | "tooling" | "streaming";

export default function ChatPage() {
  const [thread, setThread] = useState<Message[]>(SEED_THREAD);
  const [phase, setPhase] = useState<Phase>("idle");
  const [toolIdx, setToolIdx] = useState(0);
  const [shown, setShown] = useState(0);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scroller.current?.scrollTo({ top: 999999, behavior: "smooth" });
  }, [thread, phase, toolIdx, shown]);

  const ask = (q: string) => {
    if (phase !== "idle") return;
    setThread((t) => [...t, { role: "user", text: q }]);
    setPhase("tooling");
    setToolIdx(0);
    let i = 0;
    const step = setInterval(() => {
      i += 1;
      if (i >= TOOL_STEPS.length) {
        clearInterval(step);
        setPhase("streaming");
        setShown(0);
        let b = 0;
        const stream = setInterval(() => {
          b += 1;
          setShown(b);
          if (b >= DEMO_ANSWER.length) {
            clearInterval(stream);
            setTimeout(() => {
              setThread((t) => [...t, { role: "ai", blocks: DEMO_ANSWER }]);
              setPhase("idle");
            }, 250);
          }
        }, 650);
      } else {
        setToolIdx(i);
      }
    }, 900);
  };

  return (
    <div className="grain ambient relative flex min-h-screen w-full">
      <SideNav active={null} />

      <div className="relative z-10 flex min-h-screen flex-1 flex-col">
        {/* header */}
        <header className="flex items-center justify-between border-b border-white/[0.06] bg-[#0a0d13]/50 px-7 py-4 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-ng-teal/15 text-ng-teal">
              <Spark className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[15px] font-semibold tracking-[-0.01em]">NetGuard AI</p>
              <p className="flex items-center gap-1.5 text-[11.5px] text-ng-faint">
                <span className="h-1.5 w-1.5 rounded-full bg-ng-teal" /> Connected to kit.local · Powered by Claude
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

            {phase === "tooling" && (
              <div className="flex gap-3 streamin">
                <Avatar />
                <div className="flex items-center gap-2.5 rounded-2xl rounded-tl-md border border-white/[0.07] bg-white/[0.03] px-4 py-3">
                  <span className="relative grid h-4 w-4 place-items-center">
                    <span className="h-3.5 w-3.5 rounded-full border-2 border-ng-teal/30 border-t-ng-teal animate-spin" />
                  </span>
                  <span className="font-mono text-[12.5px] text-ng-sub">{TOOL_STEPS[toolIdx]}</span>
                </div>
              </div>
            )}

            {phase === "streaming" && (
              <div className="flex gap-3 streamin">
                <Avatar />
                <div className="min-w-0 flex-1 space-y-3 rounded-2xl rounded-tl-md border border-white/[0.07] bg-white/[0.03] px-4 py-3.5">
                  {DEMO_ANSWER.slice(0, shown).map((b, i) => (
                    <BlockView key={i} b={b} />
                  ))}
                  <span className="inline-block h-4 w-1.5 translate-y-0.5 animate-pulse bg-ng-teal" />
                </div>
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
                  disabled={phase !== "idle"}
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
                className="min-w-0 flex-1 bg-transparent py-1 text-[14px] text-ng-ink placeholder:text-ng-faint focus:outline-none"
                placeholder="Ask about a connection, process, or host…"
                onKeyDown={(e) => {
                  const v = (e.target as HTMLInputElement).value.trim();
                  if (e.key === "Enter" && v) {
                    ask(v);
                    (e.target as HTMLInputElement).value = "";
                  }
                }}
              />
              <button
                onClick={() => ask("Show me the SSH attempts")}
                disabled={phase !== "idle"}
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
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-tr-md bg-white/[0.07] px-4 py-2.5 text-[14px] leading-relaxed text-ng-ink">
          {m.text}
        </div>
      </div>
    );
  }
  return (
    <div className="flex gap-3">
      <Avatar />
      <div className="min-w-0 flex-1 space-y-3">
        {m.tools && (
          <div className="flex flex-wrap gap-1.5">
            {m.tools.map((t) => (
              <span
                key={t}
                className="flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.02] px-2.5 py-1 font-mono text-[11px] text-ng-faint"
              >
                <Check className="h-3 w-3 text-ng-teal/70" /> {t}
              </span>
            ))}
          </div>
        )}
        <div className="space-y-3 rounded-2xl rounded-tl-md border border-white/[0.07] bg-white/[0.03] px-4 py-3.5">
          {m.blocks.map((b, i) => (
            <BlockView key={i} b={b} />
          ))}
        </div>
      </div>
    </div>
  );
}

function BlockView({ b }: { b: Block }) {
  if (b.kind === "p") {
    return <p className="text-[14px] leading-relaxed text-ng-ink/90">{b.text}</p>;
  }
  if (b.kind === "code") {
    return (
      <pre className="tnum overflow-x-auto rounded-lg border border-white/[0.06] bg-[#080b10] p-3 font-mono text-[12px] leading-relaxed text-ng-sub whitespace-pre-wrap">
        {b.text}
      </pre>
    );
  }
  const tone =
    b.tone === "alert"
      ? { bar: "bg-ng-red",   ring: "border-ng-red/20 bg-ng-red/[0.06]",     dot: "text-ng-red" }
      : { bar: "bg-ng-amber", ring: "border-ng-amber/20 bg-ng-amber/[0.06]", dot: "text-ng-amber" };
  return (
    <div className={"relative overflow-hidden rounded-xl border px-3.5 py-3 " + tone.ring}>
      <span className={"absolute inset-y-0 left-0 w-1 " + tone.bar} />
      <div className="pl-2">
        <p className={"flex items-center gap-2 text-[12.5px] font-semibold " + tone.dot}>
          <Dot className="h-2 w-2" /> {b.title}
        </p>
        <p className="mt-1 text-[13.5px] leading-relaxed text-ng-ink/85">{b.text}</p>
      </div>
    </div>
  );
}

function Avatar() {
  return (
    <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-ng-teal/25 to-emerald-700/20 text-ng-teal">
      <Spark className="h-4 w-4" />
    </span>
  );
}
