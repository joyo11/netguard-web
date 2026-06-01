// Traffic queries — real Postgres via Supabase service-role client.
// Functions are scoped to a userId and return only that user's data.
// Same shape as the old mock.ts so /api/chat tools didn't need rewriting.

import { createServiceClient } from "@/lib/supabase/server";
import { humanizeApp } from "@/lib/humanize";

export type ConnectionState = "safe" | "watch" | "alert";

export type Connection = {
  t: string; // HH:MM
  app: string;
  proc: string;
  host: string;
  cc: string;
  port: number;
  bytes: string;
  state: ConnectionState;
};

type DbRow = {
  ts: string;
  app: string | null;
  proc: string | null;
  remote_host: string | null;
  remote_ip: string | null;
  cc: string | null;
  port: number | null;
  bytes_out: number | null;
  bytes_in: number | null;
  state: ConnectionState;
};

function rowToConnection(r: DbRow): Connection {
  const total = (r.bytes_out ?? 0) + (r.bytes_in ?? 0);
  return {
    t: new Date(r.ts).toISOString().slice(11, 16), // HH:MM (UTC)
    app: humanizeApp(r.app),
    proc: r.proc ?? r.app ?? "",
    host: r.remote_host ?? r.remote_ip ?? "",
    cc: r.cc ?? "··",
    port: r.port ?? 0,
    bytes: formatBytes(total),
    state: r.state,
  };
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Tools used by /api/chat ────────────────────────────────────────────

// Optional machine filter passed through to every query so a user
// with multiple agents installed can scope the view.
export type MachineFilter = string | undefined;

function applyMachine<Q extends { eq: (col: string, val: string) => Q }>(
  q: Q,
  machine: MachineFilter
): Q {
  return machine ? q.eq("hostname", machine) : q;
}

export async function getSummary(userId: string, machine?: MachineFilter) {
  const admin = createServiceClient();
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const since1h = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const { count: total24h } = await applyMachine(
    admin
      .from("connections")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("ts", since24h),
    machine
  );

  const { count: total1h } = await applyMachine(
    admin
      .from("connections")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("ts", since1h),
    machine
  );

  const { count: alerts } = await applyMachine(
    admin
      .from("connections")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("state", "alert")
      .gte("ts", since24h),
    machine
  );

  const { count: watching } = await applyMachine(
    admin
      .from("connections")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("state", "watch")
      .gte("ts", since24h),
    machine
  );

  const { data: tokenRow } = await admin
    .from("agent_tokens")
    .select("last_used_at")
    .eq("user_id", userId)
    .is("revoked_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: latest } = await applyMachine(
    admin
      .from("connections")
      .select("hostname")
      .eq("user_id", userId)
      .order("ts", { ascending: false })
      .limit(1),
    machine
  ).maybeSingle();

  return {
    totalConnections24h: total24h ?? 0,
    totalConnectionsLastHour: total1h ?? 0,
    watching: watching ?? 0,
    alerts: alerts ?? 0,
    agentLastSeenAt: tokenRow?.last_used_at ?? null,
    hostname: latest?.hostname ?? null,
  };
}

// Lists every machine that's posted at least one connection. Used by
// the dashboard switcher.
export async function getMachines(userId: string) {
  const admin = createServiceClient();
  const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await admin
    .from("connections")
    .select("hostname, ts")
    .eq("user_id", userId)
    .gte("ts", since30d)
    .order("ts", { ascending: false })
    .limit(2000);

  const seen = new Map<string, { hostname: string; lastSeenAt: string; count: number }>();
  for (const row of data ?? []) {
    const h = (row.hostname ?? "unknown") as string;
    const existing = seen.get(h);
    if (existing) {
      existing.count += 1;
    } else {
      seen.set(h, { hostname: h, lastSeenAt: row.ts as string, count: 1 });
    }
  }
  return Array.from(seen.values()).sort(
    (a, b) => new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime()
  );
}

export async function getAlerts(userId: string) {
  const admin = createServiceClient();
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data } = await admin
    .from("connections")
    .select("*")
    .eq("user_id", userId)
    .in("state", ["watch", "alert"])
    .gte("ts", since24h)
    .order("ts", { ascending: false })
    .limit(100);

  const rows = (data ?? []) as DbRow[];
  const grouped: Record<
    string,
    { sample: Connection; count: number; state: ConnectionState }
  > = {};
  for (const r of rows) {
    const key = `${r.remote_host ?? r.remote_ip}:${r.port}`;
    if (!grouped[key]) {
      grouped[key] = { sample: rowToConnection(r), count: 0, state: r.state };
    }
    grouped[key].count += 1;
  }
  return grouped;
}

export async function queryTraffic(
  userId: string,
  opts: { state?: ConnectionState; app?: string; sinceMinutes?: number } = {}
) {
  const admin = createServiceClient();
  let q = admin.from("connections").select("*").eq("user_id", userId);

  if (opts.state) q = q.eq("state", opts.state);
  if (opts.app) q = q.ilike("app", `%${opts.app}%`);

  const minutes = opts.sinceMinutes ?? 60;
  q = q.gte("ts", new Date(Date.now() - minutes * 60_000).toISOString());

  const { data } = await q.order("ts", { ascending: false }).limit(40);
  return (data ?? []).map((r) => rowToConnection(r as DbRow));
}

export async function findByHost(userId: string, pattern: string) {
  const admin = createServiceClient();
  const isCountry = pattern.length === 2 && /^[A-Za-z]{2}$/.test(pattern);

  let q = admin.from("connections").select("*").eq("user_id", userId);
  if (isCountry) {
    q = q.eq("cc", pattern.toUpperCase());
  } else {
    q = q.ilike("remote_host", `%${pattern}%`);
  }

  const { data } = await q.order("ts", { ascending: false }).limit(40);
  return (data ?? []).map((r) => rowToConnection(r as DbRow));
}

// Used by the dashboard server component to show the live feed.
export async function getRecentFeed(userId: string, limit = 40, machine?: MachineFilter) {
  const admin = createServiceClient();
  const { data } = await applyMachine(
    admin.from("connections").select("*").eq("user_id", userId),
    machine
  )
    .order("ts", { ascending: false })
    .limit(limit);
  return (data ?? []).map((r) => rowToConnection(r as DbRow));
}
