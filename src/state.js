import { EXTRA_LIFE_EVERY, MAX_LIVES, TILE, START_LIVES } from "./constants.js";
import { isHardModePreferred } from "./progress.js";

/** @type {'title' | 'playing' | 'paused' | 'cleared' | 'dead' | 'won'} */
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

export let hardMode = isHardModePreferred();
/** Skip leaderboard / unlocks when practicing the boss arena */
export let practiceMode = false;
/** Stomp combo chain */
export let combo = 0;
export let comboTimer = 0;
/** Active powerup timers (seconds remaining) */
export let speedBoost = 0;
export let magnetBoost = 0;
export let shieldBoost = 0;

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
  powerups: [],
  projectiles: [],
  shockwaves: [],
  bossFanfare: 0,
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
  anim: "idle",
  frame: 0,
  frameTimer: 0,
  invuln: 0,
  jumpCutExempt: false,
  suppressLand: false,
  wallDir: 0,
  wallCling: 0,
};

/** Last safe grounded footing */
export const checkpoint = { x: 0, y: 0 };

export let reduceMotion = false;
export let preferTouch = false;

/** Per-run tallies for end screen / leaderboard honesty */
export let runCoins = 0;
export let runStomps = 0;
export let runElapsed = 0;

export function resetRunStats() {
  runCoins = 0;
  runStomps = 0;
  runElapsed = 0;
  nextExtraLifeAt = EXTRA_LIFE_EVERY;
  combo = 0;
  comboTimer = 0;
  speedBoost = 0;
  magnetBoost = 0;
  shieldBoost = 0;
}

export function addRunCoin(n = 1) {
  runCoins += n;
}

export function addRunStomp(n = 1) {
  runStomps += n;
}

export function addRunElapsed(dt) {
  runElapsed += dt;
}

export function setHardMode(on) {
  hardMode = !!on;
}

export function setPracticeMode(on) {
  practiceMode = !!on;
}

export function setCombo(count, timer = 0) {
  combo = count;
  comboTimer = timer;
}

export function setSpeedBoost(t) {
  speedBoost = Math.max(0, t);
}

export function setMagnetBoost(t) {
  magnetBoost = Math.max(0, t);
}

export function setShieldBoost(t) {
  shieldBoost = Math.max(0, t);
}

export function initMediaFlags(onChange) {
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const coarseQuery = window.matchMedia("(pointer: coarse)");

  const refresh = () => {
    reduceMotion = motionQuery.matches;
    preferTouch = coarseQuery.matches;
    onChange?.();
  };

  refresh();
  motionQuery.addEventListener("change", refresh);
  coarseQuery.addEventListener("change", refresh);
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
  score += delta;
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
