#!/usr/bin/env bash
# Pulls live state from the VPS so local dev mirrors production.
#
# Why this exists: admin actions (create project, organize sections, upload
# files, generate thumbnails) all run against the VPS instance and write to
# /var/www/portal-content/registry.json and /var/www/portal/public/thumbnails/.
# Those paths are not in git, so without this script the local dev environment
# drifts away from VPS every time you do anything in the admin UI.
#
# Runs automatically before `npm run dev` (see "predev" in package.json).
# To skip when offline: SKIP_VPS_SYNC=1 npm run dev

set -euo pipefail

if [[ "${SKIP_VPS_SYNC:-0}" == "1" ]]; then
  echo "[sync] SKIP_VPS_SYNC=1 — skipping VPS sync"
  exit 0
fi

VPS="${VPS_HOST_ALIAS:-heuristica-vps}"
REGISTRY_REMOTE="${VPS}:/var/www/portal-content/registry.json"
THUMBS_REMOTE="${VPS}:/var/www/portal/public/thumbnails/"

# Quick reachability check — fail soft so a flaky network doesn't block dev
if ! ssh -o BatchMode=yes -o ConnectTimeout=5 "$VPS" "true" 2>/dev/null; then
  echo "[sync] cannot reach $VPS over SSH — leaving local state as-is" >&2
  echo "[sync] (run 'ssh $VPS' once interactively to seed known_hosts, or set SKIP_VPS_SYNC=1)" >&2
  exit 0
fi

echo "[sync] mirroring $VPS state -> local"

# Registry — single JSON file. Atomic write via temp + mv.
if ssh "$VPS" "cat /var/www/portal-content/registry.json" > .registry.json.tmp 2>/dev/null; then
  mv .registry.json.tmp .registry.json
  PROJECTS=$(jq '.projects | length' .registry.json 2>/dev/null || echo "?")
  echo "[sync]   registry.json  ($PROJECTS projects)"
else
  rm -f .registry.json.tmp
  echo "[sync]   registry.json  FAILED (kept existing local copy)" >&2
fi

# Thumbnails — generated PNGs that the portal serves from public/.
mkdir -p public/thumbnails
if rsync -az --delete --quiet "$THUMBS_REMOTE" public/thumbnails/ 2>/dev/null; then
  COUNT=$(find public/thumbnails -type f | wc -l | tr -d ' ')
  echo "[sync]   public/thumbnails/  ($COUNT files)"
else
  echo "[sync]   public/thumbnails/  FAILED (kept existing local copy)" >&2
fi

echo "[sync] done."
