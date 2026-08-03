import { canvas, startBtn, W } from "./dom.js";
import { clearInput, initInput } from "./input.js";
import { getLevelDef } from "./level.js";
import { draw } from "./render.js";
import {
  advanceLevel,
  resetRun,
  updateCamera,
  updateCoins,
  updateEnemies,
  updateExit,
  updateHazards,
  updatePlayer,
} from "./simulation.js";
import {
  addTime,
  camera,
  level,
  levelIndex,
  score,
  setShakeOffset,
  setState,
  state,
  time,
} from "./state.js";
import { announce, setOverlay, setTouchVisible, updateHud } from "./ui.js";

export function startGame() {
  clearInput();
  resetRun(true);
  setState("playing");
  const def = getLevelDef(0);
  setOverlay(false, "NEON RUNNER", "", "JACK IN");
  setTouchVisible(true);
  announce(`Run started. Sector ${def.sector}: ${def.name}.`);
}

export function continueToNextSector() {
  clearInput();
  if (!advanceLevel()) {
    setState("won");
    setOverlay(
      true,
      "JACKPOT",
      `All sectors cleared. You jacked ${String(score).padStart(3, "0")} data packs.`,
      "RUN AGAIN",
      `SECTOR ${level.sector}`
    );
    return;
  }
  setState("playing");
  setOverlay(false, "NEON RUNNER", "", "JACK IN");
  setTouchVisible(true);
  const def = getLevelDef(levelIndex);
  announce(`Uplink established. Sector ${def.sector}: ${def.name}.`);
}

function onOverlayAction() {
  if (state === "cleared") continueToNextSector();
  else if (state === "title" || state === "dead" || state === "won") startGame();
}

function isMenuOpen() {
  return state === "title" || state === "cleared" || state === "dead" || state === "won";
}

let last = performance.now();

function frame(now) {
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;
  addTime(dt);

  if (state === "playing") {
    updatePlayer(dt);
    if (state === "playing") updateEnemies(dt);
    if (state === "playing") updateCoins(dt);
    if (state === "playing") updateHazards();
    if (state === "playing") updateExit();
    if (state === "playing") updateCamera(dt);
  } else {
    camera.x = (Math.sin(time * 0.15) * 0.5 + 0.5) * (level.width - W) * 0.2;
    camera.y = 40;
    setShakeOffset(0, 0);
  }

  draw();
  requestAnimationFrame(frame);
}

/**
 * @param {{
 *   touchLeft: HTMLElement | null,
 *   touchRight: HTMLElement | null,
 *   touchJump: HTMLElement | null,
 * }} touchEls
 */
export function initGame(touchEls) {
  if (canvas && !canvas.hasAttribute("tabindex")) {
    canvas.tabIndex = -1;
  }

  initInput({
    isMenuOpen,
    onStart: onOverlayAction,
    touchLeft: touchEls.touchLeft,
    touchRight: touchEls.touchRight,
    touchJump: touchEls.touchJump,
  });

  startBtn.addEventListener("click", onOverlayAction);

  resetRun(true);
  setState("title");
  updateHud();
  setOverlay(
    true,
    "NEON RUNNER",
    `Five sectors. Sprint the grid. Stomp the drones. Jack every exit.`,
    "JACK IN",
    "SECTOR 2084"
  );
  setTouchVisible(false);
  requestAnimationFrame(frame);
}
