import { canvas, startBtn, W } from "./dom.js";
import { getMusicThemeCount, initAudio, sfx, startMusic, stopMusic, unlockAudio } from "./audio.js";
import { clearInput, initInput } from "./input.js";
import { getLevelCount, getLevelDef, LEVELS } from "./level.js";
import { getMeta } from "./meta.js";
import { draw } from "./render.js";
import { SECTOR_THEMES, getSectorThemeCount } from "./sectorTheme.js";
import {
  advanceLevel,
  finalizeReplayIfDone,
  resetRun,
  updateCamera,
  updateCheckpoints,
  updateCoins,
  updateCollapse,
  updateEnemies,
  updateExit,
  updateHazards,
  updatePlayer,
} from "./simulation.js";
import {
  addRunElapsed,
  addTime,
  camera,
  hitStop,
  level,
  levelIndex,
  addReplayElapsed,
  player,
  replayDuration,
  replayElapsed,
  sampleReplayAt,
  setShakeOffset,
  setState,
  state,
  tickCrack,
  tickHitStop,
  time,
} from "./state.js";
import {
  getSectorStory,
  getSectorStoryCount,
  SECTOR_STORIES,
} from "./story.js";
import {
  announce,
  initLeaderboard,
  initMetaUi,
  initMuteControl,
  setOverlay,
  setTouchVisible,
  showPauseOverlay,
  showTitleModes,
  updateHud,
} from "./ui.js";

let transitionLocked = false;
/** @type {'normal' | 'lockdown' | 'timeAttack'} */
let pendingMode = "normal";
let pendingSector = 0;

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
  const limit = Math.min(n, themes, SECTOR_THEMES.length, LEVELS.length, SECTOR_STORIES.length);
  for (let i = 0; i < limit; i++) {
    if (LEVELS[i].id !== SECTOR_THEMES[i].id || LEVELS[i].name !== SECTOR_THEMES[i].name) {
      console.error(
        `[neon-runner] sector identity mismatch at ${i}: level=${LEVELS[i].id}/${LEVELS[i].name} theme=${SECTOR_THEMES[i].id}/${SECTOR_THEMES[i].name}`
      );
    }
    if (LEVELS[i].id !== SECTOR_STORIES[i].id || LEVELS[i].name !== SECTOR_STORIES[i].name) {
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

/**
 * @param {'normal' | 'lockdown' | 'timeAttack'} [mode]
 * @param {number} [sector]
 */
export function startGame(mode = pendingMode, sector = pendingSector) {
  if (transitionLocked) return;
  if (state !== "title" && state !== "dead" && state !== "won" && state !== "settings") return;
  if (mode === "lockdown" && !getMeta().hasCleared) {
    announce("Clear the grid once to unlock LOCKDOWN.");
    sfx.ui();
    return;
  }
  transitionLocked = true;
  try {
    clearInput();
    setState("playing");
    resetRun(true, { mode, sector });
    setOverlay(false, "NEON RUNNER", "", "JACK IN");
    setTouchVisible(true);
    const def = getLevelDef(levelIndex);
    const beat = getSectorStory(levelIndex);
    const modeLabel =
      mode === "lockdown" ? "Lockdown" : mode === "timeAttack" ? "Time trial" : "Run";
    announce(`${modeLabel} started. Sector ${def.sector}: ${def.name}. ${beat.brief}`);
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
  else if (state === "paused") resumeGame();
  else if (state === "title" || state === "dead" || state === "won" || state === "settings") {
    startGame(pendingMode, pendingSector);
  }
}

function isMenuOpen() {
  return (
    state === "title" ||
    state === "cleared" ||
    state === "dead" ||
    state === "won" ||
    state === "paused" ||
    state === "settings"
  );
}

export function pauseGame() {
  if (state !== "playing") return;
  setState("paused");
  stopMusic();
  clearInput();
  showPauseOverlay();
  setTouchVisible(false);
  sfx.ui();
}

export function resumeGame() {
  if (state !== "paused") return;
  clearInput();
  setState("playing");
  setOverlay(false, "NEON RUNNER", "", "JACK IN");
  setTouchVisible(true);
  cueGameplayAudio("continue");
}

export function abortToTitle() {
  clearInput();
  stopMusic();
  resetRun(true, { mode: "normal", sector: 0 });
  setState("title");
  updateHud();
  showTitleModes();
  setTouchVisible(false);
}

export function setPendingMode(mode, sector = 0) {
  pendingMode = mode;
  pendingSector = sector;
}

function syncReplayPose(t) {
  const sample = sampleReplayAt(t);
  if (!sample) return;
  player.x = sample.x;
  player.y = sample.y;
  player.facing = sample.facing;
  player.anim = sample.anim;
  player.frame = sample.frame;
  player.dashTimer = sample.dash ? 0.05 : 0;
}

let last = performance.now();

function frame(now) {
  const rawDt = Math.max(0, (now - last) / 1000);
  const dt = Math.min(0.033, rawDt);
  last = now;
  addTime(dt);
  tickCrack(dt);

  if (state === "replaying") {
    const t = addReplayElapsed(dt);
    syncReplayPose(Math.min(replayDuration || 2, t));
    updateCamera(dt);
    finalizeReplayIfDone(t);
  } else if (state === "playing") {
    if (hitStop > 0) {
      tickHitStop(dt);
    } else {
      addRunElapsed(rawDt);
      updatePlayer(dt);
      if (state === "playing") updateCollapse(dt);
      if (state === "playing") updateEnemies(dt);
      if (state === "playing") updateCoins(dt);
      if (state === "playing") updateHazards(dt);
      if (state === "playing") updateCheckpoints();
      if (state === "playing") updateExit();
    }
    updateCamera(dt);
  } else if (state !== "paused") {
    camera.x = (Math.sin(time * 0.15) * 0.5 + 0.5) * Math.max(0, level.width - W) * 0.2;
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
 *   touchDash?: HTMLElement | null,
 *   refreshMedia?: () => void,
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
  initMetaUi({
    onMode: (mode, sector) => {
      setPendingMode(mode, sector);
      startGame(mode, sector);
    },
    onResume: resumeGame,
    onAbort: abortToTitle,
    refreshMedia: touchEls.refreshMedia,
  });

  initInput({
    isMenuOpen,
    onStart: onOverlayAction,
    onPause: () => {
      if (state === "playing") pauseGame();
      else if (state === "paused") resumeGame();
    },
    touchLeft: touchEls.touchLeft,
    touchRight: touchEls.touchRight,
    touchJump: touchEls.touchJump,
    touchDash: touchEls.touchDash || null,
  });

  startBtn.addEventListener("click", onOverlayAction);

  resetRun(true);
  setState("title");
  updateHud();
  showTitleModes();
  setTouchVisible(false);
  requestAnimationFrame(frame);
}
