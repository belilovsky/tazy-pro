# TAZY.PRO

Working MVP for the national digital Tazy platform: public registry, digital
passport, reviewer workspace, FCI data room, and SQLAdmin-backed operations.

## Repository status

This repository already contains the current frontend MVP, the FastAPI backend,
deployment helpers, and the planning docs that shape the next rounds:

- [ROADMAP.md](./ROADMAP.md)
- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)
- [docs/API_SPEC.md](./docs/API_SPEC.md)
- [docs/DATA_MODEL.md](./docs/DATA_MODEL.md)
- [docs/DATA_CONTRACT.md](./docs/DATA_CONTRACT.md)
- [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)
- [docs/FRONTEND_APP_SHELL.md](./docs/FRONTEND_APP_SHELL.md)
- [docs/POSTGRES_SCHEMA.sql](./docs/POSTGRES_SCHEMA.sql)

## What is included

- Full responsive landing page.
- Evidence registry dog profile demo.
- Interactive breeding intelligence model.
- Digital passport preview.
- Lightweight app routes for public dog profiles and QR passports.
- Mock API adapter with persisted local reviewer decisions.
- FastAPI backend skeleton with SQLAlchemy models, seeded public API, reviewer endpoints, and SQLAdmin.
- Browser HTTP client that uses `/api/v1` in production and falls back to local seed data for static development.
- DB health checks, protected-response no-store headers, reviewer login throttling, and daily SQLite backups.
- FCI Data Room route with seed-derived evidence metrics.
- FCI recognition roadmap.
- RU/KZ/EN hero copy switch.
- RU/KZ/EN shell and landing copy catalog.
- Dark/light theme switch.

## Source material

- Project brief: "Национальная цифровая платформа TAZY".
- Visual/reference prototype: `naiza.html`.

## Run frontend

Open `index.html` directly in a browser, or run a simple local server:

```bash
python3 -m http.server 4173
```

Then open `http://localhost:4173`.

Useful local routes:

- `http://localhost:4173/#/dogs/akzhel-barys`
- `http://localhost:4173/#/passport/tzy-kz-000182`
- `http://localhost:4173/#/admin`

If Node/npm is available, the same server can be started with:

```bash
npm run dev
```

Check JavaScript modules, API contract expectations, and AV DS token usage with:

```bash
npm run check
```

## Backend

The first backend is in [backend/](./backend). It follows the existing API and
Postgres drafts instead of introducing a parallel model:

- `GET /api/v1/dogs`
- `GET /api/v1/dogs/{id}`
- `GET /api/v1/passports/{passportId}`
- `GET /api/v1/review/queue`
- `POST /api/v1/review/decisions`
- `GET /api/v1/fci/data-room`
- SQLAdmin at `/admin`
- `GET /api/v1/health/db`

The static app uses the same-origin `/api/v1` client in `src/api/tazyApi.js`.
Reviewer routes authenticate through a backend session cookie; `X-Reviewer-Key`
remains available only as a service fallback.

Local backend run:

```bash
python3 -m venv .venv
. .venv/bin/activate
pip install -r backend/requirements.txt
uvicorn backend.app.main:app --reload --port 8181
```

Backend verification:

```bash
.venv/bin/python -m py_compile $(find backend tests -name '*.py' -print)
.venv/bin/python -m pytest -q
.venv/bin/python -m pip install ruff
.venv/bin/python -m ruff check backend tests
```

GitHub Actions runs the same backend checks plus the frontend contract and AV DS
audits on every push to `main` and on pull requests.
