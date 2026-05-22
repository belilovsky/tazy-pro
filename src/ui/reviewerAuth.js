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
  const message = createElement(
    documentRef,
    "p",
    "",
    error?.message || "Sign in to load protected evidence and FCI data from the backend.",
  );
  panel.append(
    createElement(documentRef, "p", "section-label", "Protected workspace"),
    createElement(documentRef, "h2", "", "Reviewer login required"),
    message,
  );

  const form = createElement(documentRef, "form", "reviewer-key-form");
  const usernameLabel = createElement(documentRef, "label", "reviewer-key-label", "Username");
  const username = createElement(documentRef, "input", "reviewer-key-input");
  username.type = "text";
  username.name = "username";
  username.autocomplete = "username";
  username.placeholder = "Reviewer username";
  usernameLabel.append(username);

  const passwordLabel = createElement(documentRef, "label", "reviewer-key-label", "Password");
  const password = createElement(documentRef, "input", "reviewer-key-input");
  password.type = "password";
  password.name = "password";
  password.autocomplete = "current-password";
  password.placeholder = "Password";
  passwordLabel.append(password);

  const actions = createElement(documentRef, "div", "admin-actions");
  const submit = createElement(documentRef, "button", "primary-button compact", "Sign in");
  submit.type = "submit";
  const reset = createElement(documentRef, "button", "secondary-button", "Reset");
  reset.type = "reset";
  actions.append(submit, reset);

  form.append(usernameLabel, passwordLabel, actions);
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    submit.disabled = true;
    message.textContent = "Signing in...";
    try {
      await api.loginReviewer?.({ username: username.value, password: password.value });
      onSubmit();
    } catch (nextError) {
      message.textContent = nextError?.message || "Reviewer login failed.";
      password.value = "";
      password.focus();
    } finally {
      submit.disabled = false;
    }
  });

  panel.append(form);
  return panel;
}
