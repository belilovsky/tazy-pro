#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT_DIR}"

if [ -x "${ROOT_DIR}/.venv/bin/python" ]; then
  PYTHON_BIN="${ROOT_DIR}/.venv/bin/python"
else
  PYTHON_BIN="${PYTHON_BIN:-python3}"
fi

NODE_BIN="${NODE_BIN:-node}"

if ! command -v "${PYTHON_BIN}" >/dev/null 2>&1; then
  echo "Python runtime not found: ${PYTHON_BIN}" >&2
  exit 1
fi

if ! command -v "${NODE_BIN}" >/dev/null 2>&1; then
  echo "Node runtime not found: ${NODE_BIN}" >&2
  exit 1
fi

echo "==> Python compile"
"${PYTHON_BIN}" -m py_compile $(find backend tests -name '*.py' -print)

echo "==> Pytest"
"${PYTHON_BIN}" -m pytest -q

echo "==> Ruff"
"${PYTHON_BIN}" -m ruff check backend tests

echo "==> Domain contract"
"${NODE_BIN}" scripts/verify-domain.js

echo "==> API client"
"${NODE_BIN}" scripts/verify-api-client.js

echo "==> AV DS token audit"
"${NODE_BIN}" scripts/audit-avds-tokens.js

echo "Verification passed."
