// Settings — v3 port. Server shell pulls the auth session so the
// header can greet the signed-in user.

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SettingsClient } from "./settings-client";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/settings");

  return <SettingsClient email={user.email ?? ""} />;
}
