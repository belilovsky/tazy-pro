from __future__ import annotations

import asyncio

import pytest
from fastapi.testclient import TestClient


@pytest.fixture()
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("TAZY_DEBUG", "true")
    monkeypatch.setenv("TAZY_DATABASE_URL", f"sqlite+aiosqlite:///{tmp_path / 'tazy-test.db'}")
    monkeypatch.setenv("TAZY_SECRET_KEY", "test-secret")
    monkeypatch.setenv("TAZY_REVIEWER_API_KEY", "test-reviewer-key")

    from backend.app.config import get_settings
    from backend.app.database import dispose_engine

    get_settings.cache_clear()
    asyncio.run(dispose_engine())

    from backend.app.main import create_app

    with TestClient(create_app(), base_url="https://testserver") as test_client:
        yield test_client

    get_settings.cache_clear()
    asyncio.run(dispose_engine())


def test_health_echoes_request_id(client: TestClient):
    response = client.get("/health", headers={"X-Request-ID": "test-request"})

    assert response.status_code == 200
    assert response.headers["X-Request-ID"] == "test-request"
    assert response.json()["status"] == "ok"


def test_db_health_checks_database(client: TestClient):
    response = client.get("/api/v1/health/db")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "tazy-api", "database": "ok"}


def test_internal_server_error_is_unified(monkeypatch, client: TestClient):
    from backend.app.routers import public

    async def _raise_db_error(session):
        raise RuntimeError("critical-path failure")

    monkeypatch.setattr(public, "get_dogs", _raise_db_error)

    response = client.get("/api/v1/dogs", headers={"X-Request-ID": "error-route"})

    assert response.status_code == 500
    payload = response.json()
    assert payload["error"]["code"] == "internal_error"
    assert payload["error"]["message"] == "Internal server error"
    assert payload["error"]["requestId"] == "error-route"


def test_public_dogs_seeded(client: TestClient):
    response = client.get("/api/v1/dogs")

    assert response.status_code == 200
    payload = response.json()
    assert payload["nextCursor"] is None
    assert [item["id"] for item in payload["items"]] == ["akzhel-barys", "saumal-koke"]


def test_public_profile_does_not_leak_reviewer_evidence(client: TestClient):
    response = client.get("/api/v1/dogs/akzhel-barys")

    assert response.status_code == 200
    payload = response.json()
    assert payload["name"] == "Akzhel Barys"
    assert payload["evidence"] == []
    assert all(event["visibility"] == "public" for event in payload["passportEvents"])
    assert "reviewerNote" not in str(payload)


def test_passport_snapshot_is_public_and_hashed(client: TestClient):
    response = client.get("/api/v1/passports/tzy-kz-000182")

    assert response.status_code == 200
    payload = response.json()
    assert payload["dog"]["id"] == "akzhel-barys"
    assert payload["snapshotHash"].startswith("sha256:")
    assert all(event["visibility"] == "public" for event in payload["events"])


def test_list_dogs_rejects_bad_cursor(client: TestClient):
    response = client.get("/api/v1/dogs?cursor=not-a-number")

    assert response.status_code == 422


def test_reviewer_queue_requires_key_outside_debug(tmp_path, monkeypatch):
    monkeypatch.setenv("TAZY_DEBUG", "false")
    monkeypatch.setenv("TAZY_DATABASE_URL", f"sqlite+aiosqlite:///{tmp_path / 'prod-like.db'}")
    monkeypatch.setenv("TAZY_SECRET_KEY", "prod-test-secret")
    monkeypatch.setenv("TAZY_ADMIN_PASSWORD", "prod-admin-password")
    monkeypatch.setenv("TAZY_REVIEWER_API_KEY", "prod-reviewer-key")

    from backend.app.config import get_settings
    from backend.app.database import dispose_engine

    get_settings.cache_clear()
    asyncio.run(dispose_engine())

    from backend.app.main import create_app

    with TestClient(create_app(), base_url="https://testserver") as test_client:
        response = test_client.get("/api/v1/review/queue")
        assert response.status_code == 401
        assert response.json()["error"]["message"] == "Reviewer login is required"

    get_settings.cache_clear()
    asyncio.run(dispose_engine())


def test_reviewer_session_login_unlocks_queue(tmp_path, monkeypatch):
    monkeypatch.setenv("TAZY_DEBUG", "false")
    monkeypatch.setenv("TAZY_DATABASE_URL", f"sqlite+aiosqlite:///{tmp_path / 'session.db'}")
    monkeypatch.setenv("TAZY_SECRET_KEY", "prod-session-secret")
    monkeypatch.setenv("TAZY_ADMIN_USERNAME", "admin")
    monkeypatch.setenv("TAZY_ADMIN_PASSWORD", "prod-admin-password")
    monkeypatch.setenv("TAZY_REVIEWER_API_KEY", "prod-reviewer-key")

    from backend.app.config import get_settings
    from backend.app.database import dispose_engine

    get_settings.cache_clear()
    asyncio.run(dispose_engine())

    from backend.app.main import create_app

    with TestClient(create_app(), base_url="https://testserver") as test_client:
        bad_login = test_client.post(
            "/api/v1/review/login",
            json={"username": "admin", "password": "wrong-password"},
        )
        assert bad_login.status_code == 401

        login = test_client.post(
            "/api/v1/review/login",
            json={"username": "admin", "password": "prod-admin-password"},
        )
        assert login.status_code == 200
        assert login.json() == {"authenticated": True, "reviewerId": "admin"}

        session = test_client.get("/api/v1/review/session")
        assert session.json() == {"authenticated": True, "reviewerId": "admin"}

        queue = test_client.get("/api/v1/review/queue")
        assert queue.status_code == 200
        assert queue.headers["Cache-Control"] == "no-store"
        assert len(queue.json()["items"]) == 3

        logout = test_client.post("/api/v1/review/logout")
        assert logout.status_code == 200
        assert logout.json() == {"authenticated": False, "reviewerId": ""}

        locked = test_client.get("/api/v1/review/queue")
        assert locked.status_code == 401

    get_settings.cache_clear()
    asyncio.run(dispose_engine())


