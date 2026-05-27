# TAZY.DOG Roadmap

## Product thesis

TAZY.DOG should become the trusted digital infrastructure for the Kazakh Tazy:
registry, evidence, digital passports, breeding quality, and FCI readiness in one
system.

`tazy.pro` is now a separate feed and nutrition product. This roadmap covers the
breed platform on `tazy.dog`; nutrition-specific product work should stay in the
separate feed backlog.

The platform should not look like a campaign page only. Its strongest position is
proof-first infrastructure: every public claim about a dog, kennel, pedigree, or
population should be backed by traceable records.

## Principles

- Evidence before promotion.
- Public trust without exposing private owner data.
- FCI-compatible records from the first MVP.
- KZ/RU/EN as product-level languages, not only landing-page copy.
- Auditability for every verification decision.
- Breeding intelligence as population governance, not just matchmaking.

## Phase 0: Prototype

Status: done.

- Static responsive product prototype.
- Public registry concept.
- Digital passport preview.
- Breeding intelligence demo.
- FCI 2024-2034 evidence narrative.
- Public breeder, geo ecosystem, heritage, architecture, and FCI progress
  surfaces.
- AV DS semantic-token boundary and frontend contract checks.
- Dark/light theme and RU/KZ/EN copy runtime.

## Phase 1: MVP Foundation

Goal: replace the static prototype with a working application skeleton.

- Move frontend to React + Vite or Next.js.
- Create app routes:
  - `/` public platform overview.
  - `/dogs/:id` public dog profile.
  - `/passport/:id` QR passport view.
  - `/admin` verification workspace.
  - `/data-room` FCI export workspace.
- Add full KZ/RU/EN localization.
- Add design tokens and reusable UI components.
- Define backend contract and seed data.
- Add basic CI: lint, type check, build.

Current MVP note: the static shell already includes the first version of these
surfaces and contract checks. The remaining Phase 1 work is primarily the
framework/build-tool migration, route-level TypeScript, and production CI
packaging once package tooling is available.

Suggested success metric: a reviewer can open a real dog profile, inspect its
evidence completeness, switch languages, and view a QR passport without reading
developer notes.

## Phase 2: Registry And Verification

Goal: make the registry trustworthy.

- Implement core entities: dog, owner, breeder, kennel, pedigree, evidence item.
- Add 8-level verification status model.
- Add document upload and reviewer decisions.
- Add immutable event log for profile changes.
- Add public completeness indicator.
- Separate private owner/contact records from public profile data.

Suggested success metric: every public profile field can be traced to an evidence
item, verification decision, or imported registry record.

## Phase 3: Digital Passport

Goal: make every verified dog shareable and inspectable.

- Generate stable passport IDs.
- Add QR code for public passport view.
- Add signed or hashed passport snapshot.
- Add exportable PDF passport.
- Add public/private field policy.
- Add event history: birth, ownership, DNA, health, field trials, show results.

Suggested success metric: a passport can be used at an event or in an
international handoff without manual explanation.

## Phase 4: Breeding Intelligence

Goal: help breeders make better population-level decisions.

- COI calculator from pedigree graph.
- Popular Sire Effect dashboard.
- Pairing risk forecast.
- Health-test compatibility checks.
- Population diversity reporting by region, kennel, and generation.
- Recommendations with clear confidence and missing-data warnings.

Suggested success metric: a breeder sees why a pairing is recommended, risky, or
blocked, and what evidence would improve the decision.

## Phase 5: FCI Data Room

Goal: turn registry operations into a continuous evidence package.

- Export FCI-ready datasets.
- Produce annual breed progress reports.
- Track five-generation pedigree completeness.
- Track health, DNA, field-trial, and population metrics.
- Add read-only reviewer access for federation stakeholders.

Suggested success metric: FCI-facing reporting is generated from the live system,
not assembled manually before a deadline.

## Phase 6: International Showcase

Goal: make Tazy understandable and credible outside Kazakhstan.

- Public kennel and verified breeder pages.
- International dog showcase.
- World Dog Show and event results.
- Education pages on breed standard, culture, and responsible ownership.
- Media kit for diplomacy, tourism, and cultural heritage narratives.

Suggested success metric: a foreign expert can understand the breed, verify
individual records, and contact the right institution without needing a local
intermediary.

## Open Decisions

- Backend choice: FastAPI + Postgres, Supabase, or a hybrid.
- Auth model: government/federation SSO, email/password, or invited reviewers.
- Legal owner data policy and consent language.
- Which institution is the source of truth for registry imports.
- Whether blockchain-like public anchoring is needed, or cryptographic hashes
  inside the database and exported files are enough.
- Initial launch scope for 17 May 2026 versus the 3 September Tazy Day milestone.
