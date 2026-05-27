import { tazyApi } from "../api/tazyApi.js?v=20260528T071500Z";
import { dogProfiles } from "../data/platform.js?v=20260528T071500Z";
import {
  LANGUAGE_EVENT,
  formatCopy,
  getCopy,
  getCurrentLang,
  translateSeedText,
} from "../i18n/runtime.js?v=20260528T071500Z";
import { createAdminWorkspace } from "./admin.js?v=20260528T071500Z";
import { createDataRoomView } from "./dataRoom.js?v=20260528T071500Z";
import { createVerificationRow } from "./evidence.js?v=20260528T071500Z";

const routePrefix = "#/";
let routeRequestId = 0;

const publicRouteConfigs = {
  breeders: {
    eyebrowKey: "breeders.routeEyebrow",
    titleKey: "breeders.routeTitle",
    textKey: "breeders.routeText",
    stats: [
      { value: "3", labelKey: "breeders.routeStatTiers" },
      { value: "1", labelKey: "breeders.routeStatCode" },
      { value: "70%", labelKey: "breeders.routeStatLitters" },
    ],
    cards: [
      { labelKey: "breeders.tierOwnerLabel", titleKey: "breeders.tierOwnerTitle", textKey: "breeders.tierOwnerText" },
      { labelKey: "breeders.tierBreederLabel", titleKey: "breeders.tierBreederTitle", textKey: "breeders.tierBreederText" },
      { labelKey: "breeders.tierExpertLabel", titleKey: "breeders.tierExpertTitle", textKey: "breeders.tierExpertText" },
    ],
    panels: [
      { titleKey: "breeders.routePanelCodeTitle", textKey: "breeders.routePanelCodeText" },
      { titleKey: "breeders.routePanelLitterTitle", textKey: "breeders.routePanelLitterText" },
      { titleKey: "breeders.routePanelTrustTitle", textKey: "breeders.routePanelTrustText" },
    ],
    actions: [
      { href: "#registry", key: "breeders.routeCtaRegistry", variant: "primary-button" },
      { href: "#/fci-progress", key: "breeders.routeCtaFci", variant: "secondary-button" },
    ],
  },
  ecosystem: {
    eyebrowKey: "ecosystem.routeEyebrow",
    titleKey: "ecosystem.routeTitle",
    textKey: "ecosystem.routeText",
    stats: [
      { value: "17+3", labelKey: "ecosystem.routeStatRegions" },
      { value: "5", labelKey: "ecosystem.routeStatLayers" },
      { value: "PWA", labelKey: "ecosystem.routeStatField" },
    ],
    cards: [
      { labelKey: "ecosystem.mapLabel", titleKey: "ecosystem.mapTitle", textKey: "ecosystem.mapText" },
      { labelKey: "ecosystem.eventsLabel", titleKey: "ecosystem.eventsTitle", textKey: "ecosystem.eventsText" },
      { labelKey: "ecosystem.heritageLabel", titleKey: "ecosystem.heritageTitle", textKey: "ecosystem.heritageText" },
      { labelKey: "ecosystem.tourismLabel", titleKey: "ecosystem.tourismTitle", textKey: "ecosystem.tourismText" },
    ],
    panels: [
      { titleKey: "ecosystem.routePanelFieldTitle", textKey: "ecosystem.routePanelFieldText" },
      { titleKey: "ecosystem.routePanelQrTitle", textKey: "ecosystem.routePanelQrText" },
      { titleKey: "ecosystem.routePanelPlanningTitle", textKey: "ecosystem.routePanelPlanningText" },
    ],
    actions: [
      { href: "#registry", key: "ecosystem.routeCtaRegistry", variant: "primary-button" },
      { href: "#/heritage", key: "ecosystem.routeCtaHeritage", variant: "secondary-button" },
    ],
  },
  heritage: {
    eyebrowKey: "heritage.routeEyebrow",
    titleKey: "heritage.routeTitle",
    textKey: "heritage.routeText",
    stats: [
      { value: "3", labelKey: "heritage.routeStatLanguages" },
      { value: "EN/FR", labelKey: "heritage.routeStatIntl" },
      { value: "1", labelKey: "heritage.routeStatAmbassadors" },
    ],
    cards: [
      { labelKey: "heritage.cardArchiveLabel", titleKey: "heritage.cardArchiveTitle", textKey: "heritage.cardArchiveText" },
      { labelKey: "heritage.cardAmbassadorLabel", titleKey: "heritage.cardAmbassadorTitle", textKey: "heritage.cardAmbassadorText" },
      { labelKey: "heritage.cardProtocolLabel", titleKey: "heritage.cardProtocolTitle", textKey: "heritage.cardProtocolText" },
      { labelKey: "heritage.cardMediaLabel", titleKey: "heritage.cardMediaTitle", textKey: "heritage.cardMediaText" },
    ],
    panels: [
      { titleKey: "heritage.routePanelUnescoTitle", textKey: "heritage.routePanelUnescoText" },
      { titleKey: "heritage.routePanelImportTitle", textKey: "heritage.routePanelImportText" },
      { titleKey: "heritage.routePanelPressTitle", textKey: "heritage.routePanelPressText" },
    ],
    actions: [
      { href: "#/ecosystem", key: "heritage.routeCtaMap", variant: "primary-button" },
      { href: "#/fci-progress", key: "heritage.routeCtaFci", variant: "secondary-button" },
    ],
  },
  architecture: {
    eyebrowKey: "architecture.routeEyebrow",
    titleKey: "architecture.routeTitle",
    textKey: "architecture.routeText",
    stats: [
      { value: "4", labelKey: "architecture.routeStatLayers" },
      { value: "RBAC", labelKey: "architecture.routeStatAccess" },
      { value: "API", labelKey: "architecture.routeStatApi" },
    ],
    cards: [
      { labelKey: "architecture.coreLabel", titleKey: "architecture.coreTitle", textKey: "architecture.coreText" },
      { labelKey: "architecture.layerPublicLabel", titleKey: "architecture.layerPublicTitle", textKey: "architecture.layerPublicText" },
      { labelKey: "architecture.layerReviewLabel", titleKey: "architecture.layerReviewTitle", textKey: "architecture.layerReviewText" },
      { labelKey: "architecture.layerExportLabel", titleKey: "architecture.layerExportTitle", textKey: "architecture.layerExportText" },
    ],
    panels: [
      { titleKey: "architecture.routePanelBoundaryTitle", textKey: "architecture.routePanelBoundaryText" },
      { titleKey: "architecture.routePanelOfflineTitle", textKey: "architecture.routePanelOfflineText" },
      { titleKey: "architecture.routePanelAvdsTitle", textKey: "architecture.routePanelAvdsText" },
    ],
    actions: [
      { href: "#registry", key: "architecture.routeCtaRegistry", variant: "primary-button" },
      { href: "#/data-room", key: "architecture.routeCtaDataRoom", variant: "secondary-button" },
    ],
  },
  "fci-progress": {
    eyebrowKey: "fci.routeEyebrow",
    titleKey: "fci.routeTitle",
    textKey: "fci.routeText",
    stats: [
      { value: "2024–2034", labelKey: "fci.routeStatCycle" },
      { value: "5+", labelKey: "fci.routeStatPedigree" },
      { value: "4×", labelKey: "fci.routeStatExports" },
    ],
    cards: [
      { labelKey: "fci.routeMilestoneOneLabel", titleKey: "fci.stepOneTitle", textKey: "fci.stepOneText" },
      { labelKey: "fci.routeMilestoneTwoLabel", titleKey: "fci.stepTwoTitle", textKey: "fci.stepTwoText" },
      { labelKey: "fci.routeMilestoneThreeLabel", titleKey: "fci.stepThreeTitle", textKey: "fci.stepThreeText" },
      { labelKey: "fci.routeMilestoneFourLabel", titleKey: "fci.stepFourTitle", textKey: "fci.stepFourText" },
    ],
    panels: [
      { titleKey: "fci.publicTitle", textKey: "fci.publicText" },
      { titleKey: "fci.protectedTitle", textKey: "fci.protectedText" },
      { titleKey: "fci.routePanelReportsTitle", textKey: "fci.routePanelReportsText" },
    ],
    actions: [
      { href: "#registry", key: "fci.routeCtaRegistry", variant: "primary-button" },
      { href: "#/data-room", key: "fci.open", variant: "secondary-button" },
    ],
  },
};

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

