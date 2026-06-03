# NetGuard

**An AI security co-pilot for your network. Runs on your machine, answers to you.**

🔗 Live: [netguard-web.vercel.app](https://netguard-web.vercel.app)
🔗 Web repo: [github.com/joyo11/netguard-web](https://github.com/joyo11/netguard-web)
🔗 Agent repo: [github.com/joyo11/NETGUARD](https://github.com/joyo11/NETGUARD)

---

## What it does

NetGuard tells you what your computer is actually doing online, in plain English.

A tiny local agent watches every TCP connection your machine makes (which process, which destination, which port, how many bytes), streams that to your private dashboard, and lets you ask an AI co-pilot questions like:

- "What's been happening today?"
- "Anything suspicious right now?"
- "Why is my laptop talking to Romania?"
- "What is Chrome doing with doubleclick.net?"

The AI reads your real traffic via tool calls, flags activity as safe / watch / alert, and recommends what to do. It never blocks anything on its own. You decide.

## Why I built it

Most people have no idea what their laptop talks to in the background. The tools that do exist (Little Snitch, GlassWire, Wireshark) are either expensive, intimidating, or both. They throw raw firewall logs at you and call it a day.

That gap matters. Privacy is one of the biggest leverage points an individual has, and right now it's locked behind technical fluency most people don't have time for. NetGuard puts a calm, knowledgeable explainer between you and your network so you can finally answer the question "is my machine doing anything I should worry about?" without learning what a SYN packet is.

It's open source so you can verify exactly what the agent reads. It runs on your machine so your traffic never leaves it unencrypted. It costs nothing because the goal is to help, not to extract.

## Architecture

Three pieces, kept deliberately separate so each one is replaceable.

```
┌──────────────────┐    HTTPS    ┌───────────────────┐    SQL    ┌──────────────┐
│  Local agent     │─────────────│  Next.js (Vercel) │───────────│  Supabase    │
│  (Python, lsof)  │  /api/ingest│  Route Handlers   │           │  Postgres    │
└──────────────────┘             └─────────┬─────────┘           └──────────────┘
                                           │
                                           │ tool calls
                                           ▼
                                  ┌───────────────────┐
                                  │  Anthropic Claude │
                                  │  (Sonnet + Haiku) │
                                  └───────────────────┘
```

1. **Agent** runs on your machine, polls `lsof -i -n -P -sTCP:ESTABLISHED` every 15 seconds, sends a batch to `/api/ingest` authenticated with a per-user bearer token.
2. **Ingest** enriches IPs with reverse-DNS hostnames, classifies each row (safe / watch / alert) using a rules engine, writes to Postgres.
3. **Dashboard** reads the user's rows back via Row-Level Security and renders a live activity feed.
4. **Chat** lets you ask Claude questions. Claude uses function-calling tools (`get_summary`, `get_alerts`, `query_traffic`, `find_by_host`) to query your data and ground its answers.
5. **"While you were away"** API computes the delta since your last visit and asks Claude Haiku for a one-sentence digest.

## Frontend stack

**Next.js 16 (App Router) + React 19 + TypeScript + Tailwind v4**, deployed on Vercel.

**Why Next.js 16 App Router**
Server Components let the dashboard fetch the user, the connection feed, and the install token in one server roundtrip. No client-side waterfall, no "loading…" flash, no separate REST layer for things that only need to render once. File-based routing and the Vercel pipeline mean deploying a feature is `git push`.

**Why not Vite + React Router**
SPA-first. I'd have to bolt on SSR, auth gating, and API routes myself. Auth flows in particular are painful when every protected page has to check the session client-side first.

**Why not Remix**
Comparable philosophy and I almost picked it. Next.js wins on the Vercel deployment integration (zero-config preview URLs per PR) and the larger ecosystem of recipes.

**Why Tailwind v4**
Zero-runtime CSS (atomic classes that only ship if used), design tokens declared in `@theme` blocks, and v4's CSS-first config (no `tailwind.config.js`) makes color and font management readable. The whole NetGuard design system (pitch / cream / teal / amber / danger) fits in 12 lines.

**Why not styled-components or CSS Modules**
Styled-components ships a runtime that hurts streaming SSR. CSS Modules force a per-component file dance that doesn't compose. Tailwind keeps the design language portable across components.

## Backend stack

**Next.js Route Handlers on Node runtime + Anthropic Claude SDK.**

Five API routes, each a single file:

- `POST /api/ingest` — agent posts connection batches
- `GET /api/chat` (SSE stream) — Claude tool-use loop
- `GET /api/away-summary` — proactive AI digest
- `GET/POST /api/agent-token` — read or rotate the agent token
- `GET /api/account/export`, `POST /api/account/delete` — data export and account deletion

**Why Node route handlers (not Edge)**
Edge is faster on cold start but doesn't ship the Node `dns` module, and reverse-DNS at ingest time was a v4 must-have. Anthropic SDK also assumes Node. Ingest is bursty (a batch every 15 sec per agent) so cold starts don't matter.

**Why not a separate Express / Fastify backend**
Adds a second deploy target, a second domain, CORS plumbing. Route handlers in the same Next.js project share types with the frontend and deploy as one unit.

**Why Anthropic Claude (Sonnet 4.6 + Haiku 4.5)**
Claude's tool-use flow is the cleanest in the industry right now. The chat is a multi-turn loop where Claude can call `query_traffic({state: "alert"})` mid-answer and use the result in its reply. Sonnet for chat (it needs to reason about messy data), Haiku for the "while you were away" summary (one sentence, cheap).

**Why not OpenAI**
Equivalent capability, but Claude's default tone fits the explainer use case better (calm, less salesy). Also wanted to avoid the recent OpenAI policy churn around tool use semantics.

**Why not local Llama / Mistral**
The whole pitch is "install one curl command and it just works." Bundling a 4GB model defeats that. Maybe later for an offline mode.

## Database

**Supabase Postgres** with Row-Level Security.

Three tables: `profiles`, `agent_tokens`, `connections`, plus a small `ip_enrichment` cache.

**Why Postgres**
The data is naturally relational (one user, many tokens, many connections). I need time-range queries (last hour, last 24 hours, since last visit), group-by (top apps in a window), JSONB for raw payloads. Postgres handles all of that without breaking a sweat.

**Why Supabase specifically**
Three things in one product:
1. Hosted Postgres with sensible defaults
2. Auth (Google OAuth + email/password) without a separate provider
3. Row-Level Security policies enforced at the database, so the API can't accidentally leak someone else's data

Building Auth from scratch (sessions, OAuth callbacks, password reset, magic links) is a multi-week project. Supabase gets you to "users exist, they can sign in" on day one.

**Why not Firebase**
NoSQL is the wrong shape for relational connection logs. Aggregating "top 5 apps in the last hour" in Firestore is a chore. Pricing scales opaquely, and you can't drop into SQL when you need to.

**Why not raw Postgres on Neon / Railway**
Cheaper and faster, but I'd need to bolt on auth myself (Clerk, Auth0, or NextAuth) and write all the RLS policies by hand. Supabase folds it all together.

**Why not MongoDB**
Same as Firebase plus the "no joins" tax. Connections are linked to users which are linked to tokens. Joins are how I express that.

**Why not SQLite**
Doesn't work across Vercel serverless functions (no shared filesystem). Single-user demos only.

## Agent stack

**Python 3 standard library, nothing else.**

The agent is one file (`agent.py`), distributed by inlining it inside the installer (`install.sh`). It uses `subprocess` to run `lsof`, `urllib.request` to POST batches, and that's it.

**Why Python stdlib only**
Zero dependencies means zero install friction. No `pip install` step that can fail behind a corporate proxy. macOS and most Linux distros ship Python 3 in the base install.

**Why not Go**
Better runtime, but distribution becomes "download the right binary for your CPU and OS, mark it executable, get past Gatekeeper on macOS, figure out auto-update." Curl-and-bash is friendlier.

**Why not Rust**
Same distribution problem as Go, plus a longer compile chain. The agent polls every 15 sec; the bottleneck is `lsof`, not Python.

## What's next

Honest roadmap, by priority:

- **Tracker badges + country flags** on the dashboard (cheap visible win)
- **One-click block** via a local pfctl/iptables helper signed by the user
- **Windows agent** using PowerShell `Get-NetTCPConnection`
- **Browser extension** to catch DNS lookups before lsof does
- **Self-hostable** server bundle for the privacy-maximalists

## License

MIT. Use it, fork it, run it on your own infrastructure. The point is to help.
