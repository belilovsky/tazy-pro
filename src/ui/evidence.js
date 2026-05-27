import { getCopy, getCurrentLang, translateSeedText } from "../i18n/runtime.js?v=20260527T004500Z";

export function createVerificationRow(documentRef, [label, status, state]) {
  const lang = getCurrentLang(documentRef);
  const row = documentRef.createElement("div");
  row.className = `verification-row${state === "pending" ? " pending" : ""}`;

  const dot = documentRef.createElement("span");
  dot.className = "verification-dot";
  dot.setAttribute("aria-hidden", "true");
  dot.textContent = state === "done" ? "✓" : "•";

  const text = documentRef.createElement("span");
  const title = documentRef.createElement("b");
  const subtitle = documentRef.createElement("small");
  title.textContent = translateSeedText(label, lang);
  subtitle.textContent = translateSeedText(status, lang);
  text.append(title, subtitle);

  const stateLabel = documentRef.createElement("b");
  stateLabel.textContent = getCopy(`state.${state}`, lang);

  row.append(dot, text, stateLabel);
  return row;
}
