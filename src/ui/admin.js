import { tazyApi } from "../api/tazyApi.js?v=20260528T004500Z";
import { DECISION_TYPE, EVIDENCE_PRIORITY } from "../domain/contracts.js?v=20260528T004500Z";
import { getCopy, getCurrentLang, translateSeedText } from "../i18n/runtime.js?v=20260528T004500Z";
import { createVerificationRow } from "./evidence.js?v=20260528T004500Z";
import { createReviewerKeyPanel, isAuthError } from "./reviewerAuth.js?v=20260528T004500Z";

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
  const lang = getCurrentLang(documentRef);
  const button = createElement(documentRef, "button", "admin-queue-button");
  button.type = "button";
  button.dataset.reviewItem = item.id;
  button.classList.toggle("active", item.id === selectedId);

  const top = createElement(documentRef, "span", "admin-queue-top");
  top.append(
    createElement(documentRef, "strong", "", translateSeedText(item.label, lang)),
    createElement(documentRef, "small", "", translateSeedText(item.priorityLabel, lang)),
  );

  button.append(
    top,
    createElement(documentRef, "b", "", item.dog?.name || t("admin.unknownDog")),
    createElement(documentRef, "small", "", translateSeedText(item.statusLabel, lang)),
  );
  return button;
}

function renderQueue(documentRef, queue, items, selectedId, onSelect) {
  queue.replaceChildren(
    ...items.map((item) => {
      const button = createQueueButton(documentRef, item, selectedId);
      button.addEventListener("click", () => onSelect(item.id));
      return button;
    }),
  );
}

function renderDetail(documentRef, detail, item, onDecision) {
  const lang = getCurrentLang(documentRef);
  const t = (key) => getCopy(key, lang);
  const dog = item.dog;
  const decision = item.currentDecision;
  const panel = createElement(documentRef, "div", "admin-detail-grid");

  const evidence = createElement(documentRef, "article", "route-panel admin-evidence-panel");
  const evidenceTop = createElement(documentRef, "div", "admin-panel-top");
  evidenceTop.append(
    createElement(documentRef, "span", "admin-pill", translateSeedText(item.priorityLabel, lang)),
    createElement(documentRef, "span", "admin-status", translateSeedText(decision?.decisionLabel || item.statusLabel, lang)),
  );
  evidence.append(
    evidenceTop,
    createElement(documentRef, "p", "section-label", translateSeedText(item.label, lang)),
    createElement(documentRef, "h2", "", translateSeedText(item.title, lang)),
    createElement(documentRef, "p", "", translateSeedText(item.summary, lang)),
  );

  const metadata = createElement(documentRef, "div", "admin-meta-grid");
  [
    [t("admin.detailDog"), dog?.name || t("admin.unknownValue")],
    [t("admin.detailSubmittedBy"), item.submittedBy],
    [t("admin.detailReceived"), item.receivedAt],
    [t("admin.detailRegistry"), dog?.registryNumber || t("admin.draftRegistry")],
  ].forEach(([label, value]) => {
    const row = createElement(documentRef, "div");
    row.append(createElement(documentRef, "span", "", label), createElement(documentRef, "strong", "", value));
    metadata.append(row);
  });
  evidence.append(metadata);

  const noteLabel = createElement(documentRef, "label", "admin-note-label", t("admin.noteLabel"));
  const note = createElement(documentRef, "textarea", "admin-note");
  note.rows = 4;
  note.value = item.reviewerNote;
  noteLabel.append(note);

  const actions = createElement(documentRef, "div", "admin-actions");
  [
    [DECISION_TYPE.approved, t("admin.actionApprove"), "primary-button compact"],
    [DECISION_TYPE.changesRequested, t("admin.actionChanges"), "secondary-button"],
    [DECISION_TYPE.rejected, t("admin.actionReject"), "danger-button"],
  ].forEach(([value, label, className]) => {
    const button = createElement(documentRef, "button", className, label);
    button.type = "button";
    button.addEventListener("click", () => onDecision(item.id, value, note.value));
    actions.append(button);
  });

  const log = createElement(documentRef, "p", "admin-event-log");
  log.setAttribute("aria-live", "polite");
  log.textContent = decision
    ? t("admin.decisionSaved")
    : t("admin.noDecision");

  evidence.append(noteLabel, actions, log);

  const dogPanel = createElement(documentRef, "article", "route-panel admin-dog-panel");
  const image = createElement(documentRef, "img", "admin-dog-image");
  image.src = dog?.photo || "";
  image.alt = translateSeedText(dog?.alt || "", lang);
  const dogCopy = createElement(documentRef, "div");
  dogCopy.append(
    createElement(documentRef, "p", "section-label", t("admin.profileImpact")),
    createElement(documentRef, "h2", "", dog?.name || t("admin.unknownDog")),
    createElement(documentRef, "p", "", translateSeedText(dog?.summary || t("admin.profileSummaryMissing"), lang)),
  );
  const statusList = createElement(documentRef, "div", "verification-list");
  statusList.append(...(dog?.steps || []).map((step) => createVerificationRow(documentRef, step)));
  dogPanel.append(image, dogCopy, statusList);

  panel.append(evidence, dogPanel);
  detail.replaceChildren(panel);
}

