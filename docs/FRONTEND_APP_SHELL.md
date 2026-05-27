# Frontend App Shell

## Decision

The first app shell uses native ES modules instead of introducing a framework
immediately. This keeps the existing prototype blocks intact, avoids a package
manager dependency during the first cleanup, and leaves a clear migration path to
React/Vite later.

## Current module map

```text
index.html
  Loads the existing page sections and starts src/main.js.

src/main.js
  Bootstraps the page.

src/data/platform.js
  Contains API-shaped seed data: dog profiles, evidence items, breeding pair
  scores, and hero language copy.

src/domain/contracts.js
  Owns JSDoc domain typedefs, enum-like constants, display labels, and seed
  validators.

src/domain/readModels.js
  Owns read helpers used by UI modules so screens do not depend on raw seed
  arrays.

src/i18n/messages.js
  Owns the first RU/KZ/EN copy catalog for shell and landing sections.

src/i18n/runtime.js
  Applies RU/KZ/EN copy to static HTML and app-route views, updates metadata,
  aria-labels, placeholders, image alt text, active language state, and document
  language.

src/api/mockApi.js
  Owns local fallback methods and browser-only reviewer-decision persistence for
  static development.

src/api/tazyApi.js
  Owns the production browser API boundary. It calls same-origin `/api/v1`,
  handles reviewer session login, and falls back to `mockApi` only when the
  backend is unavailable in local static mode.

src/ui/shell.js
  Owns header scroll state, theme toggle, language switch, active navigation,
  and mobile menu behavior.

src/ui/registry.js
  Owns the registry dog selector and verification rows.

src/ui/breeding.js
  Owns the breeding pair model controls and recommendation output.

src/ui/router.js
  Owns lightweight hash routes for public product routes, dog profiles, digital
  passports, reviewer workspace, and FCI Data Room views.

src/ui/dataRoom.js
  Owns the FCI Data Room route and evidence package snapshot rendering.

src/ui/evidence.js
  Owns shared evidence row rendering used by registry and route views.

src/ui/admin.js
  Owns the reviewer workspace: queue selection, profile impact, reviewer notes,
  reviewer-key prompt, and append-only backend decision creation.
```

## Public route map

```text
#/breeders       Verification tiers, breeder code, litter declaration, trust marks
#/ecosystem      Regional map, events, QR validation, field/offline planning
#/architecture   Evidence core, public/protected boundary, API and AV DS contract
#/heritage       Living heritage archive, diplomacy, import and press surfaces
#/fci-progress   FCI recognition cycle and generated reporting posture
#/dogs/:id       Public dog profile
#/passport/:id   Public digital passport
#/data-room      Protected FCI evidence package snapshot
#/admin          Protected reviewer workspace
```

The static home page mirrors the same product map as sections, so every
important platform idea is visible before a user enters protected workflows.

## Frontend contracts

`scripts/verify-frontend-contract.js` checks two production-sensitive surfaces:

- every static `data-copy*` key and code-level copy key exists in RU/KZ/EN;
- every static hash link points to a known page anchor or app route.
- browser state uses `tazy-dog.*` storage keys while still reading and migrating
  the legacy `tazy-pro.*` keys created before the domain split.

`scripts/audit-avds-tokens.js` enforces the AV DS boundary: component CSS below
the token block must use semantic variables instead of raw colors or legacy
tokens. The shell also ships the AV DS local font bundle from `assets/fonts/avds`
and maps type roles to the current AV DS stack: `IBM Plex Sans` for UI/display,
`IBM Plex Mono` for metrics, identifiers, and tabular data, and `IBM Plex Serif`
reserved only for future editorial/report surfaces.

## Migration path to React/Vite

When package tooling is available, these modules can move directly into React:

- `src/data/platform.js` becomes seed/domain data.
- `src/domain/contracts.js` becomes shared schema/types.
- `src/domain/readModels.js` becomes generated API clients or selector helpers.
- `src/api/tazyApi.js` remains the real HTTP client boundary.
- `src/i18n/messages.js` and `src/i18n/runtime.js` become the application
  translation catalog and i18n runtime.
- `src/ui/registry.js` becomes `RegistrySection`.
- `src/ui/breeding.js` becomes `BreedingConsole`.
- `src/ui/admin.js` becomes `ReviewerWorkspace`.
- `src/ui/dataRoom.js` becomes `FciDataRoom`.
- `src/ui/router.js` becomes the route map for public product pages,
  `/dogs/:id`, `/passport/:id`, `/data-room`, and `/admin`.
- `src/ui/shell.js` splits into `Header`, `MobileMenu`, `ThemeToggle`, and
  `LanguageSwitch`.
- `index.html` sections become route/page components.

The important rule is to preserve the existing product blocks and behavior while
changing the implementation layer.
