/** Keep in sync with package.json "version" */
export const APP_VERSION = "1.9.0";

export const LOGICAL_W = 960;
export const LOGICAL_H = 540;
export const TILE = 48;
export const GRAVITY = 2000;
export const MAX_FALL = 1400;
export const JUMP_VELOCITY = -980;
export const STOMP_BOUNCE = -620;
export const START_LIVES = 3;
/** Hard mode starts with a single life */
export const HARD_START_LIVES = 1;
/** Soft cap for lives (including extras from score thresholds) */
export const MAX_LIVES = 9;
/** Award +1 life each time DATA crosses this interval (500, 1000, …) */
export const EXTRA_LIFE_EVERY = 500;
export const COYOTE_TIME = 0.1;
export const JUMP_BUFFER = 0.12;
/** Hard mode removes coyote forgiveness */
export const HARD_COYOTE_TIME = 0;
export const HARD_JUMP_BUFFER = 0.08;
export const INVULN_HIT = 1.2;
export const INVULN_STOMP = 0.2;
export const JUMP_CUT_FACTOR = 0.65;
export const JUMP_CUT_THRESHOLD = -280;
export const STOMP_SLACK = 8;

/** Wall cling / jump (Ascender-friendly, available in all sectors) */
export const WALL_SLIDE_SPEED = 140;
export const WALL_JUMP_VX = 320;
export const WALL_JUMP_VY = -920;
export const WALL_CLING_GRACE = 0.12;

/** DATA awarded per data pack collected */
export const SCORE_PACK = 10;
/** DATA awarded per standard enemy stomped */
export const SCORE_STOMP = 20;
/** DATA awarded when an armored drone is destroyed */
export const SCORE_ARMORED = 40;
/** DATA awarded when a Cyber-Rex is destroyed */
export const SCORE_REX = 60;
/** DATA awarded when a turret is destroyed */
export const SCORE_TURRET = 30;
/** DATA awarded when the Cyber-Rex boss is destroyed */
export const SCORE_REX_BOSS = 200;
/** Extra DATA per step in a stomp combo chain */
export const SCORE_COMBO_STEP = 5;
/** Seconds to keep a stomp combo alive */
export const COMBO_WINDOW = 1.4;

/** Overclock pickup: speed + brief shield */
export const POWERUP_SPEED_MULT = 1.35;
export const POWERUP_SPEED_DURATION = 6;
export const POWERUP_SHIELD_DURATION = 3.5;
export const POWERUP_MAGNET_DURATION = 7;
export const POWERUP_MAGNET_RADIUS = 140;

/** Boss defeat fanfare before exit unlocks */
export const BOSS_FANFARE_DURATION = 1.6;

/** Gameplay / entity colors (sector skies live in sectorTheme.js). */
export const COLORS = {
  cyan: "#35f0ff",
  magenta: "#ff2bd6",
  lime: "#b6ff3b",
  amber: "#ffb347",
  platform: "#1a1030",
};
