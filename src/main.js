import { initDom } from "./dom.js";
import { initGame } from "./game.js";
import { initMediaFlags, state } from "./state.js";
import { setTouchVisible } from "./ui.js";

initDom();
const refreshMedia = initMediaFlags(() => {
  setTouchVisible(state === "playing");
});

initGame({
  touchLeft: document.getElementById("touch-left"),
  touchRight: document.getElementById("touch-right"),
  touchJump: document.getElementById("touch-jump"),
  touchDash: document.getElementById("touch-dash"),
  refreshMedia,
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    const isDemo = new URLSearchParams(location.search).has("demo");
    if (isDemo) {
      // Demos need fresh modules; skip SW so canvases aren't served stale bundles.
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => Promise.all(regs.map((r) => r.unregister())))
        .catch(() => {});
      if (window.caches) {
        caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k)))).catch(() => {});
      }
      return;
    }
    navigator.serviceWorker.register("./sw.js").catch(() => {
      /* ignore offline registration failures */
    });
  });
}