function createRouteButton(documentRef, href, text, variant = "primary-button") {
  const link = createElement(documentRef, "a", variant, text);
  link.href = href;
  return link;
}

function createEvidencePanel(documentRef, dog) {
  const lang = getCurrentLang(documentRef);
  const panel = createElement(documentRef, "article", "route-panel");
  const title = createElement(documentRef, "h2", "", getCopy("route.evidenceStatus", lang));
  const list = createElement(documentRef, "div", "verification-list");
  list.append(...dog.steps.map((step) => createVerificationRow(documentRef, step)));
  panel.append(title, list);
  return panel;
}

function createPublicRouteView(documentRef, config) {
  const lang = getCurrentLang(documentRef);
  const t = (key) => getCopy(key, lang);
  const section = createElement(documentRef, "section", "route-shell public-route-view");
  const back = createRouteButton(documentRef, "#/", t("route.backPlatform"), "route-back");

  const header = createElement(documentRef, "article", "route-panel public-route-header");
  header.append(
    createElement(documentRef, "p", "section-label", t(config.eyebrowKey)),
    createElement(documentRef, "h1", "", t(config.titleKey)),
    createElement(documentRef, "p", "public-route-lead", t(config.textKey)),
  );

  const stats = createElement(documentRef, "div", "public-route-stat-grid");
  config.stats.forEach(({ value, labelKey }) => {
    const item = createElement(documentRef, "div");
    item.append(
      createElement(documentRef, "strong", "", value),
      createElement(documentRef, "span", "", t(labelKey)),
    );
    stats.append(item);
  });
  header.append(stats);

  const actionRow = createElement(documentRef, "div", "hero-actions");
  config.actions.forEach(({ href, key, variant }) => {
    actionRow.append(createRouteButton(documentRef, href, t(key), variant));
  });
  header.append(actionRow);

  const cardGrid = createElement(documentRef, "div", "public-route-card-grid");
  config.cards.forEach(({ labelKey, titleKey, textKey }) => {
    const card = createElement(documentRef, "article", "route-panel public-route-card");
    card.append(
      createElement(documentRef, "p", "section-label", t(labelKey)),
      createElement(documentRef, "h2", "", t(titleKey)),
      createElement(documentRef, "p", "", t(textKey)),
    );
    cardGrid.append(card);
  });

  const panelGrid = createElement(documentRef, "div", "public-route-panel-grid");
  config.panels.forEach(({ titleKey, textKey }) => {
    const panel = createElement(documentRef, "article", "route-panel public-route-panel");
    panel.append(createElement(documentRef, "h2", "", t(titleKey)), createElement(documentRef, "p", "", t(textKey)));
    panelGrid.append(panel);
  });

  section.append(back, header, cardGrid, panelGrid);
  return section;
}

