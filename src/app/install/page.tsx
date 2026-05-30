"use client";

import { useEffect, useRef, useState } from "react";
import { Wordmark } from "@/components/wordmark";
import { Check, Close, Copy } from "@/components/icons";

const INSTALL_CMD = "curl -fsSL https://get.netguard.sh | sh";

const TRUST_BADGES = [
  { label: "Open source" },
  { label: "Runs locally" },
  { label: "Encrypted in transit" },
];

export default function InstallAgent() {
  const [copied, setCopied] = useState(false);
  const [connected, setConnected] = useState(false);
  const [showWhy, setShowWhy] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Demo: auto-transition Waiting → Connected after a beat.
  useEffect(() => {
    timer.current = setTimeout(() => setConnected(true), 4200);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const copy = () => {
    navigator.clipboard?.writeText(INSTALL_CMD).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const replay = () => {
    setConnected(false);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setConnected(true), 4200);
  };

  return (
    <div className="grain ambient relative min-h-screen w-full overflow-hidden">
      {/* top bar */}
      <header className="relative z-10 mx-auto flex w-full max-w-[1280px] items-center justify-between px-8 py-6">
        <Wordmark />
        <div className="flex items-center gap-3 text-[13px] text-ng-sub">
          <span>Signed in as</span>
          <span className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] py-1 pl-1 pr-3">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-gradient-to-br from-ng-teal/80 to-emerald-600 text-[11px] font-semibold text-ng-canvas">
              D
            </span>
            dev@kit.local
          </span>
        </div>
      </header>

      {/* centered card */}
      <main className="relative z-10 flex min-h-[calc(100vh-88px)] items-center justify-center px-6 pb-24">
        <div className="w-full max-w-[560px]">
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
            <p className="mx-auto mt-2.5 max-w-[400px] text-center text-[14.5px] leading-relaxed text-ng-sub">
              A tiny local agent reads your machine&apos;s network metadata and streams it to your dashboard.
              Nothing leaves your machine unencrypted.
            </p>

            {/* command block */}
            <div className="mt-7">
              <div className="group flex items-center gap-3 rounded-xl border border-white/[0.08] bg-[#0a0d13] py-3.5 pl-4 pr-2.5">
                <span className="select-none text-ng-faint">$</span>
                <code className="tnum flex-1 truncate font-mono text-[13.5px] text-ng-ink">
                  {INSTALL_CMD}
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

            {/* live status */}
            <button
              onClick={replay}
              title="Replay demo"
              className="mx-auto flex items-center gap-3 rounded-xl px-3 py-2 transition hover:bg-white/[0.02]"
            >
              {connected ? (
                <span className="relative grid h-5 w-5 place-items-center">
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-ng-teal/15 text-ng-teal">
                    <Check className="h-3 w-3" />
                  </span>
                </span>
              ) : (
                <span className="relative grid h-5 w-5 place-items-center">
                  <span className="absolute h-2.5 w-2.5 rounded-full bg-ng-teal/70 pulse-ring" />
                  <span className="h-2.5 w-2.5 rounded-full bg-ng-teal" />
                </span>
              )}
              <span
                className={
                  "text-[14px] font-medium transition " +
                  (connected ? "text-ng-teal" : "text-ng-sub")
                }
              >
                {connected ? "Connected — first packet received" : "Waiting for first packet…"}
              </span>
            </button>
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
      </main>

      {showWhy && <WhyModal onClose={() => setShowWhy(false)} />}
    </div>
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
