// Server-side Supabase clients.
//
// `createClient` — cookie-aware client that respects the user's session.
//   Use in Server Components, Server Actions, and Route Handlers when
//   you need to act as the logged-in user (RLS applies).
//
// `createServiceClient` — bypasses RLS via the secret key. ONLY use in
//   trusted server code (e.g. /api/ingest after agent-token validation).
//   Never expose this to the client.

import { createServerClient } from "@supabase/ssr";
import { createClient as createSdkClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Components can't set cookies — middleware handles refresh.
          }
        },
      },
    }
  );
}

export function createServiceClient() {
  return createSdkClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    }
  );
}
