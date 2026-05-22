"""Small auth helpers for reviewer API and SQLAdmin."""

from __future__ import annotations

import secrets
from typing import Annotated

from fastapi import Depends, Header, HTTPException, Request, status
from sqladmin.authentication import AuthenticationBackend

from backend.app.config import Settings, get_settings


def _bearer_value(authorization: str | None) -> str:
    if not authorization:
        return ""
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer":
        return ""
    return token.strip()


async def require_reviewer(
    authorization: Annotated[str | None, Header()] = None,
    x_reviewer_key: Annotated[str | None, Header(alias="X-Reviewer-Key")] = None,
    settings: Settings = Depends(get_settings),
) -> str:
    expected = settings.reviewer_api_key
    provided = x_reviewer_key or _bearer_value(authorization)
    if settings.debug and not provided:
        return "dev-reviewer"
    if expected and provided and secrets.compare_digest(provided, expected):
        return "reviewer"
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail={"code": "unauthorized", "message": "Reviewer API key is required"},
    )


class TazyAdminAuth(AuthenticationBackend):
    """SQLAdmin form auth, adapted from the QPet admin panel."""

    def __init__(self, secret_key: str, *, username: str, password: str):
        super().__init__(secret_key)
        self._username = username
        self._password = password

    async def login(self, request: Request) -> bool:
        form = await request.form()
        username = str(form.get("username", ""))
        password = str(form.get("password", ""))
        if secrets.compare_digest(username, self._username) and secrets.compare_digest(password, self._password):
            request.session["admin_authenticated"] = True
            request.session["admin_user"] = username
            request.session["admin_role"] = "admin"
            return True
        return False

    async def logout(self, request: Request) -> bool:
        request.session.clear()
        return True

    async def authenticate(self, request: Request) -> bool:
        return request.session.get("admin_authenticated") is True
