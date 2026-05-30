// /api/agent-token
//   GET  — return the current user's active agent token; auto-create
//          one on first call so the user never sees an empty state.
//   POST — rotate: revoke all existing tokens for the user, mint a
//          fresh one, return it.
//
// Both routes require an authenticated user (via Supabase session
// cookies). The token itself is what authenticates the local agent
// to /api/ingest later.

import { createClient } from "@/lib/supabase/server";
import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function mintToken(): string {
  return "ng_live_" + randomBytes(24).toString("hex");
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  // Find an active (un-revoked) token for this user.
  const { data: existing, error } = await supabase
    .from("agent_tokens")
    .select("token, last_used_at, created_at")
    .eq("user_id", user.id)
    .is("revoked_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (existing) {
    return NextResponse.json({
      token: existing.token,
      lastUsedAt: existing.last_used_at,
      createdAt: existing.created_at,
    });
  }

  // No active token — create one.
  const token = mintToken();
  const { data: inserted, error: insertErr } = await supabase
    .from("agent_tokens")
    .insert({ user_id: user.id, token, label: "default" })
    .select("token, last_used_at, created_at")
    .single();

  if (insertErr || !inserted) {
    return NextResponse.json(
      { error: insertErr?.message ?? "Failed to mint token" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    token: inserted.token,
    lastUsedAt: inserted.last_used_at,
    createdAt: inserted.created_at,
  });
}

export async function POST() {
  // Rotate: revoke all active tokens, mint a fresh one.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const { error: revokeErr } = await supabase
    .from("agent_tokens")
    .update({ revoked_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("revoked_at", null);

  if (revokeErr) {
    return NextResponse.json({ error: revokeErr.message }, { status: 500 });
  }

  const token = mintToken();
  const { data: inserted, error: insertErr } = await supabase
    .from("agent_tokens")
    .insert({ user_id: user.id, token, label: "default" })
    .select("token, last_used_at, created_at")
    .single();

  if (insertErr || !inserted) {
    return NextResponse.json(
      { error: insertErr?.message ?? "Failed to mint token" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    token: inserted.token,
    lastUsedAt: inserted.last_used_at,
    createdAt: inserted.created_at,
  });
}
