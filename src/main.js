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
    navigator.serviceWorker.register("./sw.js").catch(() => {
      /* ignore offline registration failures */
    });
  });
}
