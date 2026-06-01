"use client";

// Auth — v3 port. One screen with three modes:
//   1. Sign in (email + password)
//   2. Create account (email + password + confirm)
//   3. Forgot password (email-only, triggers Supabase reset email)
// Google OAuth is the primary CTA on all three.

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";
import { Aurora, WordmarkV3 } from "@/components/v3";

type Mode = "signin" | "signup" | "forgot";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";
  const initialError = searchParams.get("error");

  const [mode, setMode] = useState<Mode>("signin");
  const [pending, setPending] = useState<"google" | "password" | null>(null);
  const [error, setError] = useState<string | null>(initialError);
  const [info, setInfo] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const switchTo = (m: Mode) => {
    setMode(m);
    setError(null);
    setInfo(null);
  };

  async function signInWithGoogle() {
    if (pending) return;
    setError(null);
    setInfo(null);
    setPending("google");
    const supabase = createClient();
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    if (err) {
      setPending(null);
      setError(err.message);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    setError(null);
    setInfo(null);
    setPending("password");
    const supabase = createClient();

    try {
      if (mode === "signin") {
        const { error: err } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (err) throw err;
        router.push(next);
        router.refresh();
        return;
      }
      if (mode === "signup") {
        if (password.length < 8) {
          throw new Error("Password must be at least 8 characters.");
        }
        if (password !== confirm) {
          throw new Error("Passwords don't match.");
        }
        const origin = typeof window !== "undefined" ? window.location.origin : "";
        const { error: err, data } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}` },
        });
        if (err) throw err;
        // If email confirmation is on, there's no session yet — tell the user.
        if (!data.session) {
          setInfo("Check your inbox to confirm your email, then sign in.");
          setMode("signin");
        } else {
          router.push(next);
          router.refresh();
        }
        return;
      }
      // forgot
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${origin}/auth/callback?next=${encodeURIComponent("/settings")}`,
      });
      if (err) throw err;
      setInfo("Reset link sent. Check your inbox.");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setPending(null);
    }
  }

  const title =
    mode === "signin" ? "Sign in to NetGuard"
      : mode === "signup" ? "Create your NetGuard account"
        : "Reset your password";
  const subtitle =
    mode === "signin" ? "One click with Google, or use your email and password."
      : mode === "signup" ? "Free, open source, runs on your machine. No card required."
        : "We'll email you a link to set a new password.";

  return (
    <div className="ng-scroll relative min-h-screen w-full overflow-y-auto bg-pitch font-display text-cream antialiased">
      <Aurora className="!h-[640px]" />

      <header className="relative z-10 mx-auto flex w-full max-w-[1180px] items-center justify-between px-5 py-5 sm:px-8">
        <Link href="/" className="ng-focus rounded">
          <WordmarkV3 />
        </Link>
        <Link
          href="/"
          className="ng-focus rounded-lg px-3.5 py-2 text-[13.5px] text-cream/55 transition-colors hover:text-cream"
        >
          ← Back
        </Link>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-[440px] flex-col items-stretch px-5 pb-20 pt-6 sm:px-8 sm:pt-14">
        <div className="ng-rise ng-bubble-ai rounded-2xl p-7">
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-cream">{title}</h1>
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-cream/55">{subtitle}</p>

          {mode !== "forgot" && (
            <>
              <button
                onClick={signInWithGoogle}
                disabled={pending !== null}
                className="ng-focus mt-6 flex w-full items-center justify-center gap-3 rounded-xl bg-cream py-3 text-[14px] font-semibold text-pitch transition hover:bg-cream/95 disabled:opacity-60"
              >
                {pending === "google" ? (
                  <>
                    <Spinner className="text-pitch" />
                    Opening Google…
                  </>
                ) : (
                  <>
                    <GoogleMark className="h-[18px] w-[18px]" />
                    Continue with Google
                  </>
                )}
              </button>

              <div className="my-5 flex items-center gap-3">
                <span className="h-px flex-1 bg-cream/[0.08]" />
                <span className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-cream/35">
                  or
                </span>
                <span className="h-px flex-1 bg-cream/[0.08]" />
              </div>
            </>
          )}

          <form onSubmit={submit} className="space-y-3">
            <Input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={setEmail}
              placeholder="you@example.com"
            />
            {mode !== "forgot" && (
              <Input
                type="password"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                required
                value={password}
                onChange={setPassword}
                placeholder={mode === "signup" ? "Pick a password (8+ chars)" : "Password"}
              />
            )}
            {mode === "signup" && (
              <Input
                type="password"
                autoComplete="new-password"
                required
                value={confirm}
                onChange={setConfirm}
                placeholder="Confirm password"
              />
            )}

            <button
              type="submit"
              disabled={pending !== null}
              className="ng-focus flex w-full items-center justify-center gap-2 rounded-xl bg-teal py-3 text-[14px] font-semibold text-pitch shadow-[0_12px_36px_-12px_rgba(61,220,151,0.6)] transition hover:bg-teal/90 disabled:opacity-60"
            >
              {pending === "password" ? (
                <>
                  <Spinner className="text-pitch" />
                  {mode === "signin" ? "Signing in…" : mode === "signup" ? "Creating…" : "Sending…"}
                </>
              ) : mode === "signin" ? (
                "Sign in"
              ) : mode === "signup" ? (
                "Create account"
              ) : (
                "Send reset link"
              )}
            </button>
          </form>

          {error && (
            <p className="mt-4 rounded-lg border border-danger/30 bg-danger/[0.06] px-3 py-2 text-[12.5px] text-danger">
              {error}
            </p>
          )}
          {info && (
            <p className="mt-4 rounded-lg border border-teal/25 bg-teal/[0.06] px-3 py-2 text-[12.5px] text-cream/80">
              {info}
            </p>
          )}

          {/* Mode-switch links */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-2 text-[12.5px]">
            {mode === "signin" && (
              <>
                <button
                  type="button"
                  onClick={() => switchTo("forgot")}
                  className="ng-focus rounded text-cream/55 transition-colors hover:text-cream"
                >
                  Forgot password?
                </button>
                <button
                  type="button"
                  onClick={() => switchTo("signup")}
                  className="ng-focus rounded text-cream/70 transition-colors hover:text-cream"
                >
                  Create an account →
                </button>
              </>
            )}
            {mode === "signup" && (
              <>
                <span className="text-cream/45">Already have one?</span>
                <button
                  type="button"
                  onClick={() => switchTo("signin")}
                  className="ng-focus rounded text-cream/70 transition-colors hover:text-cream"
                >
                  Sign in →
                </button>
              </>
            )}
            {mode === "forgot" && (
              <button
                type="button"
                onClick={() => switchTo("signin")}
                className="ng-focus rounded text-cream/55 transition-colors hover:text-cream"
              >
                ← Back to sign in
              </button>
            )}
          </div>
        </div>

        <p className="mt-5 text-center text-[11.5px] leading-relaxed text-cream/40">
          We only see your email so we can attach your network data to your account. Your Google
          password never reaches us.
        </p>
      </main>
    </div>
  );
}

function Input({
  type,
  value,
  onChange,
  placeholder,
  required,
  autoComplete,
}: {
  type: "email" | "password";
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
}) {
  return (
    <input
      type={type}
      required={required}
      autoComplete={autoComplete}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="ng-focus w-full rounded-xl border border-cream/10 bg-[#0a0d13] px-3.5 py-3 text-[14px] text-cream placeholder:text-cream/35 focus:border-teal/40 focus:outline-none"
    />
  );
}

function Spinner({ className = "" }: { className?: string }) {
  return (
    <span
      className={
        "h-4 w-4 rounded-full border-2 border-current/30 border-t-current animate-spin " + className
      }
    />
  );
}

function GoogleMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 18 18" className={className}>
      <path
        d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.836.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  );
}
