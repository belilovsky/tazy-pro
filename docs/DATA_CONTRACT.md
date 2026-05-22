# Frontend Data Contract

This repository can still run as a static prototype, but the frontend now has a
small domain layer and a same-origin HTTP client that mirror the backend
contract.

## Contract modules

```text
src/domain/contracts.js
  JSDoc domain typedefs, enum-like constants, labels, and seed validators.

src/domain/readModels.js
  Read helpers used by UI modules. UI should read through this layer instead of
  reaching directly into raw seed records.

src/api/mockApi.js
  Local fallback adapter. It wraps read models, simulates a small network delay,
  and persists reviewer decisions to browser localStorage.

src/api/tazyApi.js
  Production browser API client. It calls same-origin `/api/v1`, sends
  reviewer keys from sessionStorage for protected routes, and falls back to
  `mockApi` when the backend is not available in local static development.

src/data/platform.js
  Temporary seed data shaped like future API records.

scripts/verify-domain.js
  Local verification for seed data shape and cross-record references.
```

## Current entities

### Dog

Public registry profile. Important fields:

- `id`
- `name`
- `sex`
- `dateOfBirth`
- `region`
- `registryNumber`
- `passportId`
- `verificationLevel`
- `completenessScore`
- `breeder`
- `kennel`
- `steps`
- `passportEvents`

### EvidenceItem

Reviewer-facing evidence record. Important fields:

- `id`
- `dogId`
- `type`
- `label`
- `title`
- `submittedBy`
- `receivedAt`
- `priority`
- `status`
- `visibility`
- `summary`
- `reviewerNote`

### VerificationDecision

Audit-log event prepared by reviewer actions.

- `id`
- `evidenceItemId`
- `decision`
- `reviewerId`
- `note`
- `createdAt`

### PassportEvent

Public digital-passport event.

- `id`
- `dogId`
- `type`
- `title`
- `value`
- `eventAt`
- `visibility`
- `evidenceItemId`

## Rules

- UI modules that model product workflows should call `src/api/tazyApi.js`.
- UI modules should prefer `src/domain/readModels.js`.
- Raw seed arrays in `src/data/platform.js` should be treated as API fixtures.
- New fields should be added to `contracts.js` first, then seed data, then UI.
- Public views should use read models that can later enforce public/private field
  policy.
- Reviewer decisions are persisted through the backend as append-only audit
  events when `/api/v1` is available; local static development uses mock storage.

## API adapter surface

```js
tazyApi.listDogs()
tazyApi.getDog(id)
tazyApi.getDogByPassport(passportId)
tazyApi.listEvidenceForDog(dogId)
tazyApi.listReviewQueue()
tazyApi.listVerificationDecisions()
tazyApi.getVerificationDecision(evidenceItemId)
tazyApi.createVerificationDecision({ evidenceItemId, decision, note, reviewerId })
tazyApi.getFciDataRoomSnapshot()
tazyApi.resolvePassport(passportId)
```

The adapter is intentionally narrow. It gives UI modules one backend-like
boundary while preserving offline/static fallback behavior for design and review
work.

The matching backend draft is captured in:

- [API_SPEC.md](./API_SPEC.md)
- [POSTGRES_SCHEMA.sql](./POSTGRES_SCHEMA.sql)

## Verification

```bash
npm run verify:domain
npm run check
```

The domain and API verifiers are intentionally lightweight. They catch missing
required fields, broken dog references, reviewer-auth header regressions, and
local fallback regressions before the app is deployed.
