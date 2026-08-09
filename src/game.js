import { TILE } from "./constants.js";
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
  updateProjectiles,
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
  practiceMode,
  replayDuration,
  replayElapsed,
  sampleReplayAt,
  setPracticeMode,
  setShakeOffset,
  setState,
  state,
  tickCrack,
  tickHitStop,
  time,
  setLives,
} from "./state.js";
import {
  getSectorStory,
  getSectorStoryCount,
  SECTOR_STORIES,
} from "./story.js";
import {
  announce,
  getCampaignSector,
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
let pendingPractice = false;

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
 * @param {{ practice?: boolean }} [opts]
 */
export function startGame(mode = pendingMode, sector = pendingSector, opts = {}) {
  if (transitionLocked) return;
  if (state !== "title" && state !== "dead" && state !== "won" && state !== "settings") return;
  const practice =
    !!opts.practice ||
    pendingPractice ||
    (practiceMode && (state === "dead" || state === "won"));
  if (!practice && mode === "lockdown" && !getMeta().hasCleared) {
    announce("Clear the grid once to unlock LOCKDOWN.");
    sfx.ui();
    return;
  }
  transitionLocked = true;
  try {
    clearInput();
    setState("playing");
    resetRun(true, {
      mode: practice ? "normal" : mode,
      sector: practice ? getLevelCount() - 1 : sector,
      practice,
    });
    setOverlay(false, "NEON RUNNER", "", "JACK IN");
    setTouchVisible(true);
    const def = getLevelDef(levelIndex);
    const beat = getSectorStory(levelIndex);
    if (practice) {
      announce(`Rex practice. ${beat.brief}`);
    } else {
      const modeLabel =
        mode === "lockdown" ? "Lockdown" : mode === "timeAttack" ? "Time trial" : "Run";
      announce(`${modeLabel} started. Sector ${def.sector}: ${def.name}. ${beat.brief}`);
    }
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
  else if (state === "title") {
    startGame("normal", getCampaignSector(), { practice: false });
  } else if (state === "dead" || state === "won" || state === "settings") {
    startGame(pendingMode, pendingSector, {
      practice: pendingPractice || practiceMode,
    });
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
  setPracticeMode(false);
  pendingPractice = false;
  resetRun(true, { mode: "normal", sector: 0, practice: false });
  setState("title");
  updateHud();
  showTitleModes();
  setTouchVisible(false);
}

export function setPendingMode(mode, sector = 0, practice = false) {
  pendingMode = mode;
  pendingSector = sector;
  pendingPractice = !!practice;
}

/**
 * Boot helper for recordings / QA: Needle Path, parked in the first turret's lane.
 * Open with `?demo=turret`.
 */
export function demoTurrets() {
  startGame("timeAttack", 2);
  // Share the first turret's floor pad ([16,10,3,2]); turret at tile x=17.
  player.x = 16.15 * TILE;
  player.y = 10 * TILE - player.h - 0.5;
  player.vx = 0;
  player.vy = 0;
  player.onGround = true;
  player.invuln = Infinity;
  setLives(999);
  for (const e of level.enemies) {
    if (e.turret) e.fireCd = 0.05;
  }
  camera.x = Math.max(0, Math.min(level.width - W, player.x - W * 0.45));
  camera.y = Math.max(0, Math.min(level.height - 540, player.y - 220));
  announce("TURRET DEMO — amber guns track and fire when you share their lane.");
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
      if (state === "playing") updateProjectiles(dt);
      if (state === "playing") updateCoins(dt);
      if (state === "playing") updateHazards(dt);
      if (state === "playing") updateCheckpoints();
      if (state === "playing") updateExit();
    }
    updateCamera(dt);
    updateHud();
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
    onMode: (mode, sector, practice = false) => {
      setPendingMode(mode, sector, practice);
      startGame(mode, sector, { practice });
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

  if (new URLSearchParams(location.search).get("demo") === "turret") {
    queueMicrotask(() => {
      demoTurrets();
      canvas?.focus({ preventScroll: true });
    });
  }
}
