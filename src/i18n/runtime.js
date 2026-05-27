import { copyCatalog } from "./messages.js?v=20260528T023600Z";

export const DEFAULT_LANG = "ru";
export const PUBLIC_LANGS = ["ru", "en"];
export const LANGUAGE_EVENT = "tazy:langchange";
const PRODUCTION_ORIGIN = "https://tazy.dog";
const LANGUAGE_STORAGE_KEY = "tazy-dog.lang";
const LEGACY_LANGUAGE_STORAGE_KEY = "tazy-pro.lang";

function languageCatalog(lang) {
  return copyCatalog[normalizeLang(lang)] || copyCatalog[DEFAULT_LANG];
}

export function normalizeLang(value) {
  if (value === "kk" || value === "kz") {
    return "kk";
  }
  if (value === "en") {
    return "en";
  }
  return DEFAULT_LANG;
}

function normalizePublicLang(value) {
  const lang = normalizeLang(value);
  return PUBLIC_LANGS.includes(lang) ? lang : DEFAULT_LANG;
}

function readPathLang(locationRef = globalThis.location) {
  const firstSegment = locationRef?.pathname?.split("/").filter(Boolean)[0] || "";
  if (firstSegment === "en") {
    return "en";
  }
  if (firstSegment === "ru") {
    return "ru";
  }
  return "";
}

function localizedPath(lang, locationRef = globalThis.location) {
  const publicLang = normalizePublicLang(lang);
  const search = locationRef?.search || "";
  const hash = locationRef?.hash || "";
  const path = publicLang === "en" ? "/en/" : "/";
  return `${path}${search}${hash}`;
}

export function localizedHref(lang, locationRef = globalThis.location) {
  const origin = locationRef?.origin || PRODUCTION_ORIGIN;
  return `${origin}${localizedPath(lang, locationRef)}`;
}

export function canonicalHref(lang) {
  return `${PRODUCTION_ORIGIN}${normalizePublicLang(lang) === "en" ? "/en/" : "/"}`;
}

export function readStoredLang() {
  try {
    const value = globalThis.localStorage?.getItem(LANGUAGE_STORAGE_KEY) || globalThis.localStorage?.getItem(LEGACY_LANGUAGE_STORAGE_KEY) || "";
    return value ? normalizeLang(value) : "";
  } catch {
    return "";
  }
}

export function getCurrentLang(root = document) {
  return normalizeLang(root?.documentElement?.lang || DEFAULT_LANG);
}

export function resolveInitialLang(root = document) {
  const pathLang = readPathLang(root?.defaultView?.location);
  if (pathLang) {
    return pathLang;
  }
  const pathname = root?.defaultView?.location?.pathname || "/";
  if (pathname === "/" || pathname.endsWith("/index.html")) {
    return DEFAULT_LANG;
  }
  return normalizePublicLang(readStoredLang() || root?.documentElement?.lang || DEFAULT_LANG);
}

export function writeStoredLang(lang) {
  try {
    globalThis.localStorage?.setItem(LANGUAGE_STORAGE_KEY, normalizeLang(lang));
    globalThis.localStorage?.removeItem(LEGACY_LANGUAGE_STORAGE_KEY);
  } catch {
    // Ignore storage failures in locked-down browsers.
  }
}

export function getCopy(key, lang = DEFAULT_LANG) {
  return languageCatalog(lang)?.[key] || copyCatalog[DEFAULT_LANG]?.[key] || key;
}

export function formatCopy(key, values = {}, lang = DEFAULT_LANG) {
  return getCopy(key, lang).replace(/\{(\w+)\}/g, (_, token) => String(values[token] ?? ""));
}

function syncLocalizedUrls(root, lang) {
  const publicLang = normalizePublicLang(lang);
  const currentCanonical = canonicalHref(publicLang);
  root.querySelectorAll("[data-localized-url]").forEach((node) => {
    if (node.tagName === "LINK") {
      node.setAttribute("href", currentCanonical);
    } else {
      node.setAttribute("content", currentCanonical);
    }
  });
  root.querySelectorAll("[data-hreflang]").forEach((node) => {
    const hreflang = node.dataset.hreflang;
    node.setAttribute("href", hreflang === "en" ? canonicalHref("en") : canonicalHref("ru"));
  });
  root.querySelector("[data-localized-locale]")?.setAttribute("content", publicLang === "en" ? "en_US" : "ru_RU");
}

export function translateSeedText(text, lang = DEFAULT_LANG) {
  if (!text) {
    return text;
  }
  const normalizedLang = normalizeLang(lang);
  const localized = languageCatalog(normalizedLang)?.seed?.[text];
  if (localized) {
    return localized;
  }
  if (normalizedLang === DEFAULT_LANG) {
    const defaultText = copyCatalog[DEFAULT_LANG]?.seed?.[text];
    if (defaultText) {
      return defaultText;
    }
  }

  const levelMatch = /^Level (\d+)$/.exec(text);
  if (levelMatch) {
    return formatCopy("seed.levelFormat", { level: levelMatch[1] }, lang);
  }

  const itemsMatch = /^(\d+) items$/.exec(text);
  if (itemsMatch) {
    return formatCopy("seed.itemsFormat", { count: itemsMatch[1] }, lang);
  }

  const generationsMatch = /^(\d+) generations$/.exec(text);
  if (generationsMatch) {
    return formatCopy("seed.generationsFormat", { count: generationsMatch[1] }, lang);
  }

  return text;
}

export function applyLanguage(root = document, nextLang = DEFAULT_LANG) {
  const lang = normalizePublicLang(nextLang);
  root.documentElement.lang = lang;
  root.querySelectorAll("[data-lang]").forEach((item) => {
    const active = item.dataset.lang === lang;
    item.classList.toggle("active", active);
    item.setAttribute("aria-pressed", String(active));
    if (active) {
      item.setAttribute("aria-current", "true");
    } else {
      item.removeAttribute("aria-current");
    }
  });
  root.querySelectorAll("[data-copy]").forEach((node) => {
    const key = node.dataset.copy;
    if (key) {
      node.textContent = getCopy(key, lang);
    }
  });
  root.querySelectorAll("[data-copy-aria-label]").forEach((node) => {
    const key = node.dataset.copyAriaLabel;
    if (key) {
      node.setAttribute("aria-label", getCopy(key, lang));
    }
  });
  root.querySelectorAll("[data-copy-content]").forEach((node) => {
    const key = node.dataset.copyContent;
    if (key) {
      node.setAttribute("content", getCopy(key, lang));
    }
  });
  root.querySelectorAll("[data-copy-alt]").forEach((node) => {
    const key = node.dataset.copyAlt;
    if (key) {
      node.setAttribute("alt", getCopy(key, lang));
    }
  });
  root.querySelectorAll("[data-copy-placeholder]").forEach((node) => {
    const key = node.dataset.copyPlaceholder;
    if (key) {
      node.setAttribute("placeholder", getCopy(key, lang));
    }
  });
  const title = getCopy("meta.title", lang);
  if (title && title !== "meta.title") {
    root.title = title;
  }
  syncLocalizedUrls(root, lang);
  writeStoredLang(lang);
  root.dispatchEvent(new CustomEvent(LANGUAGE_EVENT, { detail: { lang } }));
  return lang;
}
