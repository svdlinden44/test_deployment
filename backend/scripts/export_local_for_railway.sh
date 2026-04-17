#!/usr/bin/env bash
# Export local SQLite (or default DB) to fixtures/railway_sync.json
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
if [[ -f .venv/bin/activate ]]; then
  # shellcheck source=/dev/null
  source .venv/bin/activate
fi
python manage.py migrate --noinput
python manage.py dumpdata \
  --natural-foreign --natural-primary \
  --exclude sessions \
  --exclude auth.permission \
  --exclude admin.logentry \
  --indent 2 \
  -o fixtures/railway_sync.json
echo "Wrote $ROOT/fixtures/railway_sync.json ($(wc -c < fixtures/railway_sync.json | tr -d ' ') bytes)"
