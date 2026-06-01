// POST /api/account/delete — irreversibly removes the signed-in user.
// Cascades through connections + agent_tokens + profile, then deletes
// the auth user itself via the service-role admin API. The client gets
// signed out as a side effect and is redirected home.

import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createServiceClient();
  // Delete in dependency order. Errors swallowed individually so a
  // partial failure doesn't strand the auth user with no data.
  await admin.from("connections").delete().eq("user_id", user.id);
  await admin.from("agent_tokens").delete().eq("user_id", user.id);
  await admin.from("profiles").delete().eq("id", user.id);

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Clear the local session cookies.
  await supabase.auth.signOut();

  // Honor a JSON-only flag so the client can show its own confirmation
  // before navigating; default behaviour is to redirect home.
  if (req.headers.get("accept") === "application/json") {
    return NextResponse.json({ ok: true });
  }
  return NextResponse.redirect(new URL("/", req.url), { status: 303 });
}
