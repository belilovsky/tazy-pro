# TAZY.PRO Backend

FastAPI backend for the current TAZY.PRO MVP. It follows the existing project
contracts in `docs/API_SPEC.md` and `docs/POSTGRES_SCHEMA.sql`, and reuses the
same admin direction as the QPet SQLAdmin stack.

## Run Locally

```bash
python3 -m venv .venv
. .venv/bin/activate
pip install -r backend/requirements.txt
uvicorn backend.app.main:app --reload --port 8181
```

The default local database is SQLite at `.tazy/tazy.db`. For Postgres:

```bash
export TAZY_DATABASE_URL='postgresql+asyncpg://user:pass@localhost:5432/tazy'
```

## Admin

SQLAdmin is mounted at `/admin`.

Local defaults:

```text
TAZY_ADMIN_USERNAME=admin
TAZY_ADMIN_PASSWORD=admin
```

Production must set:

```text
TAZY_DEBUG=false
TAZY_SECRET_KEY=...
TAZY_ADMIN_USERNAME=...
TAZY_ADMIN_PASSWORD=...
TAZY_REVIEWER_API_KEY=...
TAZY_DATABASE_URL=postgresql+asyncpg://...
```

## API Smoke

```bash
curl http://localhost:8181/health
curl http://localhost:8181/api/v1/dogs
curl http://localhost:8181/api/v1/dogs/akzhel-barys
curl http://localhost:8181/api/v1/review/session
curl -H "X-Reviewer-Key: dev-reviewer-key" http://localhost:8181/api/v1/review/queue
```

The browser reviewer workspace should use `/api/v1/review/login` and the
same-origin session cookie. `X-Reviewer-Key` is kept for scripted smoke checks
and operational fallback.

## Local verification

```bash
.venv/bin/python -m py_compile $(find backend tests -name '*.py' -print)
.venv/bin/python -m pytest -q
.venv/bin/python -m pip install ruff
.venv/bin/python -m ruff check backend tests
node scripts/verify-domain.js
node scripts/verify-api-client.js
node scripts/audit-avds-tokens.js
```

## Deploy

The production helper installs the backend as a systemd service on
`127.0.0.1:8182` and stores generated secrets in `/etc/tazy-pro/backend.env`:

```bash
./scripts/deploy_backend.sh
```

After that, nginx should proxy `/api/` and `/admin/` to the backend port.
