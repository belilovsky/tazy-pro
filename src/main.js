import { initBreeding } from "./ui/breeding.js?v=20260522T1040";
import { initRegistry } from "./ui/registry.js?v=20260522T1040";
import { initRouter } from "./ui/router.js?v=20260522T1040";
import { initShell } from "./ui/shell.js?v=20260522T1040";

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
