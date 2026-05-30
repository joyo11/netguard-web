// Shared mock traffic data — single source of truth for both the
// Dashboard UI and the AI's tool functions. Once a real backend lands,
// these helpers swap to PostgreSQL queries with the same signatures.

export type ConnectionState = "safe" | "watch" | "alert";

export type Connection = {
  t: string; // HH:MM
  app: string;
  proc: string;
  host: string;
  cc: string; // country code or "··"
  port: number;
  bytes: string;
  state: ConnectionState;
};

export const FEED: Connection[] = [
  { t: "14:02", app: "Chrome",  proc: "Google Chrome Helper", host: "google.com",           cc: "US", port: 443, bytes: "12.4 KB", state: "safe"  },
  { t: "14:02", app: "Slack",   proc: "Slack Helper",          host: "slack.com",            cc: "US", port: 443, bytes: "3.2 KB",  state: "safe"  },
  { t: "14:01", app: "unknown", proc: "sshd",                  host: "185.143.x.x",          cc: "RO", port: 22,  bytes: "8 KB",    state: "alert" },
  { t: "14:01", app: "Spotify", proc: "Spotify",               host: "audio-fa.scdn.co",     cc: "US", port: 443, bytes: "240 KB", state: "safe"  },
  { t: "14:00", app: "TV-app",  proc: "SmartTV Companion",     host: "tracker.adcorp.net",   cc: "··", port: 443, bytes: "4.1 KB",  state: "watch" },
  { t: "13:59", app: "Chrome",  proc: "Google Chrome Helper",  host: "fonts.gstatic.com",    cc: "US", port: 443, bytes: "88 KB",   state: "safe"  },
  { t: "13:58", app: "Mail",    proc: "Mail",                  host: "imap.fastmail.com",    cc: "AU", port: 993, bytes: "1.9 KB",  state: "safe"  },
  { t: "13:57", app: "Docker",  proc: "com.docker.backend",    host: "registry-1.docker.io", cc: "US", port: 443, bytes: "540 KB", state: "safe"  },
];

// Additional historical context the AI can surface — these aren't shown
// on the dashboard's recent feed but are queryable for "today" questions.
export const RECENT_HISTORY: Connection[] = [
  { t: "13:50", app: "unknown", proc: "sshd", host: "185.143.x.x", cc: "RO", port: 22, bytes: "0.5 KB", state: "alert" },
  { t: "13:49", app: "unknown", proc: "sshd", host: "185.143.x.x", cc: "RO", port: 22, bytes: "0.5 KB", state: "alert" },
  { t: "13:48", app: "unknown", proc: "sshd", host: "185.143.x.x", cc: "RO", port: 22, bytes: "0.5 KB", state: "alert" },
  { t: "13:47", app: "TV-app",  proc: "SmartTV Companion", host: "tracker.adcorp.net", cc: "··", port: 443, bytes: "4.0 KB", state: "watch" },
  { t: "13:45", app: "TV-app",  proc: "SmartTV Companion", host: "tracker.adcorp.net", cc: "··", port: 443, bytes: "3.8 KB", state: "watch" },
];

export const ALL_CONNECTIONS = [...FEED, ...RECENT_HISTORY];

export const SUMMARY = {
  totalConnections: 248,
  watching: 1,
  alerts: 1,
  agentUptimeHours: 2,
  lastScanSecondsAgo: 12,
  hostname: "kit.local",
};

// ─── Tool helpers — what the AI actually calls ─────────────────────────

export function getSummary() {
  return {
    ...SUMMARY,
    recentConnections: FEED.length,
    historicalConnectionsThisHour: ALL_CONNECTIONS.length,
  };
}

export function getAlerts() {
  return ALL_CONNECTIONS.filter((c) => c.state === "alert" || c.state === "watch")
    .reduce((acc: Record<string, { sample: Connection; count: number; state: ConnectionState }>, c) => {
      const key = `${c.host}:${c.port}`;
      if (!acc[key]) acc[key] = { sample: c, count: 0, state: c.state };
      acc[key].count += 1;
      return acc;
    }, {});
}

export function queryTraffic(opts: { state?: ConnectionState; app?: string; sinceMinutes?: number } = {}) {
  let rows = ALL_CONNECTIONS.slice();
  if (opts.state) rows = rows.filter((c) => c.state === opts.state);
  if (opts.app) rows = rows.filter((c) => c.app.toLowerCase().includes(opts.app!.toLowerCase()));
  // sinceMinutes is informational here — mock data is just ~15 min wide
  return rows.slice(0, 40);
}

export function findByHost(pattern: string) {
  const needle = pattern.toLowerCase();
  return ALL_CONNECTIONS.filter(
    (c) => c.host.toLowerCase().includes(needle) || c.cc.toLowerCase() === needle
  ).slice(0, 40);
}
