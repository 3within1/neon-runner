/**
 * Shared per-sector identity — visuals and music share the same index / BPM / mood.
 * Music note patterns live in audio.js; LEVELS ids/names in level.js.
 * Keep lengths and id/name triples aligned (asserted in game.js at init).
 */

/**
 * @typedef {{
 *   id: string,
 *   name: string,
 *   bpm: number,
 *   density: number,
 *   bgTop: string,
 *   bgBot: string,
 *   skyA: string,
 *   skyB: string,
 *   buildingA: string,
 *   buildingB: string,
 *   window: string,
 *   grid: string,
 *   accent: string,
 *   particle: string,
 *   style: 'city' | 'towers' | 'needles' | 'swarm' | 'blackout',
 * }} SectorTheme
 */

/** @type {readonly SectorTheme[]} */
export const SECTOR_THEMES = [
  // 0 — GRID SPRINT: classic neon pulse @ 112
  {
    id: "grid-sprint",
    name: "GRID SPRINT",
    bpm: 112,
    density: 0.55,
    bgTop: "#12061c",
    bgBot: "#05030c",
    skyA: "rgba(255, 43, 214, 0.18)",
    skyB: "rgba(53, 240, 255, 0.1)",
    buildingA: "rgba(255, 43, 214, 0.12)",
    buildingB: "rgba(53, 240, 255, 0.08)",
    window: "rgba(255, 200, 80, 0.25)",
    grid: "rgba(53, 240, 255, 0.08)",
    accent: "rgba(53, 240, 255, 0.18)",
    particle: "rgba(53, 240, 255, 0.18)",
    style: "city",
  },
  // 1 — ASCENDER: climbing motifs @ 104 (cooler, upward)
  {
    id: "ascender",
    name: "ASCENDER",
    bpm: 104,
    density: 0.4,
    bgTop: "#061428",
    bgBot: "#030812",
    skyA: "rgba(53, 240, 255, 0.16)",
    skyB: "rgba(80, 120, 255, 0.1)",
    buildingA: "rgba(53, 240, 255, 0.1)",
    buildingB: "rgba(100, 140, 255, 0.08)",
    window: "rgba(180, 230, 255, 0.28)",
    grid: "rgba(100, 180, 255, 0.1)",
    accent: "rgba(120, 200, 255, 0.2)",
    particle: "rgba(180, 230, 255, 0.22)",
    style: "towers",
  },
  // 2 — NEEDLE PATH: tense / sparse @ 118
  {
    id: "needle-path",
    name: "NEEDLE PATH",
    bpm: 118,
    density: 0.3,
    bgTop: "#0a0618",
    bgBot: "#020208",
    skyA: "rgba(180, 80, 255, 0.12)",
    skyB: "rgba(40, 255, 200, 0.06)",
    buildingA: "rgba(200, 120, 255, 0.1)",
    buildingB: "rgba(40, 255, 200, 0.07)",
    window: "rgba(200, 255, 240, 0.2)",
    grid: "rgba(160, 100, 255, 0.07)",
    accent: "rgba(40, 255, 200, 0.16)",
    particle: "rgba(200, 120, 255, 0.2)",
    style: "needles",
  },
  // 3 — SWARM GRID: fast dense aggression @ 128
  {
    id: "swarm-grid",
    name: "SWARM GRID",
    bpm: 128,
    density: 0.9,
    bgTop: "#1a0610",
    bgBot: "#080208",
    skyA: "rgba(255, 43, 214, 0.22)",
    skyB: "rgba(255, 100, 60, 0.1)",
    buildingA: "rgba(255, 43, 214, 0.16)",
    buildingB: "rgba(255, 80, 100, 0.1)",
    window: "rgba(255, 160, 60, 0.3)",
    grid: "rgba(255, 43, 214, 0.1)",
    accent: "rgba(255, 100, 160, 0.2)",
    particle: "rgba(255, 43, 214, 0.22)",
    style: "swarm",
  },
  // 4 — BLACKOUT RUN: dark finale @ 120
  {
    id: "blackout-run",
    name: "BLACKOUT RUN",
    bpm: 120,
    density: 0.35,
    bgTop: "#050308",
    bgBot: "#010102",
    skyA: "rgba(255, 160, 40, 0.08)",
    skyB: "rgba(80, 20, 40, 0.12)",
    buildingA: "rgba(40, 30, 50, 0.55)",
    buildingB: "rgba(20, 16, 28, 0.7)",
    window: "rgba(255, 140, 40, 0.12)",
    grid: "rgba(255, 120, 40, 0.05)",
    accent: "rgba(255, 100, 40, 0.14)",
    particle: "rgba(255, 160, 60, 0.16)",
    style: "blackout",
  },
];

/**
 * @param {number} index
 * @returns {SectorTheme}
 */
export function getSectorTheme(index) {
  const i = Math.max(0, Math.min(SECTOR_THEMES.length - 1, Math.floor(Number(index) || 0)));
  return SECTOR_THEMES[i];
}

export function getSectorThemeCount() {
  return SECTOR_THEMES.length;
}
