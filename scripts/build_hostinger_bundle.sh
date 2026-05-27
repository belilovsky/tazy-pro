#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST_DIR="${ROOT_DIR}/dist/hostinger"
MAIN_DIR="${DIST_DIR}/tazy.dog"
PRO_DIR="${DIST_DIR}/tazy.pro"
API_BASE="${HOSTINGER_API_BASE:-https://tazy.qdev.run}"
CANONICAL_URL="${HOSTINGER_CANONICAL_URL:-https://tazy.dog/}"

rm -rf "${MAIN_DIR}" "${PRO_DIR}"
rm -f \
  "${DIST_DIR}/tazy.dog-hostinger.zip" \
  "${DIST_DIR}/tazy.pro-hostinger.zip" \
  "${DIST_DIR}/tazy.pro-redirect-hostinger.zip"
install -d -m 0755 "${MAIN_DIR}" "${PRO_DIR}"

cp "${ROOT_DIR}/index.html" "${MAIN_DIR}/index.html"
cp "${ROOT_DIR}/styles.css" "${MAIN_DIR}/styles.css"
cp -R "${ROOT_DIR}/assets" "${MAIN_DIR}/assets"
cp -R "${ROOT_DIR}/src" "${MAIN_DIR}/src"
cp "${ROOT_DIR}/ops/hostinger/tazy-dog.htaccess" "${MAIN_DIR}/.htaccess"

python3 - "$MAIN_DIR/index.html" "$API_BASE" "$CANONICAL_URL" <<'PY'
from __future__ import annotations

import pathlib
import sys

index_path = pathlib.Path(sys.argv[1])
api_base = sys.argv[2].rstrip("/")
canonical_url = sys.argv[3]

html = index_path.read_text(encoding="utf-8")
head_marker = '    <meta name="theme-color" content="#071014" />'
extra = []
if 'name="tazy-api-base"' not in html:
    extra.append(f'    <meta name="tazy-api-base" content="{api_base}" />')
if 'rel="canonical"' not in html:
    extra.append(f'    <link rel="canonical" href="{canonical_url}" />')
if 'property="og:url"' not in html:
    extra.append('    <meta property="og:url" content="https://tazy.dog/" />')
if 'name="tazy-api-base"' not in html:
    html = html.replace(head_marker, "\n".join([head_marker, *extra]))
elif extra:
    html = html.replace(head_marker, "\n".join([head_marker, *extra]))

html = html.replace('content="./assets/tazy-hero.png"', 'content="https://tazy.dog/assets/tazy-hero.png"')
index_path.write_text(html, encoding="utf-8")
PY

node "${ROOT_DIR}/scripts/build_localized_entrypoints.js" "${MAIN_DIR}" "https://tazy.dog"

cat > "${MAIN_DIR}/robots.txt" <<'ROBOTS'
User-agent: *
Allow: /
Sitemap: https://tazy.dog/sitemap.xml
ROBOTS

cat > "${MAIN_DIR}/sitemap.xml" <<'SITEMAP'
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://tazy.dog/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://tazy.dog/en/</loc>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
</urlset>
SITEMAP

cp "${ROOT_DIR}/ops/hostinger/tazy-pro-feed.htaccess" "${PRO_DIR}/.htaccess"
cp "${ROOT_DIR}/ops/hostinger/tazy-pro-feed.html" "${PRO_DIR}/index.html"
cp -R "${ROOT_DIR}/assets" "${PRO_DIR}/assets"

cat > "${PRO_DIR}/robots.txt" <<'ROBOTS'
User-agent: *
Allow: /
Sitemap: https://tazy.pro/sitemap.xml
ROBOTS

cat > "${PRO_DIR}/sitemap.xml" <<'SITEMAP'
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://tazy.pro/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
SITEMAP

(
  cd "${MAIN_DIR}"
  zip -qr "${DIST_DIR}/tazy.dog-hostinger.zip" .
)
(
  cd "${PRO_DIR}"
  zip -qr "${DIST_DIR}/tazy.pro-hostinger.zip" .
)

echo "Built Hostinger bundles:"
echo "  ${MAIN_DIR}"
echo "  ${DIST_DIR}/tazy.dog-hostinger.zip"
echo "  ${PRO_DIR}"
echo "  ${DIST_DIR}/tazy.pro-hostinger.zip"
