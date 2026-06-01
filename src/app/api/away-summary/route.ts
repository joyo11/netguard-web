// GET /api/away-summary — computes activity since the user's last
// dashboard visit, asks Claude to summarize it in one or two
// sentences, and bumps last_dashboard_seen_at to "now" so the next
// call captures a fresh window.

import Anthropic from "@anthropic-ai/sdk";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = "claude-haiku-4-5-20251001";
const DEFAULT_LOOKBACK_MS = 60 * 60 * 1000; // 1h if no last-seen
const MAX_LOOKBACK_MS = 7 * 24 * 60 * 60 * 1000; // cap at 7 days

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createServiceClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("last_dashboard_seen_at")
    .eq("id", user.id)
    .maybeSingle();

  const lastSeenIso = profile?.last_dashboard_seen_at as string | null | undefined;
  const now = Date.now();
  const sinceMs = lastSeenIso
    ? Math.max(now - MAX_LOOKBACK_MS, new Date(lastSeenIso).getTime())
    : now - DEFAULT_LOOKBACK_MS;
  const sinceIso = new Date(sinceMs).toISOString();

  // Activity counts in the window.
  const [{ count: total }, { data: alerts }, { data: watches }, { data: sample }] = await Promise.all([
    admin
      .from("connections")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("ts", sinceIso),
    admin
      .from("connections")
      .select("app, remote_host, port")
      .eq("user_id", user.id)
      .eq("state", "alert")
      .gte("ts", sinceIso)
      .order("ts", { ascending: false })
      .limit(20),
    admin
      .from("connections")
      .select("app, remote_host, port")
      .eq("user_id", user.id)
      .eq("state", "watch")
      .gte("ts", sinceIso)
      .order("ts", { ascending: false })
      .limit(20),
    // Top apps by row count in the window (cheap: read 200, group in JS)
    admin
      .from("connections")
      .select("app, remote_host")
      .eq("user_id", user.id)
      .gte("ts", sinceIso)
      .order("ts", { ascending: false })
      .limit(200),
  ]);

  // Always advance the seen-at pointer so the next call shows a fresh delta.
  void admin
    .from("profiles")
    .update({ last_dashboard_seen_at: new Date(now).toISOString() })
    .eq("id", user.id);

  const totalCount = total ?? 0;
  const isFirstVisit = !lastSeenIso;
  const minutesAway = lastSeenIso ? Math.round((now - new Date(lastSeenIso).getTime()) / 60000) : 0;

  // Empty path — no AI call needed.
  if (totalCount === 0) {
    return NextResponse.json({
      summary: isFirstVisit
        ? "Welcome back. The agent hasn't reported anything yet."
        : minutesAway < 5
          ? "Nothing new since you last looked."
          : `Quiet for the last ${formatGap(minutesAway)}. No alerts.`,
      since: sinceIso,
      counts: { total: 0, alerts: 0, watches: 0 },
      empty: true,
    });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // Fallback summary without AI so the card still renders.
    return NextResponse.json({
      summary:
        `${totalCount} connection${totalCount === 1 ? "" : "s"} in the last ${formatGap(minutesAway || 60)}` +
        ((alerts?.length ?? 0) > 0 ? `, ${alerts!.length} flagged.` : ", nothing flagged."),
      since: sinceIso,
      counts: {
        total: totalCount,
        alerts: alerts?.length ?? 0,
        watches: watches?.length ?? 0,
      },
      empty: false,
    });
  }

  // Group apps for the prompt context.
  const appCounts = new Map<string, number>();
  const hosts = new Set<string>();
  for (const r of sample ?? []) {
    const a = (r.app as string | null) ?? "unknown";
    appCounts.set(a, (appCounts.get(a) ?? 0) + 1);
    if (r.remote_host) hosts.add(r.remote_host as string);
  }
  const topApps = Array.from(appCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const prompt = `You are NetGuard summarizing what happened on the user's machine while they were away.

Window: ${isFirstVisit ? "last hour (first visit)" : `${formatGap(minutesAway)} away`}
Total connections: ${totalCount}
Alerts (${alerts?.length ?? 0}): ${(alerts ?? []).slice(0, 5).map((a) => `${a.app ?? "?"} → ${a.remote_host ?? "?"}:${a.port ?? "?"}`).join(", ") || "none"}
Watch (${watches?.length ?? 0}): ${(watches ?? []).slice(0, 5).map((a) => `${a.app ?? "?"} → ${a.remote_host ?? "?"}:${a.port ?? "?"}`).join(", ") || "none"}
Top apps: ${topApps.map(([a, n]) => `${a} (${n})`).join(", ")}

Write ONE sentence (max two) summarizing what happened. Lead with anything alarming. If everything is quiet, say so plainly. Be specific (name an app or host when interesting). No dashes (— or –). No greeting, no sign-off, no "tldr" or "summary:" prefix. Just the sentence.`;

  try {
    const client = new Anthropic({ apiKey });
    const resp = await client.messages.create({
      model: MODEL,
      max_tokens: 180,
      messages: [{ role: "user", content: prompt }],
    });
    const text = resp.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();

    return NextResponse.json({
      summary: text || "Activity continues. Open the feed for details.",
      since: sinceIso,
      counts: {
        total: totalCount,
        alerts: alerts?.length ?? 0,
        watches: watches?.length ?? 0,
      },
      empty: false,
    });
  } catch (e) {
    return NextResponse.json({
      summary:
        `${totalCount} connection${totalCount === 1 ? "" : "s"} since you last looked` +
        ((alerts?.length ?? 0) > 0 ? `, ${alerts!.length} flagged.` : ", nothing flagged."),
      since: sinceIso,
      counts: {
        total: totalCount,
        alerts: alerts?.length ?? 0,
        watches: watches?.length ?? 0,
      },
      empty: false,
      error: e instanceof Error ? e.message : String(e),
    });
  }
}

function formatGap(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"}`;
}
