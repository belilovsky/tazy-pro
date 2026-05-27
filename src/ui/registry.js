import { dogProfiles } from "../data/platform.js?v=20260527T111000Z";
import { getPublicDogProfile } from "../domain/readModels.js?v=20260527T111000Z";
import { LANGUAGE_EVENT, getCurrentLang, translateSeedText } from "../i18n/runtime.js?v=20260527T111000Z";
import { createVerificationRow } from "./evidence.js?v=20260527T111000Z";
import { updateDogRouteLinks } from "./router.js?v=20260527T111000Z";

export function initRegistry(root = document) {
  const photo = root.querySelector("[data-dog-photo]");
  const name = root.querySelector("[data-dog-name]");
  const meta = root.querySelector("[data-dog-meta]");
  const score = root.querySelector("[data-dog-score]");
  const list = root.querySelector("[data-verification-list]");
  const dogButtons = [...root.querySelectorAll("[data-dog]")];

  if (!photo || !name || !meta || !score || !list || dogButtons.length === 0) {
    return;
  }

  let activeIndex = 0;

  function renderDog(index) {
    const lang = getCurrentLang(root);
    const seedProfile = dogProfiles[index] || dogProfiles[0];
    const profile = getPublicDogProfile(seedProfile.id);
    photo.src = profile.photo;
    photo.alt = translateSeedText(profile.alt, lang);
    name.textContent = profile.name;
    meta.textContent = translateSeedText(profile.meta, lang);
    score.textContent = profile.score;
    updateDogRouteLinks(root, profile);

    list.replaceChildren(
      ...profile.steps.map((step) => createVerificationRow(root, step)),
    );
  }

  dogButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activeIndex = Number(button.dataset.dog);
      dogButtons.forEach((item) => {
        const isActive = item === button;
        item.classList.toggle("active", isActive);
        item.setAttribute("aria-selected", String(isActive));
      });
      renderDog(activeIndex);
    });
  });

  root.addEventListener(LANGUAGE_EVENT, () => renderDog(activeIndex));
  renderDog(0);
}
