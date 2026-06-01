-- v4: per-IP enrichment cache (reverse DNS, country, ASN) and a
-- per-profile "last dashboard seen" timestamp for the "While you were
-- away" summary card.

-- ─── ip_enrichment ─────────────────────────────────────────────────────
-- Keyed by IP. Populated by /api/ingest. 7-day TTL enforced at read time.
create table if not exists public.ip_enrichment (
  ip            text primary key,
  hostname      text,
  cc            text,
  asn_name      text,
  resolved_at   timestamptz default now()
);

create index if not exists ip_enrichment_resolved_idx
  on public.ip_enrichment(resolved_at);

alter table public.ip_enrichment enable row level security;
-- No client policies — only the service role (via /api/ingest) touches it.

-- ─── profiles.last_dashboard_seen_at ───────────────────────────────────
-- Used by the "While you were away" card to compute the activity delta
-- since the user's last visit.
alter table public.profiles
  add column if not exists last_dashboard_seen_at timestamptz;
