from __future__ import annotations

import asyncio
import os

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

    with TestClient(create_app()) as test_client:
        yield test_client

    get_settings.cache_clear()
    asyncio.run(dispose_engine())


def test_health_echoes_request_id(client: TestClient):
    response = client.get("/health", headers={"X-Request-ID": "test-request"})

    assert response.status_code == 200
    assert response.headers["X-Request-ID"] == "test-request"
    assert response.json()["status"] == "ok"


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

    with TestClient(create_app()) as test_client:
        response = test_client.get("/api/v1/review/queue")
        assert response.status_code == 401

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
