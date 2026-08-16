import {
  COLORS,
  SCORE_ARMORED,
  SCORE_MINIBOSS,
  SCORE_REX,
  SCORE_REX_BOSS,
  SCORE_STOMP,
  SCORE_TURRET,
  STOMP_SLACK,
  TILE,
} from "./constants.js";
import { rect } from "./physics.js";
import { enemySpeedMult, level, levelIndex, runMode } from "./state.js";

/**
 * Declarative level defs (tile units).
 * platforms: [tx, ty, tw, th] or [tx, ty, tw, th, "collapse"]
 * hazards: [tx, ty, tw, th] | [tx, ty, tw, th, "spike"|"electric"|"laser", period?]
 * checkpoints: [tx, ty]
 * coins: [tx, ty]
 * enemies: [tx, ty, minA, maxA] or [tx, ty, minA, maxA, type]
 *   Turrets ignore patrol span (placed at tx, ty) and spawn only in LOCKDOWN.
 */

/** Per-type stats used by spawnEnemy / simulation / render. */
export const ENEMY_TYPES = {
  drone: {
    w: 36,
    h: 28,
    speed: 80,
    hp: 1,
    score: SCORE_STOMP,
    axis: "x",
    bobAmp: 3,
    bobSpeed: 6,
    fill: "#2a0830",
    stroke: COLORS.magenta,
    eye: COLORS.cyan,
    thruster: COLORS.amber,
    radius: 8,
  },
  climber: {
    w: 28,
    h: 36,
    speed: 70,
    hp: 1,
    score: SCORE_STOMP,
    axis: "y",
    bobAmp: 2,
    bobSpeed: 5,
    fill: "#081828",
    stroke: COLORS.cyan,
    eye: COLORS.lime,
    thruster: COLORS.cyan,
    radius: 6,
  },
  needle: {
    w: 22,
    h: 34,
    speed: 130,
    hp: 1,
    score: SCORE_STOMP,
    axis: "x",
    bobAmp: 4,
    bobSpeed: 8,
    fill: "#102018",
    stroke: COLORS.lime,
    eye: COLORS.cyan,
    thruster: COLORS.lime,
    radius: 4,
  },
  swarm: {
    w: 24,
    h: 20,
    speed: 110,
    hp: 1,
    score: SCORE_STOMP,
    axis: "x",
    bobAmp: 2,
    bobSpeed: 10,
    fill: "#300820",
    stroke: COLORS.magenta,
    eye: COLORS.amber,
    thruster: COLORS.magenta,
    radius: 6,
  },
  armored: {
    w: 44,
    h: 34,
    speed: 55,
    hp: 2,
    score: SCORE_ARMORED,
    axis: "x",
    bobAmp: 1.5,
    bobSpeed: 4,
    fill: "#1a1420",
    stroke: COLORS.amber,
    eye: COLORS.magenta,
    thruster: COLORS.amber,
    radius: 6,
  },
  /** Stationary gun emplacement — tracks the runner and fires bolts. */
  turret: {
    w: 36,
    h: 36,
    speed: 0,
    hp: 2,
    score: SCORE_TURRET,
    axis: "x",
    bobAmp: 0,
    bobSpeed: 0,
    grounded: true,
    turret: true,
    fill: "#181028",
    stroke: COLORS.amber,
    eye: COLORS.lime,
    thruster: COLORS.magenta,
    radius: 4,
  },
  /** Ground-stomping Cyber-Rex (sprite + walk cycle). */
  rex: {
    w: 96,
    h: 72,
    speed: 42,
    hp: 3,
    score: SCORE_REX,
    axis: "x",
    bobAmp: 2,
    bobSpeed: 5,
    grounded: true,
    fill: "#163018",
    stroke: COLORS.magenta,
    eye: "#ff3030",
    thruster: COLORS.cyan,
    radius: 4,
  },
  /** Ascender mini-boss — gates the tower exit. */
  towerSentinel: {
    w: 64,
    h: 56,
    speed: 70,
    hp: 4,
    score: SCORE_MINIBOSS,
    axis: "x",
    bobAmp: 1,
    bobSpeed: 4,
    grounded: true,
    boss: true,
    chase: true,
    miniboss: true,
    fill: "#102028",
    stroke: COLORS.cyan,
    eye: COLORS.amber,
    thruster: COLORS.lime,
    radius: 6,
  },
  /** Finale boss — chases, charges, gates the arena exit. */
  rexBoss: {
    w: 112,
    h: 84,
    speed: 88,
    hp: 8,
    score: SCORE_REX_BOSS,
    axis: "x",
    bobAmp: 2,
    bobSpeed: 5,
    grounded: true,
    boss: true,
    chase: true,
    fill: "#163018",
    stroke: COLORS.magenta,
    eye: "#ff3030",
    thruster: COLORS.cyan,
    radius: 4,
  },
};

