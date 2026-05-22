"""Reviewer API endpoints."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.app.database import get_db
from backend.app.models import EvidenceItem, VerificationDecision
from backend.app.config import Settings, get_settings
from backend.app.security import credentials_match, require_reviewer
from backend.app.services import decision_dict, review_queue

router = APIRouter(prefix="/api/v1/review", tags=["review"])


class ReviewerLogin(BaseModel):
    username: str = Field(min_length=1, max_length=120)
    password: str = Field(min_length=1, max_length=500)


class DecisionCreate(BaseModel):
    evidenceItemId: str
    decision: str = Field(pattern="^(approved|changes_requested|rejected)$")
    note: str = Field(min_length=1, max_length=5000)
    reviewerId: str | None = None


def reviewer_session_payload(request: Request) -> dict[str, object]:
    reviewer_user = request.session.get("reviewer_user") or request.session.get("admin_user")
    authenticated = request.session.get("reviewer_authenticated") is True or request.session.get("admin_authenticated") is True
    return {
        "authenticated": authenticated,
        "reviewerId": str(reviewer_user or "") if authenticated else "",
    }


@router.get("/session")
async def get_reviewer_session(request: Request):
    return reviewer_session_payload(request)


@router.post("/login")
async def login_reviewer(
    payload: ReviewerLogin,
    request: Request,
    settings: Settings = Depends(get_settings),
):
    if not credentials_match(
        payload.username,
        payload.password,
        expected_username=settings.admin_username,
        expected_password=settings.admin_password,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "unauthorized", "message": "Reviewer credentials are invalid"},
        )

    request.session["reviewer_authenticated"] = True
    request.session["reviewer_user"] = payload.username
    request.session["reviewer_role"] = "reviewer"
    return reviewer_session_payload(request)


@router.post("/logout")
async def logout_reviewer(request: Request):
    for key in ("reviewer_authenticated", "reviewer_user", "reviewer_role"):
        request.session.pop(key, None)
    return reviewer_session_payload(request)


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
