# Deployment

Production URL:

- https://tazy.qdev.run

Current production target:

- VPS: `root@62.72.32.112`
- Static root: `/var/www/tazy.qdev.run/current`
- Releases: `/var/www/tazy.qdev.run/releases/<timestamp>`
- Backend root: `/opt/tazy-pro/current`
- Backend service: `tazy-pro-backend.service`
- Backend bind: `127.0.0.1:8182`
- Backend env: `/etc/tazy-pro/backend.env`
- Backend backups: `/opt/tazy-pro/shared/backups`
- Nginx config: `/etc/nginx/sites-available/tazy.qdev.run`
- TLS certificate: `/etc/letsencrypt/live/tazy.qdev.run/`

## Deploy Static

From the repository root:

```bash
./scripts/deploy_static.sh
```

Optional overrides:

```bash
DEPLOY_HOST=root@62.72.32.112 DEPLOY_DOMAIN=tazy.qdev.run ./scripts/deploy_static.sh
```

The script uploads the static app files, creates a timestamped release, updates
the `current` symlink, and keeps the latest five releases.

## Deploy Backend

```bash
./scripts/deploy_backend.sh
```

The backend deploy creates a timestamped release under `/opt/tazy-pro/releases`,
installs Python dependencies into `/opt/tazy-pro/shared/.venv`, keeps generated
production secrets in `/etc/tazy-pro/backend.env`, and restarts the systemd
service. It also installs `tazy-pro-backup.timer`, which snapshots the current
SQLite database daily while the MVP is not yet on Postgres.

The current nginx config proxies:

- `/api/` -> `http://127.0.0.1:8182`
- `/admin/` -> `http://127.0.0.1:8182`
- `.css`, `.js`, and `.mjs` static modules use `Cache-Control: no-cache`
  because the app is not bundled with hashed filenames yet.
- image assets keep the seven-day static cache.
- The current static module graph also carries a deployment query string to
  force-refresh browsers that saw the earlier seven-day JS cache.

## Nginx

The production host serves the static app with:

- HTTPS redirect from `http://tazy.qdev.run`
- `try_files $uri $uri/ /index.html`
- static asset caching for CSS, JS, and images
- `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`,
  `Permissions-Policy`, and HSTS headers

## Verify

```bash
curl -I https://tazy.qdev.run/
curl -I http://tazy.qdev.run/
curl -fsS https://tazy.qdev.run/api/v1/dogs
curl -fsS https://tazy.qdev.run/api/v1/health/db
curl -fsS https://tazy.qdev.run/admin/login
```

Expected:

- HTTPS returns `200`.
- HTTP returns `301` to `https://tazy.qdev.run/`.
- API dog registry returns `200`.
- API DB health returns `200`.
- `/api/v1/review/queue` returns `401` without reviewer session credentials.
- `GET /admin/login` and `HEAD /admin/login` return `200`.
- `strict-transport-security`, `x-content-type-options`, and
  `referrer-policy` are present on HTTPS.

Browser smoke should cover:

- home page renders with hero image
- RU/KZ/EN language switch
- `#/passport/tzy-kz-000194`
- `#/data-room`
- `#/admin` reviewer decision persistence
- desktop and mobile overflow checks

## Backup

Run a manual production SQLite backup with:

```bash
./scripts/backup_backend_db.sh
```

The backup command never prints database contents or secrets. It stores gzip
snapshots under `/opt/tazy-pro/shared/backups` and keeps the latest 14 by
default.
