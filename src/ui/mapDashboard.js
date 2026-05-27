import { LANGUAGE_EVENT, getCopy, getCurrentLang } from "../i18n/runtime.js?v=20260528T004500Z";
import { mapBounds, mapViewBox, qazgeoRegions } from "../data/qazgeoMap.js?v=20260528T004500Z";

const SVG_NS = "http://www.w3.org/2000/svg";
const MAP_INSET = 24;

const regionNames = {
  "KZ-AKM": { ru: "Акмолинская область", en: "Akmola Region" },
  "KZ-AKT": { ru: "Актюбинская область", en: "Aktobe Region" },
  "KZ-ALA": { ru: "Алматы", en: "Almaty" },
  "KZ-ALM": { ru: "Алматинская область", en: "Almaty Region" },
  "KZ-AST": { ru: "Астана", en: "Astana" },
  "KZ-ATY": { ru: "Атырауская область", en: "Atyrau Region" },
  "KZ-KAR": { ru: "Карагандинская область", en: "Karaganda Region" },
  "KZ-KUS": { ru: "Костанайская область", en: "Kostanay Region" },
  "KZ-KZY": { ru: "Кызылординская область", en: "Kyzylorda Region" },
  "KZ-MAN": { ru: "Мангистауская область", en: "Mangystau Region" },
  "KZ-PAV": { ru: "Павлодарская область", en: "Pavlodar Region" },
  "KZ-SEV": { ru: "Северо-Казахстанская область", en: "North Kazakhstan Region" },
  "KZ-VOS": { ru: "Восточно-Казахстанская область", en: "East Kazakhstan Region" },
  "KZ-YUZ": { ru: "Туркестанская область", en: "Turkistan Region" },
  "KZ-ZAP": { ru: "Западно-Казахстанская область", en: "West Kazakhstan Region" },
  "KZ-ZHA": { ru: "Жамбылская область", en: "Jambyl Region" },
};

const cityPoints = {
  aktau: { lon: 51.1972, lat: 43.6472 },
  aktobe: { lon: 57.1668, lat: 50.2839 },
  almaty: { lon: 76.8512, lat: 43.2220 },
  astana: { lon: 71.4460, lat: 51.1801 },
  karaganda: { lon: 73.0858, lat: 49.8028 },
  taldykorgan: { lon: 78.3733, lat: 45.0174 },
  turkistan: { lon: 68.2722, lat: 43.2972 },
  zhezkazgan: { lon: 67.7097, lat: 47.7939 },
};

const layerConfig = {
  registry: {
    activeRegions: ["KZ-AKT", "KZ-AKM", "KZ-AST", "KZ-ALM", "KZ-ALA", "KZ-YUZ"],
    routes: [
      ["aktobe", "astana", "almaty", "turkistan"],
    ],
    nodes: [
      {
        city: "aktobe",
        title: { ru: "Актобе", en: "Aktobe" },
        subtitleKey: "mapdash.nodeRegistryAktobe",
        anchor: "right",
        offsetX: 12,
        offsetY: 14,
      },
      {
        city: "astana",
        title: { ru: "Астана", en: "Astana" },
        subtitleKey: "mapdash.nodeRegistryAstana",
        anchor: "right",
        offsetX: 18,
        offsetY: -18,
      },
      {
        city: "almaty",
        title: { ru: "Алматы", en: "Almaty" },
        subtitleKey: "mapdash.nodeRegistryAlmaty",
        anchor: "left",
        offsetX: -18,
        offsetY: -10,
        primary: true,
      },
      {
        city: "turkistan",
        title: { ru: "Туркестан", en: "Turkistan" },
        subtitleKey: "mapdash.nodeRegistryTurkistan",
        anchor: "right",
        offsetX: 16,
        offsetY: 18,
      },
    ],
  },
  field: {
    activeRegions: ["KZ-ATY", "KZ-KAR", "KZ-MAN", "KZ-ALM"],
    routes: [
      ["aktau", "karaganda", "taldykorgan"],
    ],
    nodes: [
      {
        city: "aktau",
        title: { ru: "Мангистау", en: "Mangystau" },
        subtitleKey: "mapdash.nodeFieldMangystau",
        anchor: "right",
        offsetX: 10,
        offsetY: -18,
      },
      {
        city: "karaganda",
        title: { ru: "Сарыарка", en: "Saryarka" },
        subtitleKey: "mapdash.nodeFieldSaryarka",
        anchor: "left",
        offsetX: -18,
        offsetY: 18,
      },
      {
        city: "taldykorgan",
        title: { ru: "Жетысу", en: "Zhetysu" },
        subtitleKey: "mapdash.nodeFieldZhetysu",
        anchor: "left",
        offsetX: -14,
        offsetY: -16,
        primary: true,
      },
    ],
  },
  heritage: {
    activeRegions: ["KZ-AST", "KZ-KAR", "KZ-ALA", "KZ-YUZ"],
    routes: [
      ["zhezkazgan", "turkistan", "almaty"],
    ],
    nodes: [
      {
        city: "zhezkazgan",
        title: { ru: "Улытау", en: "Ulytau" },
        subtitleKey: "mapdash.nodeHeritageUlytau",
        anchor: "right",
        offsetX: 16,
        offsetY: -14,
        primary: true,
      },
      {
        city: "turkistan",
        title: { ru: "Туркестан", en: "Turkistan" },
        subtitleKey: "mapdash.nodeHeritageTurkistan",
        anchor: "right",
        offsetX: 16,
        offsetY: 12,
      },
      {
        city: "almaty",
        title: { ru: "Алматы", en: "Almaty" },
        subtitleKey: "mapdash.nodeHeritageAlmaty",
        anchor: "left",
        offsetX: -16,
        offsetY: -26,
      },
    ],
  },
};

