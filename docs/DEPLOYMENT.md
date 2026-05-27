# Deployment

Production URLs:

- Breed platform: https://tazy.dog
- Feed/nutrition product: https://tazy.pro
- Backend/API origin: https://tazy.qdev.run

Current VPS target:

- VPS: `root@62.72.32.112`
- Breed static root: `/var/www/tazy.dog/current`
- Feed static root: `/var/www/tazy.pro/current`
- Staging static root: `/var/www/tazy.qdev.run/current`
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

## Hostinger Domains

The public launch domain is hosted on Hostinger as a static site:

```bash
npm run build:hostinger
```

Upload the contents of `dist/hostinger/tazy.dog/` into the domain root for
`tazy.dog`. This is the breed platform: registry, breeders, heritage map,
digital passports, and FCI readiness. The generated `.htaccess` forces HTTPS,
redirects `www.tazy.dog` to `tazy.dog`, disables directory listings, applies
conservative cache/security headers, and keeps SPA-style fallback to
`index.html`.

Upload the contents of `dist/hostinger/tazy.pro/` into the domain root for
`tazy.pro`. This is now the feed/nutrition product: formulas, kennel programs,
quality controls, and future feed-commerce/product work. It must not redirect
to `tazy.dog`; the only cross-link is an editorial link back to the breed
platform.

The Hostinger static bundle injects:

```html
<meta name="tazy-api-base" content="https://tazy.qdev.run" />
<link rel="canonical" href="https://tazy.dog/" />
```

That keeps the breed frontend deployable to Hostinger while the current FastAPI
backend and protected reviewer/FCI routes continue to run on the VPS.
`tazy.pro` is static-only until the feed product receives its own backend.

If Hostinger is used as the registrar only, point DNS `A` records for
`tazy.dog`, `www.tazy.dog`, `tazy.pro`, and `www.tazy.pro` to the VPS and use
`ops/nginx/tazy.dog.conf`. In that mode the breed frontend and API are
same-origin on `tazy.dog`, while `tazy.pro` is served from
`/var/www/tazy.pro/current` as a separate static feed site.

DNS records for the registrar-only setup:

```text
Type  Name  Value
A     @     62.72.32.112
A     www   62.72.32.112
```

Apply the same pair for both `tazy.dog` and `tazy.pro`. After `dig +short A
tazy.dog` returns `62.72.32.112`, issue TLS on the VPS:

```bash
certbot --nginx -d tazy.dog -d www.tazy.dog -d tazy.pro -d www.tazy.pro
```

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
- desktop and mobile navigation include the public architecture route
- `#/breeders`, `#/ecosystem`, `#/architecture`, `#/heritage`, and
  `#/fci-progress`
- `#/passport/tzy-kz-000182`
- `#/data-room`
- `#/admin` reviewer decision persistence
- desktop and mobile overflow checks

For quick production health verification run:

```bash
./scripts/smoke_prod.sh
./scripts/smoke_prod.sh https://tazy.qdev.run
```

Before deploying, run:

```bash
./scripts/verify_repo.sh
```

This includes Python tests, Ruff, domain/API contract checks, localized frontend
link coverage, and the AV DS token audit.

## Backup

Run a manual production SQLite backup with:

```bash
./scripts/backup_backend_db.sh
```

The backup command never prints database contents or secrets. It stores gzip
snapshots under `/opt/tazy-pro/shared/backups` and keeps the latest 14 by
default.
