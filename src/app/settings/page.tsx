"use client";

import { useEffect, useState, type ReactNode } from "react";
import { SideNav } from "@/components/side-nav";
import { MobileBar } from "@/components/mobile-bar";
import { Check, Copy, Cross, Download } from "@/components/icons";

const COLLECTED = [
  { k: "Process / app name", v: 'e.g. "Google Chrome Helper"' },
  { k: "Destination host & port", v: "e.g. google.com:443" },
  { k: "Bytes in / out + timestamp", v: "volume only" },
];

const NOT_COLLECTED = [
  "Packet contents / payloads",
  "Passwords or form data",
  "Page contents · keystrokes",
];

const INITIAL_NOTIFS = [
  {
    id: "critical",
    title: "Critical alerts",
    sub: "Always on — suspicious activity that needs review",
    on: true,
    locked: true,
  },
  {
    id: "daily",
    title: "Daily summary email",
    sub: "A plain-English recap at 9:00 each morning",
    on: true,
    locked: false,
  },
  {
    id: "push",
    title: "Push to my phone",
    sub: "Send alerts to the NetGuard mobile app",
    on: false,
    locked: false,
  },
];

export default function Settings() {
  const [paused, setPaused] = useState(false);
  const [notifs, setNotifs] = useState(INITIAL_NOTIFS);
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [lastUsedAt, setLastUsedAt] = useState<string | null>(null);
  const [rotating, setRotating] = useState(false);

  const masked = "ng_live_••••-••••-••••-••••-••••";
  const isConnected =
    lastUsedAt && (Date.now() - new Date(lastUsedAt).getTime()) / 1000 < 60;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const res = await fetch("/api/agent-token", { cache: "no-store" });
      if (!res.ok || cancelled) return;
      const data = await res.json();
      setToken(data.token);
      setLastUsedAt(data.lastUsedAt);
    }
    load();
    const id = setInterval(load, 10_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const copyToken = () => {
    if (!token) return;
    navigator.clipboard?.writeText(token).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const rotateToken = async () => {
    if (!confirm("Rotate the token? The current agent will stop until you reinstall with the new token.")) return;
    setRotating(true);
    try {
      const res = await fetch("/api/agent-token", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setToken(data.token);
        setLastUsedAt(data.lastUsedAt);
        setRevealed(true);
      }
    } finally {
      setRotating(false);
    }
  };

  return (
    <div className="grain ambient relative flex min-h-screen w-full">
      <SideNav active="settings" />

      <div className="relative z-10 flex flex-1 flex-col overflow-y-auto">
        <MobileBar active="settings" />
        <div className="mx-auto w-full max-w-[820px] px-4 py-6 md:px-8 md:py-9">
          <h1 className="text-[22px] font-semibold tracking-[-0.02em]">Settings</h1>
          <p className="mt-0.5 text-[13px] text-ng-sub">
            Agent, privacy, and notifications for{" "}
            <span className="font-mono text-ng-ink">kit.local</span>
          </p>

          {/* AGENT */}
          <Section label="Agent" desc="Control the local agent running on this machine.">
            <Row>
              <div>
                <p className="text-[14px] font-medium text-ng-ink">Pause monitoring</p>
                <p className="mt-0.5 text-[12.5px] text-ng-sub">
                  {paused
                    ? "Paused — no traffic is being recorded."
                    : "Monitoring active — recording connection metadata."}
                </p>
              </div>
              <Toggle on={!paused} onClick={() => setPaused((p) => !p)} />
            </Row>
            <Divider />
            <Row>
              <div className="flex items-center gap-3">
                <span className="relative grid h-2.5 w-2.5 place-items-center">
                  {isConnected && !paused && (
                    <span className="absolute h-2.5 w-2.5 rounded-full bg-ng-teal/70 pulse-ring" />
                  )}
                  <span
                    className={
                      "h-2.5 w-2.5 rounded-full " +
                      (paused || !isConnected ? "bg-ng-faint" : "bg-ng-teal")
                    }
                  />
                </span>
                <div>
                  <p className="text-[14px] font-medium text-ng-ink">
                    {paused
                      ? "Paused"
                      : isConnected
                      ? "Connected"
                      : lastUsedAt
                      ? "Disconnected"
                      : "Never connected"}
                  </p>
                  <p className="mt-0.5 font-mono text-[12px] text-ng-faint">
                    {lastUsedAt
                      ? `Last packet ${relativeTime(lastUsedAt)}`
                      : "Install the agent to start streaming"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3.5 py-2 text-[13px] font-medium text-ng-sub transition hover:bg-white/[0.06] hover:text-ng-ink">
                  Restart agent
                </button>
                <button className="rounded-lg border border-ng-red/20 bg-ng-red/[0.06] px-3.5 py-2 text-[13px] font-medium text-ng-red/90 transition hover:bg-ng-red/[0.12]">
                  Uninstall agent
                </button>
              </div>
            </Row>
          </Section>

          {/* PRIVACY */}
          <Section
            label="Privacy"
            desc="NetGuard reads connection metadata only — never the contents."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="mb-2.5 flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.12em] text-ng-teal">
                  <Check className="h-3.5 w-3.5" /> Collected
                </p>
                <ul className="space-y-2">
                  {COLLECTED.map((c) => (
                    <li
                      key={c.k}
                      className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2"
                    >
                      <p className="text-[13px] text-ng-ink">{c.k}</p>
                      <p className="font-mono text-[11.5px] text-ng-faint">{c.v}</p>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-2.5 flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.12em] text-ng-faint">
                  <Cross className="h-3.5 w-3.5" /> Never collected
                </p>
                <ul className="space-y-2">
                  {NOT_COLLECTED.map((t) => (
                    <li
                      key={t}
                      className="flex items-center gap-2 rounded-lg border border-white/[0.04] bg-transparent px-3 py-[11px] text-[13px] text-ng-sub"
                    >
                      <Cross className="h-3.5 w-3.5 shrink-0 text-ng-faint" /> {t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <Divider />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[13px] text-ng-sub">
                Your data lives in your account. Export or remove it anytime.
              </p>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3.5 py-2 text-[13px] font-medium text-ng-sub transition hover:bg-white/[0.06] hover:text-ng-ink">
                  <Download className="h-3.5 w-3.5" /> Download all my data
                </button>
                <button className="rounded-lg border border-ng-red/20 bg-ng-red/[0.06] px-3.5 py-2 text-[13px] font-medium text-ng-red/90 transition hover:bg-ng-red/[0.12]">
                  Delete account &amp; all data
                </button>
              </div>
            </div>
          </Section>

          {/* NOTIFICATIONS */}
          <Section label="Notifications" desc="Choose how NetGuard reaches you.">
            <div className="space-y-0">
              {notifs.map((n, i) => (
                <div key={n.id}>
                  {i > 0 && <Divider />}
                  <Row>
                    <div>
                      <p className="flex items-center gap-2 text-[14px] font-medium text-ng-ink">
                        {n.title}
                        {n.locked && (
                          <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-ng-faint">
                            Always
                          </span>
                        )}
                      </p>
                      <p className="mt-0.5 text-[12.5px] text-ng-sub">{n.sub}</p>
                    </div>
                    <Toggle
                      on={n.on}
                      disabled={n.locked}
                      onClick={() =>
                        !n.locked &&
                        setNotifs((arr) =>
                          arr.map((x) => (x.id === n.id ? { ...x, on: !x.on } : x))
                        )
                      }
                    />
                  </Row>
                </div>
              ))}
            </div>
          </Section>

          {/* AGENT TOKEN */}
          <Section
            label="Agent token"
            desc="This token authenticates your agent. Treat it like a password."
          >
            <Row>
              <code
                className={
                  "tnum break-all font-mono text-[13.5px] tracking-tight " +
                  (revealed ? "text-ng-ink" : "text-ng-sub")
                }
              >
                {token == null ? "loading…" : revealed ? token : masked}
              </code>
              <div className="flex items-center gap-2">
                <button
                  onClick={copyToken}
                  disabled={!token}
                  className="grid h-9 w-9 place-items-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-ng-sub transition hover:bg-white/[0.06] hover:text-ng-ink disabled:opacity-40"
                  title="Copy"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-ng-teal" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
                <button
                  onClick={() => setRevealed((r) => !r)}
                  disabled={!token}
                  className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3.5 py-2 text-[13px] font-medium text-ng-sub transition hover:bg-white/[0.06] hover:text-ng-ink disabled:opacity-40"
                >
                  {revealed ? "Hide" : "Reveal"}
                </button>
                <button
                  onClick={rotateToken}
                  disabled={rotating}
                  className="rounded-lg border border-ng-amber/20 bg-ng-amber/[0.06] px-3.5 py-2 text-[13px] font-medium text-ng-amber/90 transition hover:bg-ng-amber/[0.12] disabled:opacity-40"
                >
                  {rotating ? "Rotating…" : "Rotate"}
                </button>
              </div>
            </Row>
            <p className="mt-3 text-[12px] text-ng-faint">
              Rotating immediately invalidates the old token — you&apos;ll need to reconnect the agent.
            </p>
          </Section>

          <div className="h-16" />
        </div>
      </div>
    </div>
  );
}

function Section({
  label,
  desc,
  children,
}: {
  label: string;
  desc?: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-7">
      <div className="mb-3">
        <h2 className="text-[12px] font-semibold uppercase tracking-[0.16em] text-ng-faint">
          {label}
        </h2>
        {desc && <p className="mt-1 text-[13px] text-ng-sub">{desc}</p>}
      </div>
      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 shadow-card backdrop-blur-xl">
        {children}
      </div>
    </section>
  );
}

function Row({ children }: { children: ReactNode }) {
  return <div className="flex items-center justify-between gap-4">{children}</div>;
}

function Divider() {
  return <div className="my-4 h-px bg-white/[0.06]" />;
}

function relativeTime(iso: string): string {
  const sec = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 60) return `${Math.round(sec)}s ago`;
  if (sec < 3600) return `${Math.round(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.round(sec / 3600)}h ago`;
  return `${Math.round(sec / 86400)}d ago`;
}

function Toggle({
  on,
  onClick,
  disabled,
}: {
  on: boolean;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={
        "relative h-6 w-11 shrink-0 rounded-full border transition " +
        (on
          ? "border-ng-teal/40 bg-ng-teal/25"
          : "border-white/[0.1] bg-white/[0.05]") +
        (disabled ? " cursor-default opacity-70" : "")
      }
    >
      <span
        className={
          "absolute top-1/2 -translate-y-1/2 rounded-full transition-all " +
          (on
            ? "left-[22px] bg-ng-teal shadow-[0_0_10px_rgba(61,220,151,0.6)]"
            : "left-[3px] bg-ng-sub")
        }
        style={{ height: "18px", width: "18px" }}
      />
    </button>
  );
}