function renderStats(documentRef, stats, reviewQueue, api) {
  const lang = getCurrentLang(documentRef);
  stats.replaceChildren();
  [
    [getCopy("admin.queue", lang), String(reviewQueue.length)],
    [getCopy("admin.dogsAffected", lang), `${new Set(reviewQueue.map((item) => item.dogId)).size}`],
    [getCopy("admin.highPriority", lang), `${reviewQueue.filter((item) => item.priority === EVIDENCE_PRIORITY.high).length}`],
    [getCopy("admin.auditMode", lang), api.getSourceLabel?.(lang) || getCopy("source.backend", lang)],
  ].forEach(([label, value]) => {
    const item = createElement(documentRef, "div");
    item.append(createElement(documentRef, "span", "", label), createElement(documentRef, "strong", "", value));
    stats.append(item);
  });
}

function renderLoading(documentRef, queue, detail) {
  const lang = getCurrentLang(documentRef);
  queue.replaceChildren(createElement(documentRef, "p", "admin-empty", getCopy("admin.loadingQueue", lang)));
  detail.replaceChildren(createElement(documentRef, "article", "route-panel", getCopy("admin.preparing", lang)));
}

function renderError(documentRef, detail, error) {
  const lang = getCurrentLang(documentRef);
  const panel = createElement(documentRef, "article", "route-panel");
  panel.append(
    createElement(documentRef, "h2", "", getCopy("admin.unavailable", lang)),
    createElement(documentRef, "p", "", error?.message || getCopy("admin.queueLoadFailed", lang)),
  );
  detail.replaceChildren(panel);
}

export function createAdminWorkspace(documentRef, api = tazyApi) {
  const lang = getCurrentLang(documentRef);
  let reviewQueue = [];
  let selectedId;

  const section = createElement(documentRef, "section", "route-shell admin-workspace");
  const back = createElement(documentRef, "a", "route-back", getCopy("route.backPlatform", lang));
  back.href = "#/";

  const heading = createElement(documentRef, "div", "admin-heading");
  heading.append(
    createElement(documentRef, "p", "section-label", getCopy("admin.eyebrow", lang)),
    createElement(documentRef, "h1", "", getCopy("admin.title", lang)),
    createElement(documentRef, "p", "", getCopy("admin.text", lang)),
  );

  const stats = createElement(documentRef, "div", "route-stat-grid admin-stat-grid");
  renderStats(documentRef, stats, reviewQueue, api);

  const layout = createElement(documentRef, "div", "admin-layout");
  const queuePanel = createElement(documentRef, "aside", "route-panel admin-queue-panel");
  queuePanel.append(createElement(documentRef, "h2", "", getCopy("admin.queueTitle", lang)));
  const queue = createElement(documentRef, "div", "admin-queue");
  queuePanel.append(queue);

  const detail = createElement(documentRef, "div", "admin-detail");
  layout.append(queuePanel, detail);

  async function loadQueue() {
    reviewQueue = await api.listReviewQueue();
    selectedId = selectedId || reviewQueue[0]?.id;
    refresh();
  }

  function renderAuth(error) {
    queue.replaceChildren(createElement(documentRef, "p", "admin-empty", getCopy("reviewer.protected", getCurrentLang(documentRef))));
    detail.replaceChildren(createReviewerKeyPanel(documentRef, api, () => {
      renderLoading(documentRef, queue, detail);
      loadQueue().catch((nextError) => {
        if (isAuthError(nextError)) {
          renderAuth(nextError);
          return;
        }
        renderError(documentRef, detail, nextError);
      });
    }, error));
    renderStats(documentRef, stats, reviewQueue, api);
  }

  function refresh() {
    const selected = reviewQueue.find((item) => item.id === selectedId) || reviewQueue[0];
    if (!selected) {
      queue.replaceChildren(createElement(documentRef, "p", "admin-empty", getCopy("admin.emptyQueue", getCurrentLang(documentRef))));
      detail.replaceChildren(createElement(documentRef, "article", "route-panel", getCopy("admin.emptyDetail", getCurrentLang(documentRef))));
      renderStats(documentRef, stats, reviewQueue, api);
      return;
    }

    selectedId = selected.id;
    renderStats(documentRef, stats, reviewQueue, api);
    renderQueue(documentRef, queue, reviewQueue, selectedId, (nextId) => {
      selectedId = nextId;
      refresh();
    });
    renderDetail(documentRef, detail, selected, async (itemId, decision, note) => {
      try {
        await api.createVerificationDecision({ evidenceItemId: itemId, decision, note });
        await loadQueue();
      } catch (error) {
        if (isAuthError(error)) {
          renderAuth(error);
          return;
        }
        renderError(documentRef, detail, error);
      }
    });
  }

  renderLoading(documentRef, queue, detail);
  loadQueue().catch((error) => {
    if (isAuthError(error)) {
      renderAuth(error);
      return;
    }
    renderError(documentRef, detail, error);
  });
  section.append(back, heading, stats, layout);
  return section;
}
