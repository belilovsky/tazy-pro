import { dogProfiles } from "../data/platform.js";
import { getPublicDogProfile } from "../domain/readModels.js";
import { createVerificationRow } from "./evidence.js";
import { updateDogRouteLinks } from "./router.js";

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

  function renderDog(index) {
    const seedProfile = dogProfiles[index] || dogProfiles[0];
    const profile = getPublicDogProfile(seedProfile.id);
    photo.src = profile.photo;
    photo.alt = profile.alt;
    name.textContent = profile.name;
    meta.textContent = profile.meta;
    score.textContent = profile.score;
    updateDogRouteLinks(root, profile);

    list.replaceChildren(
      ...profile.steps.map((step) => createVerificationRow(root, step)),
    );
  }

  dogButtons.forEach((button) => {
    button.addEventListener("click", () => {
      dogButtons.forEach((item) => {
        const isActive = item === button;
        item.classList.toggle("active", isActive);
        item.setAttribute("aria-selected", String(isActive));
      });
      renderDog(Number(button.dataset.dog));
    });
  });

  renderDog(0);
}
