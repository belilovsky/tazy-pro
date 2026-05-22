# TAZY.PRO MVP Architecture

## Current state

The repository currently contains a static HTML/CSS/JS prototype. It is useful for
product direction and visual language, but it is not yet a production
application.

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
- Files: object storage with private originals and public derived assets.
- Auth: role-based access for admins, reviewers, breeders, and public users.
- Tests: unit tests for domain rules, integration tests for API flows,
  Playwright smoke for public pages.

## Security and privacy baseline

- No raw private owner data in public API responses.
- Short-lived signed URLs for private documents.
- Append-only audit events for verification decisions.
- Role checks on every admin endpoint.
- Rate limits on public profile and search endpoints.
- Backups tested before launch.

