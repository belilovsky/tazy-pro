"""Seed records copied from the current frontend domain fixtures."""

from __future__ import annotations

from datetime import date, datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models import Breeder, Dog, EvidenceItem, ExportPackage, Kennel, PassportEvent


DOGS = [
    {
        "public_id": "akzhel-barys",
        "name": "Akzhel Barys",
        "sex": "male",
        "date_of_birth": date(2022, 4, 18),
        "registry_number": "TZY-2034-0182",
        "passport_id": "TZY-KZ-000182",
        "verification_level": 7,
        "breeder": "Altyn Dala Breeding Group",
        "kennel": "Zhetysu Line Registry",
        "region": "Almaty region",
        "summary": (
            "A field-tested male with verified parentage and strong export readiness. "
            "Health package is almost complete, with ophthalmology still pending."
        ),
        "completeness_score": 86,
        "photo_url": "./assets/tazy-profile-1.jpg",
        "alt_text": "Akzhel Barys profile",
        "verification_steps": [
            ["Owner claim", "signed by breeder", "done"],
            ["Microchip", "KZ-3980-42A", "done"],
            ["Pedigree", "4 generations", "done"],
            ["Health package", "ophthalmology pending", "pending"],
            ["DNA parentage", "verified", "done"],
            ["Field trial", "video evidence", "done"],
            ["FCI export", "annual package ready", "pending"],
        ],
        "passport_events": [
            {
                "public_id": "passport-barys-dna",
                "event_type": "dna",
                "title": "DNA parentage",
                "value": "Verified · 2026-05-17",
                "event_at": datetime(2026, 5, 17, tzinfo=timezone.utc),
                "visibility": "public",
                "evidence_item_public_id": "dna-barys-parentage",
            },
            {
                "public_id": "passport-barys-health",
                "event_type": "health",
                "title": "Health package",
                "value": "Ophthalmology pending",
                "event_at": datetime(2026, 5, 17, tzinfo=timezone.utc),
                "visibility": "public",
                "evidence_item_public_id": "health-barys-ophthalmology",
            },
            {
                "public_id": "passport-barys-field",
                "event_type": "field_trial",
                "title": "Field trial",
                "value": "Video evidence attached",
                "event_at": datetime(2026, 5, 17, tzinfo=timezone.utc),
                "visibility": "public",
                "evidence_item_public_id": "field-barys-video",
            },
        ],
    },
    {
        "public_id": "saumal-koke",
        "name": "Saumal Koke",
        "sex": "female",
        "date_of_birth": date(2023, 6, 2),
        "registry_number": "TZY-2034-0194",
        "passport_id": "TZY-KZ-000194",
        "verification_level": 5,
        "breeder": "Turkistan Tazy Club",
        "kennel": "Saumal Kennel",
        "region": "Turkistan region",
        "summary": (
            "A young female with confirmed identity, kennel-signed ownership, and a complete health package. "
            "DNA sample and field trial are still in progress."
        ),
        "completeness_score": 74,
        "photo_url": "./assets/tazy-profile-2.jpg",
        "alt_text": "Saumal Koke profile",
        "verification_steps": [
            ["Owner claim", "signed by kennel", "done"],
            ["Microchip", "KZ-7741-09C", "done"],
            ["Pedigree", "3 generations", "done"],
            ["Health package", "complete", "done"],
            ["DNA parentage", "sample in lab", "pending"],
            ["Field trial", "scheduled", "pending"],
            ["FCI export", "needs DNA close", "pending"],
        ],
        "passport_events": [
            {
                "public_id": "passport-koke-identity",
                "event_type": "microchip",
                "title": "Identity",
                "value": "Microchip verified",
                "event_at": datetime(2026, 5, 17, tzinfo=timezone.utc),
                "visibility": "public",
                "evidence_item_public_id": "microchip-koke-identity",
            },
            {
                "public_id": "passport-koke-health",
                "event_type": "health",
                "title": "Health package",
                "value": "Complete",
                "event_at": datetime(2026, 5, 18, tzinfo=timezone.utc),
                "visibility": "public",
                "evidence_item_public_id": "health-koke-package",
            },
            {
                "public_id": "passport-koke-dna",
                "event_type": "dna",
                "title": "DNA parentage",
                "value": "Sample in lab",
                "event_at": datetime(2026, 5, 19, tzinfo=timezone.utc),
                "visibility": "public",
                "evidence_item_public_id": "dna-koke-parentage",
            },
        ],
    },
]


