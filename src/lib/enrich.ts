// IP enrichment: reverse-DNS lookups cached in the ip_enrichment table.
// Called from /api/ingest before inserting connection rows so the
// dashboard can display hostnames instead of raw IPs.
//
// Design notes:
// - Reverse DNS via Node's built-in dns.promises.reverse — no API keys,
//   no rate limits, the OS resolver does the work.
// - Cache lifetime: 7 days. PTR records change rarely, this is generous.
// - Fail-soft: any lookup error returns null. The connection row still
//   inserts with whatever the agent posted.

import { promises as dns } from "node:dns";
import { createServiceClient } from "@/lib/supabase/server";

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const LOOKUP_TIMEOUT_MS = 1500;

type EnrichRow = {
  ip: string;
  hostname: string | null;
  cc: string | null;
  asn_name: string | null;
  resolved_at: string;
};

function looksLikeIp(s: string): boolean {
  // Cheap: dotted-quad or contains colon (IPv6).
  return /^(\d{1,3}\.){3}\d{1,3}$/.test(s) || s.includes(":");
}

async function reverseDns(ip: string): Promise<string | null> {
  const lookup = dns.reverse(ip).then((names) => names[0] ?? null);
  const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), LOOKUP_TIMEOUT_MS));
  try {
    return (await Promise.race([lookup, timeout])) || null;
  } catch {
    return null;
  }
}

// Look up many IPs in parallel, return a Map of ip → hostname (or null).
// Hits the cache table first, then queues fresh PTR lookups for misses
// and writes the results back so the next call is free.
export async function enrichIps(
  ips: string[]
): Promise<Map<string, string | null>> {
  const out = new Map<string, string | null>();
  const unique = Array.from(new Set(ips.filter((s) => s && looksLikeIp(s))));
  if (unique.length === 0) return out;

  const admin = createServiceClient();
  const { data: cached } = await admin
    .from("ip_enrichment")
    .select("*")
    .in("ip", unique);

  const now = Date.now();
  const fresh = new Map<string, EnrichRow>();
  for (const row of (cached ?? []) as EnrichRow[]) {
    if (now - new Date(row.resolved_at).getTime() < CACHE_TTL_MS) {
      fresh.set(row.ip, row);
      out.set(row.ip, row.hostname);
    }
  }

  const todo = unique.filter((ip) => !fresh.has(ip));
  if (todo.length === 0) return out;

  // Parallel reverse-DNS, capped by the timeout above.
  const resolved = await Promise.all(
    todo.map(async (ip) => ({ ip, hostname: await reverseDns(ip) }))
  );

  // Write the new rows back so the next batch is cache-hits.
  const upserts = resolved.map((r) => ({
    ip: r.ip,
    hostname: r.hostname,
    cc: null,
    asn_name: null,
    resolved_at: new Date().toISOString(),
  }));
  if (upserts.length > 0) {
    void admin.from("ip_enrichment").upsert(upserts, { onConflict: "ip" });
  }

  for (const r of resolved) out.set(r.ip, r.hostname);
  return out;
}
