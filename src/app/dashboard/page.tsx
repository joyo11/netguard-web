// Dashboard — server component. Reads the authed user, pulls real
// traffic data, hands it to the client wrapper for interaction.
//
// Per Vinod: empty state IS the install command — single source of
// truth for "you have no data yet, here's what to do".

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getRecentFeed, getSummary, type Connection } from "@/data/traffic";
import { randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { DashboardClient } from "./dashboard-client";

export const dynamic = "force-dynamic";

function mintToken(): string {
  return "ng_live_" + randomBytes(24).toString("hex");
}

async function getOrCreateAgentToken(userId: string): Promise<string> {
  const admin = createServiceClient();
  const { data: existing } = await admin
    .from("agent_tokens")
    .select("token")
    .eq("user_id", userId)
    .is("revoked_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existing?.token) return existing.token;
  const token = mintToken();
  await admin.from("agent_tokens").insert({ user_id: userId, token, label: "default" });
  return token;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/dashboard");

  const [feed, summary, token] = await Promise.all([
    getRecentFeed(user!.id, 40),
    getSummary(user!.id),
    getOrCreateAgentToken(user!.id),
  ]);

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const origin = `${proto}://${host}`;
  const installCmd = `curl -fsSL ${origin}/install.sh | NG_TOKEN=${token} NG_ENDPOINT=${origin} bash`;

  return (
    <DashboardClient
      feed={feed as Connection[]}
      summary={summary}
      installCmd={installCmd}
      userEmail={user!.email ?? ""}
    />
  );
}
