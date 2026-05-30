// Email magic-link login — no passwords, no OAuth setup needed.
// Server action submits the email, Supabase sends a link, user clicks it,
// /auth/callback verifies and lands them on the next URL.

import { Shield } from "@/components/icons";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

type SearchParams = Promise<{ next?: string; sent?: string; error?: string }>;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const sent = sp.sent === "1";
  const error = sp.error;
  const next = sp.next || "/dashboard";

  async function sendMagicLink(formData: FormData) {
    "use server";
    const email = String(formData.get("email") || "").trim().toLowerCase();
    const next = String(formData.get("next") || "/dashboard");

    if (!email || !email.includes("@")) {
      redirect(`/auth/login?next=${encodeURIComponent(next)}&error=invalid_email`);
    }

    const supabase = await createClient();
    const origin =
      process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000";

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });

    if (error) {
      redirect(
        `/auth/login?next=${encodeURIComponent(next)}&error=${encodeURIComponent(error.message)}`
      );
    }

    redirect(`/auth/login?next=${encodeURIComponent(next)}&sent=1`);
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

            {sent ? (
              <CheckEmailState />
            ) : (
              <>
                <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-ng-ink">
                  Sign in to NetGuard
                </h1>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-ng-sub">
                  Enter your email and we&apos;ll send you a one-time sign-in link.
                </p>

                <form action={sendMagicLink} className="mt-6 space-y-3">
                  <input type="hidden" name="next" value={next} />
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-white/[0.09] bg-[#0a0d13] px-3.5 py-3 text-[14px] text-ng-ink placeholder:text-ng-faint focus:border-ng-teal/40 focus:outline-none"
                  />

                  {error && (
                    <p className="rounded-lg border border-ng-red/20 bg-ng-red/[0.06] px-3 py-2 text-[12.5px] text-ng-red">
                      {error === "invalid_email" ? "That doesn't look like a valid email." : error}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="w-full rounded-xl bg-ng-teal py-3 text-[14px] font-semibold text-ng-canvas shadow-glow transition hover:bg-ng-teal/90"
                  >
                    Send sign-in link
                  </button>
                </form>

                <p className="mt-5 text-center text-[12px] text-ng-faint">
                  No password to remember. We&apos;ll email you a link that signs you in.
                </p>
              </>
            )}
          </div>

          <p className="mt-5 text-center text-[12px] text-ng-faint">
            New here?{" "}
            <Link href="/install" className="text-ng-sub hover:text-ng-ink">
              Start with the install guide
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

function CheckEmailState() {
  return (
    <div>
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-ng-teal/15 text-ng-teal">
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M3 7l9 6 9-6M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7M3 7l2-2h14l2 2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h1 className="mt-4 text-center text-[20px] font-semibold tracking-[-0.02em]">
        Check your email
      </h1>
      <p className="mx-auto mt-2 max-w-[300px] text-center text-[13.5px] leading-relaxed text-ng-sub">
        We sent you a one-time sign-in link. Click it and you&apos;ll land back here, signed in.
      </p>
      <p className="mt-5 text-center text-[12px] text-ng-faint">
        Didn&apos;t arrive in a minute or two? Check spam or{" "}
        <Link href="/auth/login" className="text-ng-sub underline decoration-white/20 underline-offset-4 hover:text-ng-ink">
          try again
        </Link>
      </p>
    </div>
  );
}
