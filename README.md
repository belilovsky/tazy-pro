# TAZY.PRO prototype

Static first prototype for the national digital Tazy platform.

## Repository status

This is the first product prototype and planning repository. The current app is
static, while the product direction is captured in:

- [ROADMAP.md](./ROADMAP.md)
- [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)
- [docs/DATA_MODEL.md](./docs/DATA_MODEL.md)
- [docs/DATA_CONTRACT.md](./docs/DATA_CONTRACT.md)
- [docs/FRONTEND_APP_SHELL.md](./docs/FRONTEND_APP_SHELL.md)

## What is included

- Full responsive landing page.
- Evidence registry dog profile demo.
- Interactive breeding intelligence model.
- Digital passport preview.
- Lightweight app routes for public dog profiles and QR passports.
- Mock API adapter with persisted local reviewer decisions.
- FCI Data Room route with seed-derived evidence metrics.
- FCI recognition roadmap.
- RU/KZ/EN hero copy switch.
- Dark/light theme switch.

## Source material

- Project brief: "Национальная цифровая платформа TAZY".
- Visual/reference prototype: `naiza.html`.

## Run

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

Check JavaScript module syntax with:

```bash
npm run check
```

Check only the domain seed contract with:

```bash
npm run verify:domain
```