function projectPoint(lon, lat) {
  const scale = Math.min(
    (mapViewBox.width - MAP_INSET * 2) / (mapBounds.maxLon - mapBounds.minLon),
    (mapViewBox.height - MAP_INSET * 2) / (mapBounds.maxLat - mapBounds.minLat),
  );

  return {
    x: (lon - mapBounds.minLon) * scale + MAP_INSET,
    y: (mapBounds.maxLat - lat) * scale + MAP_INSET,
  };
}

function nodePoint(node) {
  const point = cityPoints[node.city];
  return projectPoint(point.lon, point.lat);
}

function pathForRoute(stops) {
  return stops
    .map((stop, index) => {
      const point = cityPoints[stop];
      const { x, y } = projectPoint(point.lon, point.lat);
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

function regionTitle(regionCode, lang) {
  const label = regionNames[regionCode];
  if (!label) {
    return regionCode;
  }
  return label[lang] || label.ru;
}

function buildBaseMap(svg, lang) {
  svg.textContent = "";
  svg.dataset.activeLayer = "registry";

  const regionsGroup = document.createElementNS(SVG_NS, "g");
  regionsGroup.classList.add("kz-region-layer");

  qazgeoRegions.forEach((region) => {
    const path = document.createElementNS(SVG_NS, "path");
    path.classList.add("kz-region");
    path.dataset.regionCode = region.code;
    path.setAttribute("d", region.d);
    path.setAttribute("vector-effect", "non-scaling-stroke");

    const title = document.createElementNS(SVG_NS, "title");
    title.textContent = regionTitle(region.code, lang);
    path.append(title);
    regionsGroup.append(path);
  });

  svg.append(regionsGroup);

  Object.entries(layerConfig).forEach(([layer, config]) => {
    const routeGroup = document.createElementNS(SVG_NS, "g");
    routeGroup.classList.add("map-route-group", `map-route-group-${layer}`);
    routeGroup.dataset.mapGeoLayer = layer;
    routeGroup.hidden = layer !== "registry";

    config.routes.forEach((route) => {
      const routePath = document.createElementNS(SVG_NS, "path");
      routePath.classList.add("map-route");
      routePath.setAttribute("d", pathForRoute(route));
      routePath.setAttribute("vector-effect", "non-scaling-stroke");
      routeGroup.append(routePath);
    });

    svg.append(routeGroup);
  });
}

function renderLayerNodes(group, layer, lang) {
  group.replaceChildren();

  layerConfig[layer].nodes.forEach((node) => {
    const point = nodePoint(node);
    const card = document.createElement("span");
    card.className = `map-node${node.primary ? " map-node-primary" : ""}`;
    card.dataset.anchor = node.anchor;
    card.style.setProperty("--x", `${((point.x / mapViewBox.width) * 100).toFixed(2)}%`);
    card.style.setProperty("--y", `${((point.y / mapViewBox.height) * 100).toFixed(2)}%`);
    card.style.setProperty("--shift-x", `${node.offsetX || 0}px`);
    card.style.setProperty("--shift-y", `${node.offsetY || 0}px`);

    const title = document.createElement("b");
    title.textContent = node.title[lang] || node.title.ru;
    card.append(title);

    const subtitle = document.createElement("small");
    subtitle.textContent = getCopy(node.subtitleKey, lang);
    card.append(subtitle);

    group.append(card);
  });
}

function renderNodeLayers(groups, lang) {
  groups.forEach((group) => {
    renderLayerNodes(group, group.dataset.mapLayerGroup, lang);
  });
}

function updateRegionLabels(svg, lang) {
  svg.querySelectorAll(".kz-region").forEach((path) => {
    const title = path.querySelector("title");
    if (title) {
      title.textContent = regionTitle(path.dataset.regionCode, lang);
    }
  });
}

function applyActiveLayer(svg, layer) {
  svg.dataset.activeLayer = layer;
  const activeRegions = new Set(layerConfig[layer]?.activeRegions || []);

  svg.querySelectorAll(".kz-region").forEach((path) => {
    path.classList.toggle("is-active", activeRegions.has(path.dataset.regionCode));
  });

  svg.querySelectorAll("[data-map-geo-layer]").forEach((group) => {
    group.hidden = group.dataset.mapGeoLayer !== layer;
  });
}

export function initMapDashboard(root = document) {
  const dashboard = root.querySelector(".map-dashboard");
  const buttons = [...root.querySelectorAll("[data-map-layer-control]")];
  const groups = [...root.querySelectorAll("[data-map-layer-group]")];
  const summaries = [...root.querySelectorAll("[data-map-summary]")];
  const svg = root.querySelector("[data-map-svg]");

  if (!dashboard || !svg || buttons.length === 0 || groups.length === 0 || summaries.length === 0) {
    return;
  }

  let activeLayer = buttons.find((button) => button.classList.contains("active"))?.dataset.mapLayerControl || buttons[0]?.dataset.mapLayerControl || "registry";

  const render = (layer) => {
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
    applyActiveLayer(svg, layer);
  };

  buildBaseMap(svg, getCurrentLang(root));
  renderNodeLayers(groups, getCurrentLang(root));

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      render(button.dataset.mapLayerControl);
    });
  });

  root.addEventListener(LANGUAGE_EVENT, (event) => {
    const lang = event.detail?.lang || getCurrentLang(root);
    updateRegionLabels(svg, lang);
    renderNodeLayers(groups, lang);
    render(activeLayer);
  });

  render(activeLayer);
}