function createDogProfile(documentRef, dog) {
  const lang = getCurrentLang(documentRef);
  const t = (key, values) => (values ? formatCopy(key, values, lang) : getCopy(key, lang));
  const section = createElement(documentRef, "section", "route-shell dog-profile-view");
  const back = createRouteButton(documentRef, "#registry", t("route.backRegistry"), "route-back");

  const hero = createElement(documentRef, "div", "route-hero");
  const image = createElement(documentRef, "img", "route-hero-image");
  image.src = dog.photo;
  image.alt = translateSeedText(dog.alt, lang);

  const copy = createElement(documentRef, "div", "route-hero-copy");
  copy.append(
    createElement(documentRef, "p", "section-label", t("route.publicDogProfile")),
    createElement(documentRef, "h1", "", dog.name),
    createElement(documentRef, "p", "route-meta", translateSeedText(dog.meta, lang)),
  );

  const actions = createElement(documentRef, "div", "hero-actions");
  actions.append(
    createRouteButton(documentRef, `#/passport/${dog.passportId.toLowerCase()}`, t("route.openPassport")),
    createRouteButton(documentRef, "#breeding", t("route.modelBreeding"), "secondary-button"),
  );
  copy.append(actions);

  const stats = createElement(documentRef, "div", "route-stat-grid");
  [
    [t("route.registryLabel"), dog.registryNumber],
    [t("route.completenessLabel"), dog.score],
    [t("route.verificationLabel"), translateSeedText(dog.verificationLabel, lang)],
    [t("route.passportLabel"), dog.passportId],
  ].forEach(([label, value]) => {
    const item = createElement(documentRef, "div");
    item.append(createElement(documentRef, "span", "", label), createElement(documentRef, "strong", "", value));
    stats.append(item);
  });

  hero.append(image, copy, stats);

  const grid = createElement(documentRef, "div", "route-grid");
  const summary = createElement(documentRef, "article", "route-panel");
  summary.append(
    createElement(documentRef, "h2", "", t("route.profileSummary")),
    createElement(documentRef, "p", "", translateSeedText(dog.summary, lang)),
  );

  const institution = createElement(documentRef, "article", "route-panel");
  institution.append(
    createElement(documentRef, "h2", "", t("route.registryContext")),
    createElement(documentRef, "p", "", `${t("route.registryBreeder")}: ${dog.breeder}`),
    createElement(documentRef, "p", "", `${t("route.registryKennel")}: ${dog.kennel}`),
    createElement(documentRef, "p", "", `${t("route.registryRegion")}: ${dog.region}`),
  );

  grid.append(createEvidencePanel(documentRef, dog), summary, institution);
  section.append(back, hero, grid);
  return section;
}

