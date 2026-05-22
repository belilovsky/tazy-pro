import { getFciDataRoomSnapshot as getLocalFciDataRoomSnapshot } from "../domain/dataRoom.js?v=20260522T143930Z";
import { mockApi } from "./mockApi.js?v=20260522T143930Z";

const REVIEWER_KEY_STORAGE = "tazy-pro.reviewer-key.v1";
const DEFAULT_API_BASE = "";

class ApiError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = "ApiError";
    this.status = options.status || 0;
    this.code = options.code || "api_error";
    this.canFallback = Boolean(options.canFallback);
  }
}

function getApiBase() {
  const configured = globalThis.document?.querySelector('meta[name="tazy-api-base"]')?.content;
  return (configured || DEFAULT_API_BASE).replace(/\/$/, "");
}

function getSessionStorage() {
  try {
    return globalThis.sessionStorage || null;
  } catch {
    return null;
  }
}

function getReviewerKey() {
  return getSessionStorage()?.getItem(REVIEWER_KEY_STORAGE) || "";
}

function setReviewerKey(value) {
  const storage = getSessionStorage();
  if (!storage) {
    return;
  }
  const key = value.trim();
  if (key) {
    storage.setItem(REVIEWER_KEY_STORAGE, key);
  } else {
    storage.removeItem(REVIEWER_KEY_STORAGE);
  }
}

function normalizeDogProfile(dog) {
  if (!dog) {
    return null;
  }
  return {
    ...dog,
    photo: dog.photo || "",
    alt: dog.alt || dog.name,
    meta: dog.meta || [dog.sex, dog.dateOfBirth, dog.region].filter(Boolean).join(" · "),
    score: dog.score || `${dog.completenessScore}%`,
    verificationLabel: dog.verificationLabel || `Level ${dog.verificationLevel}`,
    steps: Array.isArray(dog.steps) ? dog.steps : [],
    passportEvents: Array.isArray(dog.passportEvents) ? dog.passportEvents : [],
  };
}

function normalizeDogList(payload) {
  return Array.isArray(payload?.items) ? payload.items.map(normalizeDogProfile) : [];
}

function authHeaders() {
  const key = getReviewerKey();
  return key ? { "X-Reviewer-Key": key } : {};
}

function canUseLocalFallback() {
  const location = globalThis.location;
  if (!location) {
    return true;
  }
  return (
    location.protocol === "file:" ||
    location.hostname === "localhost" ||
    location.hostname === "127.0.0.1" ||
    location.hostname === "::1"
  );
}

async function parseError(response) {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new ApiError("Backend API is not available on this origin.", {
      status: response.status,
      code: "api_unavailable",
      canFallback: true,
    });
  }

  const payload = await response.json().catch(() => null);
  const error = payload?.error || {};
  throw new ApiError(error.message || response.statusText || "API request failed", {
    status: response.status,
    code: error.code || "api_error",
    canFallback: response.status === 404 && error.code !== "not_found",
  });
}

async function requestJson(path, options = {}) {
  const headers = {
    Accept: "application/json",
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(options.reviewer ? authHeaders() : {}),
  };
  const url = `${getApiBase()}/api/v1${path}`;
  const body = options.body ? JSON.stringify(options.body) : undefined;

  let response;
  try {
    if (typeof globalThis.fetch === "function") {
      response = await globalThis.fetch(url, {
        method: options.method || "GET",
        headers,
        body,
        credentials: "same-origin",
      });
    } else {
      response = await requestJsonWithXhr(url, {
        method: options.method || "GET",
        headers,
        body,
      });
    }
  } catch (error) {
    throw new ApiError(error?.message || "Backend API is not reachable.", {
      code: "network_error",
      canFallback: true,
    });
  }

  if (!response.ok) {
    await parseError(response);
  }

  return response.json();
}

