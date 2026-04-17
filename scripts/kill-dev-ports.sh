#!/usr/bin/env bash
# Stops dev listeners for this repo: Vite (frontend) on a TCP port range, Django on 8000.
# Override: DEV_FRONTEND_PORT_LO, DEV_FRONTEND_PORT_HI (inclusive), DEV_BACKEND_PORTS (space-separated).

set -euo pipefail

FRONTEND_LO="${DEV_FRONTEND_PORT_LO:-3000}"
FRONTEND_HI="${DEV_FRONTEND_PORT_HI:-3020}"
BACKEND_PORTS="${DEV_BACKEND_PORTS:-8000}"

kill_listeners_on_port() {
  local port=$1
  local pids
  pids="$(lsof -nP -iTCP:"$port" -sTCP:LISTEN -t 2>/dev/null || true)"
  if [[ -z "$pids" ]]; then
    return 0
  fi
  # shellcheck disable=SC2086
  kill $pids 2>/dev/null || true
  sleep 0.15
  pids="$(lsof -nP -iTCP:"$port" -sTCP:LISTEN -t 2>/dev/null || true)"
  if [[ -n "$pids" ]]; then
    # shellcheck disable=SC2086
    kill -9 $pids 2>/dev/null || true
  fi
}

for ((p = FRONTEND_LO; p <= FRONTEND_HI; p++)); do
  kill_listeners_on_port "$p"
done

for port in $BACKEND_PORTS; do
  kill_listeners_on_port "$port"
done

echo "Stopped TCP listeners on frontend ports ${FRONTEND_LO}-${FRONTEND_HI} and backend: ${BACKEND_PORTS}"
