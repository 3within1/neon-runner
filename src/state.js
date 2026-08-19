import {
  COMBO_BONUS_DATA,
  COMBO_BONUS_EVERY,
  COYOTE_TIME,
  EXTRA_LIFE_EVERY,
  JUMP_BUFFER,
  LOCKDOWN_SCORE_MULT,
  LOCKDOWN_SPEED_MULT,
  LOCKDOWN_START_LIVES,
  MAX_LIVES,
  REPLAY_SAMPLE_HZ,
  REPLAY_SECONDS,
  START_LIVES,
  TILE,
  UNLOCK_DASH_SECTOR,
  UNLOCK_DOUBLE_JUMP_SECTOR,
  UNLOCK_WALL_CLING_SECTOR,
  WALL_CLING_GRACE,
} from "./constants.js";
import { getMeta } from "./meta.js";

/** @typedef {'title' | 'playing' | 'paused' | 'cleared' | 'dead' | 'won' | 'replaying' | 'settings'} GameState */
/** @typedef {'normal' | 'lockdown' | 'timeAttack'} RunMode */

/** @type {GameState} */
export let state = "title";
export let score = 0;
export let lives = START_LIVES;
/** Next DATA total that awards an extra life */
export let nextExtraLifeAt = EXTRA_LIFE_EVERY;
export let time = 0;
export let shake = 0;
export let shakeX = 0;
export let shakeY = 0;
export let levelIndex = 0;
export let hitStop = 0;
export let crackFlash = 0;
export let combo = 0;
export let comboTimer = 0;
export let maxCombo = 0;
export let runDeaths = 0;
export let sectorElapsed = 0;
/** @type {RunMode} */
export let runMode = "normal";
export let timeAttackSector = 0;
export let scoreMult = 1;
export let enemySpeedMult = 1;
/** Skip leaderboard / unlocks when practicing the boss arena */
export let practiceMode = false;

export const camera = { x: 0, y: 0 };

export const level = {
  width: 80 * TILE,
  height: 12 * TILE,
  spawn: { x: 2 * TILE, y: 8 * TILE },
  exit: { x: 76 * TILE, y: 7 * TILE, w: TILE * 1.2, h: TILE * 2 },
  sector: "2084",
  name: "GRID SPRINT",
  platforms: [],
  hazards: [],
  coins: [],
  enemies: [],
  checkpoints: [],
  /** @type {{ x: number, y: number, w: number, h: number, vx: number, vy: number, life: number }[]} */
  projectiles: [],
};

export const player = {
  x: 0,
  y: 0,
  w: 28,
  h: 40,
  vx: 0,
  vy: 0,
  prevX: 0,
  prevY: 0,
  facing: 1,
  onGround: false,
  coyote: 0,
  jumpBuffer: 0,
  airJumps: 0,
  maxAirJumps: 0,
  dashCd: 0,
  dashTimer: 0,
  dashDir: 1,
  canDash: false,
  canWallCling: false,
  /** -1 left wall, 1 right wall, 0 none */
  wallDir: 0,
  /** Remaining cling grace (seconds) */
  wallCling: 0,
  anim: "idle",
  frame: 0,
  frameTimer: 0,
  invuln: 0,
  jumpCutExempt: false,
  suppressLand: false,
};

/** Last safe grounded footing */
export const checkpoint = { x: 0, y: 0 };

export let reduceMotion = false;
export let preferTouch = false;
export let colorblind = false;

/** Per-run tallies for end screen / leaderboard honesty */
export let runCoins = 0;
export let runStomps = 0;
export let runElapsed = 0;

/** Ring buffer for death replay */
const REPLAY_LEN = Math.ceil(REPLAY_SECONDS * REPLAY_SAMPLE_HZ);
/** @type {{ x: number, y: number, facing: number, anim: string, frame: number, dash: boolean }[]} */
export const replayBuffer = new Array(REPLAY_LEN);
export let replayWrite = 0;
export let replayCount = 0;
export let replayPlay = 0;
export let replayDuration = 0;
export let replayElapsed = 0;

export function resetRunStats() {
  runCoins = 0;
  runStomps = 0;
  runElapsed = 0;
  runDeaths = 0;
  maxCombo = 0;
  combo = 0;
  comboTimer = 0;
  sectorElapsed = 0;
  nextExtraLifeAt = EXTRA_LIFE_EVERY;
  clearReplay();
}

