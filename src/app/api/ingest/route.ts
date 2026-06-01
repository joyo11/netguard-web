// /api/ingest
//   POST — accept a batch of connection observations from the local
//          agent. Authenticated via `Authorization: Bearer ng_live_...`.
//          Uses the service-role client to bypass RLS after the token
//          is validated.
//
// Body shape (loose, all fields except `connections` optional):
// {
//   "hostname": "kit.local",
//   "connections": [
//     {
//       "ts": "2026-05-30T14:02:00Z",   // optional, defaults to now
//       "app":         "Chrome",
//       "proc":        "Google Chrome Helper",
//       "remote_host": "google.com",
//       "remote_ip":   "142.250.x.x",   // optional
//       "cc":          "US",            // optional
//       "port":        443,
//       "bytes_out":   12400,
//       "bytes_in":    8000,
//       "state":       "safe"            // optional, defaults to "safe"
//     }, ...
//   ]
// }

import { createServiceClient } from "@/lib/supabase/server";
import { classify } from "@/lib/classify";
import { enrichIps } from "@/lib/enrich";
import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";

type IncomingConnection = {
  ts?: string;
  app?: string;
  proc?: string;
  remote_host?: string;
  remote_ip?: string;
  cc?: string;
  port?: number;
  bytes_out?: number;
  bytes_in?: number;
  state?: "safe" | "watch" | "alert";
};

export async function POST(req: NextRequest) {
  // Extract bearer token
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!token || !token.startsWith("ng_live_")) {
    return NextResponse.json({ error: "Missing or invalid token" }, { status: 401 });
  }

  // Validate token via service-role client (RLS bypass)
  const admin = createServiceClient();
  const { data: tokenRow, error: tokenErr } = await admin
    .from("agent_tokens")
    .select("user_id, revoked_at")
    .eq("token", token)
    .maybeSingle();

  if (tokenErr) {
    return NextResponse.json({ error: tokenErr.message }, { status: 500 });
  }
  if (!tokenRow) {
    return NextResponse.json({ error: "Unknown token" }, { status: 401 });
  }
  if (tokenRow.revoked_at) {
    return NextResponse.json({ error: "Token has been revoked" }, { status: 401 });
  }

  // Parse body
  let body: { hostname?: string; connections?: IncomingConnection[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const connections = Array.isArray(body.connections) ? body.connections : [];
  if (connections.length === 0) {
    return NextResponse.json({ inserted: 0 }, { status: 200 });
  }

  const hostname = (body.hostname ?? "unknown").slice(0, 200);
  const userId = tokenRow.user_id;
  const nowIso = new Date().toISOString();

  // v4: enrich rows that arrived as IPs with reverse-DNS hostnames so the
  // dashboard shows "clients3.google.com" instead of "216.239.34.223".
  // Treats `remote_host` as authoritative when the agent already had it;
  // only fills in when missing OR when the "host" looks like a raw IP.
  const needsLookup = connections
    .filter((c) => c && (c.remote_host || c.remote_ip))
    .map((c) => c.remote_ip || c.remote_host || "")
    .filter(Boolean);
  const enriched = await enrichIps(needsLookup);

  const rows = connections
    .filter((c) => c && (c.remote_host || c.remote_ip))
    .map((c) => {
      const ip = c.remote_ip || (c.remote_host && /^[\d.:]+$/.test(c.remote_host) ? c.remote_host : null);
      const resolvedHost = ip ? enriched.get(ip) ?? null : null;
      const finalHost = c.remote_host && !/^[\d.:]+$/.test(c.remote_host)
        ? c.remote_host
        : resolvedHost ?? c.remote_host ?? null;

      return {
        user_id: userId,
        hostname,
        ts: c.ts ?? nowIso,
        app: c.app ?? null,
        proc: c.proc ?? null,
        remote_host: finalHost,
        remote_ip: c.remote_ip ?? null,
        cc: c.cc ?? null,
        port: typeof c.port === "number" ? c.port : null,
        bytes_out: typeof c.bytes_out === "number" ? c.bytes_out : 0,
        bytes_in: typeof c.bytes_in === "number" ? c.bytes_in : 0,
        state: classify({
          remote_host: finalHost,
          remote_ip: c.remote_ip,
          port: c.port,
          app: c.app,
        }),
      };
    });

  if (rows.length === 0) {
    return NextResponse.json({ inserted: 0, skipped: connections.length });
  }

  const { error: insertErr } = await admin.from("connections").insert(rows);
  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  // Update last_used_at (fire-and-forget — don't block on this)
  void admin
    .from("agent_tokens")
    .update({ last_used_at: nowIso })
    .eq("token", token);

  return NextResponse.json({ inserted: rows.length, skipped: connections.length - rows.length });
}
