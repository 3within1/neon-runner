/** Keep in sync with package.json "version" */
export const APP_VERSION = "2.0.2";

export const LOGICAL_W = 960;
export const LOGICAL_H = 540;
export const TILE = 48;
export const GRAVITY = 2000;
export const MAX_FALL = 1400;
export const JUMP_VELOCITY = -980;
export const DOUBLE_JUMP_VELOCITY = -860;
export const STOMP_BOUNCE = -620;
export const START_LIVES = 3;
export const LOCKDOWN_START_LIVES = 2;
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

export const DASH_SPEED = 620;
export const DASH_DURATION = 0.16;
export const DASH_COOLDOWN = 0.55;
export const COMBO_WINDOW = 1.25;
export const COMBO_BONUS_EVERY = 3;
export const COMBO_BONUS_DATA = 5;
export const REPLAY_SECONDS = 2;
export const REPLAY_SAMPLE_HZ = 60;
export const LOCKDOWN_SPEED_MULT = 1.35;
export const LOCKDOWN_SCORE_MULT = 1.5;

/** Sector index where air-jump unlocks during a run */
export const UNLOCK_DOUBLE_JUMP_SECTOR = 2;
/** Sector index where dash unlocks during a run */
export const UNLOCK_DASH_SECTOR = 5;

/** DATA awarded per data pack collected */
export const SCORE_PACK = 10;
/** DATA awarded per standard enemy stomped */
export const SCORE_STOMP = 20;
/** DATA awarded when a turret is destroyed */
export const SCORE_TURRET = 30;
/** DATA awarded when an armored drone is destroyed */
export const SCORE_ARMORED = 40;
/** DATA awarded when a Cyber-Rex is destroyed */
export const SCORE_REX = 60;
/** DATA awarded when the tower sentinel mini-boss falls */
export const SCORE_MINIBOSS = 100;
/** DATA awarded when the Cyber-Rex boss is destroyed */
export const SCORE_REX_BOSS = 200;

/** Gameplay / entity colors (sector skies live in sectorTheme.js). */
export const COLORS = {
  cyan: "#35f0ff",
  magenta: "#ff2bd6",
  lime: "#b6ff3b",
  amber: "#ffb347",
  platform: "#1a1030",
  electric: "#6af0ff",
  laser: "#ff4060",
};
