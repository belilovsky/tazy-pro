import { tazyApi } from "../api/tazyApi.js?v=20260522T143930Z";
import { createReviewerKeyPanel, isAuthError } from "./reviewerAuth.js?v=20260522T143930Z";

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
  const grid = createElement(documentRef, "div", "route-stat-grid data-room-stats");
  metrics.forEach((metric) => {
    const item = createElement(documentRef, "div");
    item.append(
      createElement(documentRef, "span", "", metric.label),
      createElement(documentRef, "strong", "", metric.value),
      createElement(documentRef, "small", "", metric.detail),
    );
    grid.append(item);
  });
  return grid;
}

function createCoveragePanel(documentRef, coverage) {
  const panel = createElement(documentRef, "article", "route-panel data-room-panel");
  panel.append(createElement(documentRef, "h2", "", "Evidence coverage"));

  const list = createElement(documentRef, "div", "data-room-list");
  coverage.forEach((item) => {
    const row = createElement(documentRef, "div", "data-room-row");
    row.append(
      createElement(documentRef, "strong", "", item.label),
      createElement(documentRef, "span", "", `${item.approved} approved · ${item.pending} open`),
    );
    list.append(row);
  });

  panel.append(list);
  return panel;
}

function createQueuePanel(documentRef, priorityQueue) {
  const panel = createElement(documentRef, "article", "route-panel data-room-panel");
  panel.append(createElement(documentRef, "h2", "", "Open evidence"));

  const list = createElement(documentRef, "div", "data-room-list");
  priorityQueue.forEach((item) => {
    const row = createElement(documentRef, "div", "data-room-row");
    const copy = createElement(documentRef, "span");
    copy.append(createElement(documentRef, "b", "", item.title), createElement(documentRef, "small", "", `${item.dogName} · ${item.type}`));
    row.append(copy, createElement(documentRef, "em", "", `${item.priority} · ${item.status}`));
    list.append(row);
  });

  panel.append(list);
  return panel;
}

function createExportPanel(documentRef, exportPackages) {
  const panel = createElement(documentRef, "article", "route-panel data-room-panel");
  panel.append(createElement(documentRef, "h2", "", "Export packages"));

  const list = createElement(documentRef, "div", "data-room-list");
  exportPackages.forEach((item) => {
    const row = createElement(documentRef, "div", "data-room-row");
    const copy = createElement(documentRef, "span");
    copy.append(createElement(documentRef, "b", "", item.name), createElement(documentRef, "small", "", item.format));
    row.append(copy, createElement(documentRef, "em", "", item.status));
    list.append(row);
  });

  panel.append(list);
  return panel;
}

function renderDataRoom(documentRef, section, snapshot) {
  section.replaceChildren();
  const back = createElement(documentRef, "a", "route-back", "Back to platform");
  back.href = "#fci";

  const heading = createElement(documentRef, "div", "admin-heading");
  heading.append(
    createElement(documentRef, "p", "section-label", "FCI Data Room"),
    createElement(documentRef, "h1", "", "Recognition evidence package"),
    createElement(
      documentRef,
      "p",
      "",
      "A reviewer-facing snapshot of registry completeness, open evidence, and export packages for the 2024-2034 recognition cycle.",
    ),
  );

  const cycle = createElement(documentRef, "article", "route-panel data-room-cycle");
  cycle.append(
    createElement(documentRef, "span", "", snapshot.cycle.label),
    createElement(documentRef, "strong", "", snapshot.cycle.status),
    createElement(documentRef, "small", "", `Target: ${snapshot.cycle.targetYear} · generated ${new Date(snapshot.generatedAt).toLocaleDateString("en-GB")}`),
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
  section.replaceChildren(
    createElement(documentRef, "a", "route-back", "Back to platform"),
    createElement(documentRef, "article", "route-panel", "Loading FCI data room..."),
  );
  section.querySelector(".route-back").href = "#fci";
}

function renderError(documentRef, section, error) {
  const back = createElement(documentRef, "a", "route-back", "Back to platform");
  back.href = "#fci";
  const panel = createElement(documentRef, "article", "route-panel");
  panel.append(
    createElement(documentRef, "h2", "", "FCI Data Room unavailable"),
    createElement(documentRef, "p", "", error?.message || "Could not load the recognition evidence package."),
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
        const back = createElement(documentRef, "a", "route-back", "Back to platform");
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
