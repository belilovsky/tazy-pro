#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEPLOY_HOST="${DEPLOY_HOST:-root@62.72.32.112}"
DEPLOY_DOMAIN="${DEPLOY_DOMAIN:-tazy.qdev.run}"
DEPLOY_SOURCE_DIR="${DEPLOY_SOURCE_DIR:-}"
REMOTE_ROOT="${REMOTE_ROOT:-/var/www/${DEPLOY_DOMAIN}}"
RELEASE_ID="${RELEASE_ID:-$(date -u +%Y%m%dT%H%M%SZ)}"
REMOTE_RELEASE="${REMOTE_ROOT}/releases/${RELEASE_ID}"

ssh -o StrictHostKeyChecking=no -o ConnectTimeout=15 "${DEPLOY_HOST}" \
  "install -d -m 0755 '${REMOTE_RELEASE}' '${REMOTE_ROOT}/shared' /var/www/certbot"

if [[ -n "${DEPLOY_SOURCE_DIR}" ]]; then
  COPYFILE_DISABLE=1 tar --no-xattrs -C "${DEPLOY_SOURCE_DIR}" -czf - . | ssh -o StrictHostKeyChecking=no -o ConnectTimeout=15 "${DEPLOY_HOST}" \
    "tar -xzf - -C '${REMOTE_RELEASE}' \
      && chown -R www-data:www-data '${REMOTE_RELEASE}' \
      && ln -sfn '${REMOTE_RELEASE}' '${REMOTE_ROOT}/current' \
      && chown -h www-data:www-data '${REMOTE_ROOT}/current' \
      && find '${REMOTE_ROOT}/releases' -mindepth 1 -maxdepth 1 -type d | sort | head -n -5 | xargs -r rm -rf"
else
  TMP_RELEASE_DIR="$(mktemp -d)"
  trap 'rm -rf "${TMP_RELEASE_DIR}"' EXIT
  cp index.html styles.css robots.txt sitemap.xml "${TMP_RELEASE_DIR}/"
  cp -R assets src "${TMP_RELEASE_DIR}/"
  node "${ROOT_DIR}/scripts/build_localized_entrypoints.js" "${TMP_RELEASE_DIR}" "https://${DEPLOY_DOMAIN}"
  COPYFILE_DISABLE=1 tar --no-xattrs -C "${TMP_RELEASE_DIR}" -czf - . | ssh -o StrictHostKeyChecking=no -o ConnectTimeout=15 "${DEPLOY_HOST}" \
    "tar -xzf - -C '${REMOTE_RELEASE}' \
      && chown -R www-data:www-data '${REMOTE_RELEASE}' \
      && ln -sfn '${REMOTE_RELEASE}' '${REMOTE_ROOT}/current' \
      && chown -h www-data:www-data '${REMOTE_ROOT}/current' \
      && find '${REMOTE_ROOT}/releases' -mindepth 1 -maxdepth 1 -type d | sort | head -n -5 | xargs -r rm -rf"
fi

echo "Deployed ${DEPLOY_DOMAIN} release ${RELEASE_ID} to ${REMOTE_RELEASE}"
