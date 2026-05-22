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

src/ui/shell.js
  Owns header scroll state, theme toggle, language switch, and mobile menu.

src/ui/registry.js
  Owns the registry dog selector and verification rows.

src/ui/breeding.js
  Owns the breeding pair model controls and recommendation output.

src/ui/router.js
  Owns lightweight hash routes for public dog profiles, digital passports, and
  reviewer workspace views.

src/ui/evidence.js
  Owns shared evidence row rendering used by registry and route views.

src/ui/admin.js
  Owns the reviewer workspace demo: queue selection, profile impact, reviewer
  notes, and local decision state.
```

## Migration path to React/Vite

When package tooling is available, these modules can move directly into React:

- `src/data/platform.js` becomes seed/domain data.
- `src/domain/contracts.js` becomes shared schema/types.
- `src/domain/readModels.js` becomes generated API clients or selector helpers.
- `src/ui/registry.js` becomes `RegistrySection`.
- `src/ui/breeding.js` becomes `BreedingConsole`.
- `src/ui/admin.js` becomes `ReviewerWorkspace`.
- `src/ui/router.js` becomes the route map for `/dogs/:id`, `/passport/:id`,
  and `/admin`.
- `src/ui/shell.js` splits into `Header`, `MobileMenu`, `ThemeToggle`, and
  `LanguageSwitch`.
- `index.html` sections become route/page components.

The important rule is to preserve the existing product blocks and behavior while
changing the implementation layer.
