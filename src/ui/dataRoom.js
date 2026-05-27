import { tazyApi } from "../api/tazyApi.js?v=20260528T051500Z";
import { formatCopy, getCopy, getCurrentLang, translateSeedText } from "../i18n/runtime.js?v=20260528T051500Z";
import { createReviewerKeyPanel, isAuthError } from "./reviewerAuth.js?v=20260528T051500Z";

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

function createMetricGrid(documentRef, metrics) {
  const lang = getCurrentLang(documentRef);
  const grid = createElement(documentRef, "div", "route-stat-grid data-room-stats");
  metrics.forEach((metric) => {
    const item = createElement(documentRef, "div");
    item.append(
      createElement(documentRef, "span", "", translateSeedText(metric.label, lang)),
      createElement(documentRef, "strong", "", metric.value),
      createElement(documentRef, "small", "", translateSeedText(metric.detail, lang)),
    );
    grid.append(item);
  });
  return grid;
}

function createCoveragePanel(documentRef, coverage) {
  const lang = getCurrentLang(documentRef);
  const panel = createElement(documentRef, "article", "route-panel data-room-panel");
  panel.append(createElement(documentRef, "h2", "", getCopy("dataRoom.coverage", lang)));

  const list = createElement(documentRef, "div", "data-room-list");
  coverage.forEach((item) => {
    const row = createElement(documentRef, "div", "data-room-row");
    row.append(
      createElement(documentRef, "strong", "", translateSeedText(item.label, lang)),
      createElement(documentRef, "span", "", formatCopy("dataRoom.coverageSummary", { approved: item.approved, pending: item.pending }, lang)),
    );
    list.append(row);
  });

  panel.append(list);
  return panel;
}

function createQueuePanel(documentRef, priorityQueue) {
  const lang = getCurrentLang(documentRef);
  const panel = createElement(documentRef, "article", "route-panel data-room-panel");
  panel.append(createElement(documentRef, "h2", "", getCopy("dataRoom.openEvidence", lang)));

  const list = createElement(documentRef, "div", "data-room-list");
  priorityQueue.forEach((item) => {
    const row = createElement(documentRef, "div", "data-room-row");
    const copy = createElement(documentRef, "span");
    copy.append(
      createElement(documentRef, "b", "", translateSeedText(item.title, lang)),
      createElement(documentRef, "small", "", `${translateSeedText(item.dogName, lang)} · ${translateSeedText(item.type, lang)}`),
    );
    row.append(copy, createElement(documentRef, "em", "", `${translateSeedText(item.priority, lang)} · ${translateSeedText(item.status, lang)}`));
    list.append(row);
  });

  panel.append(list);
  return panel;
}

function createExportPanel(documentRef, exportPackages) {
  const lang = getCurrentLang(documentRef);
  const panel = createElement(documentRef, "article", "route-panel data-room-panel");
  panel.append(createElement(documentRef, "h2", "", getCopy("dataRoom.exportPackages", lang)));

  const list = createElement(documentRef, "div", "data-room-list");
  exportPackages.forEach((item) => {
    const row = createElement(documentRef, "div", "data-room-row");
    const copy = createElement(documentRef, "span");
    copy.append(
      createElement(documentRef, "b", "", translateSeedText(item.name, lang)),
      createElement(documentRef, "small", "", translateSeedText(item.format, lang)),
    );
    row.append(copy, createElement(documentRef, "em", "", translateSeedText(item.status, lang)));
    list.append(row);
  });

  panel.append(list);
  return panel;
}

function renderDataRoom(documentRef, section, snapshot) {
  const lang = getCurrentLang(documentRef);
  section.replaceChildren();
  const back = createElement(documentRef, "a", "route-back", getCopy("route.backPlatform", lang));
  back.href = "#fci";

  const heading = createElement(documentRef, "div", "admin-heading");
  heading.append(
    createElement(documentRef, "p", "section-label", getCopy("dataRoom.eyebrow", lang)),
    createElement(documentRef, "h1", "", getCopy("dataRoom.title", lang)),
    createElement(documentRef, "p", "", getCopy("dataRoom.text", lang)),
  );

  const cycle = createElement(documentRef, "article", "route-panel data-room-cycle");
  cycle.append(
    createElement(documentRef, "span", "", translateSeedText(snapshot.cycle.label, lang)),
    createElement(documentRef, "strong", "", translateSeedText(snapshot.cycle.status, lang)),
    createElement(
      documentRef,
      "small",
      "",
      formatCopy(
        "dataRoom.targetGenerated",
        { target: snapshot.cycle.targetYear, date: new Date(snapshot.generatedAt).toLocaleDateString(lang === "en" ? "en-GB" : lang === "kk" ? "kk-KZ" : "ru-RU") },
        lang,
      ),
    ),
  );

  const grid = createElement(documentRef, "div", "data-room-grid");
  grid.append(
    createCoveragePanel(documentRef, snapshot.coverage),
    createQueuePanel(documentRef, snapshot.priorityQueue),
    createExportPanel(documentRef, snapshot.exportPackages),
  );

  section.append(back, heading, cycle, createMetricGrid(documentRef, snapshot.metrics), grid);
}

function renderLoading(documentRef, section) {
  const lang = getCurrentLang(documentRef);
  section.replaceChildren(
    createElement(documentRef, "a", "route-back", getCopy("route.backPlatform", lang)),
    createElement(documentRef, "article", "route-panel", getCopy("dataRoom.loading", lang)),
  );
  section.querySelector(".route-back").href = "#fci";
}

function renderError(documentRef, section, error) {
  const lang = getCurrentLang(documentRef);
  const back = createElement(documentRef, "a", "route-back", getCopy("route.backPlatform", lang));
  back.href = "#fci";
  const panel = createElement(documentRef, "article", "route-panel");
  panel.append(
    createElement(documentRef, "h2", "", getCopy("dataRoom.unavailable", lang)),
    createElement(documentRef, "p", "", error?.message || getCopy("dataRoom.loadFailed", lang)),
  );
  section.replaceChildren(back, panel);
}

export function createDataRoomView(documentRef, api = tazyApi) {
  const section = createElement(documentRef, "section", "route-shell data-room-view");

  async function loadSnapshot() {
    renderLoading(documentRef, section);
    try {
      renderDataRoom(documentRef, section, await api.getFciDataRoomSnapshot());
    } catch (error) {
      if (isAuthError(error)) {
        const back = createElement(documentRef, "a", "route-back", getCopy("route.backPlatform", getCurrentLang(documentRef)));
        back.href = "#fci";
        section.replaceChildren(back, createReviewerKeyPanel(documentRef, api, loadSnapshot, error));
        return;
      }
      renderError(documentRef, section, error);
    }
  }

  loadSnapshot();
  return section;
}
