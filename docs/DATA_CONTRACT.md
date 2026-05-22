# Frontend Data Contract

This repository is still a static prototype, but the frontend now has a small
domain layer that mirrors the future backend contract.

## Contract modules

```text
src/domain/contracts.js
  JSDoc domain typedefs, enum-like constants, labels, and seed validators.

src/domain/readModels.js
  Read helpers used by UI modules. UI should read through this layer instead of
  reaching directly into raw seed records.

src/api/mockApi.js
  Async frontend API adapter. It wraps read models, simulates a small network
  delay, and persists reviewer decisions to browser localStorage.

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

- UI modules that model product workflows should call `src/api/mockApi.js`.
- UI modules should prefer `src/domain/readModels.js`.
- Raw seed arrays in `src/data/platform.js` should be treated as API fixtures.
- New fields should be added to `contracts.js` first, then seed data, then UI.
- Public views should use read models that can later enforce public/private field
  policy.
- Reviewer decisions are persisted locally through the mock API for now; backend
  implementation should persist them as append-only audit events.

## Mock API surface

```js
mockApi.listDogs()
mockApi.getDog(id)
mockApi.getDogByPassport(passportId)
mockApi.listEvidenceForDog(dogId)
mockApi.listReviewQueue()
mockApi.listVerificationDecisions()
mockApi.getVerificationDecision(evidenceItemId)
mockApi.createVerificationDecision({ evidenceItemId, decision, note, reviewerId })
mockApi.clearVerificationDecisions()
mockApi.resolvePassport(passportId)
```

The adapter is intentionally narrow. It gives UI modules a backend-like boundary
without committing the repository to a framework or backend service before the
MVP schema is approved.

## Verification

```bash
npm run verify:domain
npm run check
```

The domain verifier is intentionally lightweight. It catches missing required
fields and broken dog references before the prototype grows into a backend-backed
application.
