import { initBreeding } from "./ui/breeding.js?v=20260527T212801Z";
import { initMapDashboard } from "./ui/mapDashboard.js?v=20260527T212801Z";
import { initRegistry } from "./ui/registry.js?v=20260527T212801Z";
import { initRouter } from "./ui/router.js?v=20260527T212801Z";
import { initShell } from "./ui/shell.js?v=20260527T212801Z";

function boot() {
  initShell();
  initMapDashboard();
  initRegistry();
  initBreeding();
  initRouter();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot, { once: true });
} else {
  boot();
}
