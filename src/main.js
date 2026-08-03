import { initDom } from "./dom.js";
import { initGame } from "./game.js";
import { initMediaFlags } from "./state.js";

initDom();
initMediaFlags();

initGame({
  touchLeft: document.getElementById("touch-left"),
  touchRight: document.getElementById("touch-right"),
  touchJump: document.getElementById("touch-jump"),
});