EVIDENCE_ITEMS = [
    {
        "public_id": "health-barys-ophthalmology",
        "dog_public_id": "akzhel-barys",
        "type": "health",
        "label": "Health package",
        "title": "Ophthalmology certificate",
        "submitted_by": "Altyn Dala Breeding Group",
        "received_at": date(2026, 5, 17),
        "priority": "medium",
        "status": "needs_review",
        "visibility": "reviewer_only",
        "summary": (
            "Breeder submitted the preliminary ophthalmology result. "
            "The export-ready profile still needs a signed final certificate."
        ),
        "reviewer_note": "Request the signed PDF and issuer contact before moving the health package to approved status.",
    },
    {
        "public_id": "dna-koke-parentage",
        "dog_public_id": "saumal-koke",
        "type": "dna",
        "label": "DNA parentage",
        "title": "Lab sample confirmation",
        "submitted_by": "Turkistan Tazy Club",
        "received_at": date(2026, 5, 19),
        "priority": "high",
        "status": "waiting_external",
        "visibility": "reviewer_only",
        "summary": "Lab sample was received, but parentage confirmation is not attached yet. This blocks Level 6 verification.",
        "reviewer_note": "Hold public DNA claim until lab confirmation arrives. Keep the profile visible as sample-in-lab.",
    },
    {
        "public_id": "field-koke-trial",
        "dog_public_id": "saumal-koke",
        "type": "field_trial",
        "label": "Field trial",
        "title": "Spring field-trial video",
        "submitted_by": "Saumal Kennel",
        "received_at": date(2026, 5, 21),
        "priority": "low",
        "status": "needs_review",
        "visibility": "reviewer_only",
        "summary": (
            "Video evidence was uploaded for the spring field-trial event. "
            "Reviewer must confirm dog identity and event metadata."
        ),
        "reviewer_note": "Check microchip confirmation in the event sheet before approving the video evidence.",
    },
]


EXPORT_PACKAGES = [
    {
        "package_key": "annual-registry-snapshot",
        "name": "Annual registry snapshot",
        "format": "CSV + JSON",
        "status": "ready",
    },
    {
        "package_key": "evidence-exceptions-report",
        "name": "Evidence exceptions report",
        "format": "PDF",
        "status": "draft",
    },
    {
        "package_key": "public-passport-manifest",
        "name": "Public passport manifest",
        "format": "JSON",
        "status": "draft",
    },
]


async def ensure_seed_data(session: AsyncSession) -> None:
    existing = await session.scalar(select(Dog.id).limit(1))
    if existing:
        return

    breeders: dict[str, Breeder] = {}
    kennels: dict[str, Kennel] = {}
    dogs_by_public_id: dict[str, Dog] = {}

    for record in DOGS:
        breeder_name = record["breeder"]
        kennel_name = record["kennel"]
        breeder = breeders.setdefault(
            breeder_name,
            Breeder(display_name=breeder_name, region=record["region"], verification_status="verified"),
        )
        kennel = kennels.setdefault(
            kennel_name,
            Kennel(name=kennel_name, region=record["region"], verification_status="verified"),
        )
        session.add_all([breeder, kennel])

        dog = Dog(
            public_id=record["public_id"],
            public_profile_slug=record["public_id"],
            registry_number=record["registry_number"],
            passport_id=record["passport_id"],
            name=record["name"],
            sex=record["sex"],
            date_of_birth=record["date_of_birth"],
            region=record["region"],
            status="active",
            verification_level=record["verification_level"],
            completeness_score=record["completeness_score"],
            breeder=breeder,
            kennel=kennel,
            summary=record["summary"],
            photo_url=record["photo_url"],
            alt_text=record["alt_text"],
            verification_steps=record["verification_steps"],
        )
        session.add(dog)
        dogs_by_public_id[record["public_id"]] = dog

        for event in record["passport_events"]:
            session.add(
                PassportEvent(
                    dog=dog,
                    public_id=event["public_id"],
                    event_type=event["event_type"],
                    title=event["title"],
                    value=event["value"],
                    event_at=event["event_at"],
                    visibility=event["visibility"],
                    evidence_item_public_id=event["evidence_item_public_id"],
                )
            )

    await session.flush()

    for record in EVIDENCE_ITEMS:
        session.add(
            EvidenceItem(
                dog=dogs_by_public_id[record["dog_public_id"]],
                public_id=record["public_id"],
                type=record["type"],
                label=record["label"],
                title=record["title"],
                submitted_by=record["submitted_by"],
                received_at=record["received_at"],
                priority=record["priority"],
                status=record["status"],
                visibility=record["visibility"],
                summary=record["summary"],
                reviewer_note=record["reviewer_note"],
            )
        )

    for record in EXPORT_PACKAGES:
        session.add(ExportPackage(**record))

    await session.commit()
