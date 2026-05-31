#!/usr/bin/env bash
#
# NetGuard agent installer.
#
# Run with: curl -fsSL https://netguard-web.vercel.app/install.sh | \
#             NG_TOKEN=<your-token> NG_ENDPOINT=<your-endpoint> bash
#
# What this does:
#   1. Verifies Python 3 is available
#   2. Writes ~/.netguard/config with your token + endpoint
#   3. Writes ~/.netguard/agent.py
#   4. Kills any previously-installed agent (PID file)
#   5. Starts the agent in the background via nohup
#
# Uninstall: kill $(cat ~/.netguard/agent.pid) && rm -rf ~/.netguard

set -euo pipefail

NG_TOKEN="${NG_TOKEN:-}"
NG_ENDPOINT="${NG_ENDPOINT:-}"

if [ -z "$NG_TOKEN" ] || [ -z "$NG_ENDPOINT" ]; then
  echo "✗ NG_TOKEN and NG_ENDPOINT must be set." >&2
  echo "  Get the install command from your NetGuard dashboard." >&2
  exit 1
fi

# Python 3 check
if ! command -v python3 >/dev/null 2>&1; then
  echo "✗ python3 is required but not installed." >&2
  exit 1
fi

NG_DIR="${HOME}/.netguard"
mkdir -p "$NG_DIR"
chmod 700 "$NG_DIR"

# Stop any previously-running agent
if [ -f "$NG_DIR/agent.pid" ]; then
  OLD_PID="$(cat "$NG_DIR/agent.pid" 2>/dev/null || echo)"
  if [ -n "$OLD_PID" ] && kill -0 "$OLD_PID" 2>/dev/null; then
    echo "→ Stopping previous agent (pid $OLD_PID)…"
    kill "$OLD_PID" 2>/dev/null || true
    sleep 1
  fi
fi

# Config
cat > "$NG_DIR/config" <<EOF
NG_TOKEN=$NG_TOKEN
NG_ENDPOINT=$NG_ENDPOINT
EOF
chmod 600 "$NG_DIR/config"

# Agent (Python, stdlib only)
cat > "$NG_DIR/agent.py" <<'PYEOF'
#!/usr/bin/env python3
"""NetGuard agent — polls `lsof` every 15s, POSTs to /api/ingest."""

import json
import os
import re
import socket
import ssl
import subprocess
import sys
import time
import urllib.error
import urllib.request

CONFIG_PATH = os.path.expanduser("~/.netguard/config")
POLL_INTERVAL_SEC = 15
HTTP_TIMEOUT_SEC = 10


def _build_ssl_context():
    """Workaround for macOS Python lacking a CA bundle. Try common system
    cert locations; fall back to default if nothing's found."""
    candidates = [
        "/etc/ssl/cert.pem",                       # macOS (modern)
        "/usr/local/etc/openssl/cert.pem",         # Homebrew Intel
        "/opt/homebrew/etc/openssl@3/cert.pem",    # Homebrew Apple silicon
        "/etc/ssl/certs/ca-certificates.crt",      # Debian/Ubuntu
        "/etc/pki/tls/certs/ca-bundle.crt",        # RHEL/Fedora
    ]
    for p in candidates:
        if os.path.exists(p):
            return ssl.create_default_context(cafile=p)
    return ssl.create_default_context()


SSL_CONTEXT = _build_ssl_context()


def load_config():
    cfg = {}
    with open(CONFIG_PATH) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            cfg[k.strip()] = v.strip()
    return cfg


def is_ip(s: str) -> bool:
    # IPv4 or bracketed IPv6
    return bool(re.match(r"^(\d{1,3}\.){3}\d{1,3}$", s) or s.startswith("["))


