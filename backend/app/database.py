"""Async SQLAlchemy database setup copied from the proven QPet pattern."""

from __future__ import annotations

from collections.abc import AsyncGenerator
from pathlib import Path

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from backend.app.config import get_settings


class Base(DeclarativeBase):
    pass


_engine = None
_sessionmaker: async_sessionmaker[AsyncSession] | None = None


def _ensure_sqlite_parent(database_url: str) -> None:
    prefix = "sqlite+aiosqlite:///"
    if not database_url.startswith(prefix):
        return
    raw_path = database_url.removeprefix(prefix)
    if raw_path == ":memory:":
        return
    Path(raw_path).expanduser().parent.mkdir(parents=True, exist_ok=True)


def get_engine():
    global _engine
    if _engine is None:
        settings = get_settings()
        _ensure_sqlite_parent(settings.database_url)
        _engine = create_async_engine(
            settings.database_url,
            echo=settings.debug,
            pool_pre_ping=True,
        )
    return _engine


def get_sessionmaker() -> async_sessionmaker[AsyncSession]:
    global _sessionmaker
    if _sessionmaker is None:
        _sessionmaker = async_sessionmaker(
            get_engine(),
            class_=AsyncSession,
            expire_on_commit=False,
            autoflush=False,
        )
    return _sessionmaker


async def create_tables() -> None:
    async with get_engine().begin() as conn:
        from backend.app import models  # noqa: F401

        await conn.run_sync(Base.metadata.create_all)


async def check_database() -> None:
    async with get_engine().connect() as conn:
        await conn.execute(text("select 1"))


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with get_sessionmaker()() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def dispose_engine() -> None:
    global _engine, _sessionmaker
    if _engine is not None:
        await _engine.dispose()
    _engine = None
    _sessionmaker = None