export const LEVELS = [
  {
    id: "grid-sprint",
    sector: "2084",
    name: "GRID SPRINT",
    width: 80,
    height: 12,
    spawn: [2, 8],
    exit: [76, 7],
    platforms: [
      [0, 10, 14, 2],
      [16, 10, 10, 2],
      [28, 10, 8, 2],
      [40, 10, 18, 2],
      [62, 10, 18, 2],
      [6, 7, 3, 1],
      [12, 5, 3, 1],
      [18, 7, 2, 1],
      [22, 4, 3, 1],
      [30, 6, 4, 1],
      [36, 3, 3, 1],
      [44, 7, 3, 1],
      [50, 5, 4, 1],
      [56, 3, 3, 1],
      [64, 7, 4, 1],
      [70, 5, 3, 1],
      [74, 9, 4, 1],
      // optional high route (riskier, more packs)
      [10, 2, 2, 1],
      [15, 1, 2, 1],
      [20, 2, 2, 1],
      [26, 1, 2, 1],
      [32, 2, 2, 1],
      [38, 1, 2, 1],
      [48, 2, 2, 1],
      [54, 1, 2, 1],
      [60, 2, 2, 1],
      [24, 8, 2, 1, "collapse"],
      [46, 8, 2, 1, "collapse"],
    ],
    hazards: [
      [14.15, 9.65, 1.7, 0.35],
      [26.15, 9.65, 1.7, 0.35],
      [36.15, 9.65, 3.7, 0.35],
      [58.2, 9.65, 3.6, 0.35],
      [42, 9.2, 2, 0.2, "electric"],
    ],
    checkpoints: [[40, 9], [62, 9]],
    coins: [
      [7, 6],
      [13, 4],
      [19, 6],
      [23, 3],
      [31, 5],
      [37, 2],
      [45, 6],
      [51, 4],
      [52.5, 4],
      [57, 2],
      [65, 6],
      [71, 4],
      [9, 9],
      [20, 9],
      [33, 9],
      [48, 9],
      [67, 9],
      // high route packs
      [10.5, 1],
      [15.5, 0],
      [20.5, 1],
      [26.5, 0],
      [32.5, 1],
      [38.5, 0],
      [48.5, 1],
      [54.5, 0],
      [60.5, 1],
    ],
    enemies: [
      [8, 9, 6, 12, "drone"],
      [18, 9, 16, 24, "drone"],
      [32, 5, 30, 34, "drone"],
      [52, 4, 50, 54, "drone"],
      [66, 6, 64, 68, "drone"],
    ],
  },
  {
    id: "ascender",
    sector: "2091",
    name: "ASCENDER",
    // Narrow + tall: viewport is ~20×11 tiles, so the camera scrolls up the shaft.
    width: 20,
    height: 36,
    spawn: [2, 33],
    // Exit stands on the summit arena (platform top y=2)
    exit: [15, 0],
    /**
     * Vertical uplink climb. Floor pads leave a 1-tile drop-in beside the
     * teach shafts so cling can arm; landings stay gapped from walls for
     * the same reason. Tower Sentinel patrols the summit.
     */
    platforms: [
      // Floor — two pads, 1-tile drop-in beside the chimney shafts
      [0, 34, 6, 2],
      [14, 34, 6, 2],
      // Teach chimney (10-tile shafts, 4-tile gap to bounce between)
      [7, 24, 1, 10],
      [12, 24, 1, 10],
      [8, 29, 4, 1],
      // Top of the chimney
      [0, 24, 6, 1],
      [14, 24, 6, 1],
      [8, 24, 4, 1],
      // Mid climb — 4-tile jumps, shafts with air gaps
      [0, 20, 5, 1],
      [15, 20, 5, 1],
      [8, 20, 4, 1, "collapse"],
      [6, 16, 1, 8],
      [13, 16, 1, 8],
      [0, 16, 5, 1],
      [15, 16, 5, 1],
      [8, 17, 4, 1],
      // Upper climb
      [1, 12, 6, 1],
      [13, 12, 6, 1],
      [8, 12, 4, 1, "collapse"],
      [0, 8, 5, 1],
      [15, 8, 5, 1],
      [7, 9, 6, 1],
      // Pre-summit
      [2, 5, 6, 1],
      [12, 5, 6, 1],
      // Continuous summit arena for Tower Sentinel
      [1, 2, 18, 1],
    ],
    hazards: [
      // Spikes only in the chimney well — keep the 1-tile drop-ins clear so cling can arm
      [8.15, 33.65, 3.7, 0.35],
      [8, 16.2, 4, 0.12, "laser", 1.25],
      [7, 8.2, 6, 0.12, "laser", 1.1],
      [0.2, 19.2, 3, 0.2, "electric"],
    ],
    checkpoints: [
      [2, 33],
      [1, 23],
      [1, 15],
      [1, 7],
    ],
    coins: [
      [2, 32],
      [17, 32],
      [9, 28],
      [2, 23],
      [17, 23],
      [1, 19],
      [18, 19],
      [9, 16],
      [2, 15],
      [17, 15],
      [3, 11],
      [16, 11],
      [9, 8],
      [1, 7],
      [18, 7],
      [4, 4],
      [15, 4],
      [3, 1],
      [16, 1],
    ],
    enemies: [
      [3, 33, 1, 5, "drone"],
      [16, 33, 15, 19, "drone"],
      [8, 28, 25, 33, "climber"],
      [2, 19, 1, 4, "needle"],
      [8, 18, 17, 23, "climber"],
      [16, 15, 15, 19, "drone"],
      [3, 11, 2, 6, "needle"],
      [16, 7, 15, 19, "drone"],
      // Tower Sentinel — locked to the summit arena [1, 19)
      [8, 1, 2, 18, "towerSentinel"],
    ],
  },
  {
    id: "needle-path",
    sector: "2100",
    name: "NEEDLE PATH",
    width: 72,
    height: 12,
    spawn: [1, 8],
    exit: [68, 1],
    platforms: [
      [0, 10, 6, 2],
      [9, 10, 4, 2],
      [16, 10, 3, 2],
      [23, 10, 5, 2],
      [32, 10, 4, 2],
      [40, 10, 6, 2],
      [50, 10, 4, 2],
      [58, 10, 14, 2],
      [5, 7, 2, 1],
      [11, 5, 2, 1],
      [15, 7, 2, 1],
      [19, 4, 2, 1],
      [24, 6, 2, 1],
      [28, 3, 2, 1],
      [33, 5, 2, 1],
      [37, 7, 2, 1],
      [42, 4, 2, 1],
      [46, 6, 2, 1],
      [52, 3, 3, 1],
      [57, 5, 2, 1],
      [62, 3, 8, 1],
      [66, 7, 3, 1],
      // optional upper needle lane
      [7, 2, 2, 1],
      [13, 1, 2, 1],
      [21, 2, 2, 1],
      [29, 1, 2, 1],
      [35, 2, 2, 1],
      [44, 1, 2, 1],
      [18, 8, 2, 1, "collapse"],
      [36, 8, 2, 1, "collapse"],
    ],
    hazards: [
      [6.15, 9.65, 2.7, 0.35],
      [13.15, 9.65, 2.7, 0.35],
      [19.15, 9.65, 3.7, 0.35],
      [28.15, 9.65, 3.7, 0.35],
      [36.15, 9.65, 3.7, 0.35],
      [46.2, 9.65, 3.6, 0.35],
      [54.2, 9.65, 3.6, 0.35],
      [25, 5.2, 2, 0.12, "laser", 1.0],
      [40, 3.2, 2.2, 0.12, "laser", 0.85],
      [50, 9.2, 2, 0.2, "electric"],
    ],
    checkpoints: [[23, 9], [40, 9], [58, 9]],
    coins: [
      [6, 6],
      [12, 4],
      [16, 6],
      [20, 3],
      [25, 5],
      [29, 2],
      [34, 4],
      [38, 6],
      [43, 3],
      [47, 5],
      [53, 2],
      [58, 4],
      [64, 2],
      [67, 6],
      [2, 9],
      [25, 9],
      [43, 9],
      [7.5, 1],
      [13.5, 0],
      [21.5, 1],
      [29.5, 0],
      [35.5, 1],
      [44.5, 0],
    ],
    enemies: [
      [11, 9, 9, 13, "needle"],
      [25, 9, 23, 28, "needle"],
      [43, 9, 40, 46, "needle"],
      [20, 3, 19, 21, "needle"],
      [34, 4, 33, 35, "needle"],
      [53, 2, 52, 55, "needle"],
      // Stationary guns covering the floor lane
      [17, 9, 17, 17, "turret"],
      [41, 9, 41, 41, "turret"],
    ],
  },
  {
    id: "swarm-grid",
    sector: "2112",
    name: "SWARM GRID",
    width: 78,
    height: 12,
    spawn: [2, 8],
    exit: [74, 6],
    platforms: [
      [0, 10, 16, 2],
      [18, 10, 14, 2],
      [34, 10, 16, 2],
      [52, 10, 12, 2],
      [66, 10, 12, 2],
      [8, 7, 4, 1],
      [14, 5, 4, 1],
      [22, 7, 5, 1],
      [28, 4, 4, 1],
      [36, 6, 5, 1],
      [42, 3, 4, 1],
      [48, 7, 4, 1],
      [54, 5, 5, 1],
      [60, 3, 4, 1],
      [68, 6, 4, 1],
      [72, 8, 4, 1],
      [30, 8, 2, 1, "collapse"],
      [58, 8, 2, 1, "collapse"],
    ],
    hazards: [
      [16.15, 9.65, 1.7, 0.35],
      [32.15, 9.65, 1.7, 0.35],
      [50.15, 9.65, 1.7, 0.35],
      [64.2, 9.65, 1.6, 0.35],
      [20, 9.2, 3, 0.2, "electric"],
      [44, 5.2, 2.5, 0.12, "laser", 1.2],
    ],
    checkpoints: [[18, 9], [34, 9], [52, 9]],
    coins: [
      [9, 6],
      [15, 4],
      [23, 6],
      [29, 3],
      [37, 5],
      [43, 2],
      [49, 6],
      [55, 4],
      [61, 2],
      [69, 5],
      [6, 9],
      [24, 9],
      [40, 9],
      [56, 9],
      [70, 9],
    ],
    enemies: [
      [4, 9, 4, 14, "swarm"],
      [10, 9, 5, 15, "swarm"],
      [22, 9, 18, 30, "swarm"],
      [26, 9, 20, 32, "swarm"],
      [40, 9, 34, 48, "swarm"],
      [44, 9, 36, 50, "swarm"],
      [56, 9, 52, 62, "swarm"],
      [16, 4, 14, 18, "swarm"],
      [30, 3, 28, 32, "swarm"],
      [43, 2, 42, 46, "swarm"],
      [56, 4, 54, 59, "drone"],
      [69, 5, 68, 71, "drone"],
      [60, 9, 60, 60, "turret"],
    ],
  },
  {
    id: "overclock-span",
    sector: "2118",
    name: "OVERCLOCK SPAN",
    width: 70,
    height: 14,
    spawn: [2, 11],
    exit: [64, 1],
    platforms: [
      [0, 12, 10, 2],
      [12, 12, 6, 2],
      [22, 12, 8, 2],
      [34, 12, 8, 2],
      [46, 12, 8, 2],
      [58, 12, 12, 2],
      [4, 9, 3, 1],
      [9, 7, 3, 1],
      [14, 5, 3, 1],
      [19, 8, 3, 1],
      [24, 6, 3, 1],
      [28, 3, 3, 1],
      [33, 7, 3, 1],
      [38, 4, 3, 1],
      [42, 8, 3, 1],
      [47, 5, 3, 1],
      [52, 3, 3, 1],
      [56, 6, 3, 1],
      [60, 3, 6, 1],
      [62, 8, 3, 1],
      [16, 9, 2, 1, "collapse"],
      [30, 9, 2, 1, "collapse"],
      [44, 9, 2, 1, "collapse"],
      [50, 9, 2, 1, "collapse"],
    ],
    hazards: [
      [10.15, 11.65, 1.7, 0.35],
      [18.15, 11.65, 3.7, 0.35],
      [30.15, 11.65, 3.7, 0.35],
      [42.15, 11.65, 3.7, 0.35],
      [54.2, 11.65, 3.6, 0.35],
      [20, 5.2, 2.2, 0.12, "laser", 0.9],
      [36, 3.2, 2.5, 0.12, "laser", 1.05],
      [48, 4.2, 2, 0.12, "laser", 0.8],
      [26, 11.2, 2.5, 0.2, "electric"],
      [50, 11.2, 2.5, 0.2, "electric"],
    ],
    checkpoints: [[22, 11], [34, 11], [46, 11], [58, 11]],
    coins: [
      [5, 8],
      [10, 6],
      [15, 4],
      [20, 7],
      [25, 5],
      [29, 2],
      [34, 6],
      [39, 3],
      [43, 7],
      [48, 4],
      [53, 2],
      [57, 5],
      [62, 2],
      [14, 11],
      [38, 11],
      [56, 11],
    ],
    enemies: [
      [6, 11, 4, 9, "armored"],
      [16, 11, 12, 18, "drone"],
      [26, 11, 22, 30, "armored"],
      [38, 11, 34, 42, "needle"],
      [50, 11, 46, 54, "armored"],
      [10, 6, 4, 11, "climber"],
      [25, 5, 3, 11, "climber"],
      [40, 3, 2, 8, "climber"],
      [29, 2, 28, 31, "needle"],
      [53, 2, 52, 55, "swarm"],
      [61, 2, 60, 64, "armored"],
    ],
  },
  {
    id: "blackout-run",
    sector: "2125",
    name: "BLACKOUT RUN",
    width: 96,
    height: 14,
    spawn: [2, 10],
    exit: [92, 1],
    platforms: [
      [0, 12, 8, 2],
      [11, 12, 5, 2],
      [20, 12, 6, 2],
      [30, 12, 8, 2],
      [42, 12, 5, 2],
      [51, 12, 10, 2],
      [65, 12, 6, 2],
      [75, 12, 8, 2],
      [86, 12, 10, 2],
      [3, 9, 3, 1],
      [7, 7, 2, 1],
      [11, 5, 3, 1],
      [16, 7, 2, 1],
      [20, 4, 3, 1],
      [25, 6, 3, 1],
      [29, 3, 3, 1],
      [34, 8, 3, 1],
      [38, 5, 2, 1],
      [42, 7, 3, 1],
      [46, 3, 3, 1],
      [50, 6, 2, 1],
      [54, 4, 3, 1],
      [58, 8, 3, 1],
      [64, 5, 3, 1],
      [68, 7, 2, 1],
      [72, 4, 3, 1],
      [76, 6, 3, 1],
      [80, 3, 3, 1],
      [84, 5, 3, 1],
      [88, 3, 6, 1],
      [90, 8, 3, 1],
      [18, 10, 2, 1, "collapse"],
      [40, 10, 2, 1, "collapse"],
      [70, 10, 2, 1, "collapse"],
    ],
    hazards: [
      [8.15, 11.65, 2.7, 0.35],
      [16.15, 11.65, 3.7, 0.35],
      [26.15, 11.65, 3.7, 0.35],
      [38.15, 11.65, 3.7, 0.35],
      [47.15, 11.65, 3.7, 0.35],
      [61.2, 11.65, 3.6, 0.35],
      [71.2, 11.65, 3.6, 0.35],
      [83.2, 11.65, 2.6, 0.35],
      [22, 3.2, 2.2, 0.12, "laser", 0.95],
      [48, 2.2, 2.5, 0.12, "laser", 0.8],
      [78, 3.2, 2, 0.12, "laser", 0.75],
      [34, 11.2, 3, 0.2, "electric"],
      [66, 11.2, 3, 0.2, "electric"],
    ],
    checkpoints: [[20, 11], [42, 11], [65, 11], [86, 11]],
    coins: [
      [4, 8],
      [8, 6],
      [12, 4],
      [17, 6],
      [21, 3],
      [26, 5],
      [30, 2],
      [35, 7],
      [39, 4],
      [43, 6],
      [47, 2],
      [51, 5],
      [55, 3],
      [59, 7],
      [65, 4],
      [69, 6],
      [73, 3],
      [77, 5],
      [81, 2],
      [85, 4],
      [90, 2],
      [14, 11],
      [36, 11],
      [56, 11],
      [78, 11],
    ],
    enemies: [
      [4, 11, 4, 7, "drone"],
      [14, 11, 11, 16, "swarm"],
      [23, 11, 20, 26, "drone"],
      [34, 11, 30, 38, "armored"],
      [46, 11, 42, 47, "needle"],
      [56, 11, 52, 60, "armored"],
      [70, 11, 65, 71, "drone"],
      [80, 11, 75, 83, "armored"],
      [12, 4, 11, 14, "needle"],
      [21, 3, 2, 7, "climber"],
      [30, 2, 29, 32, "needle"],
      [47, 2, 46, 49, "swarm"],
      [55, 3, 2, 8, "climber"],
      [76, 11, 76, 76, "turret"],
      [73, 3, 72, 75, "needle"],
      [81, 2, 80, 83, "swarm"],
      [89, 2, 88, 91, "armored"],
    ],
  },
  {
    id: "rex-core",
    sector: "2126",
    name: "REX CORE",
    width: 40,
    height: 14,
    spawn: [2, 10],
    exit: [34, 10],
    platforms: [
      [0, 12, 40, 2],
      [8, 8, 3, 1],
      [16, 9, 3, 1],
      [24, 8, 3, 1],
      [30, 9, 2, 1],
    ],
    hazards: [[18, 11.2, 4, 0.2, "electric"]],
    checkpoints: [[4, 11]],
    coins: [
      [9, 7],
      [17, 8],
      [25, 7],
      [31, 8],
      [12, 11],
      [20, 11],
      [28, 11],
    ],
    enemies: [[18, 10.25, 4, 33, "rexBoss"]],
  },
];

