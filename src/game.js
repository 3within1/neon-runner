import {
  canvas,
  startBtn,
  practiceBtn,
  resumeBtn,
  restartBtn,
  quitBtn,
  touchPauseBtn,
  W,
} from "./dom.js";
import {
  getMusicThemeCount,
  initAudio,
  sfx,
  startMusic,
  stopMusic,
  toggleMute,
  unlockAudio,
} from "./audio.js";
import { clearInput, initInput } from "./input.js";
import { getLevelCount, getLevelDef, LEVELS } from "./level.js";
import { draw } from "./render.js";
import { SECTOR_THEMES, getSectorThemeCount } from "./sectorTheme.js";
import {
  advanceLevel,
  resetRun,
  updateBossFanfare,
  updateCamera,
  updateCheckpoints,
  updateCoins,
  updateEnemies,
  updateExit,
  updateHazards,
  updatePlayer,
  updatePowerups,
  updateProjectiles,
  updateShockwaves,
} from "./simulation.js";
import {
  addRunElapsed,
  addTime,
  camera,
  level,
  levelIndex,
  practiceMode,
  setPracticeMode,
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
  initSectorSelect,
  setOverlay,
  setTouchVisible,
  syncBestClear,
  syncMuteButton,
  updateHud,
} from "./ui.js";

let transitionLocked = false;

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

/**
 * @param {{ startIndex?: number, practice?: boolean }} [opts]
 */
export function startGame(opts = {}) {
  if (transitionLocked) return;
  if (
    state !== "title" &&
    state !== "dead" &&
    state !== "won" &&
    state !== "paused"
  ) {
    return;
  }
  transitionLocked = true;
  try {
    clearInput();
    const practice = !!opts.practice || (practiceMode && (state === "dead" || state === "won"));
    const startIndex = practice
      ? getLevelCount() - 1
      : Math.max(0, opts.startIndex ?? 0);
    setState("playing");
    resetRun(true, { startIndex, practice });
    setOverlay(false, "NEON RUNNER", "", "JACK IN");
    setTouchVisible(true);
    const def = getLevelDef(levelIndex);
    const beat = getSectorStory(levelIndex);
    announce(
      practice
        ? `Rex practice. ${beat.brief}`
        : `Run started. Sector ${def.sector}: ${def.name}. ${beat.brief}`
    );
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

export function pauseGame() {
  if (state !== "playing") return;
  clearInput();
  setState("paused");
  sfx.pause();
  setOverlay(true, "PAUSED", "Grid frozen. Resume, restart, or quit.", "RESUME", "SYSTEM HOLD");
  announce("Paused.");
}

export function resumeGame() {
  if (state !== "paused") return;
  clearInput();
  setState("playing");
  setOverlay(false, "NEON RUNNER", "", "JACK IN");
  setTouchVisible(true);
  announce("Resumed.");
  sfx.ui();
}

export function quitToTitle() {
  if (transitionLocked) return;
  transitionLocked = true;
  try {
    clearInput();
    stopMusic();
    setPracticeMode(false);
    resetRun(true, { startIndex: 0, practice: false });
    setState("title");
    updateHud();
    syncBestClear();
    setOverlay(
      true,
      TITLE_STORY.title,
      TITLE_STORY.tagline,
      TITLE_STORY.button,
      TITLE_STORY.eyebrow
    );
    setTouchVisible(false);
    announce("Returned to title.");
    sfx.ui();
  } finally {
    transitionLocked = false;
  }
}

function onOverlayAction() {
  if (transitionLocked) return;
  if (state === "cleared") continueToNextSector();
  else if (state === "paused") resumeGame();
  else if (state === "title" || state === "dead" || state === "won") startGame();
}

function isMenuOpen() {
  return (
    state === "title" ||
    state === "cleared" ||
    state === "dead" ||
    state === "won" ||
    state === "paused"
  );
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
    if (state === "playing") updateProjectiles(dt);
    if (state === "playing") updateShockwaves(dt);
    if (state === "playing") updateCoins(dt);
    if (state === "playing") updatePowerups(dt);
    if (state === "playing") updateCheckpoints();
    if (state === "playing") updateHazards(dt);
    if (state === "playing") updateBossFanfare(dt);
    if (state === "playing") updateExit();
    if (state === "playing") updateCamera(dt);
    updateHud();
  } else if (state === "paused") {
    updateCamera(0);
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
  initSectorSelect((index) => startGame({ startIndex: index, practice: false }));

  initInput({
    isMenuOpen,
    onStart: onOverlayAction,
    onPause: () => {
      if (state === "playing") pauseGame();
      else if (state === "paused") resumeGame();
    },
    onMute: () => {
      void unlockAudio().then(() => {
        toggleMute();
        syncMuteButton();
        sfx.ui();
      });
    },
    touchLeft: touchEls.touchLeft,
    touchRight: touchEls.touchRight,
    touchJump: touchEls.touchJump,
  });

  startBtn?.addEventListener("click", onOverlayAction);
  practiceBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    startGame({ practice: true });
  });
  resumeBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    resumeGame();
  });
  restartBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    startGame({
      startIndex: practiceMode ? getLevelCount() - 1 : 0,
      practice: practiceMode,
    });
  });
  quitBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    quitToTitle();
  });
  touchPauseBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (state === "playing") pauseGame();
    else if (state === "paused") resumeGame();
  });

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

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      /* ignore offline cache failures */
    });
  }

  requestAnimationFrame(frame);
}
