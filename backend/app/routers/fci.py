"""FCI data-room API endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.database import get_db
from backend.app.security import require_reviewer
from backend.app.services import fci_snapshot

router = APIRouter(prefix="/api/v1/fci", tags=["fci"])


@router.get("/data-room")
async def get_data_room(_: str = Depends(require_reviewer), session: AsyncSession = Depends(get_db)):
    return await fci_snapshot(session)