export function getLevelCount() {
  return LEVELS.length;
}

export function getLevelDef(index = levelIndex) {
  if (index < 0 || index >= LEVELS.length) {
    throw new Error(`Invalid level index: ${index}`);
  }
  return LEVELS[index];
}

function addPlatform(tx, ty, tw, th, kind = "solid") {
  const p = rect(tx * TILE, ty * TILE, tw * TILE, th * TILE);
  p.kind = kind === "collapse" ? "collapse" : "solid";
  p.collapseTimer = 0;
  p.respawnTimer = 0;
  p.fallen = false;
  p.shake = 0;
  level.platforms.push(p);
}

function addHazard(tx, ty, tw, th, kind = "spike", period = 1.2) {
  const hit = rect(tx * TILE, ty * TILE, tw * TILE, th * TILE);
  hit.kind = kind || "spike";
  hit.period = period;
  hit.phase = (tx * 0.37 + ty * 0.19) % 1;
  hit.on = true;
  hit.drawX = (tx - 0.15) * TILE;
  hit.drawY = (ty - 0.15) * TILE;
  hit.drawW = (tw + 0.3) * TILE;
  hit.drawH = (th + 0.15) * TILE;
  level.hazards.push(hit);
}

function addCheckpoint(tx, ty) {
  level.checkpoints.push({
    x: tx * TILE,
    y: ty * TILE,
    w: TILE,
    h: TILE,
    activated: false,
  });
}

