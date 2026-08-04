/** Keep in sync with package.json "version" */
export const APP_VERSION = "1.5.6";

export const LOGICAL_W = 960;
export const LOGICAL_H = 540;
export const TILE = 48;
export const GRAVITY = 2000;
export const MAX_FALL = 1400;
export const JUMP_VELOCITY = -980;
export const STOMP_BOUNCE = -620;
export const START_LIVES = 3;
/** Soft cap for lives (including extras from score thresholds) */
export const MAX_LIVES = 9;
/** Award +1 life each time DATA crosses this interval (500, 1000, …) */
export const EXTRA_LIFE_EVERY = 500;
export const COYOTE_TIME = 0.1;
export const JUMP_BUFFER = 0.12;
export const INVULN_HIT = 1.2;
export const INVULN_STOMP = 0.2;
export const JUMP_CUT_FACTOR = 0.65;
export const JUMP_CUT_THRESHOLD = -280;
export const STOMP_SLACK = 8;

/** DATA awarded per data pack collected */
export const SCORE_PACK = 10;
/** DATA awarded per standard enemy stomped */
export const SCORE_STOMP = 20;
/** DATA awarded when an armored drone is destroyed */
export const SCORE_ARMORED = 40;
/** DATA awarded when a cyber rex is destroyed */
export const SCORE_REX = 60;

/** Gameplay / entity colors (sector skies live in sectorTheme.js). */
export const COLORS = {
  cyan: "#35f0ff",
  magenta: "#ff2bd6",
  lime: "#b6ff3b",
  amber: "#ffb347",
  platform: "#1a1030",
};
