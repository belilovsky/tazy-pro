# TAZY.DOG MVP Architecture

## Current state

The repository started as a static HTML/CSS/JS prototype and now includes the
first FastAPI backend in `backend/`.

Implemented backend surfaces:

- public registry and passport reads under `/api/v1`;
- reviewer queue and append-only decisions;
- FCI data-room snapshot;
- SQLAdmin mounted at `/admin`;
- SQLite-by-default local storage with `TAZY_DATABASE_URL` for Postgres.

The live frontend still runs as a static site, but route-level data now goes
through `src/api/tazyApi.js`. That client uses same-origin `/api/v1` in
production, authenticates reviewer routes through a backend session cookie, and
falls back to local seed data only on local/static development origins.

The public shell now intentionally separates:

- public trust surfaces: registry, dog profile, QR passport, breeders, geo map,
  heritage, architecture, and FCI progress;
- protected work surfaces: reviewer workspace and FCI Data Room;
- institutional exports: generated reports, evidence package snapshots, and
  future export runs.

The `#/architecture` route explains this boundary in product terms so the public
site does not look like a campaign landing page detached from the operating
model.

Production also has DB health checks, reviewer-login throttling, no-store
headers for protected API responses, and daily SQLite snapshots while Postgres
migration remains open.

## Recommended next architecture

Use a small monorepo once the project moves beyond the prototype:

```text
apps/
  web/          Public site, registry, passport, admin UI
  api/          Backend API if FastAPI is chosen
packages/
  domain/       Shared schemas, validation, verification rules
  ui/           Design tokens and reusable UI components
docs/
  *.md          Product, architecture, data model, operations notes
```

For the first MVP, there are two good backend paths:

- FastAPI + Postgres: best if we want explicit control, audit logs, and custom
  workflows from the start.
- Supabase + Postgres: best if we want faster admin/auth/storage bootstrap and
  can accept its product constraints.

The important decision is not the framework. The important decision is to keep a
clear domain model and audit trail from day one.

## Core flows

### Dog registration

1. Breeder or registrar creates a draft dog profile.
2. Required fields are validated.
3. Evidence items are attached: pedigree, DNA, health, field trials, photos.
4. Reviewer approves, rejects, or requests changes.
5. Public profile is updated only from approved evidence.

### Public dog profile

1. Visitor opens `/dogs/:id`.
2. API returns public-safe dog data.
3. UI shows completeness score and verification levels.
4. Sensitive owner/contact fields stay private unless explicitly public.

### Digital passport

1. Verified dog receives a stable passport ID.
2. System generates QR code for `/passport/:id`.
3. Passport view shows current verified snapshot.
4. Snapshot includes hash and event-log reference.
5. PDF export can be generated from the same data.

### Breeding model

1. Breeder selects sire and dam.
2. Backend reads pedigree graph and health evidence.
3. System calculates COI and risk signals.
4. Result includes recommendation, confidence, and missing evidence.
5. Decision is saved as a non-binding advisory record.

### FCI Data Room

1. Authorized reviewer opens `/data-room`.
2. System summarizes pedigree depth, health, DNA, field trials, and population.
3. Data can be exported as CSV/PDF packages.
4. Reports are generated from verified records only.

### Public architecture route

1. Visitor opens `#/architecture`.
2. UI explains the evidence core, public API, reviewer workflow, breeding
   analytics, and export/data-room layers.
3. The route links back to the public registry and protected data room without
   exposing private evidence.
4. Active navigation reflects the architecture surface on desktop and mobile.

### AV DS interface layer

1. Static page sections and app routes use the semantic token boundary in
   `styles.css`.
2. Component CSS below the token block is checked by
   `scripts/audit-avds-tokens.js`.
3. RU/KZ/EN copy is applied through `src/i18n/runtime.js`.
4. `scripts/verify-frontend-contract.js` verifies that localized copy keys and
   static route links are complete.

## Trust and audit model

- Every public claim should have an evidence source.
- Every evidence source should have a reviewer decision.
- Every reviewer decision should create an immutable event.
- Public pages should expose enough verification metadata to create trust without
  leaking personal data.
- Imported records should retain source, import timestamp, and transformation
  notes.

## Suggested technical baseline

- Frontend: React + Vite or Next.js.
- Language: TypeScript.
- API schema: OpenAPI or tRPC-style typed contract.
- Database: Postgres.
- Backend draft contracts: [API_SPEC.md](./API_SPEC.md) and
  [POSTGRES_SCHEMA.sql](./POSTGRES_SCHEMA.sql).
- Files: object storage with private originals and public derived assets.
- Auth: role-based access for admins, reviewers, breeders, and public users.
- Tests: unit tests for domain rules, integration tests for API flows,
  frontend contract checks for localization/routes, AV DS token audit, and
  rendered smoke for public pages.

## Security and privacy baseline

- No raw private owner data in public API responses.
- Short-lived signed URLs for private documents.
- Append-only audit events for verification decisions.
- Role checks on every admin endpoint.
- Rate limits on public profile and search endpoints.
- Backups tested before launch.
