// Install Agent — v3 port. Server component reads the user + token,
// then hands off to the client wrapper which polls connection status
// every 5s and flips the page to "connected" once the agent phones home.

import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { Aurora, WordmarkV3 } from "@/components/v3";
import { AccountMenu } from "@/components/account-menu";
import { InstallClient } from "./install-client";

export const dynamic = "force-dynamic";

function mintToken(): string {
  return "ng_live_" + randomBytes(24).toString("hex");
}

async function getOrCreateAgentToken(userId: string): Promise<{
  token: string;
  alreadyInstalled: boolean;
}> {
  const admin = createServiceClient();
  const { data: existing } = await admin
    .from("agent_tokens")
    .select("token, last_used_at")
    .eq("user_id", userId)
    .is("revoked_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing?.token) {
    return {
      token: existing.token,
      alreadyInstalled: existing.last_used_at != null,
    };
  }
  const token = mintToken();
  await admin.from("agent_tokens").insert({ user_id: userId, token, label: "default" });
  return { token, alreadyInstalled: false };
}

export default async function InstallPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/install");

  const { token, alreadyInstalled } = await getOrCreateAgentToken(user!.id);
  if (alreadyInstalled) redirect("/dashboard");

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const origin = `${proto}://${host}`;
  const installCmd = `curl -fsSL ${origin}/install.sh | NG_TOKEN=${token} NG_ENDPOINT=${origin} bash`;

  return (
    <div className="ng-scroll relative min-h-screen w-full overflow-y-auto bg-pitch font-display text-cream antialiased">
      <Aurora className="!h-[520px]" />

      <header className="relative z-10 mx-auto flex w-full max-w-[1180px] items-center justify-between px-5 py-5 sm:px-8">
        <Link href="/" className="ng-focus rounded">
          <WordmarkV3 />
        </Link>
        <AccountMenu email={user!.email ?? ""} placement="header" />
      </header>

      <InstallClient installCmd={installCmd} token={token} />
    </div>
  );
}
