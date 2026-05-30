// Install Agent — server component wired to the real user + agent token.
// The install command embeds the user's token so they can paste-and-go.

import Link from "next/link";
import { redirect } from "next/navigation";
import { Shield } from "@/components/icons";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { InstallClient } from "./install-client";

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

export default async function InstallPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login?next=/install");
  }

  const token = await getOrCreateAgentToken(user!.id);

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const origin = `${proto}://${host}`;
  const installCmd = `curl -fsSL ${origin}/install.sh | NG_TOKEN=${token} NG_ENDPOINT=${origin} bash`;

  return (
    <div className="grain ambient relative min-h-screen w-full overflow-hidden">
      <header className="relative z-10 mx-auto flex w-full max-w-[1280px] items-center justify-between px-8 py-6">
        <Link href="/" className="flex items-center gap-2.5">
          <Shield className="h-7 w-7" />
          <span className="text-[16px] font-semibold tracking-[-0.01em]">NetGuard</span>
        </Link>
        <div className="flex items-center gap-3 text-[13px] text-ng-sub">
          <span>Signed in as</span>
          <span className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] py-1 pl-1 pr-3">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-gradient-to-br from-ng-teal/80 to-emerald-600 text-[11px] font-semibold uppercase text-ng-canvas">
              {(user!.email ?? "U").slice(0, 1)}
            </span>
            <span className="truncate max-w-[200px]">{user!.email}</span>
          </span>
        </div>
      </header>

      <InstallClient installCmd={installCmd} token={token} />
    </div>
  );
}