def parse_lsof():
    """Returns a list of dict: {proc, app, remote_host, remote_ip, port}."""
    try:
        res = subprocess.run(
            ["lsof", "-i", "-n", "-P", "-sTCP:ESTABLISHED"],
            capture_output=True,
            text=True,
            timeout=HTTP_TIMEOUT_SEC,
        )
        out = res.stdout
        if res.returncode != 0:
            print(f"[netguard] lsof returned non-zero ({res.returncode}): {res.stderr.strip()[:200]}", flush=True)
        line_count = len(out.splitlines())
        print(f"[netguard] lsof output: {line_count} lines", flush=True)
    except (FileNotFoundError, subprocess.TimeoutExpired) as e:
        print(f"[netguard] lsof failed: {e}", flush=True)
        return []

    seen = set()
    connections = []
    for line in out.splitlines()[1:]:  # skip header
        parts = line.split(None, 9)
        if len(parts) < 9:
            continue
        proc = parts[0]
        name = parts[-1]  # NAME column at end
        # NAME like: "192.168.1.5:50123->142.250.1.5:443 (ESTABLISHED)"
        if "->" not in name:
            continue
        try:
            _local, remote_part = name.split("->", 1)
            remote = remote_part.split()[0]
            host, port_s = remote.rsplit(":", 1)
            host = host.strip("[]")
            port = int(port_s)
        except (ValueError, IndexError):
            continue

        # Dedupe — lsof may list multiple fds for the same flow
        key = (proc, host, port)
        if key in seen:
            continue
        seen.add(key)

        is_addr = is_ip(host)
        connections.append({
            "proc": proc,
            "app": proc,
            "remote_host": host,
            "remote_ip": host if is_addr else None,
            "port": port,
            "bytes_out": 0,
            "bytes_in": 0,
        })

    return connections


def post_batch(endpoint, token, hostname, batch):
    if not batch:
        return
    body = json.dumps({"hostname": hostname, "connections": batch}).encode()
    req = urllib.request.Request(
        f"{endpoint}/api/ingest",
        data=body,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "User-Agent": "netguard-agent/0.1",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=HTTP_TIMEOUT_SEC, context=SSL_CONTEXT) as resp:
            text = resp.read().decode()
            print(f"[netguard] posted {len(batch)} conns → {resp.status} {text}", flush=True)
    except urllib.error.HTTPError as e:
        body = e.read().decode(errors="ignore")
        print(f"[netguard] post HTTP {e.code}: {body}", flush=True)
    except Exception as e:
        print(f"[netguard] post failed: {e}", flush=True)


def main():
    try:
        cfg = load_config()
    except Exception as e:
        print(f"[netguard] config load failed: {e}", flush=True)
        sys.exit(1)

    token = cfg.get("NG_TOKEN")
    endpoint = cfg.get("NG_ENDPOINT", "").rstrip("/")
    if not token or not endpoint:
        print("[netguard] NG_TOKEN and NG_ENDPOINT required in config", flush=True)
        sys.exit(1)

    hostname = socket.gethostname()
    print(f"[netguard] starting — host={hostname} endpoint={endpoint}", flush=True)

    while True:
        try:
            batch = parse_lsof()
            if not batch:
                print("[netguard] tick: 0 established connections — nothing to send", flush=True)
            else:
                post_batch(endpoint, token, hostname, batch)
        except KeyboardInterrupt:
            print("[netguard] shutting down (SIGINT)", flush=True)
            break
        except Exception as e:
            print(f"[netguard] tick error: {e}", flush=True)
        time.sleep(POLL_INTERVAL_SEC)


if __name__ == "__main__":
    main()
PYEOF
chmod 644 "$NG_DIR/agent.py"

# Start in background
nohup python3 "$NG_DIR/agent.py" > "$NG_DIR/agent.log" 2>&1 &
NEW_PID=$!
echo "$NEW_PID" > "$NG_DIR/agent.pid"

echo ""
echo "✓ NetGuard agent installed and running."
echo "  PID:       $NEW_PID"
echo "  Logs:      tail -f $NG_DIR/agent.log"
echo "  Endpoint:  $NG_ENDPOINT"
echo ""
echo "  Check your dashboard: $NG_ENDPOINT/dashboard"
echo ""
echo "  Stop the agent:  kill \$(cat $NG_DIR/agent.pid)"
echo "  Uninstall:       kill \$(cat $NG_DIR/agent.pid) && rm -rf $NG_DIR"