export function clearReplay() {
  replayWrite = 0;
  replayCount = 0;
  replayPlay = 0;
  replayDuration = 0;
}

export function pushReplaySample() {
  replayBuffer[replayWrite] = {
    x: player.x,
    y: player.y,
    facing: player.facing,
    anim: player.anim,
    frame: player.frame,
    dash: player.dashTimer > 0,
  };
  replayWrite = (replayWrite + 1) % REPLAY_LEN;
  replayCount = Math.min(REPLAY_LEN, replayCount + 1);
}

export function beginReplayPlayback() {
  replayPlay = 0;
  replayElapsed = 0;
  replayDuration = Math.min(REPLAY_SECONDS, replayCount / REPLAY_SAMPLE_HZ);
}

export function addReplayElapsed(dt) {
  replayElapsed += dt;
  return replayElapsed;
}

export function sampleReplayAt(t) {
  if (replayCount <= 0) return null;
  const idxFromEnd = Math.min(
    replayCount - 1,
    Math.max(0, Math.floor(t * REPLAY_SAMPLE_HZ))
  );
  const i = (replayWrite - replayCount + idxFromEnd + REPLAY_LEN * 2) % REPLAY_LEN;
  return replayBuffer[i] || null;
}

export function addRunCoin(n = 1) {
  runCoins += n;
}

export function addRunStomp(n = 1) {
  runStomps += n;
}

export function addRunDeath() {
  runDeaths += 1;
}

export function addRunElapsed(dt) {
  runElapsed += dt;
  sectorElapsed += dt;
}

export function resetSectorElapsed() {
  sectorElapsed = 0;
}

/** Fresh stomp starts at 1; an active window extends the chain. */
export function nextComboOnStomp(currentCombo, currentTimer) {
  return currentCombo > 0 && currentTimer > 0 ? currentCombo + 1 : 1;
}

/** DATA awarded when a stomp lands on a combo milestone (0 otherwise). */
export function comboBonusForStomp(nextCombo) {
  return nextCombo > 1 && nextCombo % COMBO_BONUS_EVERY === 0 ? COMBO_BONUS_DATA : 0;
}

/**
 * Sector-gated mobility for a campaign index (0-based).
 * @param {number} sectorIndex
 */
export function abilitiesForSector(sectorIndex) {
  const idx = Number.isFinite(sectorIndex) ? sectorIndex : 0;
  return {
    maxAirJumps: idx >= UNLOCK_DOUBLE_JUMP_SECTOR ? 1 : 0,
    canDash: idx >= UNLOCK_DASH_SECTOR,
    canWallCling: idx >= UNLOCK_WALL_CLING_SECTOR,
  };
}

export function setCombo(n) {
  combo = n;
  if (n > maxCombo) maxCombo = n;
}

export function setComboTimer(t) {
  comboTimer = t;
}

export function tickCombo(dt) {
  if (comboTimer > 0) {
    comboTimer = Math.max(0, comboTimer - dt);
    if (comboTimer <= 0) combo = 0;
  }
}

/** Grounded refill; airborne decay toward zero. */
export function tickCoyote(coyote, onGround, dt, refill = COYOTE_TIME) {
  if (onGround) return refill;
  return Math.max(0, coyote - dt);
}

/** Press refreshes the buffer; otherwise decay toward zero. */
export function tickJumpBuffer(jumpBuffer, jumpPressed, dt, refill = JUMP_BUFFER) {
  if (jumpPressed) return refill;
  return Math.max(0, jumpBuffer - dt);
}

/**
 * Decay invulnerability. Non-finite values (e.g. Infinity during death replay) stay put.
 * @param {number} invuln
 * @param {number} dt
 */
export function tickInvuln(invuln, dt) {
  if (invuln <= 0) return 0;
  if (!Number.isFinite(invuln)) return invuln;
  return Math.max(0, invuln - dt);
}

/**
 * Wall-cling grace FSM: contact refreshes grace; loss of contact decays then clears dir.
 * @param {number} wallCling
 * @param {-1 | 0 | 1} wallDir
 * @param {-1 | 0 | 1} detectedDir
 * @param {number} dt
 * @param {number} [grace]
 * @returns {{ wallDir: -1 | 0 | 1, wallCling: number }}
 */
