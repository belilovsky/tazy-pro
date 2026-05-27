import { readFileSync } from "node:fs";
import { copyCatalog } from "../src/i18n/messages.js";

const html = readFileSync("index.html", "utf8");
const sourceFiles = [
  "index.html",
  "src/api/tazyApi.js",
  "src/i18n/runtime.js",
  "src/ui/admin.js",
  "src/ui/breeding.js",
  "src/ui/dataRoom.js",
  "src/ui/evidence.js",
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

const copyKeys = new Set([...collectHtmlCopyKeys(), ...collectCodeCopyKeys()]);
verifyCopyKeys(copyKeys);
verifyLinks();

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Frontend contract verified: ${copyKeys.size} copy keys and static links are covered.`);
