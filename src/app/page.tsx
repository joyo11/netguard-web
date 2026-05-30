import Link from "next/link";
import {
  ChatIcon,
  Check,
  FeedIcon,
  Shield,
  ShieldCheck,
  ShieldFeatureIcon,
} from "@/components/icons";

const FEATURES = [
  {
    title: "Watch your traffic",
    body: "Every connection your machine makes, in a calm live feed — process, destination, port, bytes.",
    icon: "feed" as const,
  },
  {
    title: "Chat with the AI",
    body: "Ask in plain English. Claude reads the patterns and tells you what's normal and what isn't.",
    icon: "chat" as const,
  },
  {
    title: "Take action",
    body: "Get a clear recommendation, then decide. NetGuard never blocks or acts without your say-so.",
    icon: "shield" as const,
  },
];

const MINI_FEED = [
  { app: "Chrome",  host: "google.com",          bytes: "12.4 KB", state: "safe"  as const },
  { app: "Slack",   host: "slack.com",           bytes: "3.2 KB",  state: "safe"  as const },
  { app: "unknown", host: "185.143.x.x (RO)",    bytes: "8 KB",    state: "alert" as const },
  { app: "TV-app",  host: "tracker.adcorp.net",  bytes: "4.1 KB",  state: "watch" as const },
];