function createPassportView(documentRef, dog) {
  const lang = getCurrentLang(documentRef);
  const t = (key) => getCopy(key, lang);
  const section = createElement(documentRef, "section", "route-shell passport-route");
  const back = createRouteButton(documentRef, `#/dogs/${dog.id}`, t("route.backProfile"), "route-back");
  const card = createElement(documentRef, "div", "passport-card route-passport-card");

  const copy = createElement(documentRef, "div", "passport-copy");
  copy.append(
    createElement(documentRef, "p", "", t("route.digitalPassport")),
    createElement(documentRef, "h1", "", dog.name),
    createElement(documentRef, "span", "", t("route.passportIntro")),
  );

  const visual = createElement(documentRef, "div", "passport-visual");
  const header = createElement(documentRef, "div", "passport-header");
  const logo = createElement(documentRef, "div", "passport-logo", "T");
  const headerText = createElement(documentRef, "div");
  headerText.append(createElement(documentRef, "strong", "", t("passport.cardLabel")), createElement(documentRef, "span", "", dog.passportId));
  header.append(logo, headerText);

  const qr = createElement(documentRef, "div", "passport-qr");
  qr.setAttribute("aria-hidden", "true");
  for (let index = 0; index < 16; index += 1) {
    qr.append(createElement(documentRef, "span"));
  }

  const eventLog = createElement(documentRef, "ol", "event-log");
  dog.passportEvents.forEach(({ title, value }) => {
    const item = createElement(documentRef, "li");
    item.append(
      createElement(documentRef, "b", "", translateSeedText(title, lang)),
      createElement(documentRef, "span", "", translateSeedText(value, lang)),
    );
    eventLog.append(item);
  });

  visual.append(header, qr, eventLog);
  card.append(copy, visual);
  section.append(back, card);
  return section;
}

function createRouteLoading(documentRef, text = getCopy("route.loading", getCurrentLang(documentRef))) {
  const section = createElement(documentRef, "section", "route-shell");
  section.append(createElement(documentRef, "article", "route-panel", text));
  return section;
}

