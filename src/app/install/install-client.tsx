"use client";

// Install — v3 port. Aurora bg, frosted card matching Settings, live
// "waiting for first packet" indicator that flips to "connected" once
// the agent posts. Token visible in a collapsible disclosure.

import { useEffect, useState } from "react";
import Link from "next/link";

const TRUST_BADGES = ["No root", "Metadata only", "Open source"];

export function InstallClient({
  installCmd,
  token,
}: {
  installCmd: string;
  token: string;
}) {
  const [copied, setCopied] = useState(false);
  const [tokenShown, setTokenShown] = useState(false);
  const [connected, setConnected] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      try {
        const res = await fetch("/api/agent-token", { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (data.lastUsedAt) {
          const ageSec = (Date.now() - new Date(data.lastUsedAt).getTime()) / 1000;
          setConnected(ageSec < 60);
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
    <main className="relative z-10 mx-auto flex w-full max-w-[680px] flex-col items-stretch px-5 pb-20 pt-4 sm:px-8 sm:pt-10">
      <div className="ng-rise mb-5 flex justify-center">
        <span className="rounded-full border border-cream/10 bg-cream/[0.04] px-3 py-1 font-mono text-[10.5px] uppercase tracking-[0.18em] text-cream/45">
          Step 1 of 1 · Setup
        </span>
      </div>

      <div className="ng-rise ng-bubble-ai rounded-2xl p-7 sm:p-9" style={{ animationDelay: "60ms" }}>
        <h1 className="text-center text-[26px] font-semibold leading-tight tracking-[-0.02em] text-cream">
          Install the NetGuard agent
        </h1>
        <p className="mx-auto mt-3 max-w-[440px] text-center text-[14.5px] leading-relaxed text-cream/55">
          A tiny local agent reads your machine&apos;s network metadata and streams it to your
          dashboard. Nothing leaves your machine unencrypted.
        </p>

        {/* Command block */}
        <div className="mt-7">
          <div className="flex items-start gap-3 rounded-xl border border-cream/10 bg-[#0a0d13] py-3.5 pl-4 pr-2.5">
            <span className="mt-1 select-none font-mono text-teal">$</span>
            <code className="min-w-0 flex-1 break-all font-mono text-[12.5px] leading-relaxed text-cream/85">
              {installCmd}
            </code>
            <button
              onClick={copy}
              className={
                "ng-focus flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 text-[12.5px] font-medium transition " +
                (copied
                  ? "border-teal/30 bg-teal/[0.08] text-teal"
                  : "border-cream/10 bg-cream/[0.04] text-cream/75 hover:bg-cream/[0.08] hover:text-cream")
              }
            >
              {copied ? <CheckIcon className="h-3.5 w-3.5" /> : <CopyIcon className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <p className="mt-2 text-center font-mono text-[11px] text-cream/35">
            macOS · Linux · ~6 MB · no root required
          </p>
        </div>

        {/* Trust badges */}
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {TRUST_BADGES.map((t) => (
            <span
              key={t}
              className="flex items-center gap-1.5 rounded-full border border-cream/10 bg-cream/[0.03] px-3 py-1.5 text-[12.5px] text-cream/65"
            >
              <CheckIcon className="h-3 w-3 text-teal" />
              {t}
            </span>
          ))}
        </div>

        <div className="my-6 h-px bg-cream/[0.06]" />

        {/* Live status */}
        <div className="flex items-center justify-center gap-3">
          {connected ? (
            <>
              <span className="grid h-6 w-6 place-items-center rounded-full bg-teal/15 text-teal">
                <CheckIcon className="h-3.5 w-3.5" />
              </span>
              <span className="text-[14px] font-medium text-teal">
                Connected · agent is streaming
              </span>
              <Link
                href="/dashboard"
                className="ng-focus ml-2 rounded-lg bg-teal/15 px-3 py-1.5 text-[12.5px] font-semibold text-teal transition-colors hover:bg-teal/25"
              >
                Go to dashboard →
              </Link>
            </>
          ) : (
            <p className="flex items-center gap-2.5 font-mono text-[12.5px] text-cream/45 ng-wait">
              <span className="flex gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-teal" />
                <span className="h-1.5 w-1.5 rounded-full bg-teal/50" />
                <span className="h-1.5 w-1.5 rounded-full bg-teal/25" />
              </span>
              Waiting for first packet…
            </p>
          )}
        </div>

        {/* Token disclosure */}
        <div className="mt-5 text-center">
          <button
            onClick={() => setTokenShown((s) => !s)}
            className="ng-focus rounded text-[12px] text-cream/40 transition-colors hover:text-cream/70"
          >
            {tokenShown ? "Hide" : "Show"} agent token
          </button>
          {tokenShown && (
            <div className="mt-3 break-all rounded-lg border border-cream/10 bg-[#0a0d13] px-3 py-2 font-mono text-[11.5px] text-cream/70">
              {token}
            </div>
          )}
          {tokenShown && (
            <p className="mt-2 text-[11px] text-cream/35">
              Treat it like a password. Rotate from{" "}
              <Link
                href="/settings"
                className="ng-focus rounded text-cream/55 underline decoration-cream/20 underline-offset-4 hover:text-cream"
              >
                Settings
              </Link>
              .
            </p>
          )}
        </div>
      </div>
    </main>
  );
}

function CheckIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
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

function CopyIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M5 15V6a2 2 0 0 1 2-2h9"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
