#!/usr/bin/env bash
set -euo pipefail

DEPLOY_HOST="${DEPLOY_HOST:-root@62.72.32.112}"
DEPLOY_DOMAIN="${DEPLOY_DOMAIN:-tazy.qdev.run}"
BACKEND_PORT="${BACKEND_PORT:-8182}"
REMOTE_ROOT="${REMOTE_ROOT:-/opt/tazy-pro}"
RELEASE_ID="${RELEASE_ID:-$(date -u +%Y%m%dT%H%M%SZ)}"
REMOTE_RELEASE="${REMOTE_ROOT}/releases/${RELEASE_ID}"

ssh -o StrictHostKeyChecking=no -o ConnectTimeout=15 "${DEPLOY_HOST}" \
  "install -d -m 0755 '${REMOTE_RELEASE}' '${REMOTE_ROOT}/shared' /etc/tazy-pro"

COPYFILE_DISABLE=1 tar --no-xattrs -czf - backend pyproject.toml index.html styles.css assets src scripts/backup_backend_db.sh | ssh -o StrictHostKeyChecking=no -o ConnectTimeout=15 "${DEPLOY_HOST}" \
  "tar -xzf - -C '${REMOTE_RELEASE}' && chown -R root:root '${REMOTE_RELEASE}'"

ssh -o StrictHostKeyChecking=no -o ConnectTimeout=15 "${DEPLOY_HOST}" "REMOTE_ROOT='${REMOTE_ROOT}' REMOTE_RELEASE='${REMOTE_RELEASE}' BACKEND_PORT='${BACKEND_PORT}' bash -s" <<'REMOTE'
set -euo pipefail

VENV="${REMOTE_ROOT}/shared/.venv"
ENV_FILE="/etc/tazy-pro/backend.env"
DATA_DIR="${REMOTE_ROOT}/shared/data"
BACKUP_DIR="${REMOTE_ROOT}/shared/backups"
PYTHON_BIN="${PYTHON_BIN:-python3.12}"

install -d -m 0750 "${DATA_DIR}"
install -d -m 0750 "${BACKUP_DIR}"

  if [ ! -x "${VENV}/bin/python" ]; then
    if command -v "${PYTHON_BIN}" >/dev/null 2>&1; then
      :
    elif command -v python3 >/dev/null 2>&1; then
      PYTHON_BIN="python3"
    elif command -v python >/dev/null 2>&1; then
      PYTHON_BIN="python"
    else
      echo "Python runtime not found on target host. Please install python3 before deploy." >&2
      exit 1
    fi

    "${PYTHON_BIN}" -m venv "${VENV}"
  fi

"${VENV}/bin/python" -m pip install --upgrade pip >/dev/null
"${VENV}/bin/python" -m pip install -r "${REMOTE_RELEASE}/backend/requirements.txt" >/dev/null

if [ ! -f "${ENV_FILE}" ]; then
  umask 077
  TAZY_SECRET_KEY="$("${PYTHON_BIN}" - <<'PY'
import secrets
print(secrets.token_urlsafe(48))
PY
)"
  TAZY_ADMIN_PASSWORD="$("${PYTHON_BIN}" - <<'PY'
import secrets
print(secrets.token_urlsafe(24))
PY
)"
  TAZY_REVIEWER_API_KEY="$("${PYTHON_BIN}" - <<'PY'
import secrets
print(secrets.token_urlsafe(32))
PY
)"
  cat > "${ENV_FILE}" <<ENV
TAZY_DEBUG=false
TAZY_SECRET_KEY=${TAZY_SECRET_KEY}
TAZY_ADMIN_USERNAME=admin
TAZY_ADMIN_PASSWORD=${TAZY_ADMIN_PASSWORD}
TAZY_REVIEWER_API_KEY=${TAZY_REVIEWER_API_KEY}
TAZY_DATABASE_URL=sqlite+aiosqlite:///${DATA_DIR}/tazy.db
TAZY_CORS_ORIGINS=https://tazy.qdev.run,https://tazy.dog,https://www.tazy.dog,https://tazy.pro,https://www.tazy.pro
TAZY_SEED_ON_STARTUP=true
ENV
fi

ln -sfn "${REMOTE_RELEASE}" "${REMOTE_ROOT}/current"

cat > /etc/systemd/system/tazy-pro-backend.service <<UNIT
[Unit]
Description=TAZY.DOG FastAPI backend
After=network.target

[Service]
Type=simple
WorkingDirectory=${REMOTE_ROOT}/current
EnvironmentFile=${ENV_FILE}
ExecStart=${VENV}/bin/uvicorn backend.app.main:app --host 127.0.0.1 --port ${BACKEND_PORT}
Restart=always
RestartSec=3
User=root

[Install]
WantedBy=multi-user.target
UNIT

cat > /etc/systemd/system/tazy-pro-backup.service <<UNIT
[Unit]
Description=TAZY.DOG SQLite database backup

[Service]
Type=oneshot
EnvironmentFile=${ENV_FILE}
ExecStart=${REMOTE_ROOT}/current/scripts/backup_backend_db.sh --local
UNIT

cat > /etc/systemd/system/tazy-pro-backup.timer <<UNIT
[Unit]
Description=Run TAZY.DOG SQLite database backup daily

[Timer]
OnCalendar=*-*-* 02:30:00
Persistent=true

[Install]
WantedBy=timers.target
UNIT

systemctl daemon-reload
systemctl enable tazy-pro-backend.service >/dev/null
systemctl enable --now tazy-pro-backup.timer >/dev/null
systemctl restart tazy-pro-backend.service
sleep 2
curl -fsS "http://127.0.0.1:${BACKEND_PORT}/health" >/dev/null
REMOTE

echo "Deployed backend ${DEPLOY_DOMAIN} release ${RELEASE_ID} on 127.0.0.1:${BACKEND_PORT}"
