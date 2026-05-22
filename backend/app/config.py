"""Environment driven settings for the TAZY.PRO backend."""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from functools import lru_cache


def _bool_env(name: str, default: bool) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


@dataclass(frozen=True)
class Settings:
    project_name: str = field(default_factory=lambda: os.getenv("TAZY_PROJECT_NAME", "TAZY.PRO"))
    debug: bool = field(default_factory=lambda: _bool_env("TAZY_DEBUG", True))
    database_url: str = field(default_factory=lambda: os.getenv("TAZY_DATABASE_URL", "sqlite+aiosqlite:///./.tazy/tazy.db"))
    secret_key: str = field(default_factory=lambda: os.getenv("TAZY_SECRET_KEY", "change-me-in-production"))
    seed_on_startup: bool = field(default_factory=lambda: _bool_env("TAZY_SEED_ON_STARTUP", True))
    cors_origins: tuple[str, ...] = field(default_factory=lambda: tuple(
        origin.strip()
        for origin in os.getenv("TAZY_CORS_ORIGINS", "http://localhost:4173,https://tazy.qdev.run").split(",")
        if origin.strip()
    ))
    admin_username: str = field(default_factory=lambda: os.getenv("TAZY_ADMIN_USERNAME", "admin"))
    admin_password: str = field(default_factory=lambda: os.getenv("TAZY_ADMIN_PASSWORD", "admin"))
    reviewer_api_key: str = field(default_factory=lambda: os.getenv("TAZY_REVIEWER_API_KEY", "dev-reviewer-key"))

    def validate_runtime(self) -> None:
        if self.debug:
            return
        insecure = []
        if self.secret_key == "change-me-in-production":
            insecure.append("TAZY_SECRET_KEY")
        if self.admin_password == "admin":
            insecure.append("TAZY_ADMIN_PASSWORD")
        if self.reviewer_api_key == "dev-reviewer-key":
            insecure.append("TAZY_REVIEWER_API_KEY")
        if insecure:
            joined = ", ".join(insecure)
            raise RuntimeError(f"Production backend requires non-default secrets: {joined}")


@lru_cache
def get_settings() -> Settings:
    return Settings()
