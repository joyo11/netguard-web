// Minimal rule engine — runs on every incoming connection in /api/ingest.
// Goal: surface enough variety on the dashboard that not every row is "safe".
// Conservative — never alerts on something benign. Misses are fine; false
// alarms erode trust.

const PRIVATE_IP = /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|127\.|169\.254\.|::1|fc[0-9a-f]{2}:|fe80:)/i;

const TRACKER_SUBSTRINGS = [
  "doubleclick",
  "googletagservices",
  "googletagmanager",
  "google-analytics",
  "adservice",
  "adsystem",
  "adnxs",
  "advertising",
  "ad-traffic",
  "tracker",
  "adcorp",
  "scorecardresearch",
  "facebook.com/tr",
  "connect.facebook.net",
  "amazon-adsystem",
  "criteo",
  "branch.io",
  "segment.io",
  "mixpanel",
  "hotjar",
  "fullstory",
];

const SUSPICIOUS_PORTS_FROM_FOREIGN = new Set([22, 23, 3389, 5900]); // SSH, telnet, RDP, VNC

export type Classification = "safe" | "watch" | "alert";

export function classify(c: {
  remote_host?: string | null;
  remote_ip?: string | null;
  port?: number | null;
  app?: string | null;
}): Classification {
  const host = (c.remote_host ?? c.remote_ip ?? "").toLowerCase();
  const ip = c.remote_ip ?? "";

  // 1. Inbound-style admin ports (SSH/RDP/etc.) talking to a non-private IP →
  //    likely outbound to a remote shell, worth flagging.
  if (
    typeof c.port === "number" &&
    SUSPICIOUS_PORTS_FROM_FOREIGN.has(c.port) &&
    ip &&
    !PRIVATE_IP.test(ip)
  ) {
    return "alert";
  }

  // 2. Known tracker / ad domains
  if (host && TRACKER_SUBSTRINGS.some((t) => host.includes(t))) {
    return "watch";
  }

  return "safe";
}
