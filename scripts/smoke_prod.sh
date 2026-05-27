#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-${SMOKE_BASE_URL:-https://tazy.qdev.run}}"
TMP_DIR=$(mktemp -d)
trap 'rm -rf "${TMP_DIR}"' EXIT

assert() {
  local condition=$1
  local message=$2
  if ! eval "[[ $condition ]]"; then
    echo "SMOKE CHECK FAILED: ${message}" >&2
    exit 1
  fi
}

fetch() {
  local method=$1
  local path=$2
  local tag=$3
  local body_file="${TMP_DIR}/${tag}-body.json"
  local headers_file="${TMP_DIR}/${tag}-headers.txt"

  local status
  status=$(curl -sS -X "$method" "$BASE_URL$path" -o "$body_file" -D "$headers_file" -w '%{http_code}')
  echo "${status} ${body_file} ${headers_file}"
}

assert_has_header() {
  local headers_file=$1
  local header_name=$2
  if ! grep -qi "^${header_name}:" "$headers_file"; then
    echo "SMOKE CHECK FAILED: missing ${header_name} header" >&2
    exit 1
  fi
}

log() {
  echo "[smoke] $1"
}

log "Target ${BASE_URL}"

read -r dogs_status dogs_body dogs_headers < <(fetch GET /api/v1/dogs dogs)
assert "${dogs_status} -eq 200" "GET ${BASE_URL}/api/v1/dogs must return 200"
read -r api_health_status api_health_body api_health_headers < <(fetch GET /api/v1/health api-health)
assert "${api_health_status} -eq 200" "GET ${BASE_URL}/api/v1/health must return 200"
read -r api_db_status api_db_body api_db_headers < <(fetch GET /api/v1/health/db api-db)
assert "${api_db_status} -eq 200" "GET ${BASE_URL}/api/v1/health/db must return 200"
read -r public_status public_body public_headers < <(fetch GET /health public-health)
assert "${public_status} -eq 200" "GET ${BASE_URL}/health must return 200"
read -r queue_status queue_body queue_headers < <(fetch GET /api/v1/review/queue review-queue)
assert "${queue_status} -eq 401" "GET ${BASE_URL}/api/v1/review/queue must return 401"

read -r admin_status admin_body admin_headers < <(fetch GET /admin/login admin-login)
assert "${admin_status} -eq 200" "GET ${BASE_URL}/admin/login must return 200"
read -r admin_head_status admin_head_body admin_head_headers < <(fetch HEAD /admin/login admin-login-head)
assert "${admin_head_status} -eq 200" "HEAD ${BASE_URL}/admin/login must return 200"

assert_has_header "$dogs_headers" 'X-Request-ID'
assert_has_header "$dogs_headers" 'x-content-type-options'
assert_has_header "$dogs_headers" 'referrer-policy'
assert_has_header "$dogs_headers" 'permissions-policy'

python3 - "$dogs_body" "$api_health_body" "$api_db_body" "$queue_body" "$admin_body" <<'PY'
import json
import sys

dogs_body, api_health_body, api_db_body, queue_body, admin_body = sys.argv[1:]

dogs_payload = json.loads(open(dogs_body, encoding="utf-8").read())
assert isinstance(dogs_payload, dict), dogs_body
assert isinstance(dogs_payload.get("items"), list), dogs_payload

api_health = json.loads(open(api_health_body, encoding="utf-8").read())
assert api_health.get("status") == "ok", api_health

api_db = json.loads(open(api_db_body, encoding="utf-8").read())
assert api_db.get("status") == "ok", api_db

queue = json.loads(open(queue_body, encoding="utf-8").read())
assert queue["error"]["code"] == "unauthorized"

admin_html = open(admin_body, encoding="utf-8").read()
assert "TAZY.DOG Admin" in admin_html

print("[smoke] JSON assertions passed")
PY

log "Smoke checks passed"