function spawnEnemy(tx, ty, minA, maxA, typeName = "drone") {
  const def = ENEMY_TYPES[typeName];
  if (!def) {
    throw new Error(`Unknown enemy type "${typeName}" in ${level.name || "level"}`);
  }

  const isTurret = !!def.turret;
  if (isTurret && runMode !== "lockdown") return;

  const min = minA * TILE;
  const max = maxA * TILE;
  const size = def.axis === "y" ? def.h : def.w;
  if (!isTurret && max - min < size) {
    throw new Error(
      `Enemy patrol too narrow in ${level.name || "level"} (${typeName}): [${minA}, ${maxA}]`
    );
  }

  const speed = def.speed * enemySpeedMult;
  const enemy = {
    type: typeName,
    axis: def.axis,
    grounded: !!def.grounded,
    boss: !!def.boss,
    miniboss: !!def.miniboss,
    chase: !!def.chase,
    turret: isTurret,
    x: tx * TILE,
    y: ty * TILE,
    w: def.w,
    h: def.h,
    vx: 0,
    vy: 0,
    minX: def.axis === "x" ? min : tx * TILE,
    maxX: def.axis === "x" ? max : tx * TILE + def.w,
    minY: def.axis === "y" ? min : ty * TILE,
    maxY: def.axis === "y" ? max : ty * TILE + def.h,
    speed,
    baseSpeed: speed,
    hp: def.hp,
    maxHp: def.hp,
    score: def.score,
    bobAmp: def.bobAmp,
    bobSpeed: def.bobSpeed,
    fill: def.fill,
    stroke: def.stroke,
    eye: def.eye,
    thruster: def.thruster,
    radius: def.radius,
    alive: true,
    flash: 0,
    walk: (tx * 1.3) % (Math.PI * 2),
    bob: (tx * 0.7 + ty * 0.3) % (Math.PI * 2),
    charging: 0,
    chargeCd: 0,
    fireCd: 0.4,
    engaged: false,
    enrageAnnounced: false,
    phaseAnnounced: 1,
    slamTimer: 0,
    airborne: false,
  };

  if (isTurret) {
    enemy.vx = 0;
    enemy.vy = 0;
    enemy.minX = enemy.x;
    enemy.maxX = enemy.x + enemy.w;
  } else if (def.axis === "y") {
    enemy.y = Math.max(enemy.minY, Math.min(enemy.maxY - enemy.h, enemy.y));
    enemy.vy = speed;
  } else {
    enemy.x = Math.max(enemy.minX, Math.min(enemy.maxX - enemy.w, enemy.x));
    enemy.vx = speed;
  }

  if (def.grounded) {
    snapEnemyToGround(enemy);
  }

  level.enemies.push(enemy);
}

