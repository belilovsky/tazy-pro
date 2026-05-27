import { getCopy, getCurrentLang } from "../i18n/runtime.js?v=20260527T004500Z";

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
  const lang = getCurrentLang(documentRef);
  const t = (key) => getCopy(key, lang);
  const panel = createElement(documentRef, "article", "route-panel reviewer-key-panel");
  const message = createElement(
    documentRef,
    "p",
    "",
    error?.message || t("reviewer.message"),
  );
  panel.append(
    createElement(documentRef, "p", "section-label", t("reviewer.protected")),
    createElement(documentRef, "h2", "", t("reviewer.title")),
    message,
  );

  const form = createElement(documentRef, "form", "reviewer-key-form");
  const usernameLabel = createElement(documentRef, "label", "reviewer-key-label", t("reviewer.username"));
  const username = createElement(documentRef, "input", "reviewer-key-input");
  username.type = "text";
  username.name = "username";
  username.autocomplete = "username";
  username.placeholder = t("reviewer.usernamePlaceholder");
  usernameLabel.append(username);

  const passwordLabel = createElement(documentRef, "label", "reviewer-key-label", t("reviewer.password"));
  const password = createElement(documentRef, "input", "reviewer-key-input");
  password.type = "password";
  password.name = "password";
  password.autocomplete = "current-password";
  password.placeholder = t("reviewer.passwordPlaceholder");
  passwordLabel.append(password);

  const actions = createElement(documentRef, "div", "admin-actions");
  const submit = createElement(documentRef, "button", "primary-button compact", t("reviewer.signIn"));
  submit.type = "submit";
  const reset = createElement(documentRef, "button", "secondary-button", t("reviewer.reset"));
  reset.type = "reset";
  actions.append(submit, reset);

  form.append(usernameLabel, passwordLabel, actions);
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    submit.disabled = true;
    message.textContent = t("reviewer.pending");
    try {
      await api.loginReviewer?.({ username: username.value, password: password.value });
      onSubmit();
    } catch (nextError) {
      message.textContent = nextError?.message || t("reviewer.failed");
      password.value = "";
      password.focus();
    } finally {
      submit.disabled = false;
    }
  });

  panel.append(form);
  return panel;
}
