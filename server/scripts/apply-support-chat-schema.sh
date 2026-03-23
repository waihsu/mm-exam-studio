#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PATCH_FILE="$ROOT_DIR/scripts/support-chat-schema.sql"

if ! command -v psql >/dev/null 2>&1; then
  echo "psql is required but was not found in PATH."
  exit 1
fi

if [ ! -f "$PATCH_FILE" ]; then
  echo "Patch file not found: $PATCH_FILE"
  exit 1
fi

if [ -z "${DATABASE_URL:-}" ] && [ -f "$ROOT_DIR/.env" ]; then
  set -a
  # shellcheck disable=SC1090
  source "$ROOT_DIR/.env"
  set +a
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is not set."
  echo "Set DATABASE_URL in the shell or server/.env before running this script."
  exit 1
fi

PSQL_DATABASE_URL="$DATABASE_URL"

if [[ "$PSQL_DATABASE_URL" == *\?* ]]; then
  BASE_URL="${PSQL_DATABASE_URL%%\?*}"
  QUERY_STRING="${PSQL_DATABASE_URL#*\?}"
  FILTERED_QUERY=""

  IFS='&' read -r -a QUERY_PARTS <<< "$QUERY_STRING"
  for part in "${QUERY_PARTS[@]}"; do
    if [[ "$part" == schema=* ]]; then
      continue
    fi

    if [ -n "$part" ]; then
      FILTERED_QUERY="${FILTERED_QUERY:+$FILTERED_QUERY&}$part"
    fi
  done

  if [ -n "$FILTERED_QUERY" ]; then
    PSQL_DATABASE_URL="$BASE_URL?$FILTERED_QUERY"
  else
    PSQL_DATABASE_URL="$BASE_URL"
  fi
fi

echo "Applying support chat schema patch..."
psql "$PSQL_DATABASE_URL" -f "$PATCH_FILE"
echo "Support chat schema patch applied."
