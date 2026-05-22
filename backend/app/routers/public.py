"""Public registry and passport API endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.database import get_db
from backend.app.services import dog_card, get_dog_by_passport, get_dog_by_public_id, get_dogs, passport_payload, public_dog_profile

router = APIRouter(prefix="/api/v1", tags=["public"])


@router.get("/dogs")
async def list_dogs(
    q: str | None = None,
    region: str | None = None,
    verification_level_min: int | None = Query(default=None, ge=1, le=8),
    limit: int = Query(default=50, ge=1, le=100),
    cursor: int | None = Query(default=None, ge=0),
    session: AsyncSession = Depends(get_db),
):
    dogs = await get_dogs(session)
    if q:
        needle = q.strip().lower()
        dogs = [dog for dog in dogs if needle in dog.name.lower() or needle in dog.registry_number.lower()]
    if region:
        dogs = [dog for dog in dogs if (dog.region or "").lower() == region.strip().lower()]
    if verification_level_min:
        dogs = [dog for dog in dogs if dog.verification_level >= verification_level_min]
    offset = cursor or 0
    page = dogs[offset : offset + limit]
    next_cursor = str(offset + limit) if offset + limit < len(dogs) else None
    return {"items": [dog_card(dog) for dog in page], "nextCursor": next_cursor}


@router.get("/dogs/{dog_id}")
async def get_dog(dog_id: str, session: AsyncSession = Depends(get_db)):
    dog = await get_dog_by_public_id(session, dog_id)
    if not dog:
        raise HTTPException(status_code=404, detail={"code": "not_found", "message": "Dog profile not found"})
    return public_dog_profile(dog)


@router.get("/passports/{passport_id}")
async def get_passport(passport_id: str, session: AsyncSession = Depends(get_db)):
    dog = await get_dog_by_passport(session, passport_id)
    if not dog:
        raise HTTPException(status_code=404, detail={"code": "not_found", "message": "Passport not found"})
    return passport_payload(dog)
