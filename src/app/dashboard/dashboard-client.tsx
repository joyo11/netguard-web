"use client";

// Dashboard — v3 Variant B port. Aurora bg, NavRail with Chat tab,
// "Ask NetGuard" header CTA, worst-state status banner, activity table
// with row tonal hierarchy + alert pulse, install-as-empty-state.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

function rowQuery(r: { app: string; host: string; port: number }) {
  // Pre-baked drill-in question for /chat — uses the row's process +
  // destination so the answer is grounded in real context.
  const host = r.host || "this destination";
  return `What is ${r.app} doing with ${host}:${r.port}? Is it normal?`;
}
import { SideNav } from "@/components/side-nav";
import { MobileBar } from "@/components/mobile-bar";
import {
  Aurora,
  NetGuardGlyph,
  Pill,
  type PillState,
} from "@/components/v3";
import { AccountMenu } from "@/components/account-menu";
import type { Connection } from "@/data/traffic";

type Summary = {
  totalConnections24h: number;
  totalConnectionsLastHour: number;
  watching: number;
  alerts: number;
  agentLastSeenAt: string | null;
  hostname: string | null;
};

type Machine = { hostname: string; lastSeenAt: string; count: number };

export function DashboardClient({
  feed,
  summary,
  installCmd,
  userEmail,
  machines,
  selectedMachine,
}: {
  feed: Connection[];
  summary: Summary;
  installCmd: string;
  userEmail: string;
  machines: Machine[];
  selectedMachine: string | null;
}) {
  const hasData = feed.length > 0;
  const isAgentLive =
    summary.agentLastSeenAt &&
    Date.now() - new Date(summary.agentLastSeenAt).getTime() < 60_000;

  // Live refresh
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => router.refresh(), 5_000);
    return () => clearInterval(id);
  }, [router]);

  const worst: "safe" | "watch" | "alert" =
    summary.alerts > 0 ? "alert" : summary.watching > 0 ? "watch" : "safe";

  return (
    <div className="relative flex min-h-screen bg-pitch font-display text-cream antialiased">
      <Aurora className="!h-[420px] opacity-70" />
      <SideNav active="dashboard" email={userEmail} />

      <main className="ng-scroll relative z-10 flex flex-1 flex-col overflow-y-auto">
        <MobileBar active="dashboard" />
        <div className="mx-auto w-full max-w-[1100px] px-5 py-7 sm:px-8 sm:py-9">
          {/* header row */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-[28px] font-semibold tracking-[-0.02em]">Dashboard</h1>
                {machines.length > 1 && (
                  <MachineSwitcher machines={machines} selected={selectedMachine} />
                )}
              </div>
              <p className="mt-1 text-[14px] text-cream/45">
                {selectedMachine ? (
                  <>
                    Live traffic from{" "}
                    <span className="font-mono text-cream/70">{selectedMachine}</span>
                  </>
                ) : machines.length > 1 ? (
                  <>
                    Showing{" "}
                    <span className="font-mono text-cream/70">all {machines.length} machines</span>
                  </>
                ) : summary.hostname ? (
                  <>
                    Live traffic from{" "}
                    <span className="font-mono text-cream/70">{summary.hostname}</span>
                  </>
                ) : (
                  <>
                    Signed in as <span className="font-mono text-cream/70">{userEmail}</span>
                  </>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <span
                title={
                  summary.agentLastSeenAt
                    ? `Last seen ${new Date(summary.agentLastSeenAt).toLocaleString()}`
                    : "Run the install command to start the agent"
                }
                className={
                  "flex items-center gap-2 rounded-full border px-3 py-2 text-[12.5px] " +
                  (isAgentLive
                    ? "border-teal/25 bg-teal/[0.07] text-cream/75"
                    : "border-cream/10 bg-cream/[0.03] text-cream/45")
                }
              >
                <span
                  className={
                    "h-1.5 w-1.5 rounded-full " +
                    (isAgentLive ? "bg-teal ng-livedot" : "bg-cream/30")
                  }
                />
                {isAgentLive
                  ? "Agent connected · live"
                  : summary.agentLastSeenAt
                  ? "Agent idle"
                  : "Agent not installed"}
              </span>
              <Link
                href="/settings"
                aria-label="Settings"
                className="ng-focus grid h-9 w-9 place-items-center rounded-lg border border-cream/10 bg-cream/[0.03] text-cream/55 transition-colors hover:text-cream"
              >
                <svg viewBox="0 0 24 24" fill="none" className="h-[18px] w-[18px]">
                  <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
                  <path
                    d="M12 2.8v2.4M12 18.8v2.4M21.2 12h-2.4M5.2 12H2.8M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7M18.5 18.5l-1.7-1.7M7.2 7.2 5.5 5.5"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              </Link>
              <AccountMenu email={userEmail} placement="header" />
              <Link
                href="/chat"
                className="ng-focus flex items-center gap-2 rounded-lg bg-teal px-4 py-2 text-[13.5px] font-semibold text-pitch transition-transform hover:scale-[1.03] active:scale-95"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                  <path d="M12 3l1.4 4.1L17.5 8.5 13.4 9.9 12 14l-1.4-4.1L6.5 8.5l4.1-1.4L12 3Z" />
                </svg>
                Ask NetGuard
              </Link>
            </div>
          </div>

          {hasData ? (
            <>
              <AwaySummaryCard />
              <StatusBanner summary={summary} worst={worst} />
              <ActivityTable feed={feed} />
            </>
          ) : (
            <InstallEmpty installCmd={installCmd} />
          )}
        </div>
      </main>
    </div>
  );
}

function StatusBanner({ summary, worst }: { summary: Summary; worst: "safe" | "watch" | "alert" }) {
  const cfg =
    worst === "alert"
      ? {
          wash: "border-danger/35 bg-danger/[0.08]",
          bar: "rgba(230,57,70,0.9)",
          icon: "bg-danger/15 text-danger",
          title: `${summary.alerts} alert${summary.alerts === 1 ? "" : "s"} need review`,
        }
      : worst === "watch"
      ? {
          wash: "border-amber/30 bg-amber/[0.06]",
          bar: "rgba(242,201,76,0.9)",
          icon: "bg-amber/15 text-amber",
          title: `${summary.watching} connection${summary.watching === 1 ? "" : "s"} on the watchlist`,
        }
      : {
          wash: "border-teal/30 bg-teal/[0.06]",
          bar: "rgba(61,220,151,0.9)",
          icon: "bg-teal/15 text-teal",
          title: "All quiet — 0 alerts today",
        };

  return (
    <div
      className={
        "ng-rise mt-7 flex flex-wrap items-center justify-between gap-5 overflow-hidden rounded-2xl border px-5 py-4 " +
        cfg.wash
      }
      style={{ boxShadow: `inset 3px 0 0 ${cfg.bar}` }}
    >
      <div className="flex items-center gap-3.5">
        <span className={`grid h-11 w-11 place-items-center rounded-xl ${cfg.icon}`}>
          <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
            <path
              d="M12 3 5 5.6v5.3c0 4.1 2.8 7.4 7 9 4.2-1.6 7-4.9 7-9V5.6L12 3Z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <div>
          <p className="text-[16px] font-semibold text-cream">{cfg.title}</p>
          <p className="mt-0.5 text-[13px] text-cream/50">
            {summary.totalConnectionsLastHour} this hour · {summary.totalConnections24h} today
          </p>
        </div>
      </div>
      <div className="flex items-center gap-7 pr-1">
        <Metric n={String(summary.totalConnections24h)} l="Connections" />
        <Metric n={String(summary.watching)} l="Watching" color="text-amber" />
        <Metric
          n={String(summary.alerts)}
          l="Alerts"
          color={summary.alerts > 0 ? "text-danger" : "text-teal"}
        />
      </div>
    </div>
  );
}

function Metric({ n, l, color = "text-cream" }: { n: string; l: string; color?: string }) {
  return (
    <div className="text-right">
      <div className={`text-[22px] font-semibold tabular-nums leading-none ${color}`}>{n}</div>
      <div className="mt-1.5 font-mono text-[10.5px] uppercase tracking-[0.16em] text-cream/35">
        {l}
      </div>
    </div>
  );
}

function ActivityTable({ feed }: { feed: Connection[] }) {
  return (
    <section
      className="ng-rise mt-6 overflow-hidden rounded-2xl border border-cream/[0.07] bg-cream/[0.015]"
      style={{ animationDelay: "80ms" }}
    >
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <h2 className="text-[16px] font-semibold tracking-tight">Live activity</h2>
          <span className="flex items-center gap-1.5 rounded-full border border-teal/25 bg-teal/[0.07] px-2.5 py-1 text-[11.5px] text-teal">
            <span className="h-1.5 w-1.5 rounded-full bg-teal ng-livedot" /> streaming
          </span>
        </div>
        <span className="font-mono text-[11.5px] text-cream/35">
          {feed.length} recent
        </span>
      </div>
      <div>
        {/* Header: condensed columns at <sm (Process · Destination · Status),
           full at sm+ (+Time, Port, Bytes). */}
        <div className="hidden grid-cols-[68px_1.4fr_2fr_64px_72px_84px] gap-3 border-y border-cream/[0.06] px-5 py-2.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-cream/35 sm:grid">
          <span>Time</span>
          <span>Process</span>
          <span>Destination</span>
          <span>Port</span>
          <span>Bytes</span>
          <span>Status</span>
        </div>
        <div className="grid grid-cols-[1.4fr_2fr_72px] gap-3 border-y border-cream/[0.06] px-4 py-2.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-cream/35 sm:hidden">
          <span>Process</span>
          <span>Destination</span>
          <span>Status</span>
        </div>
        <div>
          {feed.map((r, i) => {
            const isWatch = r.state === "watch";
            const isAlert = r.state === "alert";
            const rowBase =
              "items-center gap-3 border-b border-cream/[0.04] py-3 text-[13px] transition-colors cursor-pointer " +
              (isAlert
                ? "bg-danger/[0.07] ng-alertpulse hover:bg-danger/[0.1]"
                : isWatch
                ? "bg-amber/[0.045] hover:bg-amber/[0.08]"
                : "opacity-[0.82] hover:opacity-100 hover:bg-cream/[0.04]");
            const href = `/chat?q=${encodeURIComponent(rowQuery(r))}`;
            const rowStyle = isWatch
              ? { boxShadow: "inset 3px 0 0 rgba(242,201,76,0.9)" }
              : undefined;

            const cc = (
              <span
                className={
                  "grid h-4 w-4 shrink-0 place-items-center rounded font-mono text-[9px] " +
                  (isAlert
                    ? "bg-danger/20 text-danger"
                    : isWatch
                    ? "bg-amber/20 text-amber"
                    : "bg-cream/10 text-cream/40")
                }
              >
                {r.cc && r.cc !== "··" ? r.cc : "?"}
              </span>
            );

            const hostText = (
              <span
                className={
                  "truncate font-mono text-[12.5px] " +
                  (isAlert ? "text-danger" : isWatch ? "text-amber" : "text-cream/55")
                }
              >
                {r.host}
              </span>
            );

            return (
              <div key={i}>
                {/* Desktop / tablet row (≥sm) — clicks drill into /chat */}
                <Link
                  href={href}
                  title={`Ask NetGuard about ${r.host}:${r.port}`}
                  className={
                    "hidden grid-cols-[68px_1.4fr_2fr_64px_72px_84px] px-5 sm:grid " + rowBase
                  }
                  style={rowStyle}
                >
                  <span className="font-mono text-[12px] text-cream/40">{r.t}</span>
                  <div className="min-w-0">
                    <div className="truncate font-medium text-cream/90">{r.app}</div>
                    <div className="truncate font-mono text-[11px] text-cream/30">{r.proc}</div>
                  </div>
                  <div className="flex min-w-0 items-center gap-2">
                    {cc}
                    {hostText}
                  </div>
                  <span className="font-mono text-[12px] text-cream/45">{r.port}</span>
                  <span className="font-mono text-[12px] text-cream/45">{r.bytes}</span>
                  <span>
                    <Pill state={r.state as PillState} live={isAlert} />
                  </span>
                </Link>
                {/* Compact mobile row (<sm) — drops Time/Port/Bytes into a meta line */}
                <Link
                  href={href}
                  title={`Ask NetGuard about ${r.host}:${r.port}`}
                  className={"grid grid-cols-[1.4fr_2fr_72px] px-4 sm:hidden " + rowBase}
                  style={rowStyle}
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium text-cream/90">{r.app}</div>
                    <div className="truncate font-mono text-[10.5px] text-cream/30">
                      {r.t} · :{r.port} · {r.bytes}
                    </div>
                  </div>
                  <div className="flex min-w-0 items-center gap-2">
                    {cc}
                    {hostText}
                  </div>
                  <span className="justify-self-end">
                    <Pill state={r.state as PillState} live={isAlert} />
                  </span>
                </Link>
              </div>
              );
            })}
          </div>
        </div>
    </section>
  );
}

/* ────────── WHILE-YOU-WERE-AWAY ────────── */
function AwaySummaryCard() {
  type Resp = {
    summary: string;
    since: string;
    counts: { total: number; alerts: number; watches: number };
    empty?: boolean;
  };
  const [data, setData] = useState<Resp | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/away-summary", { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const j = (await res.json()) as Resp;
        if (!cancelled) setData(j);
      } catch {
        // Silent: if the summary fails, the dashboard still works.
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div
        className="ng-rise mt-7 flex items-center gap-3 rounded-2xl border border-cream/[0.06] bg-cream/[0.02] px-5 py-4"
        style={{ animationDelay: "30ms" }}
      >
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-teal/[0.08] text-teal">
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 ng-spin">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="42 60" />
          </svg>
        </span>
        <span className="block h-3.5 flex-1 max-w-[420px] rounded ng-shimmer bg-cream/[0.06]" />
      </div>
    );
  }

  if (!data) return null;
  const { summary, counts, empty } = data;

  return (
    <div
      className="ng-rise mt-7 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-cream/[0.07] bg-cream/[0.025] px-5 py-4"
      style={{ animationDelay: "30ms" }}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span
          className={
            "grid h-9 w-9 shrink-0 place-items-center rounded-xl " +
            (empty ? "bg-teal/[0.08] text-teal" : counts.alerts > 0 ? "bg-danger/[0.12] text-danger" : "bg-teal/[0.08] text-teal")
          }
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
            <path
              d="M12 3l1.4 4.1L17.5 8.5 13.4 9.9 12 14l-1.4-4.1L6.5 8.5l4.1-1.4L12 3Z"
              fill="currentColor"
            />
          </svg>
        </span>
        <div className="min-w-0">
          <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-cream/40">
            While you were away
          </p>
          <p className="mt-0.5 text-[14.5px] leading-snug text-cream/85">{summary}</p>
        </div>
      </div>
      {!empty && (counts.alerts + counts.watches > 0) && (
        <div className="flex items-center gap-3 text-[11.5px]">
          {counts.alerts > 0 && (
            <span className="flex items-center gap-1.5 rounded-full border border-danger/25 bg-danger/[0.07] px-2.5 py-1 text-danger">
              <span className="h-1.5 w-1.5 rounded-full bg-danger" />
              {counts.alerts} alert{counts.alerts === 1 ? "" : "s"}
            </span>
          )}
          {counts.watches > 0 && (
            <span className="flex items-center gap-1.5 rounded-full border border-amber/25 bg-amber/[0.07] px-2.5 py-1 text-amber">
              <span className="h-1.5 w-1.5 rounded-full bg-amber" />
              {counts.watches} watch
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/* ────────── MACHINE SWITCHER ────────── */
function MachineSwitcher({
  machines,
  selected,
}: {
  machines: Machine[];
  selected: string | null;
}) {
  const [open, setOpen] = useState(false);
  const wrap = useState<HTMLDivElement | null>(null);
  // Inline ref via useRef would be cleaner, but the popover dismiss
  // logic only needs to know whether the click is inside the wrapper.

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (!t.closest("[data-machine-switcher]")) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  // No-op to satisfy linters about useState usage of wrap above
  void wrap;

  const label = selected ?? "All machines";

  return (
    <div data-machine-switcher className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="ng-focus flex items-center gap-2 rounded-full border border-cream/10 bg-cream/[0.04] px-3 py-1.5 text-[12.5px] text-cream/75 transition-colors hover:bg-cream/[0.07]"
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5 text-cream/55">
          <rect x="4" y="5" width="16" height="11" rx="1.6" stroke="currentColor" strokeWidth="1.6" />
          <path d="M9 20h6M12 16v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        <span className="font-mono">{label}</span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={"h-3.5 w-3.5 text-cream/45 transition-transform " + (open ? "rotate-180" : "")}
        >
          <path d="M8 9l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-0 top-[40px] z-40 w-[260px] origin-top-left overflow-hidden rounded-xl border border-cream/10 bg-[#0d111a] shadow-[0_24px_60px_-20px_rgba(0,0,0,0.7)] ng-pop"
        >
          <MachineOption
            href="/dashboard"
            label="All machines"
            sub={`${machines.length} agent${machines.length === 1 ? "" : "s"} reporting`}
            active={!selected}
          />
          <div className="h-px bg-cream/[0.06]" />
          {machines.map((m) => (
            <MachineOption
              key={m.hostname}
              href={`/dashboard?machine=${encodeURIComponent(m.hostname)}`}
              label={m.hostname}
              sub={`${m.count} recent · last ${timeAgo(m.lastSeenAt)}`}
              active={selected === m.hostname}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MachineOption({
  href,
  label,
  sub,
  active,
}: {
  href: string;
  label: string;
  sub: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        "ng-focus flex items-start gap-2.5 px-4 py-3 text-left transition-colors hover:bg-cream/[0.04] " +
        (active ? "bg-teal/[0.08]" : "")
      }
    >
      <span
        className={
          "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full " +
          (active ? "bg-teal" : "bg-cream/25")
        }
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-mono text-[13px] text-cream/85">{label}</span>
        <span className="mt-0.5 block truncate text-[11.5px] text-cream/40">{sub}</span>
      </span>
    </Link>
  );
}

function timeAgo(iso: string): string {
  const sec = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 60) return `${Math.round(sec)}s ago`;
  if (sec < 3600) return `${Math.round(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.round(sec / 3600)}h ago`;
  return `${Math.round(sec / 86400)}d ago`;
}

function InstallEmpty({ installCmd }: { installCmd: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(installCmd).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="ng-rise mt-10 flex flex-col items-center justify-center py-10 text-center">
      <span className="relative mb-6 grid h-16 w-16 place-items-center rounded-2xl ng-avatarB">
        <NetGuardGlyph className="h-8 w-8 text-pitch" strokeWidth={1.8} />
      </span>
      <h2 className="text-[26px] font-semibold tracking-[-0.02em]">
        Install the agent to begin
      </h2>
      <p className="mx-auto mt-3 max-w-[440px] text-[15px] leading-relaxed text-cream/50">
        One command. It reads connection metadata only — no payloads, no root. You&apos;ll see live
        traffic here within seconds.
      </p>

      <div className="mt-7 w-full max-w-[680px] overflow-hidden rounded-xl border border-cream/10 bg-[#0a0d13] text-left">
        <div className="flex items-start justify-between gap-3 px-4 py-3.5">
          <code className="min-w-0 flex-1 break-all font-mono text-[13px] text-cream/85">
            <span className="select-none text-teal">$ </span>
            {installCmd}
          </code>
          <button
            onClick={copy}
            className="ng-focus flex shrink-0 items-center gap-1.5 rounded-lg border border-cream/12 bg-cream/[0.04] px-3 py-1.5 text-[12.5px] text-cream/75 transition-colors hover:bg-cream/[0.08]"
          >
            {copied ? (
              <>
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-teal" fill="none">
                  <path
                    d="M5 13l4 4 10-11"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Copied
              </>
            ) : (
              "Copy"
            )}
          </button>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
        {["No root", "Metadata only", "Open source"].map((t) => (
          <span
            key={t}
            className="flex items-center gap-1.5 rounded-full border border-cream/10 bg-cream/[0.03] px-3 py-1.5 text-[12.5px] text-cream/60"
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-teal" fill="none">
              <path
                d="M5 13l4 4 10-11"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {t}
          </span>
        ))}
      </div>

      <p className="mt-9 flex items-center gap-2.5 font-mono text-[12.5px] text-cream/40 ng-wait">
        <span className="flex gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-teal" />
          <span className="h-1.5 w-1.5 rounded-full bg-teal/50" />
          <span className="h-1.5 w-1.5 rounded-full bg-teal/25" />
        </span>
        Waiting for first packet…
      </p>
    </div>
  );
}
