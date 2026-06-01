"use client";

// Landing-only client primitives: live mock + scroll-reveal wrapper.

import { useEffect, useRef, useState, type ReactNode } from "react";

const STATUS_TONES = {
  safe:  { dot: "bg-teal",   text: "text-teal",   label: "Safe"  },
  watch: { dot: "bg-amber",  text: "text-amber",  label: "Watch" },
  alert: { dot: "bg-danger", text: "text-danger", label: "Alert" },
} as const;

const ROWS = [
  { proc: "Cursor", dest: "anthropic.com",        kb: "44 KB",  state: "safe"  as const },
  { proc: "Chrome", dest: "doubleclick.net",      kb: "2.8 KB", state: "watch" as const },
  { proc: "Mail",   dest: "imap.fastmail.com",    kb: "1.9 KB", state: "safe"  as const },
  { proc: "Docker", dest: "registry-1.docker.io", kb: "540 KB", state: "safe"  as const },
];

export function LiveMock() {
  const [count, setCount] = useState(255);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const reduced =
      typeof matchMedia !== "undefined" &&
      matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    const id = setInterval(() => {
      setCount((c) => c + Math.floor(Math.random() * 3) + 1);
      setTick((t) => t + 1);
    }, 2200);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="ng-rise mx-auto mt-16 max-w-[860px] rounded-2xl border border-cream/[0.08] bg-[#0d111a] p-2.5 shadow-[0_50px_140px_-50px_rgba(0,0,0,0.95)]"
      style={{ animationDelay: "260ms" }}
    >
      <div className="flex items-center gap-2 px-3 py-2.5">
        <span className="h-3 w-3 rounded-full bg-cream/15" />
        <span className="h-3 w-3 rounded-full bg-cream/15" />
        <span className="h-3 w-3 rounded-full bg-cream/15" />
        <span className="ml-3 font-mono text-[12px] text-cream/35">
          netguard-web.vercel.app/dashboard
        </span>
      </div>
      <div className="overflow-hidden rounded-xl border border-cream/[0.06] bg-pitch">
        <div className="flex items-center justify-between gap-3 border-l-2 border-amber bg-amber/[0.06] px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-amber/15">
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-amber" fill="none">
                <path
                  d="M12 3 5 5.6v5.3c0 4.1 2.8 7.4 7 9 4.2-1.6 7-4.9 7-9V5.6L12 3Z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span className="text-[14px] font-semibold text-cream">
              1 connection on watchlist
            </span>
          </div>
          <span className="font-mono text-[12.5px] text-cream/45">
            <span key={tick} className="text-cream/70 ng-tick">
              {count}
            </span>{" "}
            connections · 1 watching
          </span>
        </div>
        <div className="divide-y divide-cream/[0.05]">
          {ROWS.map((r) => {
            const s = STATUS_TONES[r.state];
            return (
              <div
                key={r.proc}
                className={
                  "flex items-center gap-4 px-4 py-3 text-[13.5px] " +
                  (r.state === "watch" ? "border-l-2 border-amber bg-amber/[0.04]" : "")
                }
              >
                <span className="w-20 font-medium text-cream/90">{r.proc}</span>
                <span
                  className={
                    "flex-1 truncate font-mono text-[12.5px] " +
                    (r.state === "watch" ? "text-amber" : "text-cream/45")
                  }
                >
                  {r.dest}
                </span>
                <span className="font-mono text-[12px] text-cream/40">{r.kb}</span>
                <span className={`flex items-center gap-1.5 text-[12.5px] ${s.text}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* Scroll reveal — IntersectionObserver, once. */
export function RevealStub({
  children,
  className = "",
  delay = 0,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: React.ElementType;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced =
      typeof matchMedia !== "undefined" &&
      matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setInView(true);
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as React.Ref<HTMLElement>}
      className={`ng-reveal ${inView ? "in" : ""} ${className}`}
      style={{ transitionDelay: inView ? `${delay}ms` : "0ms" }}
    >
      {children}
    </Tag>
  );
}
