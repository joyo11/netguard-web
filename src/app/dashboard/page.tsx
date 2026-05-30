"use client";

import { useState } from "react";
import Link from "next/link";
import { SideNav } from "@/components/side-nav";
import {
  ArrowUpRight,
  ChevRight,
  Expand,
  Filter,
  Gear,
  Paperclip,
  Send,
  ShieldCheck,
  Spark,
} from "@/components/icons";

const FEED = [
  { t: "14:02", app: "Chrome",  proc: "Google Chrome Helper", host: "google.com",           cc: "US", port: 443, bytes: "12.4 KB", state: "safe"  as const },
  { t: "14:02", app: "Slack",   proc: "Slack Helper",          host: "slack.com",            cc: "US", port: 443, bytes: "3.2 KB",  state: "safe"  as const },
  { t: "14:01", app: "unknown", proc: "sshd",                  host: "185.143.x.x",          cc: "RO", port: 22,  bytes: "8 KB",    state: "alert" as const },
  { t: "14:01", app: "Spotify", proc: "Spotify",               host: "audio-fa.scdn.co",     cc: "US", port: 443, bytes: "240 KB", state: "safe"  as const },
  { t: "14:00", app: "TV-app",  proc: "SmartTV Companion",     host: "tracker.adcorp.net",   cc: "··", port: 443, bytes: "4.1 KB",  state: "watch" as const },
  { t: "13:59", app: "Chrome",  proc: "Google Chrome Helper",  host: "fonts.gstatic.com",    cc: "US", port: 443, bytes: "88 KB",   state: "safe"  as const },
  { t: "13:58", app: "Mail",    proc: "Mail",                  host: "imap.fastmail.com",    cc: "AU", port: 993, bytes: "1.9 KB",  state: "safe"  as const },
  { t: "13:57", app: "Docker",  proc: "com.docker.backend",    host: "registry-1.docker.io", cc: "US", port: 443, bytes: "540 KB", state: "safe"  as const },
];

const CHAT_CHIPS = [
  "What's happening right now?",
  "Anything suspicious today?",
  "Why is my laptop talking to RO?",
];

const STATE_META = {
  safe:  { dot: "bg-ng-teal",  text: "text-ng-teal",  ring: "border-ng-teal/25  bg-ng-teal/10",  label: "Safe"  },
  watch: { dot: "bg-ng-amber", text: "text-ng-amber", ring: "border-ng-amber/25 bg-ng-amber/10", label: "Watch" },
  alert: { dot: "bg-ng-red",   text: "text-ng-red",   ring: "border-ng-red/25   bg-ng-red/10",   label: "Alert" },
};

type StateKey = keyof typeof STATE_META;

