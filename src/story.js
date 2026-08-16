/**
 * Short diegetic mission beats — keep copy terse; overlays + announces only.
 * Sector ids/names must stay aligned with LEVELS / SECTOR_THEMES (asserted in game.js).
 */

/**
 * @typedef {{
 *   id: string,
 *   name: string,
 *   brief: string,
 *   clear: string,
 * }} SectorStory
 */

export const TITLE_STORY = {
  eyebrow: "SECTOR 2084",
  title: "NEON RUNNER",
  /** Shown on the title overlay — premise, not a mechanics dump. */
  tagline:
    "Jack the stolen city core before lockdown seals the grid for good.",
  button: "JACK IN",
};

export const RUN_STORY = {
  death: "The grid swallowed you. Try again, runner.",
  /** @param {number} score */
  win: (score) =>
    `City core jacked. Lights flicker back — for now. DATA ${String(score).padStart(4, "0")}.`,
  lockdownWin: (score) =>
    `Lockdown broken. The grid remembers your tag. DATA ${String(score).padStart(4, "0")}.`,
};

export const BOSS_STORY = {
  online: "CYBER-REX ONLINE. Vault guardian engaged.",
  armorBreak: "CYBER-REX ARMOR CRACKED. Slam protocols online.",
  overclock: "CYBER-REX OVERCLOCKED. Core defense surging.",
  down: "CYBER-REX DOWN. City core unlocked.",
  exitLocked: "EXIT LOCKED. Defeat the guardian to jack the core.",
  sentinelOnline: "TOWER SENTINEL ONLINE. Clear the uplink ledge.",
  sentinelDown: "TOWER SENTINEL DOWN. Ascender uplink open.",
};

export const ABILITY_STORY = {
  wallCling: "WALL CLING ONLINE. Hold into a wall, then jump off.",
  doubleJump: "AIR JUMP ONLINE. Press jump again mid-air.",
  dash: "DASH ONLINE. Hold Shift / tap DASH to burst.",
};

/** @type {readonly SectorStory[]} */
export const SECTOR_STORIES = [
  {
    id: "grid-sprint",
    name: "GRID SPRINT",
    brief: "Surface streets. Pull the uplink key before the drones converge.",
    clear: "Uplink key acquired. The sealed towers are next.",
  },
  {
    id: "ascender",
    name: "ASCENDER",
    brief: "Ride the uplink shaft. Wall cling is live; a sentinel guards the summit.",
    clear: "Towers clear. Needle defense ahead — air jump unlocked.",
  },
  {
    id: "needle-path",
    name: "NEEDLE PATH",
    brief: "Slip the thinned kill-grid. Air jump is live. Wall cling still online.",
    clear: "Needle grid cracked. Swarm response inbound.",
  },
  {
    id: "swarm-grid",
    name: "SWARM GRID",
    brief: "Cut through the hive before it closes the lanes.",
    clear: "Swarm broken. Overclock span ahead.",
  },
  {
    id: "overclock-span",
    name: "OVERCLOCK SPAN",
    brief: "Armored climb through a hot span. Lasers sync to the beat.",
    clear: "Span cracked. Dash unlocked for blackout.",
  },
  {
    id: "blackout-run",
    name: "BLACKOUT RUN",
    brief: "Power dies. Dash the gauntlet and climb to the vault door.",
    clear: "Vault door open. Cyber-Rex waits in the core.",
  },
  {
    id: "rex-core",
    name: "REX CORE",
    brief: "Vault guardian online. Break its phases and jack the core.",
    clear: "Core unlocked.",
  },
];

export function getSectorStoryCount() {
  return SECTOR_STORIES.length;
}

/** @param {number} index */
export function getSectorStory(index) {
  return SECTOR_STORIES[index] ?? SECTOR_STORIES[0];
}

/**
 * Sector-clear overlay body: story beat + DATA tally + next uplink name.
 * @param {number} index
 * @param {number} score
 * @param {{ name: string }} next
 */
export function formatSectorClearTagline(index, score, next) {
  const beat = getSectorStory(index);
  return `${beat.clear} Next uplink: ${next.name}. DATA ${String(score).padStart(4, "0")}.`;
}
