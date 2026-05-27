import { copyCatalog } from "./messages.js?v=20260527T004500Z";

export const DEFAULT_LANG = "ru";
export const LANGUAGE_EVENT = "tazy:langchange";
const LANGUAGE_STORAGE_KEY = "tazy-pro.lang";

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

export function readStoredLang() {
  try {
    const value = globalThis.localStorage?.getItem(LANGUAGE_STORAGE_KEY) || "";
    return value ? normalizeLang(value) : "";
  } catch {
    return "";
  }
}

export function getCurrentLang(root = document) {
  return normalizeLang(root?.documentElement?.lang || DEFAULT_LANG);
}

export function resolveInitialLang(root = document) {
  return normalizeLang(readStoredLang() || root?.documentElement?.lang || DEFAULT_LANG);
}

export function writeStoredLang(lang) {
  try {
    globalThis.localStorage?.setItem(LANGUAGE_STORAGE_KEY, normalizeLang(lang));
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

export function translateSeedText(text, lang = DEFAULT_LANG) {
  if (!text) {
    return text;
  }
  const localized = languageCatalog(lang)?.seed?.[text] || copyCatalog[DEFAULT_LANG]?.seed?.[text];
  if (localized) {
    return localized;
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
  const lang = normalizeLang(nextLang);
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
  writeStoredLang(lang);
  root.dispatchEvent(new CustomEvent(LANGUAGE_EVENT, { detail: { lang } }));
  return lang;
}
