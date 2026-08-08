import {
  COLORS,
  SCORE_ARMORED,
  SCORE_REX,
  SCORE_REX_BOSS,
  SCORE_STOMP,
  TILE,
} from "./constants.js";
import { rect } from "./physics.js";
import { level, levelIndex } from "./state.js";

/**
 * Declarative level defs (tile units).
 * platforms/hazards: [tx, ty, tw, th]
 * coins: [tx, ty]
 * enemies: [tx, ty, minA, maxA] or [tx, ty, minA, maxA, type]
 *   type defaults to "drone". For axis "x" types, minA/maxA are tile X bounds;
 *   for "climber" (axis "y"), minA/maxA are tile Y bounds.
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
    ],
    hazards: [
      [14.15, 9.65, 1.7, 0.35],
      [26.15, 9.65, 1.7, 0.35],
      [36.15, 9.65, 3.7, 0.35],
      [58.2, 9.65, 3.6, 0.35],
    ],
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
    width: 64,
    height: 14,
    spawn: [2, 11],
    exit: [58, 0],
    platforms: [
      [0, 12, 10, 2],
      [12, 12, 6, 2],
      [22, 12, 8, 2],
      [34, 12, 10, 2],
      [48, 12, 16, 2],
      // climb left
      [4, 9, 3, 1],
      [8, 7, 3, 1],
      [3, 5, 3, 1],
      [8, 3, 4, 1],
      // mid air chain
      [14, 9, 2, 1],
      [18, 7, 2, 1],
      [22, 5, 3, 1],
      [27, 3, 3, 1],
      [32, 5, 2, 1],
      [36, 7, 3, 1],
      [40, 4, 3, 1],
      [45, 6, 3, 1],
      [50, 4, 3, 1],
      [54, 2, 6, 1],
      [56, 8, 3, 1],
      [44, 9, 3, 1],
    ],
    hazards: [
      [10.15, 11.65, 1.7, 0.35],
      [18.15, 11.65, 3.7, 0.35],
      [30.15, 11.65, 3.7, 0.35],
      [44.2, 11.65, 3.6, 0.35],
    ],
    coins: [
      [5, 8],
      [9, 6],
      [4, 4],
      [9, 2],
      [15, 8],
      [19, 6],
      [23, 4],
      [28, 2],
      [33, 4],
      [37, 6],
      [41, 3],
      [46, 5],
      [51, 3],
      [56, 1],
      [57, 7],
      [24, 11],
      [38, 11],
    ],
    enemies: [
      [5, 11, 4, 9, "drone"],
      [25, 11, 22, 30, "drone"],
      [38, 11, 34, 44, "drone"],
      // vertical shafts (minA/maxA = tile Y)
      [8, 7, 3, 11, "climber"],
      [23, 5, 3, 11, "climber"],
      [55, 4, 1, 8, "climber"],
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
      // thin floaters
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
    ],
    hazards: [
      [6.15, 9.65, 2.7, 0.35],
      [13.15, 9.65, 2.7, 0.35],
      [19.15, 9.65, 3.7, 0.35],
      [28.15, 9.65, 3.7, 0.35],
      [36.15, 9.65, 3.7, 0.35],
      [46.2, 9.65, 3.6, 0.35],
      [54.2, 9.65, 3.6, 0.35],
    ],
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
    ],
    enemies: [
      [11, 9, 9, 13, "needle"],
      [25, 9, 23, 28, "needle"],
      [43, 9, 40, 46, "needle"],
      [20, 3, 19, 21, "needle"],
      [34, 4, 33, 35, "needle"],
      [53, 2, 52, 55, "needle"],
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
    ],
    hazards: [
      [16.15, 9.65, 1.7, 0.35],
      [32.15, 9.65, 1.7, 0.35],
      [50.15, 9.65, 1.7, 0.35],
      [64.2, 9.65, 1.6, 0.35],
    ],
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
    ],
  },
  {
    id: "blackout-run",
    sector: "2125",
    name: "BLACKOUT RUN",
    width: 96,
    height: 14,
    spawn: [2, 10],
    // Climb to the exit door; uplink opens into the Cyber-Rex arena.
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
      // early climb
      [3, 9, 3, 1],
      [7, 7, 2, 1],
      [11, 5, 3, 1],
      [16, 7, 2, 1],
      [20, 4, 3, 1],
      [25, 6, 3, 1],
      [29, 3, 3, 1],
      // mid gauntlet
      [34, 8, 3, 1],
      [38, 5, 2, 1],
      [42, 7, 3, 1],
      [46, 3, 3, 1],
      [50, 6, 2, 1],
      [54, 4, 3, 1],
      [58, 8, 3, 1],
      // late climb to exit door
      [64, 5, 3, 1],
      [68, 7, 2, 1],
      [72, 4, 3, 1],
      [76, 6, 3, 1],
      [80, 3, 3, 1],
      [84, 5, 3, 1],
      [88, 3, 6, 1],
      [90, 8, 3, 1],
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
    ],
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
    // Exit on the arena floor; gated until Cyber-Rex falls.
    exit: [34, 10],
    platforms: [
      // boss arena floor
      [0, 12, 40, 2],
      // stomp ledges
      [8, 8, 3, 1],
      [16, 9, 3, 1],
      [24, 8, 3, 1],
      [30, 9, 2, 1],
    ],
    hazards: [],
    coins: [
      [9, 7],
      [17, 8],
      [25, 7],
      [31, 8],
      [12, 11],
      [20, 11],
      [28, 11],
    ],
    enemies: [
      // finale boss — Cyber-Rex owns the arena
      [18, 10.25, 4, 33, "rexBoss"],
    ],
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

function addPlatform(tx, ty, tw, th) {
  level.platforms.push(rect(tx * TILE, ty * TILE, tw * TILE, th * TILE));
}

function addHazard(tx, ty, tw, th) {
  const hit = rect(tx * TILE, ty * TILE, tw * TILE, th * TILE);
  hit.drawX = (tx - 0.15) * TILE;
  hit.drawY = (ty - 0.15) * TILE;
  hit.drawW = (tw + 0.3) * TILE;
  hit.drawH = (th + 0.15) * TILE;
  level.hazards.push(hit);
}

function spawnEnemy(tx, ty, minA, maxA, typeName = "drone") {
  const def = ENEMY_TYPES[typeName];
  if (!def) {
    throw new Error(`Unknown enemy type "${typeName}" in ${level.name || "level"}`);
  }

  const min = minA * TILE;
  const max = maxA * TILE;
  const size = def.axis === "y" ? def.h : def.w;
  if (max - min < size) {
    throw new Error(
      `Enemy patrol too narrow in ${level.name || "level"} (${typeName}): [${minA}, ${maxA}]`
    );
  }

  const enemy = {
    type: typeName,
    axis: def.axis,
    grounded: !!def.grounded,
    boss: !!def.boss,
    chase: !!def.chase,
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
    speed: def.speed,
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
    engaged: false,
    enrageAnnounced: false,
  };

  if (def.axis === "y") {
    enemy.y = Math.max(enemy.minY, Math.min(enemy.maxY - enemy.h, enemy.y));
    enemy.vy = def.speed;
  } else {
    enemy.x = Math.max(enemy.minX, Math.min(enemy.maxX - enemy.w, enemy.x));
    enemy.vx = def.speed;
  }

  if (def.grounded) {
    snapEnemyToGround(enemy);
  }

  level.enemies.push(enemy);
}

/** Place grounded enemies so their feet sit on the nearest platform top below. */
function snapEnemyToGround(e) {
  const midX = e.x + e.w * 0.5;
  let bestTop = null;
  for (const p of level.platforms) {
    if (midX < p.x || midX > p.x + p.w) continue;
    if (p.y < e.y - TILE) continue;
    if (bestTop === null || p.y < bestTop) bestTop = p.y;
  }
  if (bestTop !== null) {
    e.y = bestTop - e.h;
    e.minY = e.y;
    e.maxY = e.y + e.h;
  }
}

/** World-space AABB including bob offset (shared by combat + draw). */
export function enemyBody(e) {
  // Grounded units keep a stable feet-aligned hitbox; motion is visual-only.
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

function assertExitGrounded() {
  const exit = level.exit;
  const feetY = exit.y + exit.h;
  const grounded = level.platforms.some(
    (p) =>
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

  for (const p of def.platforms) addPlatform(...p);
  for (const h of def.hazards) addHazard(...h);
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
}
