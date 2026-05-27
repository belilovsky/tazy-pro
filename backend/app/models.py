"""SQLAlchemy models for the TAZY.DOG MVP schema."""

from __future__ import annotations

import uuid
from datetime import date, datetime
from typing import Any

from sqlalchemy import Boolean, CheckConstraint, Date, DateTime, ForeignKey, Integer, JSON, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.database import Base


def new_uuid() -> str:
    return str(uuid.uuid4())


class Owner(Base):
    __tablename__ = "owners"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    display_name: Mapped[str] = mapped_column(String(255), nullable=False)
    legal_name: Mapped[str | None] = mapped_column(String(255))
    country: Mapped[str] = mapped_column(String(2), nullable=False, default="KZ")
    region: Mapped[str | None] = mapped_column(String(120))
    contact_email: Mapped[str | None] = mapped_column(String(255))
    contact_phone: Mapped[str | None] = mapped_column(String(80))
    public_contact_allowed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    consent_version: Mapped[str | None] = mapped_column(String(80))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    dogs: Mapped[list["Dog"]] = relationship(back_populates="owner")

    def __str__(self) -> str:
        return self.display_name


class Breeder(Base):
    __tablename__ = "breeders"
    __table_args__ = (
        CheckConstraint("verification_status in ('draft', 'pending', 'verified', 'suspended')", name="breeder_status_check"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    display_name: Mapped[str] = mapped_column(String(255), nullable=False)
    legal_name: Mapped[str | None] = mapped_column(String(255))
    country: Mapped[str] = mapped_column(String(2), nullable=False, default="KZ")
    region: Mapped[str | None] = mapped_column(String(120))
    verification_status: Mapped[str] = mapped_column(String(40), nullable=False, default="draft")
    public_profile_slug: Mapped[str | None] = mapped_column(String(160), unique=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    dogs: Mapped[list["Dog"]] = relationship(back_populates="breeder")

    def __str__(self) -> str:
        return self.display_name


class Kennel(Base):
    __tablename__ = "kennels"
    __table_args__ = (
        CheckConstraint("verification_status in ('draft', 'pending', 'verified', 'suspended')", name="kennel_status_check"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    registration_number: Mapped[str | None] = mapped_column(String(120), unique=True)
    country: Mapped[str] = mapped_column(String(2), nullable=False, default="KZ")
    region: Mapped[str | None] = mapped_column(String(120))
    owner_id: Mapped[str | None] = mapped_column(ForeignKey("owners.id"))
    verification_status: Mapped[str] = mapped_column(String(40), nullable=False, default="draft")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    owner: Mapped[Owner | None] = relationship()
    dogs: Mapped[list["Dog"]] = relationship(back_populates="kennel")

    def __str__(self) -> str:
        return self.name


class Dog(Base):
    __tablename__ = "dogs"
    __table_args__ = (
        CheckConstraint("sex in ('male', 'female')", name="dog_sex_check"),
        CheckConstraint("status in ('draft', 'active', 'archived', 'deceased')", name="dog_status_check"),
        CheckConstraint("verification_level between 1 and 8", name="dog_verification_level_check"),
        CheckConstraint("completeness_score between 0 and 100", name="dog_completeness_score_check"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    public_id: Mapped[str] = mapped_column(String(160), nullable=False, unique=True, index=True)
    registry_number: Mapped[str] = mapped_column(String(120), nullable=False, unique=True, index=True)
    passport_id: Mapped[str] = mapped_column(String(120), nullable=False, unique=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    sex: Mapped[str] = mapped_column(String(20), nullable=False)
    date_of_birth: Mapped[date | None] = mapped_column(Date)
    color: Mapped[str | None] = mapped_column(String(120))
    region: Mapped[str | None] = mapped_column(String(120))
    status: Mapped[str] = mapped_column(String(40), nullable=False, default="active")
    public_profile_slug: Mapped[str | None] = mapped_column(String(160), unique=True)
    verification_level: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    completeness_score: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    owner_id: Mapped[str | None] = mapped_column(ForeignKey("owners.id"))
    breeder_id: Mapped[str | None] = mapped_column(ForeignKey("breeders.id"))
    kennel_id: Mapped[str | None] = mapped_column(ForeignKey("kennels.id"))
    summary: Mapped[str | None] = mapped_column(Text)
    photo_url: Mapped[str | None] = mapped_column(String(500))
    alt_text: Mapped[str | None] = mapped_column(String(255))
    verification_steps: Mapped[list[Any]] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    owner: Mapped[Owner | None] = relationship(back_populates="dogs")
    breeder: Mapped[Breeder | None] = relationship(back_populates="dogs")
    kennel: Mapped[Kennel | None] = relationship(back_populates="dogs")
    evidence_items: Mapped[list["EvidenceItem"]] = relationship(back_populates="dog", cascade="all, delete-orphan")
    passport_events: Mapped[list["PassportEvent"]] = relationship(back_populates="dog", cascade="all, delete-orphan")

    def __str__(self) -> str:
        return f"{self.name} ({self.registry_number})"


class EvidenceItem(Base):
    __tablename__ = "evidence_items"
    __table_args__ = (
        CheckConstraint(
            "type in ('ownership', 'microchip', 'pedigree', 'health', 'dna', 'field_trial', 'fci_export', 'show_result', 'photo', 'other')",
            name="evidence_type_check",
        ),
        CheckConstraint("priority in ('low', 'medium', 'high')", name="evidence_priority_check"),
        CheckConstraint("visibility in ('public', 'private', 'reviewer_only')", name="evidence_visibility_check"),
        CheckConstraint(
            "status in ('approved', 'pending', 'needs_review', 'waiting_external', 'rejected')",
            name="evidence_status_check",
        ),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    public_id: Mapped[str] = mapped_column(String(160), nullable=False, unique=True, index=True)
    dog_id: Mapped[str] = mapped_column(ForeignKey("dogs.id", ondelete="CASCADE"), nullable=False, index=True)
    type: Mapped[str] = mapped_column(String(40), nullable=False)
    label: Mapped[str | None] = mapped_column(String(120))
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    issuer: Mapped[str | None] = mapped_column(String(255))
    issued_at: Mapped[date | None] = mapped_column(Date)
    submitted_by: Mapped[str | None] = mapped_column(String(255))
    received_at: Mapped[date | None] = mapped_column(Date)
    file_id: Mapped[str | None] = mapped_column(String(255))
    source_url: Mapped[str | None] = mapped_column(String(500))
    hash: Mapped[str | None] = mapped_column(String(255))
    priority: Mapped[str] = mapped_column(String(20), nullable=False, default="medium")
    visibility: Mapped[str] = mapped_column(String(40), nullable=False, default="reviewer_only")
    status: Mapped[str] = mapped_column(String(40), nullable=False, default="needs_review")
    summary: Mapped[str | None] = mapped_column(Text)
    reviewer_note: Mapped[str | None] = mapped_column(Text)
    created_by: Mapped[str | None] = mapped_column(String(80))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    dog: Mapped[Dog] = relationship(back_populates="evidence_items")
    decisions: Mapped[list["VerificationDecision"]] = relationship(back_populates="evidence_item", cascade="all, delete-orphan")

    def __str__(self) -> str:
        return f"{self.title} ({self.public_id})"


class VerificationDecision(Base):
    __tablename__ = "verification_decisions"
    __table_args__ = (
        CheckConstraint("decision in ('approved', 'changes_requested', 'rejected', 'superseded')", name="decision_check"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    public_id: Mapped[str] = mapped_column(String(180), nullable=False, unique=True, index=True)
    evidence_item_id: Mapped[str] = mapped_column(ForeignKey("evidence_items.id", ondelete="CASCADE"), nullable=False, index=True)
    reviewer_id: Mapped[str | None] = mapped_column(String(120))
    decision: Mapped[str] = mapped_column(String(40), nullable=False)
    note: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)

    evidence_item: Mapped[EvidenceItem] = relationship(back_populates="decisions")

    def __str__(self) -> str:
        return f"{self.decision} / {self.public_id}"


class PassportEvent(Base):
    __tablename__ = "passport_events"
    __table_args__ = (
        CheckConstraint("visibility in ('public', 'private', 'reviewer_only')", name="passport_event_visibility_check"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    public_id: Mapped[str] = mapped_column(String(160), nullable=False, unique=True, index=True)
    dog_id: Mapped[str] = mapped_column(ForeignKey("dogs.id", ondelete="CASCADE"), nullable=False, index=True)
    event_type: Mapped[str] = mapped_column(String(40), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    value: Mapped[str] = mapped_column(String(500), nullable=False)
    event_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    visibility: Mapped[str] = mapped_column(String(40), nullable=False, default="public")
    evidence_item_public_id: Mapped[str | None] = mapped_column(String(160))
    hash: Mapped[str | None] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    dog: Mapped[Dog] = relationship(back_populates="passport_events")

    def __str__(self) -> str:
        return f"{self.title}: {self.value}"


class ExportPackage(Base):
    __tablename__ = "export_packages"
    __table_args__ = (
        CheckConstraint("status in ('draft', 'ready', 'exported', 'failed')", name="export_package_status_check"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    package_key: Mapped[str] = mapped_column(String(160), nullable=False, unique=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    format: Mapped[str] = mapped_column(String(80), nullable=False)
    status: Mapped[str] = mapped_column(String(40), nullable=False, default="draft")
    artifact_url: Mapped[str | None] = mapped_column(String(500))
    artifact_hash: Mapped[str | None] = mapped_column(String(255))
    created_by: Mapped[str | None] = mapped_column(String(120))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    def __str__(self) -> str:
        return f"{self.name} ({self.status})"
