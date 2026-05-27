import { initBreeding } from "./ui/breeding.js?v=20260527T111000Z";
import { initRegistry } from "./ui/registry.js?v=20260527T111000Z";
import { initRouter } from "./ui/router.js?v=20260527T111000Z";
import { initShell } from "./ui/shell.js?v=20260527T111000Z";

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
