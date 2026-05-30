"use client";

import { useState } from "react";
import Link from "next/link";
import { SideNav } from "@/components/side-nav";
import {
  ArrowUpRight,
  ChevRight,
  Copy,
  Check,
  Expand,
  Filter,
  Gear,
  Paperclip,
  Send,
  ShieldCheck,
  Spark,
} from "@/components/icons";
import type { Connection } from "@/data/traffic";

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

type Summary = {
  totalConnections24h: number;
  totalConnectionsLastHour: number;
  watching: number;
  alerts: number;
  agentLastSeenAt: string | null;
  hostname: string | null;
};

export function DashboardClient({
  feed,
  summary,
  installCmd,
  userEmail,
}: {
  feed: Connection[];
  summary: Summary;
  installCmd: string;
  userEmail: string;
}) {
  const [drawer, setDrawer] = useState(true);
  const hasData = feed.length > 0;
  const isAgentLive =
    summary.agentLastSeenAt &&
    Date.now() - new Date(summary.agentLastSeenAt).getTime() < 60_000;

  return (
    <div className="grain ambient relative flex min-h-screen w-full">
      <SideNav active="dashboard" />

      <div className="relative z-10 flex min-h-screen flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1280px] px-8 py-7">
            {/* header */}
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-[22px] font-semibold tracking-[-0.02em]">Dashboard</h1>
                <p className="mt-0.5 text-[13px] text-ng-sub">
                  {summary.hostname ? (
                    <>
                      Live traffic from <span className="font-mono text-ng-ink">{summary.hostname}</span>
                    </>
                  ) : (
                    <>
                      Signed in as <span className="font-mono text-ng-ink">{userEmail}</span>
                    </>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2.5">
                <span
                  className={
                    "flex items-center gap-2 rounded-full border py-1.5 pl-3 pr-3.5 text-[12.5px] " +
                    (isAgentLive
                      ? "border-ng-teal/20 bg-ng-teal/[0.06] text-ng-sub"
                      : "border-white/[0.08] bg-white/[0.03] text-ng-faint")
                  }
                >
                  <span className="relative grid h-2 w-2 place-items-center">
                    {isAgentLive && (
                      <span className="absolute h-2 w-2 rounded-full bg-ng-teal/70 pulse-ring" />
                    )}
                    <span
                      className={
                        "h-2 w-2 rounded-full " +
                        (isAgentLive ? "bg-ng-teal" : "bg-ng-faint")
                      }
                    />
                  </span>
                  {isAgentLive
                    ? "Agent connected"
                    : summary.agentLastSeenAt
                    ? "Agent idle"
                    : "Agent not installed"}
                </span>
                <Link
                  href="/settings"
                  className="grid h-9 w-9 place-items-center rounded-full border border-white/[0.08] bg-white/[0.03] text-ng-sub transition hover:bg-white/[0.06] hover:text-ng-ink"
                >
                  <Gear className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {hasData ? (
              <>
                {/* status banner */}
                <StatusBanner summary={summary} />
                {/* feed */}
                <FeedTable feed={feed} />
              </>
            ) : (
              <EmptyState installCmd={installCmd} />
            )}
          </div>
        </div>

        {/* chat drawer */}
        <ChatDrawerPanel
          open={drawer}
          onToggle={() => setDrawer((v) => !v)}
          isOnboarding={!hasData}
        />
      </div>
    </div>
  );
}

// ─── Banner ────────────────────────────────────────────────────────────
function StatusBanner({ summary }: { summary: Summary }) {
  const status =
    summary.alerts > 0
      ? { tone: "alert", title: `${summary.alerts} alert${summary.alerts === 1 ? "" : "s"} need review` }
      : summary.watching > 0
      ? { tone: "watch", title: `${summary.watching} connection${summary.watching === 1 ? "" : "s"} on watchlist` }
      : { tone: "safe", title: "All quiet — 0 alerts today" };

  const palette =
    status.tone === "alert"
      ? { border: "border-ng-red/20",   bg: "bg-ng-red/[0.06]",   bar: "bg-ng-red",   icon: "text-ng-red",   iconBg: "bg-ng-red/15"   }
      : status.tone === "watch"
      ? { border: "border-ng-amber/20", bg: "bg-ng-amber/[0.06]", bar: "bg-ng-amber", icon: "text-ng-amber", iconBg: "bg-ng-amber/15" }
      : { border: "border-ng-teal/20",  bg: "bg-ng-teal/[0.06]",  bar: "bg-ng-teal",  icon: "text-ng-teal",  iconBg: "bg-ng-teal/15"  };

  return (
    <div
      className={
        "relative overflow-hidden rounded-2xl border px-5 py-4 shadow-card " +
        palette.border +
        " " +
        palette.bg
      }
    >
      <div className={"pointer-events-none absolute inset-y-0 left-0 w-1 " + palette.bar} />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3.5 pl-1">
          <span className={"grid h-9 w-9 place-items-center rounded-full " + palette.iconBg + " " + palette.icon}>
            <ShieldCheck className="h-[18px] w-[18px]" />
          </span>
          <div>
            <p className="text-[15px] font-semibold text-ng-ink">{status.title}</p>
            <p className="text-[12.5px] text-ng-sub">
              {summary.totalConnectionsLastHour} connection
              {summary.totalConnectionsLastHour === 1 ? "" : "s"} in the last hour ·{" "}
              {summary.totalConnections24h} today
            </p>
          </div>
        </div>
        <div className="flex items-center gap-6 pr-1">
          <Metric label="Connections" value={String(summary.totalConnections24h)} />
          <Metric label="Watching" value={String(summary.watching)} tone="amber" />
          <Metric label="Alerts" value={String(summary.alerts)} tone={summary.alerts > 0 ? "red" : "teal"} />
        </div>
      </div>
    </div>
  );
}

// ─── Feed ──────────────────────────────────────────────────────────────
function FeedTable({ feed }: { feed: Connection[] }) {
  return (
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
        {feed.map((r, i) => {
          const m = STATE_META[r.state];
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
                    (r.state === "alert" ? "text-ng-red" : r.state === "watch" ? "text-ng-amber" : "text-ng-ink")
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
  );
}

// ─── Empty state — the install command IS the empty state ──────────────
function EmptyState({ installCmd }: { installCmd: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(installCmd).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-10 shadow-card backdrop-blur-xl text-center">
      <span className="inline-grid h-12 w-12 place-items-center rounded-2xl bg-ng-teal/15 text-ng-teal">
        <Spark className="h-6 w-6" />
      </span>
      <h2 className="mt-4 text-[20px] font-semibold tracking-[-0.02em]">
        Your dashboard will fill up the moment the agent starts streaming.
      </h2>
      <p className="mx-auto mt-2 max-w-[440px] text-[13.5px] text-ng-sub">
        Paste this one command in a terminal on the machine you want to watch. It runs locally,
        captures only metadata, and starts streaming to here.
      </p>

      <div className="mx-auto mt-6 flex max-w-[680px] items-start gap-3 rounded-xl border border-white/[0.08] bg-[#0a0d13] py-3.5 pl-4 pr-2.5 text-left">
        <span className="mt-1 select-none text-ng-faint">$</span>
        <code className="tnum min-w-0 flex-1 break-all font-mono text-[12.5px] leading-relaxed text-ng-ink">
          {installCmd}
        </code>
        <button
          onClick={copy}
          className={
            "flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 text-[12.5px] font-medium transition " +
            (copied
              ? "border-ng-teal/30 bg-ng-teal/10 text-ng-teal"
              : "border-white/10 bg-white/[0.04] text-ng-sub hover:bg-white/[0.08] hover:text-ng-ink")
          }
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      <p className="mt-4 text-[11.5px] text-ng-faint">
        macOS · Linux · ~6 MB · no root required
      </p>
      <p className="mt-2 text-[11.5px] text-ng-faint">
        This page will auto-refresh when traffic starts arriving (~15 seconds after install).
      </p>
    </div>
  );
}

// ─── Drawer ────────────────────────────────────────────────────────────
function ChatDrawerPanel({
  open,
  onToggle,
  isOnboarding,
}: {
  open: boolean;
  onToggle: () => void;
  isOnboarding: boolean;
}) {
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
            {isOnboarding ? "Ready when your agent is." : "Hey — I'm watching your network."}
          </p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-ng-sub">
            {isOnboarding
              ? "Once the install command above runs, ask me anything about your traffic and I'll answer with real data."
              : "Ask me anything about what your machine is doing online. I'll explain it plainly."}
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
        <Link
          href="/chat"
          className="flex items-end gap-2 rounded-xl border border-white/[0.08] bg-[#0a0d13] px-3 py-2.5"
        >
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-ng-faint">
            <Paperclip className="h-4 w-4" />
          </span>
          <span className="flex-1 py-1 text-[13px] text-ng-faint">Ask about your traffic…</span>
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-white/[0.06] text-ng-faint">
            <Send className="h-4 w-4" />
          </span>
        </Link>
      </div>
    </aside>
  );
}

// ─── Bits ──────────────────────────────────────────────────────────────
function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "amber" | "teal" | "red";
}) {
  const c =
    tone === "amber"
      ? "text-ng-amber"
      : tone === "teal"
      ? "text-ng-teal"
      : tone === "red"
      ? "text-ng-red"
      : "text-ng-ink";
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
