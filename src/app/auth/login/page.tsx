"use client";

// Auth page: Google OAuth (primary) + email/password (fallback).
// Magic links were dropped earlier (rate limit). Password form added
// per Vinod's pivot when Google OAuth got stuck.

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Shield } from "@/components/icons";
import { createClient } from "@/lib/supabase/browser";

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
  const [pending, setPending] = useState<"google" | "password" | null>(null);
  const [error, setError] = useState<string | null>(initialError);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function signInWithGoogle() {
    if (pending) return;
    setError(null);
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

  async function signInWithPassword(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    setError(null);
    setPending("password");
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (err) {
      setPending(null);
      setError(err.message);
      return;
    }
    router.push(next);
    router.refresh();
  }

  return (
    <div className="grain ambient relative min-h-screen w-full overflow-hidden">
      <header className="relative z-10 mx-auto flex w-full max-w-[1280px] items-center justify-between px-8 py-6">
        <Link href="/" className="flex items-center gap-2.5">
          <Shield className="h-7 w-7" />
          <span className="text-[16px] font-semibold tracking-[-0.01em]">NetGuard</span>
        </Link>
      </header>

      <main className="relative z-10 flex min-h-[calc(100vh-88px)] items-center justify-center px-6 pb-24">
        <div className="w-full max-w-[400px]">
          <div className="relative rounded-[20px] border border-white/[0.07] bg-white/[0.025] p-7 shadow-card backdrop-blur-xl">
            <div className="pointer-events-none absolute inset-x-7 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-ng-ink">
              Sign in to NetGuard
            </h1>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-ng-sub">
              One click with Google, or use your email and password.
            </p>

            <button
              onClick={signInWithGoogle}
              disabled={pending !== null}
              className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl bg-white py-3 text-[14px] font-semibold text-[#1f2024] transition hover:bg-white/95 disabled:opacity-60"
            >
              {pending === "google" ? (
                <>
                  <span className="h-4 w-4 rounded-full border-2 border-[#1f2024]/30 border-t-[#1f2024] animate-spin" />
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
              <span className="h-px flex-1 bg-white/[0.07]" />
              <span className="text-[11px] uppercase tracking-[0.18em] text-ng-faint">or</span>
              <span className="h-px flex-1 bg-white/[0.07]" />
            </div>

            <form onSubmit={signInWithPassword} className="space-y-3">
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-white/[0.09] bg-[#0a0d13] px-3.5 py-3 text-[14px] text-ng-ink placeholder:text-ng-faint focus:border-ng-teal/40 focus:outline-none"
              />
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full rounded-xl border border-white/[0.09] bg-[#0a0d13] px-3.5 py-3 text-[14px] text-ng-ink placeholder:text-ng-faint focus:border-ng-teal/40 focus:outline-none"
              />
              <button
                type="submit"
                disabled={pending !== null}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-ng-teal py-3 text-[14px] font-semibold text-ng-canvas shadow-glow transition hover:bg-ng-teal/90 disabled:opacity-60"
              >
                {pending === "password" ? (
                  <>
                    <span className="h-4 w-4 rounded-full border-2 border-ng-canvas/30 border-t-ng-canvas animate-spin" />
                    Signing in…
                  </>
                ) : (
                  "Sign in with email"
                )}
              </button>
            </form>

            {error && (
              <p className="mt-4 rounded-lg border border-ng-red/20 bg-ng-red/[0.06] px-3 py-2 text-[12.5px] text-ng-red">
                {error}
              </p>
            )}

            <p className="mt-5 text-center text-[11.5px] leading-relaxed text-ng-faint">
              We never see your Google password. We only get your email so we can attach your
              network data to your account.
            </p>
          </div>

          <p className="mt-5 text-center text-[12px] text-ng-faint">
            New here?{" "}
            <Link href="/" className="text-ng-sub hover:text-ng-ink">
              See what NetGuard does
            </Link>
          </p>
        </div>
      </main>
    </div>
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
