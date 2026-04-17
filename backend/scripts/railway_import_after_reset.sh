#!/usr/bin/env bash
# ONE-TIME: After Railway Postgres reset + deploy (migrate succeeded), load the fixture.
# Requires fixtures/railway_sync.json committed or present in the deployment root.
#
# Usage from repo root (linked Railway project):
#   chmod +x backend/scripts/railway_import_after_reset.sh
#   ./backend/scripts/railway_import_after_reset.sh
#
set -euo pipefail
# Run from repo root with Railway CLI linked to this project.
railway run -s "Backend Service" sh -c \
  'ALLOW_DESTRUCTIVE_IMPORT=1 python manage.py import_local_dump fixtures/railway_sync.json'
