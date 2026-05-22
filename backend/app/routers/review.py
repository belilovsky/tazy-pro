"""Reviewer API endpoints."""

from __future__ import annotations

import uuid
from time import monotonic

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
LOGIN_WINDOW_SECONDS = 600
LOGIN_MAX_FAILURES = 5
_login_failures: dict[str, list[float]] = {}


class ReviewerLogin(BaseModel):
    username: str = Field(min_length=1, max_length=120)
    password: str = Field(min_length=1, max_length=500)


class DecisionCreate(BaseModel):
    evidenceItemId: str
    decision: str = Field(pattern="^(approved|changes_requested|rejected)$")
    note: str = Field(min_length=1, max_length=5000)
    reviewerId: str | None = None


def _login_key(request: Request, username: str) -> str:
    host = request.client.host if request.client else "unknown"
    return f"{host}:{username.strip().lower()}"


def _recent_login_failures(key: str) -> list[float]:
    cutoff = monotonic() - LOGIN_WINDOW_SECONDS
    failures = [timestamp for timestamp in _login_failures.get(key, []) if timestamp >= cutoff]
    if failures:
        _login_failures[key] = failures
    else:
        _login_failures.pop(key, None)
    return failures


def _assert_login_allowed(key: str) -> None:
    if len(_recent_login_failures(key)) >= LOGIN_MAX_FAILURES:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={"code": "rate_limited", "message": "Too many reviewer login attempts"},
        )


def _record_login_failure(key: str) -> None:
    failures = _recent_login_failures(key)
    failures.append(monotonic())
    _login_failures[key] = failures


def _clear_login_failures(key: str) -> None:
    _login_failures.pop(key, None)


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
    key = _login_key(request, payload.username)
    _assert_login_allowed(key)
    if not credentials_match(
        payload.username,
        payload.password,
        expected_username=settings.admin_username,
        expected_password=settings.admin_password,
    ):
        _record_login_failure(key)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "unauthorized", "message": "Reviewer credentials are invalid"},
        )

    _clear_login_failures(key)
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
