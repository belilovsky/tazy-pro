#!/usr/bin/env bash
set -euo pipefail

DEPLOY_HOST="${DEPLOY_HOST:-root@62.72.32.112}"
DEPLOY_DOMAIN="${DEPLOY_DOMAIN:-tazy.qdev.run}"
REMOTE_ROOT="${REMOTE_ROOT:-/var/www/${DEPLOY_DOMAIN}}"
RELEASE_ID="${RELEASE_ID:-$(date -u +%Y%m%dT%H%M%SZ)}"
REMOTE_RELEASE="${REMOTE_ROOT}/releases/${RELEASE_ID}"

ssh -o StrictHostKeyChecking=no -o ConnectTimeout=15 "${DEPLOY_HOST}" \
  "install -d -m 0755 '${REMOTE_RELEASE}' '${REMOTE_ROOT}/shared' /var/www/certbot"

COPYFILE_DISABLE=1 tar -czf - index.html styles.css assets src | ssh -o StrictHostKeyChecking=no -o ConnectTimeout=15 "${DEPLOY_HOST}" \
  "tar -xzf - -C '${REMOTE_RELEASE}' \
    && chown -R www-data:www-data '${REMOTE_RELEASE}' \
    && ln -sfn '${REMOTE_RELEASE}' '${REMOTE_ROOT}/current' \
    && chown -h www-data:www-data '${REMOTE_ROOT}/current' \
    && find '${REMOTE_ROOT}/releases' -mindepth 1 -maxdepth 1 -type d | sort | head -n -5 | xargs -r rm -rf"

echo "Deployed ${DEPLOY_DOMAIN} release ${RELEASE_ID} to ${REMOTE_RELEASE}"
