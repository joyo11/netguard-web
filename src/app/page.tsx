// Landing — v3 port (anchored on Variant B). Server component reads
// the auth session and swaps CTAs for signed-in users.

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Aurora, NetGuardGlyph, WordmarkV3 } from "@/components/v3";
import { LiveMock, RevealStub } from "@/components/landing-v3";

export const dynamic = "force-dynamic";

export default async function Landing() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAuthed = !!user;
  const email = user?.email ?? "";

  return (
    <div className="ng-scroll relative min-h-screen w-full overflow-y-auto bg-pitch font-display text-cream antialiased">
      <Aurora className="!h-[900px]" />
      <div className="relative z-10">
        <LandingNav isAuthed={isAuthed} email={email} />
        <LandingHero isAuthed={isAuthed} />
        <HowItWorks />
        <Features />
        <TrustStrip />
        <LandingFooter />
      </div>
    </div>
  );
}

function LandingNav({ isAuthed, email }: { isAuthed: boolean; email: string }) {
  return (
    <nav className="sticky top-0 z-30 border-b border-cream/[0.06] bg-pitch/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1180px] items-center justify-between px-5 py-4 sm:px-8">
        <Link href="/" className="ng-focus rounded">
          <WordmarkV3 />
        </Link>
        <div className="hidden items-center gap-8 text-[14px] text-cream/55 md:flex">
          <a href="#how" className="ng-focus rounded transition-colors hover:text-cream">
            How it works
          </a>
          <a href="#features" className="ng-focus rounded transition-colors hover:text-cream">
            Features
          </a>
          <a
            href="https://github.com/joyo11/NETGUARD"
            target="_blank"
            rel="noreferrer"
            className="ng-focus rounded transition-colors hover:text-cream"
          >
            Open source
          </a>
          <a
            href="https://github.com/joyo11/netguard-web#readme"
            target="_blank"
            rel="noreferrer"
            className="ng-focus rounded transition-colors hover:text-cream"
          >
            Docs
          </a>
        </div>
        {isAuthed ? (
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-2 rounded-full border border-cream/10 bg-cream/[0.04] py-1.5 pl-1.5 pr-3.5 text-[13px] text-cream/70 sm:flex">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-teal/20 text-[11px] font-semibold text-teal">
                {email[0]?.toUpperCase() ?? "?"}
              </span>
              <span className="max-w-[160px] truncate">{email}</span>
            </span>
            <Link
              href="/dashboard"
              className="ng-focus rounded-lg bg-teal px-4 py-2 text-[13.5px] font-semibold text-pitch transition-transform hover:scale-[1.03] active:scale-95"
            >
              Open dashboard →
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            <Link
              href="/auth/login"
              className="ng-focus rounded-lg px-3.5 py-2 text-[13.5px] text-cream/70 transition-colors hover:text-cream"
            >
              Sign in
            </Link>
            <Link
              href="/install"
              className="ng-focus rounded-lg bg-teal px-4 py-2 text-[13.5px] font-semibold text-pitch transition-transform hover:scale-[1.03] active:scale-95"
            >
              Get started
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}

function LandingHero({ isAuthed }: { isAuthed: boolean }) {
  return (
    <header className="mx-auto max-w-[1000px] px-5 pt-20 pb-12 text-center sm:px-8 sm:pt-28">
      <div className="ng-rise mb-7 inline-flex items-center gap-2 rounded-full border border-cream/10 bg-cream/[0.04] px-3.5 py-1.5 text-[12.5px] text-cream/60">
        <span className="h-1.5 w-1.5 rounded-full bg-teal ng-livedot" />
        Open source · runs entirely on your machine
      </div>
      <h1
        className="ng-rise mx-auto max-w-[12ch] font-semibold leading-[0.98] tracking-[-0.035em]"
        style={{ animationDelay: "60ms", fontSize: "clamp(40px,7.5vw,84px)" }}
      >
        Know what your computer is{" "}
        <span className="bg-gradient-to-br from-[#5ef0b0] to-teal bg-clip-text text-transparent">
          actually
        </span>{" "}
        doing online
      </h1>
      <p
        className="ng-rise mx-auto mt-7 max-w-[560px] leading-relaxed text-cream/55"
        style={{ animationDelay: "120ms", fontSize: "clamp(16px,2vw,19px)" }}
      >
        An AI security co-pilot that explains your network traffic in plain English — so you can
        stop guessing what&apos;s phoning home.
      </p>
      <div
        className="ng-rise mt-9 flex flex-wrap items-center justify-center gap-3"
        style={{ animationDelay: "180ms" }}
      >
        <Link
          href={isAuthed ? "/dashboard" : "/install"}
          className="ng-focus rounded-xl bg-teal px-6 py-3.5 text-[15px] font-semibold text-pitch shadow-[0_16px_44px_-14px_rgba(61,220,151,0.65)] transition-transform hover:scale-[1.03] active:scale-95"
        >
          {isAuthed ? "Open dashboard →" : "Get started — it's free"}
        </Link>
        <Link
          href="/chat"
          className="ng-focus rounded-xl border border-cream/14 bg-cream/[0.03] px-6 py-3.5 text-[15px] font-medium text-cream/85 transition-colors hover:bg-cream/[0.07]"
        >
          Open chat
        </Link>
      </div>
      <LiveMock />
    </header>
  );
}

function HowItWorks() {
  const steps = [
    {
      n: "01",
      t: "Install the agent",
      d: "A 6MB local agent reads connection metadata on your machine. No root, no payloads, fully open source.",
    },
    {
      n: "02",
      t: "Watch your traffic",
      d: "Live activity streams to your encrypted dashboard. Process, destination, port, bytes — nothing else.",
    },
    {
      n: "03",
      t: "Ask the AI",
      d: "Chat in plain English. NetGuard reads patterns, flags suspicious activity, and recommends action.",
    },
  ];
  return (
    <section id="how" className="mx-auto max-w-[1180px] px-5 py-24 sm:px-8">
      <RevealStub className="text-center">
        <p className="font-mono text-[12px] uppercase tracking-[0.3em] text-teal/70">How it works</p>
        <h2 className="mt-3 text-[clamp(28px,4vw,44px)] font-semibold tracking-[-0.03em]">
          Three steps from install to insight
        </h2>
      </RevealStub>
      <div className="mt-14 grid gap-5 md:grid-cols-3">
        {steps.map((s, i) => (
          <RevealStub
            key={s.n}
            delay={i * 80}
            className="ng-lift rounded-2xl border border-cream/[0.08] bg-cream/[0.025] p-7"
          >
            <span className="font-mono text-[15px] font-medium text-teal">{s.n}</span>
            <h3 className="mt-5 text-[20px] font-semibold tracking-tight">{s.t}</h3>
            <p className="mt-3 text-[15px] leading-relaxed text-cream/55">{s.d}</p>
          </RevealStub>
        ))}
      </div>
    </section>
  );
}

function Features() {
  const feats = [
    {
      t: "Watch your traffic",
      d: "Every connection your machine makes, in a calm live feed — process, destination, port, bytes.",
      svg: <ActivityIcon />,
    },
    {
      t: "Chat with the AI",
      d: "Ask in plain English. Claude reads the patterns and tells you what's normal and what isn't.",
      svg: <SparkIcon />,
    },
    {
      t: "Take action",
      d: "Get a clear recommendation, then decide. NetGuard never blocks or acts without your say-so.",
      svg: <ShieldIcon />,
    },
  ];
  return (
    <section id="features" className="mx-auto max-w-[1180px] px-5 pb-24 sm:px-8">
      <div className="grid gap-5 md:grid-cols-3">
        {feats.map((f, i) => (
          <RevealStub
            key={f.t}
            delay={i * 80}
            className="rounded-2xl border border-cream/[0.06] bg-gradient-to-b from-cream/[0.04] to-transparent p-7"
          >
            <span className="grid h-11 w-11 place-items-center rounded-xl border border-teal/20 bg-teal/[0.08] text-teal">
              {f.svg}
            </span>
            <h3 className="mt-5 text-[19px] font-semibold tracking-tight">{f.t}</h3>
            <p className="mt-3 text-[15px] leading-relaxed text-cream/55">{f.d}</p>
          </RevealStub>
        ))}
      </div>
    </section>
  );
}

function TrustStrip() {
  const items = [
    "Open source",
    "Runs locally",
    "Encrypted in transit",
    "Metadata only — never payloads",
  ];
  return (
    <RevealStub className="border-y border-cream/[0.06] bg-cream/[0.015]">
      <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-center gap-x-10 gap-y-4 px-5 py-7 sm:px-8">
        {items.map((t) => (
          <span key={t} className="flex items-center gap-2.5 text-[14.5px] text-cream/65">
            <CheckIcon /> {t}
          </span>
        ))}
      </div>
    </RevealStub>
  );
}

function LandingFooter() {
  const cols: { h: string; links: string[] }[] = [
    { h: "Product", links: ["Dashboard", "Chat", "Agent"] },
    { h: "Resources", links: ["Docs", "Open source", "Changelog"] },
    { h: "Company", links: ["About", "Privacy", "Contact"] },
  ];
  return (
    <footer className="mx-auto max-w-[1180px] px-5 py-16 sm:px-8">
      <div className="flex flex-col items-start justify-between gap-8 border-t border-cream/[0.06] pt-10 sm:flex-row">
        <div className="max-w-[320px]">
          <WordmarkV3 />
          <p className="mt-4 text-[13.5px] leading-relaxed text-cream/45">
            The open-source AI co-pilot for your network. Runs on your machine, answers to you.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-x-14 gap-y-2 text-[13.5px] sm:grid-cols-3">
          {cols.map(({ h, links }) => (
            <div key={h}>
              <p className="mb-3 font-medium text-cream/80">{h}</p>
              <ul className="space-y-2 text-cream/45">
                {links.map((l) => (
                  <li key={l}>
                    <a href="#" className="ng-focus rounded transition-colors hover:text-cream/80">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <p className="mt-10 font-mono text-[12px] text-cream/30">© 2026 NetGuard · MIT licensed</p>
    </footer>
  );
}

// Inline icons for the features section
function ActivityIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
      <path
        d="M3 12h4l2.5-6 5 14L17 12h4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function SparkIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
      <path d="M12 3l1.4 4.1L17.5 8.5 13.4 9.9 12 14l-1.4-4.1L6.5 8.5l4.1-1.4L12 3Z" />
    </svg>
  );
}
function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
      <path
        d="M12 3 5 5.6v5.3c0 4.1 2.8 7.4 7 9 4.2-1.6 7-4.9 7-9V5.6L12 3Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4 text-teal" fill="none">
      <path
        d="M3 8.5l3.5 3.5L13 4.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
