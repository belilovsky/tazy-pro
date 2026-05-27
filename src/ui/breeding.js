import { pairScores } from "../data/platform.js?v=20260527T160500Z";
import { LANGUAGE_EVENT, getCurrentLang, translateSeedText } from "../i18n/runtime.js?v=20260527T160500Z";

export function initBreeding(root = document) {
  const sire = root.querySelector("[data-sire]");
  const dam = root.querySelector("[data-dam]");
  const runButton = root.querySelector("[data-run-match]");
  const fields = {
    coi: root.querySelector("[data-coi]"),
    coiMeter: root.querySelector("[data-coi-meter]"),
    sireRisk: root.querySelector("[data-sire-risk]"),
    sireMeter: root.querySelector("[data-sire-meter]"),
    diversity: root.querySelector("[data-diversity]"),
    diversityMeter: root.querySelector("[data-diversity-meter]"),
    title: root.querySelector("[data-recommendation-title]"),
    text: root.querySelector("[data-recommendation]"),
  };

  if (!sire || !dam || !runButton || Object.values(fields).some((field) => !field)) {
    return;
  }

  function updateBreeding() {
    const lang = getCurrentLang(root);
    const data = pairScores[`${sire.value}-${dam.value}`] || pairScores["barys-koke"];
    fields.coi.textContent = data.coi;
    fields.coiMeter.style.width = data.coiMeter;
    fields.sireRisk.textContent = translateSeedText(data.sireRisk, lang);
    fields.sireMeter.style.width = data.sireMeter;
    fields.diversity.textContent = translateSeedText(data.diversity, lang);
    fields.diversityMeter.style.width = data.diversityMeter;
    fields.title.textContent = translateSeedText(data.title, lang);
    fields.text.textContent = translateSeedText(data.text, lang);
  }

  runButton.addEventListener("click", updateBreeding);
  sire.addEventListener("change", updateBreeding);
  dam.addEventListener("change", updateBreeding);
  root.addEventListener(LANGUAGE_EVENT, updateBreeding);
  updateBreeding();
}
