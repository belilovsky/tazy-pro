function createElement(documentRef, tag, className, text) {
  const node = documentRef.createElement(tag);
  if (className) {
    node.className = className;
  }
  if (text) {
    node.textContent = text;
  }
  return node;
}

export function isAuthError(error) {
  return error?.status === 401 || error?.code === "unauthorized";
}

export function createReviewerKeyPanel(documentRef, api, onSubmit, error) {
  const panel = createElement(documentRef, "article", "route-panel reviewer-key-panel");
  panel.append(
    createElement(documentRef, "p", "section-label", "Protected workspace"),
    createElement(documentRef, "h2", "", "Reviewer key required"),
    createElement(
      documentRef,
      "p",
      "",
      error?.message || "Enter the reviewer API key to load protected evidence and FCI data from the backend.",
    ),
  );

  const form = createElement(documentRef, "form", "reviewer-key-form");
  const label = createElement(documentRef, "label", "reviewer-key-label", "Reviewer API key");
  const input = createElement(documentRef, "input", "reviewer-key-input");
  input.type = "password";
  input.name = "reviewer-key";
  input.autocomplete = "current-password";
  input.placeholder = "Paste key";
  input.value = api.getReviewerKey?.() || "";
  label.append(input);

  const actions = createElement(documentRef, "div", "admin-actions");
  const save = createElement(documentRef, "button", "primary-button compact", "Unlock");
  save.type = "submit";
  const clear = createElement(documentRef, "button", "secondary-button", "Clear key");
  clear.type = "button";
  clear.addEventListener("click", () => {
    api.setReviewerKey?.("");
    input.value = "";
    input.focus();
  });
  actions.append(save, clear);

  form.append(label, actions);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    api.setReviewerKey?.(input.value);
    onSubmit();
  });

  panel.append(form);
  return panel;
}
