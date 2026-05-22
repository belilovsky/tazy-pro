"""Read-model builders shared by API routes and tests."""

from __future__ import annotations

import hashlib
import json
from datetime import date, datetime, timezone
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.app.models import Dog, EvidenceItem, ExportPackage, PassportEvent, VerificationDecision


DECISION_LABELS = {
    "approved": "Approved",
    "changes_requested": "Changes requested",
    "rejected": "Rejected",
    "superseded": "Superseded",
}
EVIDENCE_STATUS_LABELS = {
    "approved": "Approved",
    "pending": "Pending",
    "needs_review": "Needs review",
    "waiting_external": "Waiting external",
    "rejected": "Rejected",
}
PRIORITY_LABELS = {"low": "Low", "medium": "Medium", "high": "High"}
EVIDENCE_LABELS = {
    "ownership": "Ownership",
    "microchip": "Microchip",
    "pedigree": "Pedigree",
    "health": "Health",
    "dna": "DNA",
    "field_trial": "Field trials",
    "fci_export": "FCI export",
    "show_result": "Show results",
    "photo": "Photo",
    "other": "Other",
}
PRIORITY_WEIGHT = {"high": 0, "medium": 1, "low": 2}


def iso(value: date | datetime | None) -> str | None:
    if value is None:
        return None
    return value.isoformat()


def dog_card(dog: Dog) -> dict[str, Any]:
    return {
        "id": dog.public_id,
        "name": dog.name,
        "sex": dog.sex,
        "dateOfBirth": iso(dog.date_of_birth),
        "region": dog.region,
        "registryNumber": dog.registry_number,
        "passportId": dog.passport_id,
        "verificationLevel": dog.verification_level,
        "completenessScore": dog.completeness_score,
        "photo": dog.photo_url,
        "alt": dog.alt_text,
    }


def passport_event_dict(event: PassportEvent) -> dict[str, Any]:
    return {
        "id": event.public_id,
        "dogId": event.dog.public_id if event.dog else None,
        "type": event.event_type,
        "title": event.title,
        "value": event.value,
        "eventAt": iso(event.event_at),
        "visibility": event.visibility,
        "evidenceItemId": event.evidence_item_public_id,
    }


def public_evidence_dict(item: EvidenceItem) -> dict[str, Any]:
    return {
        "id": item.public_id,
        "dogId": item.dog.public_id if item.dog else None,
        "type": item.type,
        "label": item.label or EVIDENCE_LABELS.get(item.type, item.type),
        "title": item.title,
        "priority": item.priority,
        "status": item.status,
        "visibility": item.visibility,
        "summary": item.summary,
    }


def public_dog_profile(dog: Dog) -> dict[str, Any]:
    events = sorted(
        (event for event in dog.passport_events if event.visibility == "public"),
        key=lambda event: event.event_at,
        reverse=True,
    )
    public_evidence = [item for item in dog.evidence_items if item.visibility == "public"]
    return {
        **dog_card(dog),
        "breeder": dog.breeder.display_name if dog.breeder else None,
        "kennel": dog.kennel.name if dog.kennel else None,
        "summary": dog.summary,
        "score": f"{dog.completeness_score}%",
        "verificationLabel": f"Level {dog.verification_level}",
        "steps": dog.verification_steps or [],
        "passportEvents": [passport_event_dict(event) for event in events],
        "evidence": [public_evidence_dict(item) for item in public_evidence],
    }


def decision_dict(decision: VerificationDecision | None) -> dict[str, Any] | None:
    if decision is None:
        return None
    return {
        "id": decision.public_id,
        "evidenceItemId": decision.evidence_item.public_id if decision.evidence_item else None,
        "decision": decision.decision,
        "decisionLabel": DECISION_LABELS.get(decision.decision, decision.decision),
        "reviewerId": decision.reviewer_id,
        "note": decision.note,
        "createdAt": iso(decision.created_at),
    }


def review_queue_item(item: EvidenceItem, latest: VerificationDecision | None = None) -> dict[str, Any]:
    return {
        "id": item.public_id,
        "dogId": item.dog.public_id,
        "type": item.type,
        "label": item.label or EVIDENCE_LABELS.get(item.type, item.type),
        "title": item.title,
        "submittedBy": item.submitted_by,
        "receivedAt": iso(item.received_at),
        "priority": item.priority,
        "priorityLabel": PRIORITY_LABELS.get(item.priority, item.priority),
        "status": item.status,
        "statusLabel": DECISION_LABELS.get(latest.decision, latest.decision) if latest else EVIDENCE_STATUS_LABELS.get(item.status, item.status),
        "visibility": item.visibility,
        "summary": item.summary,
        "reviewerNote": item.reviewer_note,
        "dog": dog_card(item.dog),
        "currentDecision": decision_dict(latest),
    }


async def get_dogs(session: AsyncSession) -> list[Dog]:
    result = await session.execute(
        select(Dog)
        .where(Dog.status == "active")
        .options(
            selectinload(Dog.breeder),
            selectinload(Dog.kennel),
            selectinload(Dog.evidence_items),
            selectinload(Dog.passport_events).selectinload(PassportEvent.dog),
        )
        .order_by(Dog.name)
    )
    return list(result.scalars().unique())


