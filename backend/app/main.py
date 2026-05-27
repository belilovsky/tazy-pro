"""FastAPI entrypoint for the TAZY.PRO backend and admin surface."""

from __future__ import annotations

from contextlib import asynccontextmanager
import logging
from pathlib import Path
from typing import Any

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, Response
from fastapi.staticfiles import StaticFiles
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.middleware.sessions import SessionMiddleware

from backend.app.admin import init_admin
from backend.app.config import get_settings
from backend.app.database import check_database, create_tables, get_engine, get_sessionmaker
from backend.app.middleware import RequestIdMiddleware
from backend.app.routers import fci, public, review
from backend.app.seed import ensure_seed_data

ROOT_DIR = Path(__file__).resolve().parents[2]
logger = logging.getLogger(__name__)


def _is_expected_exception(exc: object) -> bool:
    if isinstance(exc, (StarletteHTTPException, RequestValidationError)):
        return True

    nested = getattr(exc, "exceptions", None)
    if nested is None:
        return False
    return all(_is_expected_exception(sub_exc) for sub_exc in nested)


def _apply_security_headers(request: Request, response: Response) -> None:
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "SAMEORIGIN"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    response.headers["X-Request-ID"] = getattr(request.state, "request_id", "")
    if request.url.path.startswith(("/api/v1/review", "/api/v1/fci")):
        response.headers["Cache-Control"] = "no-store"


def _message_from_detail(detail: object) -> str:
    if isinstance(detail, dict):
        return str(detail.get("message") or detail.get("detail") or "Request failed")
    if isinstance(detail, str):
        return detail
    return "Request failed"


def error_payload(request: Request, code: str, message: str, extra: dict[str, Any] | None = None) -> dict[str, Any]:
    payload = {
        "error": {
            "code": code,
            "message": message,
            "requestId": getattr(request.state, "request_id", ""),
        }
    }
    if extra:
        payload["error"].update(extra)
    return payload


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    settings.validate_runtime()
    await create_tables()
    if settings.seed_on_startup:
        async with get_sessionmaker()() as session:
            await ensure_seed_data(session)
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title=f"{settings.project_name} API",
        version="0.1.0",
        description="Registry, evidence review, digital passport, and FCI data-room API for TAZY.PRO.",
        docs_url="/api/docs" if settings.debug else None,
        redoc_url="/api/redoc" if settings.debug else None,
        lifespan=lifespan,
    )

    app.add_middleware(RequestIdMiddleware)
    app.add_middleware(SessionMiddleware, secret_key=settings.secret_key, same_site="lax", https_only=not settings.debug)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=list(settings.cors_origins),
        allow_credentials=True,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type", "X-Request-ID", "X-Reviewer-Key"],
    )

    @app.middleware("http")
    async def security_headers(request: Request, call_next):
        try:
            response = await call_next(request)
        except Exception as exc:
            if _is_expected_exception(exc):
                # Let framework error handlers return proper status codes.
                raise exc

            logger.exception(
                "Unhandled exception in API request",
                extra={"path": request.url.path},
            )
            response = JSONResponse(error_payload(request, "internal_error", "Internal server error"), status_code=500)
            _apply_security_headers(request, response)
            return response

        _apply_security_headers(request, response)
        return response

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException):
        detail = exc.detail if isinstance(exc.detail, dict) else {}
        code = str(detail.get("code") or ("not_found" if exc.status_code == 404 else "http_error"))
        message = _message_from_detail(exc.detail)
        return JSONResponse(error_payload(request, code, message), status_code=exc.status_code)

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        return JSONResponse(
            error_payload(request, "validation_error", "Request validation failed", {"details": exc.errors()}),
            status_code=422,
        )

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception):
        logger.exception("Unhandled exception in API request", extra={"path": request.url.path})
        return JSONResponse(error_payload(request, "internal_error", "Internal server error"), status_code=500)

    @app.get("/health", tags=["health"])
    async def health():
        return {"status": "ok", "service": "tazy-api"}

    @app.get("/api/v1/health", tags=["health"])
    async def api_health():
        return {"status": "ok", "service": "tazy-api"}

    @app.get("/api/v1/health/db", tags=["health"])
    async def api_db_health():
        await check_database()
        return {"status": "ok", "service": "tazy-api", "database": "ok"}

    app.include_router(public.router)
    app.include_router(review.router)
    app.include_router(fci.router)

    @app.head("/admin/login", include_in_schema=False)
    async def admin_login_head():
        return Response(status_code=200, media_type="text/html")

    init_admin(app, get_engine(), settings)

    if (ROOT_DIR / "assets").exists():
        app.mount("/assets", StaticFiles(directory=ROOT_DIR / "assets"), name="assets")
    if (ROOT_DIR / "src").exists():
        app.mount("/src", StaticFiles(directory=ROOT_DIR / "src"), name="src")

    @app.get("/", include_in_schema=False)
    async def index():
        return FileResponse(ROOT_DIR / "index.html")

    @app.get("/styles.css", include_in_schema=False)
    async def styles():
        return FileResponse(ROOT_DIR / "styles.css")

    return app


app = create_app()
