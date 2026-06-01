"use client";

// Settings v3 — Aurora bg, NavRail, four frosted cards (Agent,
// Privacy, Notifications, Agent token). Preserves the real
// /api/agent-token rotate/reveal flow under the new visual layer.

import { useEffect, useState, type ReactNode } from "react";
import { SideNav } from "@/components/side-nav";
import { MobileBar } from "@/components/mobile-bar";
import { Aurora, Pill, Toggle } from "@/components/v3";

export function SettingsClient({ email }: { email: string }) {
  return (
    <div className="relative flex min-h-screen bg-pitch font-display text-cream antialiased">
      <Aurora className="!h-[360px] opacity-60" />
      <SideNav active="settings" email={email} />

      <main className="ng-scroll relative z-10 flex-1 overflow-y-auto">
        <MobileBar active="settings" />
        <div className="mx-auto max-w-[820px] px-5 py-8 sm:px-8 sm:py-11">
          <div className="ng-rise">
            <h1 className="text-[28px] font-semibold tracking-[-0.02em]">Settings</h1>
            <p className="mt-1 text-[14px] text-cream/45">
              Signed in as <span className="font-mono text-cream/70">{email}</span>
            </p>
          </div>

          <div className="mt-8 space-y-5">
            <AgentCard delay={40} />
            <PrivacyCard delay={100} />
            <NotificationsCard delay={160} />
            <TokenCard delay={220} />
            <AccountCard delay={280} email={email} />
          </div>
        </div>
      </main>
    </div>
  );
}

/* ────────── Card primitives ────────── */

function Card({
  title,
  desc,
  children,
  delay = 0,
}: {
  title: string;
  desc?: string;
  children: ReactNode;
  delay?: number;
}) {
  return (
    <section
      className="ng-rise ng-bubble-ai rounded-2xl p-6"
      style={{ animationDelay: delay + "ms" }}
    >
      <div className="mb-5 flex items-baseline justify-between gap-4">
        <h2 className="text-[17px] font-semibold tracking-tight">{title}</h2>
        {desc && <p className="text-[12.5px] text-cream/40">{desc}</p>}
      </div>
      {children}
    </section>
  );
}

function Row({ children, last = false }: { children: ReactNode; last?: boolean }) {
  return (
    <div
      className={
        "flex flex-wrap items-center justify-between gap-4 py-4 " +
        (last ? "" : "border-b border-cream/[0.06]")
      }
    >
      {children}
    </div>
  );
}

function RowText({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="min-w-0">
      <div className="text-[14.5px] font-medium text-cream/90">{title}</div>
      {sub && <div className="mt-0.5 text-[13px] text-cream/45">{sub}</div>}
    </div>
  );
}

/* ────────── AGENT ────────── */

function AgentCard({ delay }: { delay: number }) {
  const [paused, setPaused] = useState(false);

  return (
    <Card title="Agent" desc="Local monitoring daemon" delay={delay}>
      <Row>
        <RowText
          title="Pause monitoring"
          sub={
            paused
              ? "Paused — no traffic is being read"
              : "Reading connection metadata live"
          }
        />
        <Toggle
          checked={!paused}
          onChange={(v) => setPaused(!v)}
          label="Pause monitoring"
        />
      </Row>
      <Row>
        <RowText title="Connection status" />
        <Pill state={paused ? "watch" : "safe"} live={!paused}>
          {paused ? "Paused" : "Connected"}
        </Pill>
      </Row>
      <Row last>
        <RowText
          title="Agent controls"
          sub="Restart the daemon or remove it entirely"
        />
        <div className="flex flex-wrap gap-2.5">
          <button className="ng-focus rounded-lg border border-cream/12 bg-cream/[0.04] px-3.5 py-2 text-[13px] text-cream/80 transition-colors hover:bg-cream/[0.08]">
            Restart
          </button>
          <button className="ng-focus rounded-lg border border-danger/30 bg-danger/[0.06] px-3.5 py-2 text-[13px] font-medium text-danger transition-colors hover:bg-danger/[0.12]">
            Uninstall
          </button>
        </div>
      </Row>
    </Card>
  );
}

/* ────────── PRIVACY ────────── */

