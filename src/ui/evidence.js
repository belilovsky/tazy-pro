export function createVerificationRow(documentRef, [label, status, state]) {
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

