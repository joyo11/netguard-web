// Chat — server wrapper that fetches the user's latest hostname (real
// machine name from the agent) and passes it to the client component
// for the live header.

import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { ChatClient } from "./chat-client";

export const dynamic = "force-dynamic";

export default async function ChatPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/chat");

  const admin = createServiceClient();
  const { data: latest } = await admin
    .from("connections")
    .select("hostname")
    .eq("user_id", user!.id)
    .order("ts", { ascending: false })
    .limit(1)
    .maybeSingle();

  return <ChatClient hostname={latest?.hostname ?? null} />;
}
