import Link from "next/link";
import {
  ChatIcon,
  Check,
  FeedIcon,
  Shield,
  ShieldFeatureIcon,
} from "@/components/icons";
import { AnimatedMock, RevealCard, RevealSection } from "@/components/landing-bits";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

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

export default async function Landing() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAuthed = !!user;
  const userInitial = (user?.email ?? "?").slice(0, 1).toUpperCase();

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
          {isAuthed ? (
            <>
              <span className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] py-1 pl-1 pr-3 text-[12.5px] text-ng-sub md:flex">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-gradient-to-br from-ng-teal/80 to-emerald-600 text-[11px] font-semibold text-ng-canvas">
                  {userInitial}
                </span>
                <span className="max-w-[160px] truncate">{user!.email}</span>
              </span>
              <Link
                href="/dashboard"
                className="rounded-lg bg-ng-teal px-3.5 py-2 text-[13.5px] font-semibold text-ng-canvas transition hover:bg-ng-teal/90"
              >
                Open dashboard →
              </Link>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      </header>

      {/* hero */}
      <section className="relative z-10 mx-auto w-full max-w-[1280px] px-8 pt-16 pb-10 text-center">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-[12px] text-ng-sub">
          <span className="h-1.5 w-1.5 rounded-full bg-ng-teal blink" />
          Open source · runs entirely on your machine
        </div>
        <h1
          className="mx-auto mt-8 max-w-[860px] font-semibold leading-[0.98] tracking-[-0.035em] text-ng-ink"
          style={{ textWrap: "balance", fontSize: "clamp(48px, 8vw, 96px)" }}
        >
          Know what your computer is{" "}
          <span className="bg-gradient-to-r from-ng-teal via-emerald-300 to-ng-teal bg-clip-text text-transparent">
            actually
          </span>{" "}
          doing online
        </h1>
        <p className="mx-auto mt-6 max-w-[580px] text-[17px] leading-relaxed text-ng-sub md:text-[18px]">
          An AI security co-pilot that explains your network traffic in plain English — so you can stop guessing what&apos;s phoning home.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {isAuthed ? (
            <>
              <Link
                href="/dashboard"
                className="rounded-xl bg-ng-teal px-5 py-3 text-[15px] font-semibold text-ng-canvas shadow-glow transition hover:bg-ng-teal/90"
              >
                Open dashboard →
              </Link>
              <Link
                href="/chat"
                className="rounded-xl border border-white/[0.1] bg-white/[0.03] px-5 py-3 text-[15px] font-medium text-ng-ink transition hover:bg-white/[0.06]"
              >
                Open chat
              </Link>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
        {!isAuthed && (
          <p className="mt-4 font-mono text-[12px] text-ng-faint">
            curl -fsSL https://get.netguard.sh | sh
          </p>
        )}
      </section>

      {/* product screenshot — now an animated mock that cycles scenes */}
      <RevealSection className="relative z-10 mx-auto w-full max-w-[1080px] px-4 pb-20 md:px-8">
        <AnimatedMock />
      </RevealSection>

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
          ].map((s, i) => (
            <RevealCard
              key={s.step}
              delay={i * 0.08}
              className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6 shadow-card backdrop-blur-xl"
            >
              <span className="font-mono text-[11px] font-semibold text-ng-teal">{s.step}</span>
              <h3 className="mt-3 text-[16px] font-semibold tracking-[-0.01em]">{s.title}</h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-ng-sub">{s.body}</p>
            </RevealCard>
          ))}
        </div>
      </section>

      {/* features */}
      <section
        id="features"
        className="relative z-10 mx-auto w-full max-w-[1080px] px-8 pb-8 scroll-mt-24"
      >
        <div className="grid gap-4 md:grid-cols-3">
          {FEATURES.map((f, i) => (
            <RevealCard
              key={f.title}
              delay={i * 0.08}
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
            </RevealCard>
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
