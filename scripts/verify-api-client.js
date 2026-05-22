import { tazyApi } from "../src/api/tazyApi.js";

const originalFetch = globalThis.fetch;
const originalSessionStorage = globalThis.sessionStorage;
const calls = [];
const store = new Map();

function installSessionStorage() {
  Object.defineProperty(globalThis, "sessionStorage", {
    configurable: true,
    value: {
      getItem(key) {
        return store.get(key) || null;
      },
      setItem(key, value) {
        store.set(key, value);
      },
      removeItem(key) {
        store.delete(key);
      },
    },
  });
}

function restoreGlobals() {
  Object.defineProperty(globalThis, "sessionStorage", {
    configurable: true,
    value: originalSessionStorage,
  });
  globalThis.fetch = originalFetch;
}

function response(status, payload, contentType = "application/json") {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: String(status),
    headers: {
      get(name) {
        return name.toLowerCase() === "content-type" ? contentType : "";
      },
    },
    async json() {
      return payload;
    },
  };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

installSessionStorage();

globalThis.fetch = async (url, options) => {
  calls.push({ url, options });
  if (url.endsWith("/api/v1/dogs")) {
    return response(200, {
      items: [
        {
          id: "akzhel-barys",
          name: "Akzhel Barys",
          sex: "male",
          dateOfBirth: "2022-04-18",
          region: "Almaty region",
          registryNumber: "TZY-2034-0182",
          passportId: "TZY-KZ-000182",
          verificationLevel: 7,
          completenessScore: 86,
        },
      ],
      nextCursor: null,
    });
  }
  if (url.endsWith("/api/v1/review/queue")) {
    assert(options.headers["X-Reviewer-Key"] === "review-key", "Reviewer key header was not sent");
    return response(200, { items: [] });
  }
  return response(404, { error: { code: "not_found", message: "Not found" } });
};

const dogs = await tazyApi.listDogs();
assert(dogs.length === 1, "Backend dog list was not used");
assert(dogs[0].score === "86%", "Dog score was not normalized");
assert(dogs[0].meta.includes("Almaty region"), "Dog meta was not normalized");

tazyApi.setReviewerKey("review-key");
const queue = await tazyApi.listReviewQueue();
assert(Array.isArray(queue), "Reviewer queue did not return an array");
assert(calls.some((call) => call.url.endsWith("/api/v1/review/queue")), "Reviewer queue endpoint was not called");

globalThis.fetch = undefined;
const fallbackDogs = await tazyApi.listDogs();
assert(fallbackDogs.length === 2, "Local fallback did not return seed dogs");
assert(tazyApi.getSourceLabel() === "Local demo data", "Fallback source label was not set");

restoreGlobals();
console.log("API client verified: backend path, reviewer auth header, and local fallback.");
