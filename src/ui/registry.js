import { dogProfiles } from "../data/platform.js";

function createVerificationRow(documentRef, [label, status, state]) {
  const row = documentRef.createElement("div");
  row.className = `verification-row${state === "pending" ? " pending" : ""}`;

  const dot = documentRef.createElement("span");
  dot.className = "verification-dot";
  dot.setAttribute("aria-hidden", "true");
  dot.textContent = state === "done" ? "✓" : "•";

  const text = documentRef.createElement("span");
  const title = documentRef.createElement("b");
  const subtitle = documentRef.createElement("small");
  title.textContent = label;
  subtitle.textContent = status;
  text.append(title, subtitle);

  const stateLabel = documentRef.createElement("b");
  stateLabel.textContent = state;

  row.append(dot, text, stateLabel);
  return row;
}

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
    const profile = dogProfiles[index] || dogProfiles[0];
    photo.src = profile.photo;
    photo.alt = profile.alt;
    name.textContent = profile.name;
    meta.textContent = profile.meta;
    score.textContent = profile.score;

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

