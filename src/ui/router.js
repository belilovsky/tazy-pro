import { dogProfiles, getDogById, getDogByPassportId } from "../data/platform.js";
import { createVerificationRow } from "./evidence.js";

const routePrefix = "#/";

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
  const panel = createElement(documentRef, "article", "route-panel");
  const title = createElement(documentRef, "h2", "", "Evidence status");
  const list = createElement(documentRef, "div", "verification-list");
  list.append(...dog.steps.map((step) => createVerificationRow(documentRef, step)));
  panel.append(title, list);
  return panel;
}

function createDogProfile(documentRef, dog) {
  const section = createElement(documentRef, "section", "route-shell dog-profile-view");
  const back = createRouteButton(documentRef, "#registry", "Back to registry", "route-back");

  const hero = createElement(documentRef, "div", "route-hero");
  const image = createElement(documentRef, "img", "route-hero-image");
  image.src = dog.photo;
  image.alt = dog.alt;

  const copy = createElement(documentRef, "div", "route-hero-copy");
  copy.append(
    createElement(documentRef, "p", "section-label", "Public dog profile"),
    createElement(documentRef, "h1", "", dog.name),
    createElement(documentRef, "p", "route-meta", dog.meta),
  );

  const actions = createElement(documentRef, "div", "hero-actions");
  actions.append(
    createRouteButton(documentRef, `#/passport/${dog.passportId.toLowerCase()}`, "Open passport"),
    createRouteButton(documentRef, "#breeding", "Model breeding", "secondary-button"),
  );
  copy.append(actions);

  const stats = createElement(documentRef, "div", "route-stat-grid");
  [
    ["Registry", dog.registryNumber],
    ["Completeness", dog.score],
    ["Verification", dog.verificationLevel],
    ["Passport", dog.passportId],
  ].forEach(([label, value]) => {
    const item = createElement(documentRef, "div");
    item.append(createElement(documentRef, "span", "", label), createElement(documentRef, "strong", "", value));
    stats.append(item);
  });

  hero.append(image, copy, stats);

  const grid = createElement(documentRef, "div", "route-grid");
  const summary = createElement(documentRef, "article", "route-panel");
  summary.append(createElement(documentRef, "h2", "", "Profile summary"), createElement(documentRef, "p", "", dog.summary));

  const institution = createElement(documentRef, "article", "route-panel");
  institution.append(
    createElement(documentRef, "h2", "", "Registry context"),
    createElement(documentRef, "p", "", `Breeder: ${dog.breeder}`),
    createElement(documentRef, "p", "", `Kennel: ${dog.kennel}`),
    createElement(documentRef, "p", "", `Region: ${dog.region}`),
  );

  grid.append(createEvidencePanel(documentRef, dog), summary, institution);
  section.append(back, hero, grid);
  return section;
}

function createPassportView(documentRef, dog) {
  const section = createElement(documentRef, "section", "route-shell passport-route");
  const back = createRouteButton(documentRef, `#/dogs/${dog.id}`, "Back to profile", "route-back");
  const card = createElement(documentRef, "div", "passport-card route-passport-card");

  const copy = createElement(documentRef, "div", "passport-copy");
  copy.append(
    createElement(documentRef, "p", "", "Digital passport"),
    createElement(documentRef, "h1", "", dog.name),
    createElement(
      documentRef,
      "span",
      "",
      "Verified public passport for event checks, diplomacy, breeder trust, and international data review.",
    ),
  );

  const visual = createElement(documentRef, "div", "passport-visual");
  const header = createElement(documentRef, "div", "passport-header");
  const logo = createElement(documentRef, "div", "passport-logo", "T");
  const headerText = createElement(documentRef, "div");
  headerText.append(createElement(documentRef, "strong", "", "TAZY DIGITAL PASSPORT"), createElement(documentRef, "span", "", dog.passportId));
  header.append(logo, headerText);

  const qr = createElement(documentRef, "div", "passport-qr");
  qr.setAttribute("aria-hidden", "true");
  for (let index = 0; index < 16; index += 1) {
    qr.append(createElement(documentRef, "span"));
  }

  const eventLog = createElement(documentRef, "ol", "event-log");
  dog.passportEvents.forEach(([title, value]) => {
    const item = createElement(documentRef, "li");
    item.append(createElement(documentRef, "b", "", title), createElement(documentRef, "span", "", value));
    eventLog.append(item);
  });

  visual.append(header, qr, eventLog);
  card.append(copy, visual);
  section.append(back, card);
  return section;
}

function renderRoute(root, homeView, routeView) {
  const hash = window.location.hash;
  const isAppRoute = hash.startsWith(routePrefix);

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
  let view = null;

  if (resource === "dogs") {
    view = createDogProfile(root, getDogById(slug) || dogProfiles[0]);
  }

  if (resource === "passport") {
    view = createPassportView(root, getDogByPassportId(slug) || dogProfiles[0]);
  }

  if (!view) {
    window.location.hash = "#/";
    return;
  }

  homeView.hidden = true;
  routeView.hidden = false;
  routeView.replaceChildren(view);
  window.requestAnimationFrame(() => window.scrollTo({ top: 0 }));
}

export function initRouter(root = document) {
  const homeView = root.querySelector("[data-home-view]");
  const routeView = root.querySelector("[data-route-view]");

  if (!homeView || !routeView) {
    return;
  }

  window.addEventListener("hashchange", () => renderRoute(root, homeView, routeView));
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
