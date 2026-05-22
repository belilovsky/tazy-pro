import { initBreeding } from "./ui/breeding.js";
import { initRegistry } from "./ui/registry.js";
import { initShell } from "./ui/shell.js";

function boot() {
  initShell();
  initRegistry();
  initBreeding();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot, { once: true });
} else {
  boot();
}

