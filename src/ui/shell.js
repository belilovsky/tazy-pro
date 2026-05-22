import { heroCopy } from "../data/platform.js";

export function initShell(root = document) {
  const header = root.querySelector("[data-header]");
  const html = root.documentElement;
  const menu = root.querySelector("[data-mobile-menu]");
  const menuToggle = root.querySelector("[data-menu-toggle]");
  const themeToggle = root.querySelector("[data-theme-toggle]");

  if (header) {
    window.addEventListener("scroll", () => {
      header.classList.toggle("scrolled", window.scrollY > 18);
    });
  }

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const next = html.dataset.theme === "dark" ? "light" : "dark";
      html.dataset.theme = next;
    });
  }

  if (menu && menuToggle) {
    menuToggle.addEventListener("click", () => {
      const open = !menu.classList.contains("open");
      menu.classList.toggle("open", open);
      root.body.classList.toggle("no-scroll", open);
      menuToggle.setAttribute("aria-expanded", String(open));
    });

    menu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        menu.classList.remove("open");
        root.body.classList.remove("no-scroll");
        menuToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  root.querySelectorAll("[data-lang]").forEach((button) => {
    button.addEventListener("click", () => {
      const lang = button.dataset.lang;
      const localizedCopy = heroCopy[lang] || heroCopy.ru;

      root.querySelectorAll("[data-lang]").forEach((item) => {
        item.classList.toggle("active", item === button);
      });
      html.lang = lang === "kk" ? "kk" : lang;

      root.querySelectorAll("[data-copy]").forEach((node) => {
        const key = node.dataset.copy;
        if (localizedCopy[key]) {
          node.textContent = localizedCopy[key];
        }
      });
    });
  });
}

