// Translate technical process names into something a person can read.
// Keep the table conservative — if we don't know, fall back to the raw
// name. Better honest-ugly than wrong.

const APP_LABELS: Record<string, string> = {
  // Apple system services
  "rapportd": "Apple Continuity",
  "cloudd": "iCloud",
  "bird": "iCloud Files",
  "nsurlsessiond": "macOS Networking",
  "trustd": "macOS Trust",
  "apsd": "Apple Push",
  "identityservicesd": "iMessage · FaceTime",
  "sharingd": "AirDrop · Continuity",
  "callservicesd": "Apple Calls",
  "knowledge-agent": "macOS Knowledge",
  "secd": "Apple Security",
  "akd": "Apple Identity",
  "geod": "Apple Maps",
  "syncdefaultsd": "Apple Sync",
  "remindd": "Apple Reminders",
  "mediaanalysisd": "Apple Media Analysis",
  "mDNSResponder": "macOS DNS",
  "biomesyncd": "Apple Biome",
  "dasd": "Apple Background Sync",
  "softwareupdated": "Software Update",
  "garageband": "GarageBand",
  "Safari": "Safari",
  "AppleSpell": "Apple Spell-check",

  // Common dev tools
  "Code": "VS Code",
  "Code Helper": "VS Code Helper",
  "Cursor": "Cursor",
  "Cursor Helper": "Cursor Helper",
  "node": "Node.js",
  "python3": "Python",
  "ruby": "Ruby",
  "ssh": "SSH",
  "sshd": "SSH Server",
  "git-remote-h": "Git",
  "Docker": "Docker",
  "com.docker.backend": "Docker Desktop",
  "com.docker.cli": "Docker CLI",
  "com.docker.proxy": "Docker Proxy",

  // Browsers + comms
  "Chrome": "Chrome",
  "Google Chrome Helper": "Chrome",
  "Slack": "Slack",
  "Slack Helper": "Slack",
  "Discord": "Discord",
  "Mail": "Apple Mail",
  "zoom.us": "Zoom",
  "Spotify": "Spotify",
  "Spotify Helper": "Spotify",
  "WhatsApp": "WhatsApp",
  "Telegram": "Telegram",

  // AI / dev environments
  "Wispr": "Wispr",
  "ollama": "Ollama",
  "claude": "Claude Desktop",
  "ChatGPT": "ChatGPT Desktop",
};

export function humanizeApp(name: string | null | undefined): string {
  if (!name) return "unknown";
  if (APP_LABELS[name]) return APP_LABELS[name];

  // Strip com.apple.* prefix and title-case the leaf
  if (name.startsWith("com.apple.")) {
    const leaf = name.slice("com.apple.".length).split(".")[0];
    if (leaf) return `Apple ${leaf.charAt(0).toUpperCase() + leaf.slice(1)}`;
    return "Apple System";
  }

  // Trim *Helper suffixes for cleaner display
  return name.replace(/\s*Helper(\s*\(.*\))?\s*$/i, "").trim() || name;
}
