import { readFileSync } from "node:fs";
import { mockApi } from "../src/api/mockApi.js";
import { copyCatalog } from "../src/i18n/messages.js";
import { canonicalHref, localizedHref, readStoredLang, writeStoredLang } from "../src/i18n/runtime.js";

const html = readFileSync("index.html", "utf8");
const sourceFiles = [
  "index.html",
  "src/api/tazyApi.js",
  "src/i18n/runtime.js",
  "src/ui/admin.js",
  "src/ui/breeding.js",
  "src/ui/dataRoom.js",
  "src/ui/evidence.js",
  "src/ui/mapDashboard.js",
  "src/ui/registry.js",
  "src/ui/reviewerAuth.js",
  "src/ui/router.js",
  "src/ui/shell.js",
];
const keyPrefixes = new Set([
  "a11y",
  "admin",
  "api",
  "architecture",
  "benchmark",
  "brand",
  "breeders",
  "breeding",
  "cta",
  "dataRoom",
  "design",
  "ecosystem",
  "fci",
  "health",
  "footer",
  "heritage",
  "hero",
  "intro",
  "journey",
  "launch",
  "mapdash",
  "meta",
  "nav",
  "modules",
  "passport",
  "platform",
  "science",
  "registry",
  "reviewer",
  "route",
  "world",
  "seed",
  "source",
  "state",
]);
const knownRoutes = new Set([
  "/",
  "admin",
  "architecture",
  "breeders",
  "data-room",
  "ecosystem",
  "fci-progress",
  "heritage",
]);
const knownRoutePrefixes = ["dogs/", "passport/"];
const errors = [];

function collectHtmlCopyKeys() {
  const keys = new Set();
  const attributePattern = /\sdata-copy(?:-[a-z-]+)?="([^"]+)"/g;
  for (const match of html.matchAll(attributePattern)) {
    keys.add(match[1]);
  }
  return keys;
}

function collectCodeCopyKeys() {
  const keys = new Set();
  const dottedLiteral = /["']([A-Za-z][A-Za-z0-9]*(?:\.[A-Za-z0-9]+)+)["']/g;
  for (const file of sourceFiles) {
    const content = readFileSync(file, "utf8");
    for (const match of content.matchAll(dottedLiteral)) {
      const [prefix] = match[1].split(".");
      if (keyPrefixes.has(prefix)) {
        keys.add(match[1]);
      }
    }
  }
  return keys;
}

function verifyCopyKeys(keys) {
  for (const key of [...keys].sort()) {
    for (const lang of ["ru", "kk", "en"]) {
      if (!copyCatalog[lang]?.[key]) {
        errors.push(`Missing ${lang} translation for copy key: ${key}`);
      }
    }
  }
}

function verifyLinks() {
  const idPattern = /\sid="([^"]+)"/g;
  const ids = new Set([...html.matchAll(idPattern)].map((match) => match[1]));
  const hrefPattern = /\shref="#([^"]*)"/g;
  for (const match of html.matchAll(hrefPattern)) {
    const href = match[1];
    if (!href || href === "top") {
      continue;
    }
    if (href.startsWith("/")) {
      const route = href.slice(1);
      const knownRoute = knownRoutes.has(route) || knownRoutePrefixes.some((prefix) => route.startsWith(prefix));
      if (!knownRoute) {
        errors.push(`Unknown app route in href: #${href}`);
      }
      continue;
    }
    if (!ids.has(href)) {
      errors.push(`Unknown page anchor in href: #${href}`);
    }
  }
}

function verifyLanguageUrls() {
  if (!html.includes('hreflang="en"') || !html.includes('https://tazy.dog/en/')) {
    errors.push("Missing English hreflang entrypoint in index.html");
  }
  if (html.includes('data-lang="kk"')) {
    errors.push("KZ language switch is still exposed before the public KZ version is ready");
  }
  assert(canonicalHref("ru") === "https://tazy.dog/", "RU canonical URL is wrong");
  assert(canonicalHref("en") === "https://tazy.dog/en/", "EN canonical URL is wrong");
  const mockLocation = { origin: "https://tazy.dog", pathname: "/", search: "?qa=1", hash: "#/fci-progress" };
  assert(localizedHref("en", mockLocation) === "https://tazy.dog/en/?qa=1#/fci-progress", "EN localized URL did not preserve search and hash");
  assert(localizedHref("ru", { ...mockLocation, pathname: "/en/" }) === "https://tazy.dog/?qa=1#/fci-progress", "RU localized URL did not normalize back to root");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function verifyBrowserStateMigration() {
  const originalLocalStorage = globalThis.localStorage;
  const store = new Map();
  Object.defineProperty(globalThis, "localStorage", {
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

  try {
    store.set("tazy-pro.lang", "kk");
    assert(readStoredLang() === "kk", "Language runtime did not read the legacy tazy-pro storage key");
    writeStoredLang("en");
    assert(store.get("tazy-dog.lang") === "en", "Language runtime did not write the tazy-dog storage key");
    assert(!store.has("tazy-pro.lang"), "Legacy language key was not cleared after migration");

    store.set(
      "tazy-pro.verification-decisions.v1",
      JSON.stringify([{ evidenceItemId: "legacy-evidence", decision: "approve" }]),
    );
    const decisions = await mockApi.listVerificationDecisions();
    assert(decisions[0]?.evidenceItemId === "legacy-evidence", "Mock API did not read legacy reviewer decisions");
    await mockApi.clearVerificationDecisions();
    assert(store.get("tazy-dog.verification-decisions.v1") === "[]", "Mock API did not write reviewer decisions to tazy-dog storage");
    assert(!store.has("tazy-pro.verification-decisions.v1"), "Legacy reviewer decisions were not cleared after migration");
  } finally {
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: originalLocalStorage,
    });
  }
}

const copyKeys = new Set([...collectHtmlCopyKeys(), ...collectCodeCopyKeys()]);
verifyCopyKeys(copyKeys);
verifyLinks();
verifyLanguageUrls();
await verifyBrowserStateMigration();

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Frontend contract verified: ${copyKeys.size} copy keys and static links are covered.`);