function requestJsonWithXhr(url, options) {
  if (typeof globalThis.XMLHttpRequest !== "function") {
    throw new ApiError("No browser HTTP client is available.", { code: "http_unavailable", canFallback: true });
  }

  return new Promise((resolve, reject) => {
    const xhr = new globalThis.XMLHttpRequest();
    xhr.open(options.method, url);
    Object.entries(options.headers).forEach(([key, value]) => xhr.setRequestHeader(key, value));
    xhr.onload = () => {
      const headerMap = new Map();
      xhr.getAllResponseHeaders().trim().split(/[\r\n]+/).filter(Boolean).forEach((line) => {
        const index = line.indexOf(":");
        if (index > -1) {
          headerMap.set(line.slice(0, index).toLowerCase(), line.slice(index + 1).trim());
        }
      });
      resolve({
        ok: xhr.status >= 200 && xhr.status < 300,
        status: xhr.status,
        statusText: xhr.statusText,
        headers: {
          get(name) {
            return headerMap.get(name.toLowerCase()) || "";
          },
        },
        json: async () => JSON.parse(xhr.responseText),
      });
    };
    xhr.onerror = () => reject(new ApiError("Backend API is not reachable.", { code: "network_error", canFallback: true }));
    xhr.send(options.body);
  });
}

async function withFallback(request, fallback, options = {}) {
  try {
    const value = await request();
    tazyApi.source = "backend";
    return value;
  } catch (error) {
    if (options.authRequired && error.status === 401) {
      tazyApi.source = "backend";
      throw error;
    }
    if (error.canFallback && fallback && canUseLocalFallback()) {
      tazyApi.source = "local";
      return fallback();
    }
    throw error;
  }
}

export const tazyApi = {
  source: "backend",

  getReviewerKey,
  setReviewerKey,

  async getReviewerSession() {
    return requestJson("/review/session");
  },

  async loginReviewer({ username, password }) {
    return requestJson("/review/login", {
      method: "POST",
      body: { username, password },
    });
  },

  async logoutReviewer() {
    setReviewerKey("");
    return requestJson("/review/logout", { method: "POST" });
  },

  getSourceLabel() {
    return this.source === "local" ? "Local demo data" : "Backend API";
  },

  async listDogs() {
    return withFallback(
      async () => normalizeDogList(await requestJson("/dogs")),
      () => mockApi.listDogs(),
    );
  },

  async getDog(id) {
    return withFallback(
      async () => normalizeDogProfile(await requestJson(`/dogs/${encodeURIComponent(id)}`)),
      () => mockApi.getDog(id),
    );
  },

  async getDogByPassport(passportId) {
    return withFallback(
      async () => {
        const passport = await requestJson(`/passports/${encodeURIComponent(passportId)}`);
        return normalizeDogProfile(await requestJson(`/dogs/${encodeURIComponent(passport.dog.id)}`));
      },
      () => mockApi.getDogByPassport(passportId),
    );
  },

  async listEvidenceForDog(dogId) {
    return mockApi.listEvidenceForDog(dogId);
  },

  async listReviewQueue() {
    return withFallback(
      async () => {
        const payload = await requestJson("/review/queue", { reviewer: true });
        return payload.items || [];
      },
      () => mockApi.listReviewQueue(),
      { authRequired: true },
    );
  },

  async listVerificationDecisions() {
    const queue = await this.listReviewQueue();
    return queue.map((item) => item.currentDecision).filter(Boolean);
  },

  async getVerificationDecision(evidenceItemId) {
    const queue = await this.listReviewQueue();
    return queue.find((item) => item.id === evidenceItemId)?.currentDecision || null;
  },

  async createVerificationDecision({ evidenceItemId, decision, note, reviewerId }) {
    return withFallback(
      () => requestJson("/review/decisions", {
        method: "POST",
        reviewer: true,
        body: { evidenceItemId, decision, note, reviewerId },
      }),
      () => mockApi.createVerificationDecision({ evidenceItemId, decision, note, reviewerId }),
      { authRequired: true },
    );
  },

  async clearVerificationDecisions() {
    return mockApi.clearVerificationDecisions();
  },

  async resolvePassport(passportId) {
    const dog = await this.getDogByPassport(passportId);
    return dog ? { dogId: dog.id, passportId: dog.passportId } : null;
  },

  async getFciDataRoomSnapshot() {
    return withFallback(
      () => requestJson("/fci/data-room", { reviewer: true }),
      () => Promise.resolve(getLocalFciDataRoomSnapshot()),
      { authRequired: true },
    );
  },
};
