#!/usr/bin/env bash
set -euo pipefail

DEPLOY_HOST="${DEPLOY_HOST:-root@62.72.32.112}"
REMOTE_ROOT="${REMOTE_ROOT:-/opt/tazy-pro}"
ENV_FILE="${ENV_FILE:-/etc/tazy-pro/backend.env}"
KEEP_BACKUPS="${KEEP_BACKUPS:-14}"

if [ "${1:-}" != "--local" ]; then
  ssh -o StrictHostKeyChecking=no -o ConnectTimeout=15 "${DEPLOY_HOST}" \
    "REMOTE_ROOT='${REMOTE_ROOT}' ENV_FILE='${ENV_FILE}' KEEP_BACKUPS='${KEEP_BACKUPS}' '${REMOTE_ROOT}/current/scripts/backup_backend_db.sh' --local"
  exit 0
fi

set -a
. "${ENV_FILE}"
set +a

BACKUP_DIR="${BACKUP_DIR:-${REMOTE_ROOT}/shared/backups}"
install -d -m 0750 "${BACKUP_DIR}"

case "${TAZY_DATABASE_URL:-}" in
  sqlite+aiosqlite:///*)
    DB_PATH="${TAZY_DATABASE_URL#sqlite+aiosqlite:///}"
    ;;
  sqlite:///*)
    DB_PATH="${TAZY_DATABASE_URL#sqlite:///}"
    ;;
  *)
    echo "Skipping backup: TAZY_DATABASE_URL is not SQLite."
    exit 0
    ;;
esac

if [ ! -f "${DB_PATH}" ]; then
  echo "Database file not found: ${DB_PATH}" >&2
  exit 1
fi

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
BACKUP_PATH="${BACKUP_DIR}/tazy-${STAMP}.db"

python3 - "${DB_PATH}" "${BACKUP_PATH}" <<'PY'
import sqlite3
import sys

source_path, backup_path = sys.argv[1], sys.argv[2]
with sqlite3.connect(source_path) as source:
    with sqlite3.connect(backup_path) as backup:
        source.backup(backup)
PY

gzip -f "${BACKUP_PATH}"
chmod 0640 "${BACKUP_PATH}.gz"

find "${BACKUP_DIR}" -maxdepth 1 -type f -name 'tazy-*.db.gz' | sort | head -n -"${KEEP_BACKUPS}" | xargs -r rm -f
echo "Created backup ${BACKUP_PATH}.gz"
