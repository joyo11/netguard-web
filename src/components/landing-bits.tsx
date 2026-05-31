"use client";

// Landing page interactive bits — kept separate so the page itself can
// stay a server component. Aaron's call: the mock should be ALIVE, not
// a screenshot, and cards should reveal on scroll.

import { motion } from "framer-motion";
import { useEffect, useState, type ReactNode } from "react";
import { ShieldCheck } from "@/components/icons";

type MockRow = {
  app: string;
  host: string;
  bytes: string;
  state: "safe" | "watch" | "alert";
};

// Three different "scenes" the mock cycles through. Each shows a slightly
// different mix of activity so the page feels alive without being noisy.
const SCENES: MockRow[][] = [
  [
    { app: "Chrome",  host: "google.com",         bytes: "12.4 KB", state: "safe"  },
    { app: "Slack",   host: "slack.com",          bytes: "3.2 KB",  state: "safe"  },
    { app: "unknown", host: "185.143.x.x (RO)",   bytes: "8 KB",    state: "alert" },
    { app: "TV-app",  host: "tracker.adcorp.net", bytes: "4.1 KB",  state: "watch" },
  ],
  [
    { app: "Cursor",  host: "anthropic.com",       bytes: "44 KB",  state: "safe"  },
    { app: "Chrome",  host: "doubleclick.net",     bytes: "2.8 KB", state: "watch" },
    { app: "Mail",    host: "imap.fastmail.com",   bytes: "1.9 KB", state: "safe"  },
    { app: "Docker",  host: "registry-1.docker.io", bytes: "540 KB", state: "safe" },
  ],
  [
    { app: "Spotify", host: "audio-fa.scdn.co",   bytes: "240 KB", state: "safe"  },
    { app: "sshd",    host: "92.247.x.x (BG)",    bytes: "8 KB",   state: "alert" },
    { app: "Code",    host: "github.com",         bytes: "62 KB",  state: "safe"  },
    { app: "Apple",   host: "icloud.com",         bytes: "1.1 MB", state: "safe"  },
  ],
];

export function AnimatedMock() {
  const [sceneIdx, setSceneIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setSceneIdx((i) => (i + 1) % SCENES.length);
    }, 4500);
    return () => clearInterval(id);
  }, []);

  const scene = SCENES[sceneIdx];
  const alertCount = scene.filter((r) => r.state === "alert").length;
  const watchCount = scene.filter((r) => r.state === "watch").length;

  return (
    <div className="relative rounded-2xl border border-white/[0.08] bg-[#0c1118]/80 p-2.5 shadow-card backdrop-blur-xl">
      <div className="pointer-events-none absolute -inset-x-10 -top-10 h-40 bg-gradient-to-b from-ng-teal/10 to-transparent blur-2xl" />
      <div className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-ng-canvas">
        {/* window chrome */}
        <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <span className="ml-3 font-mono text-[11px] text-ng-faint">netguard-web.vercel.app/dashboard</span>
        </div>
        <div className="p-5">
          {/* status banner — color shifts with scene */}
          <motion.div
            key={`banner-${sceneIdx}`}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className={
              "relative overflow-hidden rounded-xl border px-4 py-3 " +
              (alertCount > 0
                ? "border-ng-red/20 bg-ng-red/[0.06]"
                : watchCount > 0
                ? "border-ng-amber/20 bg-ng-amber/[0.06]"
                : "border-ng-teal/20 bg-ng-teal/[0.06]")
            }
          >
            <span
              className={
                "absolute inset-y-0 left-0 w-1 " +
                (alertCount > 0 ? "bg-ng-red" : watchCount > 0 ? "bg-ng-amber" : "bg-ng-teal")
              }
            />
            <div className="flex items-center justify-between pl-2">
              <span className="flex items-center gap-2.5 text-[13.5px] font-semibold text-ng-ink">
                <span
                  className={
                    "grid h-7 w-7 place-items-center rounded-full " +
                    (alertCount > 0
                      ? "bg-ng-red/15 text-ng-red"
                      : watchCount > 0
                      ? "bg-ng-amber/15 text-ng-amber"
                      : "bg-ng-teal/15 text-ng-teal")
                  }
                >
                  <ShieldCheck className="h-4 w-4" />
                </span>
                {alertCount > 0
                  ? `${alertCount} alert${alertCount === 1 ? "" : "s"} need review`
                  : watchCount > 0
                  ? `${watchCount} connection${watchCount === 1 ? "" : "s"} on watchlist`
                  : "All quiet — 0 alerts today"}
              </span>
              <span className="tnum hidden text-[12px] text-ng-sub sm:inline">
                {248 + sceneIdx * 7} connections · {watchCount} watching
              </span>
            </div>
          </motion.div>

          {/* feed — rows fade in as scene changes */}
          <div className="mt-3 overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02]">
            {scene.map((r, i) => {
              const tone =
                r.state === "alert"
                  ? { t: "text-ng-red",   d: "bg-ng-red",   l: "Alert", bar: "bg-ng-red"   }
                  : r.state === "watch"
                  ? { t: "text-ng-amber", d: "bg-ng-amber", l: "Watch", bar: "bg-ng-amber" }
                  : { t: "text-ng-teal",  d: "bg-ng-teal",  l: "Safe",  bar: "bg-transparent" };
              return (
                <motion.div
                  key={`${sceneIdx}-${i}`}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05, ease: "easeOut" }}
                  className="relative flex items-center justify-between border-t border-white/[0.04] px-4 py-2.5 first:border-t-0"
                >
                  <span className={"absolute inset-y-0 left-0 w-[2px] " + tone.bar} />
                  <span className="w-24 text-[12.5px] font-medium text-ng-ink">{r.app}</span>
                  <span
                    className={
                      "flex-1 truncate font-mono text-[12px] " +
                      (r.state === "alert"
                        ? "text-ng-red"
                        : r.state === "watch"
                        ? "text-ng-amber"
                        : "text-ng-sub")
                    }
                  >
                    {r.host}
                  </span>
                  <span className="tnum hidden w-20 text-right font-mono text-[12px] text-ng-sub sm:inline">
                    {r.bytes}
                  </span>
                  <span
                    className={
                      "ml-4 flex w-16 items-center justify-end gap-1.5 text-[11px] font-medium " +
                      tone.t
                    }
                  >
                    <span className={"h-1.5 w-1.5 rounded-full " + tone.d} />
                    {tone.l}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// Scroll-reveal wrapper. Fires once when entering viewport.
export function RevealCard({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, delay, ease: [0.2, 0.8, 0.4, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function RevealSection({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, ease: [0.2, 0.8, 0.4, 1] }}
      className={className}
    >
      {children}
    </motion.section>
  );
}
