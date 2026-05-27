# TAZY.DOG MVP API Contract

Draft contract for the first backend. It mirrors the current frontend domain
modules and is intentionally small enough to implement with FastAPI + Postgres.

## Principles

- Public endpoints must return public-safe fields only.
- Reviewer endpoints require an authenticated reviewer/admin role.
- Public profile fields are derived from approved or explicitly pending evidence.
- Reviewer decisions are append-only audit events.
- IDs in URLs are stable slugs or passport IDs; internal database UUIDs can stay
  private.

## Base

```text
Base path: /api/v1
Content-Type: application/json
```

## Public Registry

### `GET /dogs`

Returns public registry cards.

Query params:

- `q`
- `region`
- `verification_level_min`
- `limit`
- `cursor`

Response:

```json
{
  "items": [
    {
      "id": "akzhel-barys",
      "name": "Akzhel Barys",
      "sex": "male",
      "region": "Almaty region",
      "registryNumber": "TZY-2034-0182",
      "passportId": "TZY-KZ-000182",
      "verificationLevel": 7,
      "completenessScore": 86,
      "photo": "/media/dogs/akzhel-barys.jpg"
    }
  ],
  "nextCursor": null
}
```

### `GET /dogs/{id}`

Returns a public-safe dog profile.

Response fields should match the frontend `Dog` read model:

- identity: `id`, `name`, `sex`, `dateOfBirth`, `region`
- registry: `registryNumber`, `passportId`, `verificationLevel`,
  `completenessScore`
- public institution data: `breeder`, `kennel`
- public copy/media: `summary`, `photo`, `alt`
- public evidence summary: `steps`

Private owner/contact details must not appear here.

### `GET /passports/{passportId}`

Returns public digital-passport data for QR views.

Response:

```json
{
  "dog": {
    "id": "akzhel-barys",
    "name": "Akzhel Barys",
    "registryNumber": "TZY-2034-0182",
    "passportId": "TZY-KZ-000182"
  },
  "events": [
    {
      "id": "passport-barys-dna",
      "type": "dna",
      "title": "DNA parentage",
      "value": "Verified · 2026-05-17",
      "eventAt": "2026-05-17",
      "evidenceItemId": "dna-barys-parentage"
    }
  ],
  "snapshotHash": "sha256:..."
}
```

## Reviewer Workspace

### `GET /review/session`

Returns the current reviewer session state.

```json
{
  "authenticated": true,
  "reviewerId": "admin"
}
```

### `POST /review/login`

Creates a same-origin reviewer session cookie. The MVP uses the configured admin
credentials until role-specific reviewer accounts are split out.

```json
{
  "username": "admin",
  "password": "..."
}
```

### `POST /review/logout`

Clears the reviewer session.

### `GET /review/queue`

Role: reviewer/admin.

Returns evidence items needing reviewer attention, enriched with the public dog
summary and the latest decision if one exists.

Response:

```json
{
  "items": [
    {
      "id": "dna-koke-parentage",
      "dogId": "saumal-koke",
      "type": "dna",
      "label": "DNA parentage",
      "title": "Lab sample confirmation",
      "submittedBy": "Turkistan Tazy Club",
      "receivedAt": "2026-05-19",
      "priority": "high",
      "status": "waiting_external",
      "visibility": "reviewer_only",
      "summary": "Lab sample was received...",
      "reviewerNote": "Hold public DNA claim...",
      "dog": {
        "id": "saumal-koke",
        "name": "Saumal Koke",
        "registryNumber": "TZY-2034-0194"
      },
      "currentDecision": null
    }
  ]
}
```

### `POST /review/decisions`

Role: reviewer/admin.

Creates an append-only decision event.

Request:

```json
{
  "evidenceItemId": "dna-koke-parentage",
  "decision": "approved",
  "note": "Lab confirmation received.",
  "reviewerId": "user_123"
}
```

Response:

```json
{
  "id": "decision-dna-koke-parentage-1779426824741",
  "evidenceItemId": "dna-koke-parentage",
  "decision": "approved",
  "decisionLabel": "Approved",
  "reviewerId": "user_123",
  "note": "Lab confirmation received.",
  "createdAt": "2026-05-22T05:13:44.741Z"
}
```

## FCI Data Room

### `GET /fci/data-room`

Role: reviewer/admin for the full view. Public stakeholders can receive a reduced
read-only version later.

Returns the snapshot currently modeled by `src/domain/dataRoom.js`:

- recognition cycle metadata
- registered/export-ready profile metrics
- average completeness
- open evidence count
- evidence coverage
- priority queue
- export package statuses

### `GET /fci/export-packages`

Role: reviewer/admin.

Returns available export package descriptors.

### `POST /fci/export-packages/{packageId}/runs`

Role: admin.

Creates an export run. The first implementation can write a CSV/JSON artifact to
object storage and record its hash.

## Error shape

Use one error shape across the API:

```json
{
  "error": {
    "code": "not_found",
    "message": "Dog profile not found",
    "requestId": "req_..."
  }
}
```

Expected codes:

- `bad_request`
- `unauthorized`
- `forbidden`
- `not_found`
- `conflict`
- `validation_error`
- `internal_error`

## First Implementation Order

1. `GET /dogs`, `GET /dogs/{id}`, `GET /passports/{passportId}`.
2. `GET /review/queue`, `POST /review/decisions`.
3. `GET /fci/data-room`.
4. Export package run creation after storage and audit logging are in place.
