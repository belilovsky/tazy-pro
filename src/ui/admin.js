import { DECISION_TYPE, EVIDENCE_PRIORITY } from "../domain/contracts.js";
import { createVerificationDecision, getReviewQueue } from "../domain/readModels.js";
import { createVerificationRow } from "./evidence.js";

const decisions = new Map();

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

function createQueueButton(documentRef, item, selectedId) {
  const decision = decisions.get(item.id);
  const button = createElement(documentRef, "button", "admin-queue-button");
  button.type = "button";
  button.dataset.reviewItem = item.id;
  button.classList.toggle("active", item.id === selectedId);

  const top = createElement(documentRef, "span", "admin-queue-top");
  top.append(createElement(documentRef, "strong", "", item.label), createElement(documentRef, "small", "", item.priorityLabel));

  button.append(
    top,
    createElement(documentRef, "b", "", item.dog?.name || "Unknown dog"),
    createElement(documentRef, "small", "", decision?.decisionLabel || item.statusLabel),
  );
  return button;
}

function renderQueue(documentRef, queue, selectedId, onSelect) {
  queue.replaceChildren(
    ...getReviewQueue().map((item) => {
      const button = createQueueButton(documentRef, item, selectedId);
      button.addEventListener("click", () => onSelect(item.id));
      return button;
    }),
  );
}

function renderDetail(documentRef, detail, item, onDecision) {
  const dog = item.dog;
  const decision = decisions.get(item.id);
  const panel = createElement(documentRef, "div", "admin-detail-grid");

  const evidence = createElement(documentRef, "article", "route-panel admin-evidence-panel");
  const evidenceTop = createElement(documentRef, "div", "admin-panel-top");
  evidenceTop.append(
    createElement(documentRef, "span", "admin-pill", item.priorityLabel),
    createElement(documentRef, "span", "admin-status", decision?.decisionLabel || item.statusLabel),
  );
  evidence.append(
    evidenceTop,
    createElement(documentRef, "p", "section-label", item.label),
    createElement(documentRef, "h2", "", item.title),
    createElement(documentRef, "p", "", item.summary),
  );

  const metadata = createElement(documentRef, "div", "admin-meta-grid");
  [
    ["Dog", dog?.name || "Unknown"],
    ["Submitted by", item.submittedBy],
    ["Received", item.receivedAt],
    ["Registry", dog?.registryNumber || "Draft"],
  ].forEach(([label, value]) => {
    const row = createElement(documentRef, "div");
    row.append(createElement(documentRef, "span", "", label), createElement(documentRef, "strong", "", value));
    metadata.append(row);
  });
  evidence.append(metadata);

  const noteLabel = createElement(documentRef, "label", "admin-note-label", "Reviewer note");
  const note = createElement(documentRef, "textarea", "admin-note");
  note.rows = 4;
  note.value = item.reviewerNote;
  noteLabel.append(note);

  const actions = createElement(documentRef, "div", "admin-actions");
  [
    [DECISION_TYPE.approved, "Approve", "primary-button compact"],
    [DECISION_TYPE.changesRequested, "Request changes", "secondary-button"],
    [DECISION_TYPE.rejected, "Reject", "danger-button"],
  ].forEach(([value, label, className]) => {
    const button = createElement(documentRef, "button", className, label);
    button.type = "button";
    button.addEventListener("click", () => onDecision(item.id, value, note.value));
    actions.append(button);
  });

  const log = createElement(documentRef, "p", "admin-event-log");
  log.setAttribute("aria-live", "polite");
  log.textContent = decision
    ? `${decision.decisionLabel} · local reviewer event prepared for audit log.`
    : "No decision yet. Choose an action to prepare an audit-log event.";

  evidence.append(noteLabel, actions, log);

  const dogPanel = createElement(documentRef, "article", "route-panel admin-dog-panel");
  const image = createElement(documentRef, "img", "admin-dog-image");
  image.src = dog?.photo || "";
  image.alt = dog?.alt || "";
  const dogCopy = createElement(documentRef, "div");
  dogCopy.append(
    createElement(documentRef, "p", "section-label", "Profile impact"),
    createElement(documentRef, "h2", "", dog?.name || "Unknown dog"),
    createElement(documentRef, "p", "", dog?.summary || "No profile summary available."),
  );
  const statusList = createElement(documentRef, "div", "verification-list");
  statusList.append(...(dog?.steps || []).map((step) => createVerificationRow(documentRef, step)));
  dogPanel.append(image, dogCopy, statusList);

  panel.append(evidence, dogPanel);
  detail.replaceChildren(panel);
}

export function createAdminWorkspace(documentRef) {
  const reviewQueue = getReviewQueue();
  let selectedId = reviewQueue[0]?.id;

  const section = createElement(documentRef, "section", "route-shell admin-workspace");
  const back = createElement(documentRef, "a", "route-back", "Back to platform");
  back.href = "#/";

  const heading = createElement(documentRef, "div", "admin-heading");
  heading.append(
    createElement(documentRef, "p", "section-label", "Reviewer workspace"),
    createElement(documentRef, "h1", "", "Evidence review queue"),
    createElement(
      documentRef,
      "p",
      "",
      "Approve, reject, or request changes for registry evidence before public profile claims and FCI exports are updated.",
    ),
  );

  const stats = createElement(documentRef, "div", "route-stat-grid admin-stat-grid");
  [
    ["Queue", `${reviewQueue.length} items`],
    ["Dogs affected", `${new Set(reviewQueue.map((item) => item.dogId)).size}`],
    ["High priority", `${reviewQueue.filter((item) => item.priority === EVIDENCE_PRIORITY.high).length}`],
    ["Audit mode", "Local demo"],
  ].forEach(([label, value]) => {
    const item = createElement(documentRef, "div");
    item.append(createElement(documentRef, "span", "", label), createElement(documentRef, "strong", "", value));
    stats.append(item);
  });

  const layout = createElement(documentRef, "div", "admin-layout");
  const queuePanel = createElement(documentRef, "aside", "route-panel admin-queue-panel");
  queuePanel.append(createElement(documentRef, "h2", "", "Verification queue"));
  const queue = createElement(documentRef, "div", "admin-queue");
  queuePanel.append(queue);

  const detail = createElement(documentRef, "div", "admin-detail");
  layout.append(queuePanel, detail);

  function refresh() {
    const selected = reviewQueue.find((item) => item.id === selectedId) || reviewQueue[0];
    selectedId = selected.id;
    renderQueue(documentRef, queue, selectedId, (nextId) => {
      selectedId = nextId;
      refresh();
    });
    renderDetail(documentRef, detail, selected, (itemId, decision, note) => {
      decisions.set(itemId, createVerificationDecision({ evidenceItemId: itemId, decision, note }));
      refresh();
    });
  }

  refresh();
  section.append(back, heading, stats, layout);
  return section;
}
