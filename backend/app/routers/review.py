"""Reviewer API endpoints."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.app.database import get_db
from backend.app.models import EvidenceItem, VerificationDecision
from backend.app.security import require_reviewer
from backend.app.services import decision_dict, review_queue

router = APIRouter(prefix="/api/v1/review", tags=["review"])


class DecisionCreate(BaseModel):
    evidenceItemId: str
    decision: str = Field(pattern="^(approved|changes_requested|rejected)$")
    note: str = Field(min_length=1, max_length=5000)
    reviewerId: str | None = None


@router.get("/queue")
async def list_review_queue(
    _: str = Depends(require_reviewer),
    session: AsyncSession = Depends(get_db),
):
    return {"items": await review_queue(session)}


@router.post("/decisions", status_code=201)
async def create_decision(
    payload: DecisionCreate,
    reviewer: str = Depends(require_reviewer),
    session: AsyncSession = Depends(get_db),
):
    result = await session.execute(
        select(EvidenceItem)
        .where(EvidenceItem.public_id == payload.evidenceItemId)
        .options(selectinload(EvidenceItem.decisions))
    )
    evidence = result.scalars().one_or_none()
    if not evidence:
        raise HTTPException(status_code=404, detail={"code": "not_found", "message": "Evidence item not found"})

    decision = VerificationDecision(
        public_id=f"decision-{uuid.uuid4()}",
        evidence_item=evidence,
        reviewer_id=payload.reviewerId or reviewer,
        decision=payload.decision,
        note=payload.note,
    )
    session.add(decision)
    await session.flush()
    await session.refresh(decision, attribute_names=["evidence_item"])
    return decision_dict(decision)