function PrivacyCard({ delay }: { delay: number }) {
  const collected = [
    "Process name & PID",
    "Destination host, IP & port",
    "Bytes in / out, timestamp",
  ];
  const never = [
    "Packet contents or payloads",
    "Files, keystrokes or screen",
    "Anything sent off your machine",
  ];

  return (
    <Card title="Privacy" desc="What the agent can and can't see" delay={delay}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-teal/15 bg-teal/[0.04] p-4">
          <p className="mb-3 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-teal">
            <CheckIcon /> Collected
          </p>
          <ul className="space-y-2.5">
            {collected.map((t) => (
              <li key={t} className="flex items-start gap-2.5 text-[13.5px] text-cream/75">
                <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-teal/70" />
                {t}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-cream/[0.08] bg-cream/[0.02] p-4">
          <p className="mb-3 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-cream/45">
            <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
              <path d="M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Never collected
          </p>
          <ul className="space-y-2.5">
            {never.map((t) => (
              <li key={t} className="flex items-start gap-2.5 text-[13.5px] text-cream/55">
                <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-cream/25" />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-2.5">
        <button className="ng-focus rounded-lg border border-cream/12 bg-cream/[0.04] px-3.5 py-2 text-[13px] text-cream/80 transition-colors hover:bg-cream/[0.08]">
          Download all my data
        </button>
        <button className="ng-focus rounded-lg border border-danger/30 bg-danger/[0.06] px-3.5 py-2 text-[13px] font-medium text-danger transition-colors hover:bg-danger/[0.12]">
          Delete account &amp; all data
        </button>
      </div>
    </Card>
  );
}

/* ────────── NOTIFICATIONS ────────── */

function NotificationsCard({ delay }: { delay: number }) {
  const [summary, setSummary] = useState(true);
  const [push, setPush] = useState(false);

  return (
    <Card title="Notifications" desc="How NetGuard reaches you" delay={delay}>
      <Row>
        <RowText
          title="Critical alerts"
          sub="Known trackers, exfiltration, new listening ports"
        />
        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-cream/35">
            Always on
          </span>
          <Toggle checked locked label="Critical alerts (locked on)" />
        </div>
      </Row>
      <Row>
        <RowText title="Daily summary email" sub="A plain-English recap at 9am" />
        <Toggle checked={summary} onChange={setSummary} label="Daily summary email" />
      </Row>
      <Row last>
        <RowText title="Push to my phone" sub="Requires the NetGuard mobile app" />
        <Toggle checked={push} onChange={setPush} label="Push to my phone" />
      </Row>
    </Card>
  );
}

/* ────────── AGENT TOKEN ────────── */

function TokenCard({ delay }: { delay: number }) {
  const [token, setToken] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [rotating, setRotating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/agent-token", { cache: "no-store" });
      if (!res.ok || cancelled) return;
      const data = await res.json();
      setToken(data.token);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const masked = token ? "ng_" + "•".repeat(Math.max(24, token.length - 3)) : "ng_" + "•".repeat(24);

  const copy = () => {
    if (!token) return;
    navigator.clipboard?.writeText(token).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const rotate = async () => {
    if (
      !confirm(
        "Rotate the token? Your current agent will disconnect until you paste the new one."
      )
    )
      return;
    setRotating(true);
    try {
      const res = await fetch("/api/agent-token", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setToken(data.token);
        setRevealed(true);
      }
    } finally {
      setRotating(false);
    }
  };

  return (
    <Card
      title="Agent token"
      desc="Authenticates this agent with the cloud"
      delay={delay}
    >
      <div className="flex flex-wrap items-center gap-3">
        <code className="min-w-0 flex-1 truncate rounded-xl border border-cream/10 bg-[#0a0d13] px-4 py-3 font-mono text-[13.5px] text-cream/85">
          {token == null ? "loading…" : revealed ? token : masked}
        </code>
        <div className="flex gap-2.5">
          <button
            onClick={() => setRevealed((r) => !r)}
            disabled={!token}
            className="ng-focus rounded-lg border border-cream/12 bg-cream/[0.04] px-3.5 py-2.5 text-[13px] text-cream/80 transition-colors hover:bg-cream/[0.08] disabled:opacity-40"
          >
            {revealed ? "Hide" : "Reveal"}
          </button>
          <button
            onClick={copy}
            disabled={!token}
            className="ng-focus rounded-lg border border-cream/12 bg-cream/[0.04] px-3.5 py-2.5 text-[13px] text-cream/80 transition-colors hover:bg-cream/[0.08] disabled:opacity-40"
          >
            {copied ? "Copied" : "Copy"}
          </button>
          <button
            onClick={rotate}
            disabled={rotating}
            className="ng-focus rounded-lg border border-amber/30 bg-amber/[0.06] px-3.5 py-2.5 text-[13px] font-medium text-amber transition-colors hover:bg-amber/[0.12] disabled:opacity-40"
          >
            {rotating ? "Rotating…" : "Rotate"}
          </button>
        </div>
      </div>
      <p className="mt-3.5 flex items-start gap-2 text-[12.5px] leading-relaxed text-cream/40">
        <svg viewBox="0 0 24 24" fill="none" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber/70">
          <path
            d="M12 3 5 5.6v5.3c0 4.1 2.8 7.4 7 9 4.2-1.6 7-4.9 7-9V5.6L12 3Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
        Rotating immediately invalidates the current token — your agent will disconnect until you
        paste the new one into its config.
      </p>
    </Card>
  );
}

/* ────────── ACCOUNT ────────── */

function AccountCard({ delay, email }: { delay: number; email: string }) {
  return (
    <Card title="Account" desc="Sign out of this browser" delay={delay}>
      <Row last>
        <RowText
          title={email || "Signed in"}
          sub="You can sign back in anytime. Your traffic data stays in your account."
        />
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="ng-focus flex items-center gap-2 rounded-lg border border-cream/12 bg-cream/[0.04] px-3.5 py-2.5 text-[13px] text-cream/80 transition-colors hover:bg-cream/[0.08]"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-cream/55">
              <path
                d="M14 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-2M10 12h11m0 0-3-3m3 3-3 3"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Sign out
          </button>
        </form>
      </Row>
    </Card>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none">
      <path
        d="M5 13l4 4 10-11"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