def test_reviewer_login_rate_limit(tmp_path, monkeypatch):
    monkeypatch.setenv("TAZY_DEBUG", "false")
    monkeypatch.setenv("TAZY_DATABASE_URL", f"sqlite+aiosqlite:///{tmp_path / 'login-limit.db'}")
    monkeypatch.setenv("TAZY_SECRET_KEY", "prod-login-limit-secret")
    monkeypatch.setenv("TAZY_ADMIN_USERNAME", "admin")
    monkeypatch.setenv("TAZY_ADMIN_PASSWORD", "prod-admin-password")
    monkeypatch.setenv("TAZY_REVIEWER_API_KEY", "prod-reviewer-key")

    from backend.app.config import get_settings
    from backend.app.database import dispose_engine
    from backend.app.routers.review import LOGIN_MAX_FAILURES, _login_failures

    get_settings.cache_clear()
    _login_failures.clear()
    asyncio.run(dispose_engine())

    from backend.app.main import create_app

    with TestClient(create_app(), base_url="https://testserver") as test_client:
        for _ in range(LOGIN_MAX_FAILURES):
            response = test_client.post(
                "/api/v1/review/login",
                json={"username": "admin", "password": "wrong-password"},
            )
            assert response.status_code == 401

        limited = test_client.post(
            "/api/v1/review/login",
            json={"username": "admin", "password": "prod-admin-password"},
        )
        assert limited.status_code == 429
        assert limited.json()["error"]["code"] == "rate_limited"

    _login_failures.clear()
    get_settings.cache_clear()
    asyncio.run(dispose_engine())


def test_reviewer_decision_is_append_only_current_state(client: TestClient):
    queue = client.get("/api/v1/review/queue", headers={"X-Reviewer-Key": "test-reviewer-key"}).json()
    assert len(queue["items"]) == 3

    response = client.post(
        "/api/v1/review/decisions",
        headers={"X-Reviewer-Key": "test-reviewer-key"},
        json={
            "evidenceItemId": "health-barys-ophthalmology",
            "decision": "approved",
            "note": "Signed certificate received.",
            "reviewerId": "registry-admin",
        },
    )

    assert response.status_code == 201
    decision = response.json()
    assert decision["decision"] == "approved"
    assert decision["decisionLabel"] == "Approved"

    next_queue = client.get("/api/v1/review/queue", headers={"X-Reviewer-Key": "test-reviewer-key"}).json()
    item = next(item for item in next_queue["items"] if item["id"] == "health-barys-ophthalmology")
    assert item["currentDecision"]["id"] == decision["id"]
    assert item["statusLabel"] == "Approved"


def test_fci_data_room_uses_seed_metrics(client: TestClient):
    response = client.get("/api/v1/fci/data-room", headers={"X-Reviewer-Key": "test-reviewer-key"})

    assert response.status_code == 200
    payload = response.json()
    assert payload["cycle"]["targetYear"] == "2034"
    assert payload["metrics"][0]["value"] == "2"
    assert payload["priorityQueue"][0]["priority"] == "High"




def test_unauthorized_error_has_security_headers_and_json_shape(client: TestClient):
    response = client.get('/api/v1/review/queue', headers={'X-Request-ID': 'req-unauth', 'X-Reviewer-Key': 'bad-key'})

    assert response.status_code == 401
    payload = response.json()
    assert payload['error']['code'] == 'unauthorized'
    assert payload['error']['message'] == 'Reviewer login is required'
    assert payload['error']['requestId'] == 'req-unauth'
    assert response.headers['x-content-type-options'] == 'nosniff'
    assert 'x-request-id' in response.headers
    assert response.headers.get('cache-control') == 'no-store'


def test_unified_not_found_error(client: TestClient):
    response = client.get("/api/v1/dogs/missing-dog", headers={"X-Request-ID": "missing-id"})

    assert response.status_code == 404
    assert response.json() == {
        "error": {
            "code": "not_found",
            "message": "Dog profile not found",
            "requestId": "missing-id",
        }
    }


def test_admin_login_page_is_available(client: TestClient):
    response = client.get("/admin/login")

    assert response.status_code == 200
    assert "TAZY.PRO Admin" in response.text or "Login" in response.text


def test_admin_login_head_is_available(client: TestClient):
    response = client.head("/admin/login")

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/html")
