import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { copyCatalog } from "../src/i18n/messages.js";

const targetDir = process.argv[2];
const origin = (process.argv[3] || "https://tazy.dog").replace(/\/+$/, "");
const publicLangs = ["ru", "en"];

if (!targetDir) {
  console.error("Usage: node scripts/build_localized_entrypoints.js <target-dir> [origin]");
  process.exit(1);
}

function canonicalHref(lang) {
  return `${origin}${lang === "en" ? "/en/" : "/"}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll('"', "&quot;");
}

function replaceAttribute(tag, attribute, value) {
  const escaped = escapeAttr(value);
  const pattern = new RegExp(`\\s${attribute}="[^"]*"`);
  if (pattern.test(tag)) {
    return tag.replace(pattern, ` ${attribute}="${escaped}"`);
  }
  return tag.replace(/>$/, ` ${attribute}="${escaped}">`);
}

function replaceTaggedCopy(html, lang) {
  return html.replace(/(<([a-z0-9-]+)\b[^>]*\sdata-copy="([^"]+)"[^>]*>)([\s\S]*?)(<\/\2>)/gi, (match, open, tag, key, body, close) => {
    const copy = copyCatalog[lang]?.[key];
    if (!copy || /<[^>]+>/.test(body)) {
      return match;
    }
    return `${open}${escapeHtml(copy)}${close}`;
  });
}

function replaceCopiedAttributes(html, lang, dataAttribute, targetAttribute) {
  const pattern = new RegExp(`<[^>]+\\s${dataAttribute}="([^"]+)"[^>]*>`, "g");
  return html.replace(pattern, (tag, key) => {
    const copy = copyCatalog[lang]?.[key];
    return copy ? replaceAttribute(tag, targetAttribute, copy) : tag;
  });
}

function replaceSeedFallbacks(html, lang) {
  const sourceSeed = copyCatalog.ru?.seed || {};
  const targetSeed = copyCatalog[lang]?.seed || {};
  let next = html;
  for (const [source, ruText] of Object.entries(sourceSeed)) {
    const target = targetSeed[source] || source;
    next = next.replaceAll(escapeHtml(ruText), escapeHtml(target));
    next = next.replaceAll(escapeAttr(ruText), escapeAttr(target));
  }
  return next;
}

function setLanguageButtonState(html, lang) {
  return html.replace(/<button\b[^>]*\sdata-lang="(ru|en)"[^>]*>/g, (tag, buttonLang) => {
    let next = tag.replace(/\sclass="active"/, "").replace(/\saria-current="true"/, "").replace(/\saria-pressed="(?:true|false)"/, "");
    next = replaceAttribute(next, "aria-pressed", String(buttonLang === lang));
    if (buttonLang === lang) {
      if (/\sclass="/.test(next)) {
        next = next.replace(/\sclass="/, ' class="active ');
      } else {
        next = next.replace(/>$/, ' class="active">');
      }
      next = replaceAttribute(next, "aria-current", "true");
    }
    return next;
  });
}

function localizeHtml(template, lang) {
  const title = copyCatalog[lang]["meta.title"];
  const description = copyCatalog[lang]["meta.description"];
  let html = template;
  html = html.replace(/<html lang="[^"]*"/, `<html lang="${lang}"`);
  html = html.replace(/<title\b[^>]*>[\s\S]*?<\/title>/, `<title data-copy="meta.title">${escapeHtml(title)}</title>`);
  html = replaceCopiedAttributes(html, lang, "data-copy-content", "content");
  html = replaceCopiedAttributes(html, lang, "data-copy-aria-label", "aria-label");
  html = replaceCopiedAttributes(html, lang, "data-copy-alt", "alt");
  html = replaceCopiedAttributes(html, lang, "data-copy-placeholder", "placeholder");
  html = replaceTaggedCopy(html, lang);
  html = replaceSeedFallbacks(html, lang);
  html = setLanguageButtonState(html, lang);
  html = html.replace(/<meta\b[^>]*\sdata-localized-url[^>]*>/g, (tag) => replaceAttribute(tag, "content", canonicalHref(lang)));
  html = html.replace(/<link\b[^>]*\sdata-localized-url[^>]*>/g, (tag) => replaceAttribute(tag, "href", canonicalHref(lang)));
  html = html.replace(/<meta\b[^>]*\sdata-localized-locale[^>]*>/g, (tag) => replaceAttribute(tag, "content", lang === "en" ? "en_US" : "ru_RU"));
  for (const hreflang of [...publicLangs, "x-default"]) {
    const href = hreflang === "en" ? canonicalHref("en") : canonicalHref("ru");
    html = html.replace(new RegExp(`<link\\b[^>]*\\sdata-hreflang="${hreflang}"[^>]*>`, "g"), (tag) => replaceAttribute(tag, "href", href));
  }
  html = html.replace('content="./assets/tazy-hero.png"', 'content="https://tazy.dog/assets/tazy-hero.png"');
  return html;
}

const indexPath = join(targetDir, "index.html");
const template = readFileSync(indexPath, "utf8");

writeFileSync(indexPath, localizeHtml(template, "ru"), "utf8");
mkdirSync(join(targetDir, "en"), { recursive: true });
writeFileSync(join(targetDir, "en", "index.html"), localizeHtml(template, "en"), "utf8");

console.log(`Localized entrypoints written for ${origin}: / and /en/`);
