// Magic-link callback. Supabase redirects here after the user clicks the
// link in their email. We exchange the code for a session, set cookies,
// and forward to the next URL (default /dashboard).

import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as
    | "email"
    | "magiclink"
    | "signup"
    | "recovery"
    | "invite"
    | null;
  const next = url.searchParams.get("next") || "/dashboard";

  const supabase = await createClient();

  // Two possible flows depending on Supabase Auth's configured email link mode:
  //   - "code" flow (PKCE) — exchange ?code for a session
  //   - "token_hash" flow — verifyOtp({ type, token_hash })
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(
        new URL(
          `/auth/login?error=${encodeURIComponent(error.message)}`,
          url.origin
        )
      );
    }
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (error) {
      return NextResponse.redirect(
        new URL(
          `/auth/login?error=${encodeURIComponent(error.message)}`,
          url.origin
        )
      );
    }
  } else {
    return NextResponse.redirect(
      new URL("/auth/login?error=missing_code", url.origin)
    );
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
