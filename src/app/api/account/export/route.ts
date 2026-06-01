// GET /api/account/export — returns a JSON dump of everything we hold
// for the signed-in user: profile, agent tokens, connections.

import { createClient, createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const admin = createServiceClient();
  const [profile, tokens, connections] = await Promise.all([
    admin.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    admin
      .from("agent_tokens")
      .select("token, label, created_at, last_used_at, revoked_at")
      .eq("user_id", user.id),
    admin
      .from("connections")
      .select("*")
      .eq("user_id", user.id)
      .order("ts", { ascending: false }),
  ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    user: { id: user.id, email: user.email, createdAt: user.created_at },
    profile: profile.data ?? null,
    agentTokens: tokens.data ?? [],
    connections: connections.data ?? [],
  };

  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="netguard-export-${stamp}.json"`,
    },
  });
}
