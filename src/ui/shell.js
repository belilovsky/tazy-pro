import {
  LANGUAGE_EVENT,
  applyLanguage,
  localizedHref,
  resolveInitialLang,
  writeStoredLang,
} from "../i18n/runtime.js?v=20260528T023600Z";

const THEME_STORAGE_KEY = "tazy-dog.theme";
const LEGACY_THEME_STORAGE_KEY = "tazy-pro.theme";

function readStoredTheme() {
  try {
    return globalThis.localStorage?.getItem(THEME_STORAGE_KEY) || globalThis.localStorage?.getItem(LEGACY_THEME_STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

function writeStoredTheme(theme) {
  try {
    globalThis.localStorage?.setItem(THEME_STORAGE_KEY, theme);
    globalThis.localStorage?.removeItem(LEGACY_THEME_STORAGE_KEY);
  } catch {
    // Ignore storage failures in locked-down browsers.
  }
}

function resolveInitialTheme(root = document) {
  const stored = readStoredTheme();
  if (stored === "light" || stored === "dark") {
    return stored;
  }

  if (root.defaultView?.matchMedia?.("(prefers-color-scheme: light)").matches) {
    return "light";
  }

  return root.documentElement.dataset.theme === "light" ? "light" : "dark";
}

function syncThemeColor(root = document) {
  const themeMeta = root.querySelector('meta[name="theme-color"]');
  const surface = root.defaultView?.getComputedStyle(root.documentElement).getPropertyValue("--surface-base").trim();
  if (themeMeta && surface) {
    themeMeta.setAttribute("content", surface);
  }
}

function applyTheme(root = document, theme = "dark", themeToggles = []) {
  const next = theme === "light" ? "light" : "dark";
  root.documentElement.dataset.theme = next;
  writeStoredTheme(next);
  themeToggles.forEach((themeToggle) => {
    themeToggle.setAttribute("aria-pressed", String(next === "light"));
  });
  syncThemeColor(root);
}

function resolveActiveNavHref(hash) {
  if (!hash || hash === "#" || hash === "#top" || hash === "#/" || hash === "#registry" || hash.startsWith("#/dogs/") || hash.startsWith("#/passport/")) {
    return "#registry";
  }
  if (hash === "#breeders" || hash.startsWith("#/breeders")) {
    return "#/breeders";
  }
  if (hash === "#ecosystem" || hash.startsWith("#/ecosystem")) {
    return "#/ecosystem";
  }
  if (hash === "#architecture" || hash === "#avds" || hash.startsWith("#/architecture")) {
    return "#/architecture";
  }
  if (hash === "#heritage" || hash.startsWith("#/heritage")) {
    return "#/heritage";
  }
  if (hash === "#fci" || hash.startsWith("#/fci-progress") || hash.startsWith("#/data-room")) {
    return "#/fci-progress";
  }
  return "";
}

function syncNavigationState(root = document) {
  const activeHref = resolveActiveNavHref(root.defaultView?.location.hash || "");
  root.querySelectorAll(".desktop-nav a, .mobile-menu a").forEach((link) => {
    const isActive = Boolean(activeHref) && link.getAttribute("href") === activeHref;
    link.classList.toggle("active", isActive);
    if (isActive) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

function setMobileMenuState(root, menu, menuToggle, open) {
  menu.classList.toggle("open", open);
  root.body.classList.toggle("no-scroll", open);
  menuToggle.setAttribute("aria-expanded", String(open));
  menu.setAttribute("aria-hidden", String(!open));
  if (open) {
    root.defaultView?.requestAnimationFrame(() => getFocusableMenuItems(menu)[0]?.focus());
  } else if (menu.contains(root.activeElement)) {
    menuToggle.focus();
  }
}

function getFocusableMenuItems(menu) {
  return [...menu.querySelectorAll('a[href], button:not([disabled])')];
}

export function initShell(root = document) {
  const header = root.querySelector("[data-header]");
  const html = root.documentElement;
  const menu = root.querySelector("[data-mobile-menu]");
  const menuToggle = root.querySelector("[data-menu-toggle]");
  const menuClose = root.querySelector("[data-menu-close]");
  const themeToggles = [...root.querySelectorAll("[data-theme-toggle]")];
  const setScrolled = () => {
    header?.classList.toggle("scrolled", window.scrollY > 18);
  };

  if (header) {
    window.addEventListener("scroll", setScrolled);
    window.addEventListener("load", setScrolled, { once: true });
    window.addEventListener("hashchange", setScrolled);
    setScrolled();
    window.requestAnimationFrame(setScrolled);
  }

  if (themeToggles.length > 0) {
    applyTheme(root, resolveInitialTheme(root), themeToggles);
    themeToggles.forEach((themeToggle) => themeToggle.addEventListener("click", () => {
      const next = html.dataset.theme === "dark" ? "light" : "dark";
      applyTheme(root, next, themeToggles);
    }));
  } else {
    syncThemeColor(root);
  }

  if (menu && menuToggle) {
    menuToggle.addEventListener("click", () => {
      const open = !menu.classList.contains("open");
      setMobileMenuState(root, menu, menuToggle, open);
    });

    menuClose?.addEventListener("click", () => {
      setMobileMenuState(root, menu, menuToggle, false);
    });

    menu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        setMobileMenuState(root, menu, menuToggle, false);
      });
    });

    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && menu.classList.contains("open")) {
        setMobileMenuState(root, menu, menuToggle, false);
        menuToggle.focus();
      }
      if (event.key === "Tab" && menu.classList.contains("open")) {
        const focusable = getFocusableMenuItems(menu);
        if (focusable.length === 0) {
          return;
        }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && root.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && root.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    });

    root.addEventListener("click", (event) => {
      if (!menu.classList.contains("open")) {
        return;
      }
      const target = event.target;
      if (target instanceof Node && !menu.contains(target) && !menuToggle.contains(target)) {
        setMobileMenuState(root, menu, menuToggle, false);
      }
    });
  }

  root.querySelectorAll("[data-lang]").forEach((button) => {
    button.addEventListener("click", () => {
      const nextLang = button.dataset.lang;
      const nextHref = localizedHref(nextLang, window.location);
      writeStoredLang(nextLang);
      if (nextHref !== window.location.href) {
        window.location.assign(nextHref);
        return;
      }
      applyLanguage(root, nextLang);
    });
  });

  window.addEventListener("hashchange", () => syncNavigationState(root));
  root.addEventListener(LANGUAGE_EVENT, () => syncNavigationState(root));
  applyLanguage(root, resolveInitialLang(root));
  syncNavigationState(root);
}
