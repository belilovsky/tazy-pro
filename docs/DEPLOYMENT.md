# Deployment

Production URL:

- https://tazy.qdev.run

Current production target:

- VPS: `root@62.72.32.112`
- Static root: `/var/www/tazy.qdev.run/current`
- Releases: `/var/www/tazy.qdev.run/releases/<timestamp>`
- Nginx config: `/etc/nginx/sites-available/tazy.qdev.run`
- TLS certificate: `/etc/letsencrypt/live/tazy.qdev.run/`

## Deploy

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
```

Expected:

- HTTPS returns `200`.
- HTTP returns `301` to `https://tazy.qdev.run/`.
- `strict-transport-security`, `x-content-type-options`, and
  `referrer-policy` are present on HTTPS.

Browser smoke should cover:

- home page renders with hero image
- RU/KZ/EN language switch
- `#/passport/tzy-kz-000194`
- `#/data-room`
- `#/admin` reviewer decision persistence
- desktop and mobile overflow checks
