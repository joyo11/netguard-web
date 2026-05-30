-- NetGuard initial schema.
-- Run this in Supabase SQL Editor (or via supabase CLI).
-- Sets up profiles, agent tokens, connections table with RLS.

create extension if not exists "uuid-ossp";

-- ─── profiles ──────────────────────────────────────────────────────────
-- Optional public profile attached to auth.users. Created automatically
-- via trigger when a new user signs up.
create table if not exists public.profiles (
  id          uuid references auth.users(id) on delete cascade primary key,
  email       text,
  hostname    text default 'localhost',
  created_at  timestamptz default now()
);

-- ─── agent_tokens ──────────────────────────────────────────────────────
-- Each user can issue one or more tokens that authenticate their local
-- agent's POSTs to /api/ingest. Stored in plaintext (UUID v4) — fine for
-- this MVP since the only thing the token grants is "post connections
-- for this user_id". Revoke by setting revoked_at.
create table if not exists public.agent_tokens (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid references auth.users(id) on delete cascade not null,
  token         text unique not null,
  label         text default 'default',
  last_used_at  timestamptz,
  revoked_at    timestamptz,
  created_at    timestamptz default now()
);

create index if not exists agent_tokens_token_idx  on public.agent_tokens(token);
create index if not exists agent_tokens_user_idx   on public.agent_tokens(user_id);

-- ─── connections ───────────────────────────────────────────────────────
-- One row per observed connection batch entry. The agent batches snapshots
-- every 15s and POSTs them; each entry becomes a row here.
create table if not exists public.connections (
  id           bigserial primary key,
  user_id      uuid references auth.users(id) on delete cascade not null,
  hostname     text not null default 'unknown',
  ts           timestamptz not null default now(),
  app          text,
  proc         text,
  remote_host  text,
  remote_ip    inet,
  cc           text,
  port         int,
  bytes_out    bigint default 0,
  bytes_in     bigint default 0,
  state        text default 'safe' check (state in ('safe', 'watch', 'alert')),
  raw          jsonb
);

create index if not exists connections_user_ts_idx
  on public.connections(user_id, ts desc);

create index if not exists connections_state_idx
  on public.connections(user_id, state)
  where state <> 'safe';

create index if not exists connections_host_idx
  on public.connections(user_id, remote_host);

-- ─── Row-Level Security ────────────────────────────────────────────────
-- Each user sees only their own rows. The service role bypasses RLS
-- by design — that's what /api/ingest uses after validating the agent
-- token.

alter table public.profiles      enable row level security;
alter table public.agent_tokens  enable row level security;
alter table public.connections   enable row level security;

-- profiles: read + update own
drop policy if exists "users read own profile" on public.profiles;
create policy "users read own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- agent_tokens: full management of own
drop policy if exists "users read own tokens" on public.agent_tokens;
create policy "users read own tokens"
  on public.agent_tokens for select
  using (auth.uid() = user_id);

drop policy if exists "users insert own tokens" on public.agent_tokens;
create policy "users insert own tokens"
  on public.agent_tokens for insert
  with check (auth.uid() = user_id);

drop policy if exists "users delete own tokens" on public.agent_tokens;
create policy "users delete own tokens"
  on public.agent_tokens for delete
  using (auth.uid() = user_id);

-- connections: read own only (writes happen via service role in /api/ingest)
drop policy if exists "users read own connections" on public.connections;
create policy "users read own connections"
  on public.connections for select
  using (auth.uid() = user_id);

-- ─── Auto-create profile on signup ─────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