/** Platform currently supporting an enemy's feet, if any. */
function platformUnderEnemy(e, atX = e.x + e.w * 0.5) {
  const feetY = e.y + e.h;
  let best = null;
  for (const p of level.platforms) {
    if (p.fallen) continue;
    if (atX < p.x || atX > p.x + p.w) continue;
    if (Math.abs(p.y - feetY) > 4) continue;
    if (!best || p.w > best.w) best = p;
  }
  return best;
}

/** Place grounded enemies so their feet sit on the nearest platform top below. */
function snapEnemyToGround(e) {
  const midX = e.x + e.w * 0.5;
  let bestTop = null;
  for (const p of level.platforms) {
    if (p.fallen) continue;
    if (midX < p.x || midX > p.x + p.w) continue;
    if (p.y < e.y - TILE) continue;
    if (bestTop === null || p.y < bestTop) bestTop = p.y;
  }
  if (bestTop !== null) {
    e.y = bestTop - e.h;
    e.minY = e.y;
    e.maxY = e.y + e.h;
  }
  // Keep patrol bounds on the supporting platform so grounded foes never walk into air.
  const plat = platformUnderEnemy(e);
  if (plat) {
    const pad = 2;
    e.minX = Math.max(e.minX, plat.x + pad);
    e.maxX = Math.min(e.maxX, plat.x + plat.w - pad);
    if (e.maxX - e.minX < e.w) {
      e.minX = plat.x + pad;
      e.maxX = plat.x + plat.w - pad;
    }
    e.x = Math.max(e.minX, Math.min(e.maxX - e.w, e.x));
  }
}