export function tickWallClingGrace(
  wallCling,
  wallDir,
  detectedDir,
  dt,
  grace = WALL_CLING_GRACE
) {
  if (detectedDir !== 0) {
    return { wallDir: detectedDir, wallCling: grace };
  }
  const next = Math.max(0, wallCling - dt);
  return { wallDir: next <= 0 ? 0 : wallDir, wallCling: next };
}

export function initMediaFlags(onChange) {
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const coarseQuery = window.matchMedia("(pointer: coarse)");

  const refresh = () => {
    const meta = getMeta();
    colorblind = !!meta.colorblind;
    if (meta.forceReduceMotion === true) reduceMotion = true;
    else if (meta.forceReduceMotion === false) reduceMotion = false;
    else reduceMotion = motionQuery.matches;
    preferTouch = coarseQuery.matches;
    onChange?.();
  };

  refresh();
  motionQuery.addEventListener("change", refresh);
  coarseQuery.addEventListener("change", refresh);
  return refresh;
}

export function setState(next) {
  state = next;
}

export function setLevelIndex(next) {
  levelIndex = next;
}

export function setScore(next) {
  score = next;
}

/**
 * Add DATA and grant extra lives for each EXTRA_LIFE_EVERY threshold crossed.
 * @returns {number} Lives granted this call (0 if none / at soft cap).
 */
export function addScore(delta) {
  const applied = Math.round(delta * scoreMult);
  score += applied;
  let gained = 0;
  while (score >= nextExtraLifeAt) {
    if (lives < MAX_LIVES) {
      lives += 1;
      gained += 1;
    }
    nextExtraLifeAt += EXTRA_LIFE_EVERY;
  }
  return gained;
}

export function setLives(next) {
  lives = next;
}

export function addTime(dt) {
  time += dt;
}

export function setShake(next) {
  shake = next;
}

export function setShakeOffset(x, y) {
  shakeX = x;
  shakeY = y;
}

export function decayShake(dt) {
  shake = Math.max(0, shake - dt);
}

export function setHitStop(sec) {
  hitStop = Math.max(hitStop, sec);
}

export function tickHitStop(dt) {
  hitStop = Math.max(0, hitStop - dt);
}

export function setCrackFlash(sec) {
  crackFlash = sec;
}

export function tickCrack(dt) {
  crackFlash = Math.max(0, crackFlash - dt);
}

/**
 * @param {RunMode} mode
 * @param {number} [sector]
 */
export function configureRunMode(mode, sector = 0) {
  runMode = mode;
  timeAttackSector = sector;
  if (mode === "lockdown") {
    scoreMult = LOCKDOWN_SCORE_MULT;
    enemySpeedMult = LOCKDOWN_SPEED_MULT;
    lives = LOCKDOWN_START_LIVES;
  } else {
    scoreMult = 1;
    enemySpeedMult = 1;
    lives = START_LIVES;
  }
}

export function setPracticeMode(on) {
  practiceMode = !!on;
}

export function startingLivesForMode() {
  return runMode === "lockdown" ? LOCKDOWN_START_LIVES : START_LIVES;
}

/**
 * Which end-of-sector flow to run after touching an unlocked exit.
 * @param {{
 *   practiceMode: boolean,
 *   runMode: RunMode,
 *   levelIndex: number,
 *   levelCount: number
 * }} opts
 * @returns {'practice' | 'timeAttack' | 'continue' | 'campaignWin'}
 */
export function resolveSectorClearKind({
  practiceMode: practice,
  runMode: mode,
  levelIndex: index,
  levelCount,
}) {
  if (practice) return "practice";
  if (mode === "timeAttack") return "timeAttack";
  if (index < levelCount - 1) return "continue";
  return "campaignWin";
}

/** Time Attack never advances to the next sector mid-run. */
export function canAdvanceLevel(mode) {
  return mode !== "timeAttack";
}

/**
 * Deduped frame-error logging policy for the rAF loop (#18).
 * Mutates `counts` (message → occurrence). Returns whether/how to log.
 * @param {Map<string, number>} counts
 * @param {unknown} err
 * @returns {{ key: string, kind: 'first' | 'repeat' | 'silent', count: number }}
 */
export function noteFrameError(counts, err) {
  const key = (err && /** @type {{ message?: string }} */ (err).message) || String(err);
  const seen = counts.get(key) || 0;
  const count = seen + 1;
  counts.set(key, count);
  if (seen === 0) return { key, kind: "first", count };
  if (count % 300 === 0) return { key, kind: "repeat", count };
  return { key, kind: "silent", count };
}
