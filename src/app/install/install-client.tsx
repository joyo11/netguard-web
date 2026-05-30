"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Close, Copy } from "@/components/icons";

const TRUST_BADGES = [
  { label: "Open source" },
  { label: "Runs locally" },
  { label: "Encrypted in transit" },
];

export function InstallClient({
  installCmd,
  token,
}: {
  installCmd: string;
  token: string;
}) {
  const [copied, setCopied] = useState(false);
  const [connected, setConnected] = useState<boolean | null>(null);
  const [showWhy, setShowWhy] = useState(false);

  // Poll connection status (was the token used recently?)
  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        const res = await fetch("/api/agent-token", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        if (data.lastUsedAt) {
          const ageSec = (Date.now() - new Date(data.lastUsedAt).getTime()) / 1000;
          setConnected(ageSec < 60); // "connected" if pinged in last minute
        } else {
          setConnected(false);
        }
      } catch {
        // ignore
      }
    }

    check();
    const id = setInterval(check, 5000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const copy = () => {
    navigator.clipboard?.writeText(installCmd).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <main className="relative z-10 flex min-h-[calc(100vh-88px)] items-center justify-center px-6 pb-24">
      <div className="w-full max-w-[640px]">
        <div className="mb-6 flex justify-center">
          <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-ng-faint">
            Step 1 of 1 · Setup
          </span>
        </div>

        <div className="relative rounded-[20px] border border-white/[0.07] bg-white/[0.025] p-8 shadow-card backdrop-blur-xl">
          <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          <h1 className="text-center text-[26px] font-semibold leading-tight tracking-[-0.02em] text-ng-ink">
            Install the NetGuard agent
          </h1>
          <p className="mx-auto mt-2.5 max-w-[420px] text-center text-[14.5px] leading-relaxed text-ng-sub">
            A tiny local agent reads your machine&apos;s network metadata and streams it to your
            dashboard. Nothing leaves your machine unencrypted.
          </p>

          {/* command block */}
          <div className="mt-7">
            <div className="group flex items-start gap-3 rounded-xl border border-white/[0.08] bg-[#0a0d13] py-3.5 pl-4 pr-2.5">
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
            <p className="mt-2 text-center font-mono text-[11.5px] text-ng-faint">
              macOS · Linux · ~6 MB · no root required
            </p>
            <details className="mt-3 text-center">
              <summary className="cursor-pointer text-[12px] text-ng-faint hover:text-ng-sub">
                Your agent token (auto-generated)
              </summary>
              <code className="mt-2 inline-block break-all rounded-lg border border-white/[0.06] bg-[#0a0d13] px-3 py-2 font-mono text-[11.5px] text-ng-sub">
                {token}
              </code>
              <p className="mt-2 text-[11px] text-ng-faint">
                Treat it like a password. Rotate from{" "}
                <Link href="/settings" className="text-ng-sub underline decoration-white/20 underline-offset-4 hover:text-ng-ink">
                  Settings
                </Link>{" "}
                if needed.
              </p>
            </details>
          </div>

          {/* trust badges */}
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {TRUST_BADGES.map((b) => (
              <span
                key={b.label}
                className="flex items-center gap-1.5 rounded-full border border-white/[0.07] bg-white/[0.03] px-3 py-1.5 text-[12px] text-ng-sub"
              >
                <Check className="h-3 w-3 text-ng-teal" />
                {b.label}
              </span>
            ))}
          </div>

          <div className="my-7 h-px bg-white/[0.06]" />

          {/* live status (real, polled) */}
          <div className="flex items-center justify-center gap-3 rounded-xl px-3 py-2">
            {connected ? (
              <>
                <span className="grid h-5 w-5 place-items-center rounded-full bg-ng-teal/15 text-ng-teal">
                  <Check className="h-3 w-3" />
                </span>
                <span className="text-[14px] font-medium text-ng-teal">
                  Connected — agent is streaming
                </span>
                <Link
                  href="/dashboard"
                  className="ml-2 rounded-md bg-ng-teal/15 px-2.5 py-1 text-[12px] font-semibold text-ng-teal hover:bg-ng-teal/25"
                >
                  Go to dashboard →
                </Link>
              </>
            ) : (
              <>
                <span className="relative grid h-5 w-5 place-items-center">
                  <span className="absolute h-2.5 w-2.5 rounded-full bg-ng-teal/70 pulse-ring" />
                  <span className="h-2.5 w-2.5 rounded-full bg-ng-teal" />
                </span>
                <span className="text-[14px] font-medium text-ng-sub">
                  Waiting for first packet…
                </span>
              </>
            )}
          </div>
        </div>

        <div className="mt-5 text-center">
          <button
            onClick={() => setShowWhy(true)}
            className="text-[13px] text-ng-faint underline decoration-white/20 underline-offset-4 transition hover:text-ng-sub"
          >
            Why do you need this?
          </button>
        </div>
      </div>

      {showWhy && <WhyModal onClose={() => setShowWhy(false)} />}
    </main>
  );
}

function WhyModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={onClose} />
      <div className="streamin relative w-full max-w-[480px] rounded-[18px] border border-white/[0.08] bg-ng-panel/95 p-7 shadow-card backdrop-blur-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[17px] font-semibold tracking-[-0.01em]">Why do you need this?</h3>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-ng-faint transition hover:bg-white/[0.05] hover:text-ng-ink"
          >
            <Close className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-3.5 text-[13.5px] leading-relaxed text-ng-sub">
          <p>
            NetGuard can&apos;t see your traffic from the cloud — your machine&apos;s connections never touch our
            servers on their own. The agent runs locally and reads only{" "}
            <span className="text-ng-ink">connection metadata</span>: which process talked to which host,
            on which port, and how many bytes moved.
          </p>
          <p>
            It never captures packet contents, passwords, or page data. The source is public, so you can
            verify exactly what it reads.
          </p>
          <div className="mt-4 rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
            <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-ng-faint">What it reads</p>
            <ul className="mt-2.5 space-y-1.5 font-mono text-[12.5px] text-ng-ink">
              <li>process · destination host · port</li>
              <li>bytes in / out · timestamp</li>
              <li className="text-ng-faint line-through">payloads · content · keystrokes</li>
            </ul>
          </div>
        </div>
        <button
          onClick={onClose}
          className="mt-6 w-full rounded-xl bg-white/[0.06] py-2.5 text-[14px] font-medium text-ng-ink transition hover:bg-white/[0.1]"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