async def get_dog_by_public_id(session: AsyncSession, public_id: str) -> Dog | None:
    result = await session.execute(
        select(Dog)
        .where(Dog.public_id == public_id)
        .options(
            selectinload(Dog.breeder),
            selectinload(Dog.kennel),
            selectinload(Dog.evidence_items),
            selectinload(Dog.passport_events).selectinload(PassportEvent.dog),
        )
    )
    return result.scalars().unique().one_or_none()


async def get_dog_by_passport(session: AsyncSession, passport_id: str) -> Dog | None:
    result = await session.execute(
        select(Dog)
        .where(func.lower(Dog.passport_id) == passport_id.lower())
        .options(
            selectinload(Dog.breeder),
            selectinload(Dog.kennel),
            selectinload(Dog.evidence_items),
            selectinload(Dog.passport_events).selectinload(PassportEvent.dog),
        )
    )
    return result.scalars().unique().one_or_none()


async def latest_decisions_by_evidence_id(session: AsyncSession) -> dict[str, VerificationDecision]:
    result = await session.execute(
        select(VerificationDecision)
        .options(selectinload(VerificationDecision.evidence_item))
        .order_by(VerificationDecision.created_at.desc())
    )
    decisions: dict[str, VerificationDecision] = {}
    for decision in result.scalars():
        decisions.setdefault(decision.evidence_item_id, decision)
    return decisions


async def review_queue(session: AsyncSession) -> list[dict[str, Any]]:
    result = await session.execute(
        select(EvidenceItem)
        .options(selectinload(EvidenceItem.dog), selectinload(EvidenceItem.decisions).selectinload(VerificationDecision.evidence_item))
    )
    items = list(result.scalars().unique())
    latest = await latest_decisions_by_evidence_id(session)
    items.sort(key=lambda item: (PRIORITY_WEIGHT.get(item.priority, 9), item.received_at or date.min, item.title))
    return [review_queue_item(item, latest.get(item.id)) for item in items]


def passport_snapshot_hash(payload: dict[str, Any]) -> str:
    raw = json.dumps(payload, sort_keys=True, ensure_ascii=False, default=str).encode()
    return "sha256:" + hashlib.sha256(raw).hexdigest()


def passport_payload(dog: Dog) -> dict[str, Any]:
    events = [passport_event_dict(event) for event in dog.passport_events if event.visibility == "public"]
    events.sort(key=lambda event: event["eventAt"] or "", reverse=True)
    payload = {
        "dog": {
            "id": dog.public_id,
            "name": dog.name,
            "registryNumber": dog.registry_number,
            "passportId": dog.passport_id,
        },
        "events": events,
    }
    return {**payload, "snapshotHash": passport_snapshot_hash(payload)}


async def fci_snapshot(session: AsyncSession) -> dict[str, Any]:
    dogs = await get_dogs(session)
    evidence_result = await session.execute(select(EvidenceItem))
    evidence_items = list(evidence_result.scalars())
    packages_result = await session.execute(select(ExportPackage).order_by(ExportPackage.name))
    packages = list(packages_result.scalars())

    export_ready = [dog for dog in dogs if dog.verification_level >= 7]
    average = round(sum(dog.completeness_score for dog in dogs) / len(dogs)) if dogs else 0
    open_evidence = [item for item in evidence_items if item.status != "approved"]
    coverage = []
    for evidence_type, label in EVIDENCE_LABELS.items():
        typed = [item for item in evidence_items if item.type == evidence_type]
        if not typed:
            continue
        coverage.append(
            {
                "type": evidence_type,
                "label": label,
                "total": len(typed),
                "approved": len([item for item in typed if item.status == "approved"]),
                "pending": len([item for item in typed if item.status != "approved"]),
            }
        )

    queue = await review_queue(session)
    return {
        "generatedAt": iso(datetime.now(timezone.utc)),
        "cycle": {
            "label": "2024-2034 recognition cycle",
            "status": "MVP evidence package",
            "targetYear": "2034",
        },
        "metrics": [
            {"label": "Registered profiles", "value": str(len(dogs)), "detail": "Seed profiles ready for public registry checks."},
            {"label": "Export-ready", "value": f"{len(export_ready)}/{len(dogs)}", "detail": "Dogs at verification level 7 or higher."},
            {"label": "Avg completeness", "value": f"{average}%", "detail": "Mean public completeness score across current profiles."},
            {"label": "Open evidence", "value": str(len(open_evidence)), "detail": "Reviewer-facing items that still need a decision or external confirmation."},
        ],
        "coverage": coverage,
        "priorityQueue": [
            {
                "id": item["id"],
                "dogName": item["dog"]["name"],
                "title": item["title"],
                "type": EVIDENCE_LABELS.get(item["type"], item["type"]),
                "priority": item["priorityLabel"],
                "status": item["statusLabel"],
            }
            for item in queue
            if item["status"] != "approved"
        ],
        "exportPackages": [
            {"name": package.name, "format": package.format, "status": package.status}
            for package in packages
        ],
    }
