import { initBreeding } from "./ui/breeding.js?v=20260528T023600Z";
import { initRegistry } from "./ui/registry.js?v=20260528T023600Z";
import { initRouter } from "./ui/router.js?v=20260528T023600Z";
import { initShell } from "./ui/shell.js?v=20260528T023600Z";

function boot() {
  initShell();
  initRegistry();
  initBreeding();
  initRouter();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot, { once: true });
} else {
  boot();
}
