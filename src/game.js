import { canvas, startBtn, W } from "./dom.js";
import { initAudio, sfx, startMusic, unlockAudio } from "./audio.js";
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
  addRunElapsed,
  addTime,
  camera,
  level,
  levelIndex,
  setShakeOffset,
  setState,
  state,
  time,
} from "./state.js";
import {
  announce,
  initLeaderboard,
  initMuteControl,
  setOverlay,
  setTouchVisible,
  updateHud,
} from "./ui.js";

let transitionLocked = false;

function cueGameplayAudio(kind) {
  startMusic(levelIndex);
  void unlockAudio().then(() => {
    if (kind === "start") sfx.start();
    else sfx.ui();
  });
}

export function startGame() {
  if (transitionLocked) return;
  if (state !== "title" && state !== "dead" && state !== "won") return;
  transitionLocked = true;
  try {
    clearInput();
    setState("playing");
    resetRun(true);
    setOverlay(false, "NEON RUNNER", "", "JACK IN");
    setTouchVisible(true);
    const def = getLevelDef(0);
    announce(`Run started. Sector ${def.sector}: ${def.name}.`);
    cueGameplayAudio("start");
  } finally {
    transitionLocked = false;
  }
}

export function continueToNextSector() {
  if (transitionLocked) return;
  if (state !== "cleared") return;
  transitionLocked = true;
  try {
    clearInput();
    // Only reachable from mid-run clears; final sector goes to "won" in updateExit.
    advanceLevel();
    setState("playing");
    setOverlay(false, "NEON RUNNER", "", "JACK IN");
    setTouchVisible(true);
    const def = getLevelDef(levelIndex);
    announce(`Uplink established. Sector ${def.sector}: ${def.name}.`);
    cueGameplayAudio("continue");
  } finally {
    transitionLocked = false;
  }
}

function onOverlayAction() {
  if (transitionLocked) return;
  if (state === "cleared") continueToNextSector();
  else if (state === "title" || state === "dead" || state === "won") startGame();
}

function isMenuOpen() {
  return state === "title" || state === "cleared" || state === "dead" || state === "won";
}

let last = performance.now();

function frame(now) {
  const rawDt = Math.max(0, (now - last) / 1000);
  const dt = Math.min(0.033, rawDt);
  last = now;
  addTime(dt);

  if (state === "playing") {
    addRunElapsed(rawDt);
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

  initAudio();
  initMuteControl();
  initLeaderboard();

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
    "Five sectors. Jack data packs (+10). Stomp drones (+20). Both raise DATA.",
    "JACK IN",
    "SECTOR 2084"
  );
  setTouchVisible(false);
  requestAnimationFrame(frame);
}