/** Assert every grounded enemy can stand across its full X patrol. */
function assertGroundedPatrols() {
  for (const e of level.enemies) {
    if (!e.grounded || e.axis !== "x") continue;
    const samples = [e.minX + 2, e.x + e.w * 0.5, e.maxX - 2];
    for (const x of samples) {
      const mid = Math.max(e.minX, Math.min(e.maxX, x));
      const probe = { x: mid - e.w * 0.5, y: e.y, w: e.w, h: e.h };
      if (!platformUnderEnemy(probe, mid)) {
        throw new Error(
          `Grounded ${e.type} patrol leaves solid floor in ${level.name} (sector ${level.sector}) at x=${mid}`
        );
      }
    }
  }
}

/** World-space AABB including bob offset (shared by combat + draw). */
export function enemyBody(e) {
  if (e.grounded) {
    return { x: e.x, y: e.y, w: e.w, h: e.h };
  }
  const bob = Math.sin(e.bob) * e.bobAmp;
  if (e.axis === "y") {
    return { x: e.x + bob, y: e.y, w: e.w, h: e.h };
  }
  return { x: e.x, y: e.y + bob, w: e.w, h: e.h };
}

/** True while any boss enemy is still alive (gates the sector exit). */
export function isExitLocked() {
  return level.enemies.some((e) => e.boss && e.alive);
}