function createRouteError(documentRef, title, message) {
  const lang = getCurrentLang(documentRef);
  const section = createElement(documentRef, "section", "route-shell");
  const back = createRouteButton(documentRef, "#/", getCopy("route.backPlatform", lang), "route-back");
  const panel = createElement(documentRef, "article", "route-panel");
  panel.append(createElement(documentRef, "h1", "", title), createElement(documentRef, "p", "", message));
  section.append(back, panel);
  return section;
}

async function resolveRouteView(root, resource, slug) {
  const lang = getCurrentLang(root);
  if (resource === "dogs") {
    const dog = await tazyApi.getDog(slug || dogProfiles[0].id);
    return dog
      ? createDogProfile(root, dog)
      : createRouteError(root, getCopy("route.dogNotFoundTitle", lang), getCopy("route.dogNotFoundText", lang));
  }

  if (resource === "passport") {
    const dog = await tazyApi.getDogByPassport(slug || dogProfiles[0].passportId);
    return dog
      ? createPassportView(root, dog)
      : createRouteError(root, getCopy("route.passportNotFoundTitle", lang), getCopy("route.passportNotFoundText", lang));
  }

  if (resource === "admin") {
    return createAdminWorkspace(root);
  }

  if (resource === "data-room") {
    return createDataRoomView(root);
  }

  if (publicRouteConfigs[resource]) {
    return createPublicRouteView(root, publicRouteConfigs[resource]);
  }

  return null;
}

function renderRoute(root, homeView, routeView) {
  const hash = window.location.hash;
  const isAppRoute = hash.startsWith(routePrefix);
  const requestId = routeRequestId + 1;
  routeRequestId = requestId;

  if (!isAppRoute || hash === routePrefix) {
    routeView.hidden = true;
    homeView.hidden = false;
    routeView.replaceChildren();

    if (!isAppRoute && hash.length > 1) {
      const target = root.getElementById(hash.slice(1));
      window.requestAnimationFrame(() => target?.scrollIntoView());
    } else if (hash === routePrefix) {
      window.requestAnimationFrame(() => window.scrollTo({ top: 0 }));
    }
    return;
  }

  const [resource, slug] = hash.slice(routePrefix.length).split("/");
  homeView.hidden = true;
  routeView.hidden = false;
  routeView.replaceChildren(createRouteLoading(root));
  window.requestAnimationFrame(() => window.scrollTo({ top: 0 }));

  resolveRouteView(root, resource, slug)
    .then((view) => {
      if (requestId !== routeRequestId) {
        return;
      }
      if (!view) {
        window.location.hash = "#/";
        return;
      }
      routeView.replaceChildren(view);
    })
    .catch((error) => {
      if (requestId !== routeRequestId) {
        return;
      }
      routeView.replaceChildren(
        createRouteError(
          root,
          getCopy("route.unavailableTitle", getCurrentLang(root)),
          error?.message || getCopy("route.unavailableText", getCurrentLang(root)),
        ),
      );
    });
}

export function initRouter(root = document) {
  const homeView = root.querySelector("[data-home-view]");
  const routeView = root.querySelector("[data-route-view]");

  if (!homeView || !routeView) {
    return;
  }

  window.addEventListener("hashchange", () => renderRoute(root, homeView, routeView));
  root.addEventListener(LANGUAGE_EVENT, () => renderRoute(root, homeView, routeView));
  renderRoute(root, homeView, routeView);
}

export function updateDogRouteLinks(root = document, dog) {
  const profileLink = root.querySelector("[data-dog-profile-link]");
  const passportLink = root.querySelector("[data-dog-passport-link]");
  const registryNumber = root.querySelector("[data-dog-registry-number]");

  if (profileLink) {
    profileLink.href = `#/dogs/${dog.id}`;
  }
  if (passportLink) {
    passportLink.href = `#/passport/${dog.passportId.toLowerCase()}`;
  }
  if (registryNumber) {
    registryNumber.textContent = dog.registryNumber;
  }
}
