import { readFileSync } from "node:fs";

const css = readFileSync("styles.css", "utf8");
const componentStart = css.indexOf("\n* {");
const componentCss = componentStart >= 0 ? css.slice(componentStart) : css;

const primitiveColorPattern = /#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(|color-mix\(/;
const legacyTokenPattern = /var\(--(?:bg|bg-2|surface|surface-2|text|muted|quiet|line|blue|blue-2|gold|green|red|shadow)\)/;
const requiredFontTokens = ["--font-ui", "--font-display", "--font-data", "--font-code"];
const legacyFontPattern = /\b(?:Georgia|Times New Roman|Segoe UI|BlinkMacSystemFont)\b/;
const fontFamilyPattern = /font-family:\s*([^;]+)/;

const errors = [];

requiredFontTokens.forEach((token) => {
  if (!css.includes(token)) {
    errors.push(`Missing AV DS font token ${token} in styles.css`);
  }
});

componentCss.split("\n").forEach((line, index) => {
  const lineNumber = css.slice(0, componentStart).split("\n").length + index;
  if (primitiveColorPattern.test(line)) {
    errors.push(`Primitive color outside token boundary at styles.css:${lineNumber}: ${line.trim()}`);
  }
  if (legacyTokenPattern.test(line)) {
    errors.push(`Legacy non-semantic token at styles.css:${lineNumber}: ${line.trim()}`);
  }
  if (legacyFontPattern.test(line)) {
    errors.push(`Legacy font family outside AV DS token boundary at styles.css:${lineNumber}: ${line.trim()}`);
  }
  const fontFamilyMatch = line.match(fontFamilyPattern);
  if (fontFamilyMatch && !fontFamilyMatch[1].trim().startsWith("var(--font-")) {
    errors.push(`Raw font-family outside AV DS token boundary at styles.css:${lineNumber}: ${line.trim()}`);
  }
});

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log("AV DS token audit passed: component CSS uses semantic tokens only.");