/** First living boss, if any (for HUD / engagement). */
export function getLivingBoss() {
  return level.enemies.find((e) => e.boss && e.alive) || null;
}

export function solidPlatforms() {
  return level.platforms.filter((p) => !p.fallen);
}

/**
 * Arm a collapse platform when the player lands on it (idempotent while armed).
 * @param {{ kind?: string, fallen?: boolean, collapseTimer?: number }} p
 * @returns {boolean} true if this platform is a live collapse tile
 */
export function armCollapsePlatform(p) {
  if (p.kind !== "collapse" || p.fallen) return false;
  if (p.collapseTimer <= 0) p.collapseTimer = 0.45;
  return true;
}

/**
 * Advance one collapse platform's fall / respawn timers.
 * @param {{
 *   kind?: string,
 *   fallen?: boolean,
 *   collapseTimer?: number,
 *   respawnTimer?: number,
 *   shake?: number,
 * }} p
 * @param {number} dt
 */
export function tickCollapsePlatform(p, dt) {
  if (p.kind !== "collapse") return;
  if (p.fallen) {
    p.respawnTimer -= dt;
    if (p.respawnTimer <= 0) {
      p.fallen = false;
      p.collapseTimer = 0;
      p.shake = 0;
    }
    return;
  }
  if (p.collapseTimer > 0) {
    p.collapseTimer -= dt;
    p.shake = 1;
    if (p.collapseTimer <= 0) {
      p.fallen = true;
      p.respawnTimer = 2.4;
      p.shake = 0;
    }
  } else {
    p.shake = 0;
  }
}

/**
 * Laser duty-cycle used by hazard updates (on for the first 45% of each period).
 * @param {number} nowSec
 * @param {number} phase
 * @param {number} [period]
 */
export function isLaserHazardOn(nowSec, phase, period = 1.2) {
  const p = period || 1.2;
  const t = (nowSec + phase * p) % p;
  return t < p * 0.45;
}

/**
 * LOCKDOWN turret fire gate: cooldown ready, player in range, and roughly level.
 * @param {number} fireCd
 * @param {number} dist
 * @param {number} dy
 * @param {number} [range]
 * @param {number} [maxAbsDy]
 */
export function turretCanFire(fireCd, dist, dy, range = TILE * 14, maxAbsDy = TILE * 3.5) {
  return fireCd <= 0 && dist < range && Math.abs(dy) < maxAbsDy;
}

/**
 * Horizontal bolt spawned by a tracking turret.
 * @param {{ x: number, y: number, w: number, h: number }} e
 * @param {-1 | 1} dir
 */
export function makeTurretBolt(e, dir) {
  return {
    x: e.x + e.w * 0.5 - 10 + dir * 14,
    y: e.y + e.h * 0.3,
    w: 22,
    h: 12,
    vx: dir * 260,
    vy: 0,
    life: 2.6,
  };
}

function assertExitGrounded() {
  const exit = level.exit;
  const feetY = exit.y + exit.h;
  const grounded = level.platforms.some(
    (p) =>
      !p.fallen &&
      Math.abs(p.y - feetY) < 0.5 &&
      exit.x + exit.w > p.x &&
      exit.x < p.x + p.w
  );
  if (!grounded) {
    throw new Error(
      `Exit is not standing on a platform top in ${level.name} (sector ${level.sector})`
    );
  }
}

