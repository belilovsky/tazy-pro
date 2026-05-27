import { initBreeding } from "./ui/breeding.js?v=20260527T004500Z";
import { initRegistry } from "./ui/registry.js?v=20260527T004500Z";
import { initRouter } from "./ui/router.js?v=20260527T004500Z";
import { initShell } from "./ui/shell.js?v=20260527T004500Z";

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