export default function Landing() {
  return (
    <div className="grain ambient relative min-h-screen w-full overflow-hidden">
      {/* nav */}
      <header className="relative z-10 mx-auto flex w-full max-w-[1280px] items-center justify-between px-8 py-6">
        <div className="flex items-center gap-2.5">
          <Shield className="h-7 w-7" />
          <span className="text-[16px] font-semibold tracking-[-0.01em]">NetGuard</span>
        </div>
        <nav className="hidden items-center gap-8 text-[13.5px] text-ng-sub md:flex">
          <a className="transition hover:text-ng-ink" href="#features">Product</a>
          <a className="transition hover:text-ng-ink" href="#how">How it works</a>
          <a
            className="transition hover:text-ng-ink"
            href="https://github.com/joyo11/NETGUARD"
            target="_blank"
            rel="noreferrer"
          >
            Open source
          </a>
          <a
            className="transition hover:text-ng-ink"
            href="https://github.com/joyo11/netguard-web#readme"
            target="_blank"
            rel="noreferrer"
          >
            Docs
          </a>
        </nav>
        <div className="flex items-center gap-3">
          <Link
            href="/auth/login"
            className="text-[13.5px] text-ng-sub transition hover:text-ng-ink"
          >
            Sign in
          </Link>
          <Link
            href="/install"
            className="rounded-lg bg-ng-teal px-3.5 py-2 text-[13.5px] font-semibold text-ng-canvas transition hover:bg-ng-teal/90"
          >
            Get started
          </Link>
        </div>
      </header>

      {/* hero */}
      <section className="relative z-10 mx-auto w-full max-w-[1280px] px-8 pt-16 pb-10 text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-[12px] text-ng-sub">
          <span className="h-1.5 w-1.5 rounded-full bg-ng-teal blink" />
          Open source · runs entirely on your machine
        </div>
        <h1
          className="mx-auto mt-6 max-w-[760px] text-[52px] font-semibold leading-[1.05] tracking-[-0.03em] text-ng-ink"
          style={{ textWrap: "balance" }}
        >
          Know what your computer is actually doing online
        </h1>
        <p className="mx-auto mt-5 max-w-[560px] text-[17px] leading-relaxed text-ng-sub">
          An AI security co-pilot that explains your network traffic in plain English — so you can stop guessing what&apos;s phoning home.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href="/install"
            className="rounded-xl bg-ng-teal px-5 py-3 text-[15px] font-semibold text-ng-canvas shadow-glow transition hover:bg-ng-teal/90"
          >
            Get started — free
          </Link>
          <Link
            href="/dashboard"
            className="rounded-xl border border-white/[0.1] bg-white/[0.03] px-5 py-3 text-[15px] font-medium text-ng-ink transition hover:bg-white/[0.06]"
          >
            See a live demo
          </Link>
        </div>
        <p className="mt-4 font-mono text-[12px] text-ng-faint">curl -fsSL https://get.netguard.sh | sh</p>
      </section>

      {/* product screenshot (stylized dashboard mock) */}
      <section className="relative z-10 mx-auto w-full max-w-[1080px] px-8 pb-20">
        <div className="relative rounded-2xl border border-white/[0.08] bg-[#0c1118]/80 p-2.5 shadow-card backdrop-blur-xl">
          <div className="pointer-events-none absolute -inset-x-10 -top-10 h-40 bg-gradient-to-b from-ng-teal/10 to-transparent blur-2xl" />
          <div className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-ng-canvas">
            {/* window chrome */}
            <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
              <span className="ml-3 font-mono text-[11px] text-ng-faint">netguard.app/dashboard</span>
            </div>
            <div className="p-5">
              {/* status banner mock */}
              <div className="relative overflow-hidden rounded-xl border border-ng-teal/20 bg-ng-teal/[0.06] px-4 py-3">
                <span className="absolute inset-y-0 left-0 w-1 bg-ng-teal" />
                <div className="flex items-center justify-between pl-2">
                  <span className="flex items-center gap-2.5 text-[13.5px] font-semibold text-ng-ink">
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-ng-teal/15 text-ng-teal">
                      <ShieldCheck className="h-4 w-4" />
                    </span>
                    All quiet — 0 alerts today
                  </span>
                  <span className="tnum text-[12px] text-ng-sub">248 connections · 1 watching</span>
                </div>
              </div>
              {/* mini feed */}
              <div className="mt-3 overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02]">
                {MINI_FEED.map((r, i) => {
                  const tone =
                    r.state === "alert"
                      ? { t: "text-ng-red",   d: "bg-ng-red",   l: "Alert" }
                      : r.state === "watch"
                      ? { t: "text-ng-amber", d: "bg-ng-amber", l: "Watch" }
                      : { t: "text-ng-teal",  d: "bg-ng-teal",  l: "Safe"  };
                  return (
                    <div
                      key={i}
                      className="flex items-center justify-between border-t border-white/[0.04] px-4 py-2.5 first:border-t-0"
                    >
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
                      <span className="tnum w-20 text-right font-mono text-[12px] text-ng-sub">
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
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* how it works */}
      <section
        id="how"
        className="relative z-10 mx-auto w-full max-w-[1080px] px-8 pb-16 pt-2 scroll-mt-24"
      >
        <div className="mb-7 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ng-faint">
            How it works
          </p>
          <h2 className="mt-2 text-[28px] font-semibold tracking-[-0.02em] text-ng-ink">
            Three steps from install to insight
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              step: "01",
              title: "Install the agent",
              body: "A 6MB local agent reads connection metadata on your machine. No root, no payloads, fully open source.",
            },
            {
              step: "02",
              title: "Watch your traffic",
              body: "Live activity streams to your encrypted dashboard. Process, destination, port, bytes — nothing else.",
            },
            {
              step: "03",
              title: "Ask the AI",
              body: "Chat in plain English. NetGuard reads patterns, flags suspicious activity, and recommends action.",
            },
          ].map((s) => (
            <div
              key={s.step}
              className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 shadow-card backdrop-blur-xl"
            >
              <span className="font-mono text-[11px] font-semibold text-ng-teal">{s.step}</span>
              <h3 className="mt-3 text-[16px] font-semibold tracking-[-0.01em]">{s.title}</h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-ng-sub">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* features */}
      <section
        id="features"
        className="relative z-10 mx-auto w-full max-w-[1080px] px-8 pb-8 scroll-mt-24"
      >
        <div className="grid gap-4 md:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-6 shadow-card backdrop-blur-xl transition hover:border-white/[0.12]"
            >
              <span className="grid h-11 w-11 place-items-center rounded-xl border border-ng-teal/20 bg-ng-teal/[0.08] text-ng-teal">
                {f.icon === "feed" ? (
                  <FeedIcon className="h-5 w-5" />
                ) : f.icon === "chat" ? (
                  <ChatIcon className="h-5 w-5" />
                ) : (
                  <ShieldFeatureIcon className="h-5 w-5" />
                )}
              </span>
              <h3 className="mt-4 text-[16px] font-semibold tracking-[-0.01em]">{f.title}</h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-ng-sub">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* trust strip */}
      <section
        id="privacy"
        className="relative z-10 mx-auto w-full max-w-[1080px] px-8 py-14 scroll-mt-24"
      >
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {["Open source", "Runs locally", "Encrypted in transit", "Metadata only — never payloads"].map(
            (t) => (
              <span key={t} className="flex items-center gap-2.5 text-[14px] text-ng-sub">
                <Check className="h-4 w-4 text-ng-teal" /> {t}
              </span>
            )
          )}
        </div>
      </section>

      {/* footer */}
      <footer className="relative z-10 border-t border-white/[0.06]">
        <div className="mx-auto flex w-full max-w-[1280px] flex-col items-center justify-between gap-4 px-8 py-8 md:flex-row">
          <div className="flex items-center gap-2.5">
            <Shield className="h-5 w-5" />
            <span className="text-[13.5px] font-medium text-ng-sub">NetGuard</span>
          </div>
          <nav className="flex flex-wrap items-center justify-center gap-x-7 gap-y-2 text-[13px] text-ng-faint">
            <a
              className="transition hover:text-ng-sub"
              href="https://github.com/joyo11/netguard-web"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>
            <a
              className="transition hover:text-ng-sub"
              href="https://github.com/joyo11/netguard-web#readme"
              target="_blank"
              rel="noreferrer"
            >
              Docs
            </a>
            <a className="transition hover:text-ng-sub" href="#privacy">Privacy</a>
            <a className="transition hover:text-ng-sub" href="#privacy">Security</a>
          </nav>
          <p className="text-[12.5px] text-ng-faint">© 2026 NetGuard</p>
        </div>
      </footer>
    </div>
  );
}
