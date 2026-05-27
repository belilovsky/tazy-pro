export function initMapDashboard(root = document) {
  const buttons = [...root.querySelectorAll("[data-map-layer-control]")];
  const groups = [...root.querySelectorAll("[data-map-layer-group]")];
  const summaries = [...root.querySelectorAll("[data-map-summary]")];

  if (buttons.length === 0 || groups.length === 0 || summaries.length === 0) {
    return;
  }

  let activeLayer = buttons.find((button) => button.classList.contains("active"))?.dataset.mapLayerControl || buttons[0]?.dataset.mapLayerControl;

  function render(layer) {
    activeLayer = layer;
    buttons.forEach((button) => {
      const isActive = button.dataset.mapLayerControl === layer;
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
    groups.forEach((group) => {
      group.hidden = group.dataset.mapLayerGroup !== layer;
    });
    summaries.forEach((summary) => {
      summary.hidden = summary.dataset.mapSummary !== layer;
    });
  }

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      render(button.dataset.mapLayerControl);
    });
  });

  render(activeLayer);
}
