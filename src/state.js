import { TILE, START_LIVES } from "./constants.js";

/** @type {'title' | 'playing' | 'cleared' | 'dead' | 'won'} */
export let state = "title";
export let score = 0;
export let lives = START_LIVES;
export let time = 0;
export let shake = 0;
export let shakeX = 0;
export let shakeY = 0;
export let levelIndex = 0;

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
};

/** Last safe grounded footing */
export const checkpoint = { x: 0, y: 0 };

export let reduceMotion = false;
export let preferTouch = false;

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

export function addScore(delta) {
  score += delta;
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
