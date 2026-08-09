import { canvas, startBtn, W } from "./dom.js";
import { getMusicThemeCount, initAudio, sfx, startMusic, unlockAudio } from "./audio.js";
import { clearInput, initInput } from "./input.js";
import { getLevelCount, getLevelDef, LEVELS } from "./level.js";
import { draw } from "./render.js";
import { SECTOR_THEMES, getSectorThemeCount } from "./sectorTheme.js";
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
  getSectorStory,
  getSectorStoryCount,
  SECTOR_STORIES,
  TITLE_STORY,
} from "./story.js";
import {
  announce,
  initLeaderboard,
  initMuteControl,
  setOverlay,
  setTouchVisible,
  updateHud,
} from "./ui.js";

let transitionLocked = false;

/** Catch silent drift between level defs, backdrop themes, music, and story beats. */
function assertSectorTables() {
  const n = getLevelCount();
  const themes = getSectorThemeCount();
  const music = getMusicThemeCount();
  const stories = getSectorStoryCount();
  if (themes !== n || music !== n || stories !== n) {
    console.error(
      `[neon-runner] sector table length mismatch: levels=${n} sectorThemes=${themes} music=${music} stories=${stories}`
    );
  }
  const limit = Math.min(
    n,
    themes,
    SECTOR_THEMES.length,
    LEVELS.length,
    SECTOR_STORIES.length
  );
  for (let i = 0; i < limit; i++) {
    if (LEVELS[i].id !== SECTOR_THEMES[i].id || LEVELS[i].name !== SECTOR_THEMES[i].name) {
      console.error(
        `[neon-runner] sector identity mismatch at ${i}: level=${LEVELS[i].id}/${LEVELS[i].name} theme=${SECTOR_THEMES[i].id}/${SECTOR_THEMES[i].name}`
      );
    }
    if (
      LEVELS[i].id !== SECTOR_STORIES[i].id ||
      LEVELS[i].name !== SECTOR_STORIES[i].name
    ) {
      console.error(
        `[neon-runner] sector story mismatch at ${i}: level=${LEVELS[i].id}/${LEVELS[i].name} story=${SECTOR_STORIES[i].id}/${SECTOR_STORIES[i].name}`
      );
    }
  }
}

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
    const beat = getSectorStory(0);
    announce(`Run started. Sector ${def.sector}: ${def.name}. ${beat.brief}`);
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
    const beat = getSectorStory(levelIndex);
    announce(`Uplink established. Sector ${def.sector}: ${def.name}. ${beat.brief}`);
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

  assertSectorTables();
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
    TITLE_STORY.title,
    TITLE_STORY.tagline,
    TITLE_STORY.button,
    TITLE_STORY.eyebrow
  );
  setTouchVisible(false);
  requestAnimationFrame(frame);
}