export function buildLevel(index = levelIndex) {
  const def = getLevelDef(index);

  level.width = def.width * TILE;
  level.height = def.height * TILE;
  level.spawn = { x: def.spawn[0] * TILE, y: def.spawn[1] * TILE };
  level.exit = {
    x: def.exit[0] * TILE,
    y: def.exit[1] * TILE,
    w: TILE * 1.2,
    h: TILE * 2,
  };
  level.sector = def.sector;
  level.name = def.name;
  level.platforms = [];
  level.hazards = [];
  level.coins = [];
  level.enemies = [];
  level.checkpoints = [];
  level.projectiles = [];

  for (const p of def.platforms) addPlatform(...p);
  for (const h of def.hazards) addHazard(...h);
  for (const c of def.checkpoints || []) addCheckpoint(...c);
  def.coins.forEach(([tx, ty], i) => {
    level.coins.push({
      x: tx * TILE + 14,
      y: ty * TILE + 14,
      r: 10,
      taken: false,
      phase: (i * 0.7) % (Math.PI * 2),
    });
  });
  for (const e of def.enemies) spawnEnemy(...e);
  assertExitGrounded();
  assertGroundedPatrols();
}

/**
 * 1D patrol step with hard bounce at [min, max] bounds (shared by X and Y drones).
 * @param {number} pos
 * @param {number} size
 * @param {number} vel
 * @param {number} min
 * @param {number} max
 * @param {number} speed
 * @param {number} dt
 * @returns {{ pos: number, vel: number }}
 */
export function stepPatrol1D(pos, size, vel, min, max, speed, dt) {
  let nextPos = pos + vel * dt;
  let nextVel = vel;
  if (nextPos < min) {
    nextPos = min;
    nextVel = Math.abs(speed);
  } else if (nextPos + size > max) {
    nextPos = max - size;
    nextVel = -Math.abs(speed);
  }
  return { pos: nextPos, vel: nextVel };
}

/**
 * Cyber-Rex (and similar) phase from remaining HP ratio.
 * @param {number} hp
 * @param {number} maxHp
 * @returns {1 | 2 | 3}
 */
export function bossPhaseFromHp(hp, maxHp) {
  const ratio = hp / maxHp;
  if (ratio > 0.62) return 1;
  if (ratio > 0.28) return 2;
  return 3;
}

/**
 * Tower Sentinel phase thresholds (absolute HP, not ratio).
 * @param {number} hp
 * @returns {1 | 2 | 3}
 */
export function minibossPhaseFromHp(hp) {
  if (hp <= 2) return 3;
  if (hp <= 3) return 2;
  return 1;
}

/**
 * True when the player is stomping an enemy body from above.
 * @param {number} vy
 * @param {number} prevBottom
 * @param {number} bodyY
 * @param {number} bottom
 * @param {number} [slack]
 */
export function isStompHit(vy, prevBottom, bodyY, bottom, slack = STOMP_SLACK) {
  return vy > 0 && prevBottom <= bodyY + slack && bottom >= bodyY;
}

/**
 * Top Y of a solid platform under a world X near an entity's feet, if any.
 * @param {{ x: number, y: number, w: number, h: number, fallen?: boolean }[]} platforms
 * @param {{ x: number, y: number, w: number, h: number }} e
 * @param {number} atX
 * @returns {number | null}
 */
export function floorYUnderEntity(platforms, e, atX) {
  const feetY = e.y + e.h;
  let best = null;
  for (const p of platforms) {
    if (p.fallen) continue;
    if (atX < p.x || atX > p.x + p.w) continue;
    if (p.y < e.y - TILE) continue;
    if (p.y > feetY + TILE * 0.5) continue;
    if (best === null || p.y < best) best = p.y;
  }
  return best;
}

/** Advance a bolt one frame (life + position). Does not mutate `p`. */
export function advanceProjectile(p, dt) {
  return {
    ...p,
    life: p.life - dt,
    x: p.x + p.vx * dt,
    y: p.y + p.vy * dt,
  };
}

/** Bolts expire when life reaches zero. */
export function projectileExpired(life) {
  return life <= 0;
}

/**
 * While invulnerable, bolts pass through so they stay visible.
 * @param {number} invuln
 */
export function projectileCanHurtPlayer(invuln) {
  return !(invuln > 0);
}

/**
 * Electric hazard pulse amplitude for a sector beat length.
 * @param {number} nowSec
 * @param {number} beatSec
 */
export function electricHazardPulse(nowSec, beatSec) {
  return 0.5 + 0.5 * Math.sin((nowSec * Math.PI * 2) / beatSec);
}