export default function Dashboard() {
  const [drawer, setDrawer] = useState(true);

  return (
    <div className="grain ambient relative flex min-h-screen w-full">
      <SideNav active="dashboard" />

      <div className="relative z-10 flex min-h-screen flex-1 overflow-hidden">
        {/* main column */}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1280px] px-8 py-7">
            {/* header row */}
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-[22px] font-semibold tracking-[-0.02em]">Dashboard</h1>
                <p className="mt-0.5 text-[13px] text-ng-sub">
                  Live traffic from <span className="font-mono text-ng-ink">kit.local</span>
                </p>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] py-1.5 pl-3 pr-3.5 text-[12.5px] text-ng-sub">
                  <span className="relative grid h-2 w-2 place-items-center">
                    <span className="absolute h-2 w-2 rounded-full bg-ng-teal/70 pulse-ring" />
                    <span className="h-2 w-2 rounded-full bg-ng-teal" />
                  </span>
                  Agent connected · <span className="tnum text-ng-ink">2h</span>
                </span>
                <Link
                  href="/settings"
                  className="grid h-9 w-9 place-items-center rounded-full border border-white/[0.08] bg-white/[0.03] text-ng-sub transition hover:bg-white/[0.06] hover:text-ng-ink"
                >
                  <Gear className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* status banner */}
            <div className="relative overflow-hidden rounded-2xl border border-ng-teal/20 bg-ng-teal/[0.06] px-5 py-4 shadow-card">
              <div className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-ng-teal" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3.5 pl-1">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-ng-teal/15 text-ng-teal">
                    <ShieldCheck className="h-[18px] w-[18px]" />
                  </span>
                  <div>
                    <p className="text-[15px] font-semibold text-ng-ink">All quiet — 0 alerts today</p>
                    <p className="text-[12.5px] text-ng-sub">
                      1 connection on the watchlist · last scan 12s ago
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6 pr-1">
                  <Metric label="Connections" value="248" />
                  <Metric label="Watching" value="1" tone="amber" />
                  <Metric label="Alerts" value="0" tone="teal" />
                </div>
              </div>
            </div>

            {/* feed */}
            <div className="mt-6 overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02] shadow-card backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3.5">
                <div className="flex items-center gap-2.5">
                  <h2 className="text-[14px] font-semibold">Live activity</h2>
                  <span className="flex items-center gap-1.5 rounded-full bg-white/[0.04] px-2 py-0.5 text-[11px] text-ng-sub">
                    <span className="h-1.5 w-1.5 rounded-full bg-ng-teal blink" /> streaming
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[12px] text-ng-faint">
                  <Filter className="h-3.5 w-3.5" /> All processes
                </div>
              </div>

              <div className="grid grid-cols-[64px_minmax(140px,1fr)_minmax(200px,1.4fr)_56px_88px_88px] gap-3 px-5 py-2 text-[10.5px] font-medium uppercase tracking-[0.12em] text-ng-faint">
                <span>Time</span>
                <span>Process</span>
                <span>Destination</span>
                <span className="text-right">Port</span>
                <span className="text-right">Bytes</span>
                <span className="text-right">Status</span>
              </div>

              <div>
                {FEED.map((r, i) => {
                  const m = STATE_META[r.state as StateKey];
                  return (
                    <div
                      key={i}
                      className="grid grid-cols-[64px_minmax(140px,1fr)_minmax(200px,1.4fr)_56px_88px_88px] items-center gap-3 border-t border-white/[0.04] px-5 py-3 transition hover:bg-white/[0.025]"
                    >
                      <span className="tnum font-mono text-[12.5px] text-ng-faint">{r.t}</span>
                      <div className="min-w-0">
                        <p className="truncate text-[13.5px] font-medium text-ng-ink">{r.app}</p>
                        <p className="truncate font-mono text-[11px] text-ng-faint">{r.proc}</p>
                      </div>
                      <div className="flex min-w-0 items-center gap-2">
                        <Flag cc={r.cc} />
                        <span
                          className={
                            "truncate font-mono text-[12.5px] " +
                            (r.state === "alert"
                              ? "text-ng-red"
                              : r.state === "watch"
                              ? "text-ng-amber"
                              : "text-ng-ink")
                          }
                        >
                          {r.host}
                        </span>
                      </div>
                      <span className="tnum text-right font-mono text-[12.5px] text-ng-sub">{r.port}</span>
                      <span className="tnum text-right font-mono text-[12.5px] text-ng-sub">{r.bytes}</span>
                      <div className="flex justify-end">
                        <span
                          className={
                            "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium " +
                            m.ring +
                            " " +
                            m.text
                          }
                        >
                          <span className={"h-1.5 w-1.5 rounded-full " + m.dot} /> {m.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* chat drawer */}
        <ChatDrawerPanel open={drawer} onToggle={() => setDrawer((v) => !v)} />
      </div>
    </div>
  );
}

function ChatDrawerPanel({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  if (!open) {
    return (
      <button
        onClick={onToggle}
        className="group relative z-10 flex w-12 shrink-0 flex-col items-center gap-3 border-l border-white/[0.06] bg-white/[0.015] py-5 backdrop-blur-xl transition hover:bg-white/[0.03]"
      >
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-ng-teal/15 text-ng-teal">
          <Spark className="h-4 w-4" />
        </span>
        <span className="text-[11px] font-medium tracking-wide text-ng-sub [writing-mode:vertical-rl]">
          Ask NetGuard
        </span>
      </button>
    );
  }
  return (
    <aside className="relative z-10 flex w-[360px] shrink-0 flex-col border-l border-white/[0.06] bg-[#0c1118]/70 backdrop-blur-2xl">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-ng-teal/15 text-ng-teal">
            <Spark className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[13.5px] font-semibold leading-tight">NetGuard AI</p>
            <p className="text-[11px] text-ng-faint">Powered by Claude</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Link
            href="/chat"
            title="Expand"
            className="grid h-7 w-7 place-items-center rounded-md text-ng-faint transition hover:bg-white/[0.05] hover:text-ng-ink"
          >
            <Expand className="h-3.5 w-3.5" />
          </Link>
          <button
            onClick={onToggle}
            title="Collapse"
            className="grid h-7 w-7 place-items-center rounded-md text-ng-faint transition hover:bg-white/[0.05] hover:text-ng-ink"
          >
            <ChevRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5">
        <div className="flex flex-col items-center text-center">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-ng-teal/25 to-emerald-700/20 text-ng-teal">
            <Spark className="h-6 w-6" />
          </span>
          <p className="mt-3 text-[15px] font-semibold tracking-[-0.01em]">
            Hey — I&apos;m watching your network.
          </p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-ng-sub">
            Ask me anything about what your machine is doing online. I&apos;ll explain it plainly.
          </p>
        </div>

        <div className="mt-6 space-y-2">
          <p className="px-1 text-[11px] font-medium uppercase tracking-[0.14em] text-ng-faint">
            Try asking
          </p>
          {CHAT_CHIPS.map((c) => (
            <Link
              key={c}
              href="/chat"
              className="flex w-full items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.025] px-3.5 py-2.5 text-left text-[13px] text-ng-ink transition hover:border-ng-teal/30 hover:bg-ng-teal/[0.06]"
            >
              {c}
              <ArrowUpRight className="h-3.5 w-3.5 text-ng-faint" />
            </Link>
          ))}
        </div>
      </div>

      <div className="border-t border-white/[0.06] p-3">
        <div className="flex items-end gap-2 rounded-xl border border-white/[0.08] bg-[#0a0d13] px-3 py-2.5">
          <button className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-ng-faint transition hover:text-ng-sub">
            <Paperclip className="h-4 w-4" />
          </button>
          <span className="flex-1 py-1 text-[13px] text-ng-faint">Ask about your traffic…</span>
          <button className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-white/[0.06] text-ng-faint transition hover:bg-white/[0.1]">
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "amber" | "teal";
}) {
  const c = tone === "amber" ? "text-ng-amber" : tone === "teal" ? "text-ng-teal" : "text-ng-ink";
  return (
    <div className="text-right">
      <p className={"tnum text-[20px] font-semibold leading-none " + c}>{value}</p>
      <p className="mt-1 text-[11px] uppercase tracking-[0.1em] text-ng-faint">{label}</p>
    </div>
  );
}

function Flag({ cc }: { cc: string }) {
  const known = cc && cc !== "··";
  return (
    <span
      className={
        "grid h-4 w-5 shrink-0 place-items-center rounded-[3px] text-[9px] font-semibold tracking-tight " +
        (known ? "bg-white/[0.07] text-ng-sub" : "bg-white/[0.04] text-ng-faint")
      }
    >
      {known ? cc : "?"}
    </span>
  );
}
