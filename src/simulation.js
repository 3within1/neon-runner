import {
  COMBO_BONUS_DATA,
  COMBO_BONUS_EVERY,
  COMBO_WINDOW,
  COYOTE_TIME,
  DASH_COOLDOWN,
  DASH_DURATION,
  DASH_SPEED,
  DOUBLE_JUMP_VELOCITY,
  GRAVITY,
  INVULN_HIT,
  INVULN_STOMP,
  JUMP_BUFFER,
  JUMP_CUT_FACTOR,
  JUMP_CUT_THRESHOLD,
  JUMP_VELOCITY,
  MAX_FALL,
  SCORE_PACK,
  STOMP_BOUNCE,
  STOMP_SLACK,
  TILE,
  UNLOCK_DASH_SECTOR,
  UNLOCK_DOUBLE_JUMP_SECTOR,
} from "./constants.js";
import { W, H } from "./dom.js";
import { input } from "./input.js";
import {
  buildLevel,
  enemyBody,
  getLevelCount,
  getLevelDef,
  getLivingBoss,
  isExitLocked,
  solidPlatforms,
} from "./level.js";
import { aabb, resolveAxis, segmentHitsRect } from "./physics.js";
import { sfx, stopMusic } from "./audio.js";
import {
  addRunCoin,
  addRunDeath,
  addRunStomp,
  addScore,
  beginReplayPlayback,
  camera,
  checkpoint,
  clearReplay,
  combo,
  comboTimer,
  configureRunMode,
  decayShake,
  level,
  levelIndex,
  lives,
  player,
  pushReplaySample,
  reduceMotion,
  practiceMode,
  nextComboOnStomp,
  resetRunStats,
  resetSectorElapsed,
  runElapsed,
  runMode,
  score,
  sectorElapsed,
  setCombo,
  setComboTimer,
  setCrackFlash,
  setHitStop,
  setLevelIndex,
  setLives,
  setPracticeMode,
  setScore,
  setShake,
  setShakeOffset,
  setState,
  shake,
  startingLivesForMode,
  state,
  tickCombo,
} from "./state.js";
import {
  ABILITY_STORY,
  BOSS_STORY,
  formatSectorClearTagline,
  RUN_STORY,
} from "./story.js";
import { announce, setOverlay, updateHud, presentRunEnd } from "./ui.js";
import {
  considerScoreUnlocks,
  getBestClearTime,
  getUnlockedSector,
  markCleared,
  recordClearTime,
  recordSectorTime,
  unlockSector,
} from "./meta.js";
import { getSectorTheme } from "./sectorTheme.js";

let abilityAnnouncedDouble = false;
let abilityAnnouncedDash = false;
/** @type {null | { title: string, tagline: string, button: string, eyebrow?: string, outcome: 'won' | 'dead' }} */
let pendingEnd = null;

function awardScore(delta) {
  const gained = addScore(delta);
  if (gained > 0) {
    const label = gained === 1 ? "EXTRA LIFE" : `${gained} EXTRA LIVES`;
    announce(`${label}. Lives ${lives}.`);
    sfx.extraLife();
  }
  return gained;
}

export function setCheckpoint(x, y) {
  checkpoint.x = x;
  checkpoint.y = y;
}

function syncAbilities() {
  const idx = levelIndex;
  player.maxAirJumps = idx >= UNLOCK_DOUBLE_JUMP_SECTOR ? 1 : 0;
  player.canDash = idx >= UNLOCK_DASH_SECTOR;
  if (player.maxAirJumps > 0 && !abilityAnnouncedDouble) {
    abilityAnnouncedDouble = true;
    announce(ABILITY_STORY.doubleJump);
  }
  if (player.canDash && !abilityAnnouncedDash) {
    abilityAnnouncedDash = true;
    announce(ABILITY_STORY.dash);
  }
}

function isSafeStanding(px, py) {
  const feet = { x: px, y: py, w: player.w, h: player.h };
  for (const h of level.hazards) {
    if (h.kind === "laser" && !h.on) continue;
    if (aabb(feet, h)) return false;
  }
  for (const e of level.enemies) {
    if (!e.alive) continue;
    if (aabb(feet, enemyBody(e))) return false;
  }
  for (const p of level.platforms) {
    if (p.kind !== "collapse" || p.fallen) continue;
    if (
      player.onGround &&
      feet.x + feet.w > p.x &&
      feet.x < p.x + p.w &&
      Math.abs(feet.y + feet.h - p.y) < 3
    ) {
      return false;
    }
  }
  return true;
}

export function resetPlayer(at = checkpoint) {
  player.x = at.x;
  player.y = at.y;
  player.prevX = at.x;
  player.prevY = at.y;
  player.vx = 0;
  player.vy = 0;
  player.facing = 1;
  player.onGround = false;
  player.coyote = 0;
  player.jumpBuffer = 0;
  player.airJumps = player.maxAirJumps;
  player.dashCd = 0;
  player.dashTimer = 0;
  player.anim = "idle";
  player.frame = 0;
  player.frameTimer = 0;
  player.invuln = INVULN_HIT;
  player.jumpCutExempt = false;
  player.suppressLand = true;
}

/**
 * @param {boolean} [full]
 * @param {{ mode?: 'normal' | 'lockdown' | 'timeAttack', sector?: number, practice?: boolean }} [opts]
 */
export function resetRun(full = false, opts = {}) {
  if (full) {
    const practice = !!opts.practice;
    setPracticeMode(practice);
    const mode = practice ? "normal" : opts.mode || "normal";
    const last = getLevelCount() - 1;
    let sector = 0;
    if (practice) {
      sector = Math.max(0, last);
    } else if (mode === "timeAttack") {
      sector = Math.max(0, Math.min(last, opts.sector ?? 0));
    } else {
      const unlocked = Math.min(last, getUnlockedSector());
      sector = Math.max(0, Math.min(unlocked, opts.sector ?? 0));
    }
    configureRunMode(mode, sector);
    setLevelIndex(sector);
    setScore(0);
    setLives(startingLivesForMode());
    resetRunStats();
    abilityAnnouncedDouble = false;
    abilityAnnouncedDash = false;
    pendingEnd = null;
  }
  buildLevel(levelIndex);
  syncAbilities();
  setCheckpoint(level.spawn.x, level.spawn.y);
  resetPlayer(checkpoint);
  resetSectorElapsed();
  clearReplay();
  camera.x = 0;
  camera.y = 0;
  setShake(0);
  setShakeOffset(0, 0);
  updateHud();
}

export function advanceLevel() {
  if (runMode === "timeAttack") return false;
  const next = levelIndex + 1;
  if (next >= getLevelCount()) return false;
  setLevelIndex(next);
  buildLevel(next);
  syncAbilities();
  setCheckpoint(level.spawn.x, level.spawn.y);
  resetPlayer(checkpoint);
  resetSectorElapsed();
  clearReplay();
  camera.x = 0;
  camera.y = 0;
  setShake(0);
  setShakeOffset(0, 0);
  updateHud();
  return true;
}

function pitY() {
  return level.height + 80;
}

function finishDeathPresentation() {
  if (!pendingEnd) return;
  const end = pendingEnd;
  pendingEnd = null;
  presentRunEnd(
    end.outcome,
    end.title,
    end.tagline,
    end.button,
    end.eyebrow
  );
}

export function hitPlayer(force = false) {
  if (state !== "playing") return false;
  if (!force && player.invuln > 0) return false;

  const nextLives = lives - 1;
  setLives(Math.max(0, nextLives));
  setShake(0.35);
  addRunDeath();
  updateHud();

  if (nextLives <= 0) {
    setCrackFlash(reduceMotion ? 0.2 : 0.85);
    stopMusic();
    sfx.die();
    pendingEnd = practiceMode
      ? {
          outcome: "dead",
          title: "PRACTICE CRASH",
          tagline: RUN_STORY.death,
          button: "RETRY REX",
          eyebrow: "REX CORE",
        }
      : {
          outcome: "dead",
          title: "SYSTEM CRASH",
          tagline: RUN_STORY.death,
          button: "REBOOT",
        };
    beginReplayPlayback();
    setState("replaying");
    player.invuln = Infinity;
    return true;
  }

  sfx.hit();
  resetPlayer(checkpoint);
  return true;
}

function tryDash() {
  if (!player.canDash) return;
  if (player.dashCd > 0 || player.dashTimer > 0) return;
  if (!input.dashPressed) return;
  input.dashPressed = false;
  const dir =
    input.left && !input.right ? -1 : input.right && !input.left ? 1 : player.facing;
  player.dashDir = dir || 1;
  player.dashTimer = DASH_DURATION;
  player.dashCd = DASH_COOLDOWN;
  player.vx = player.dashDir * DASH_SPEED;
  player.vy = Math.min(player.vy, 0);
  player.invuln = Math.max(player.invuln, DASH_DURATION * 0.85);
  player.facing = player.dashDir;
  sfx.dash();
}

export function updatePlayer(dt) {
  syncAbilities();
  tickCombo(dt);
  player.dashCd = Math.max(0, player.dashCd - dt);

  if (player.dashTimer > 0) {
    player.dashTimer = Math.max(0, player.dashTimer - dt);
    player.vx = player.dashDir * DASH_SPEED;
    player.vy = 0;
    input.jumpPressed = false;
    input.jumpReleased = false;
    input.dashPressed = false;
  } else {
    tryDash();
    const accel = player.onGround ? 3200 : 2200;
    const maxSpeed = 280;
    const friction = player.onGround ? 2400 : 400;
    if (input.left) {
      player.vx -= accel * dt;
      player.facing = -1;
    } else if (input.right) {
      player.vx += accel * dt;
      player.facing = 1;
    } else {
      const s = Math.sign(player.vx);
      player.vx -= s * friction * dt;
      if (Math.sign(player.vx) !== s) player.vx = 0;
    }
    player.vx = Math.max(-maxSpeed, Math.min(maxSpeed, player.vx));
  }

  const wasGrounded = player.onGround;

  if (player.onGround) {
    player.coyote = COYOTE_TIME;
    player.airJumps = player.maxAirJumps;
  } else {
    player.coyote = Math.max(0, player.coyote - dt);
  }

  if (input.jumpPressed) player.jumpBuffer = JUMP_BUFFER;
  else player.jumpBuffer = Math.max(0, player.jumpBuffer - dt);
  input.jumpPressed = false;

  if (player.dashTimer <= 0 && player.jumpBuffer > 0) {
    if (player.coyote > 0) {
      player.vy = JUMP_VELOCITY;
      player.onGround = false;
      player.coyote = 0;
      player.jumpBuffer = 0;
      player.jumpCutExempt = false;
      sfx.jump();
    } else if (player.airJumps > 0) {
      player.vy = DOUBLE_JUMP_VELOCITY;
      player.airJumps -= 1;
      player.jumpBuffer = 0;
      player.jumpCutExempt = false;
      sfx.doubleJump();
    }
  }

  if (input.jumpReleased) {
    if (!player.jumpCutExempt && player.vy < JUMP_CUT_THRESHOLD) {
      player.vy *= JUMP_CUT_FACTOR;
    }
    input.jumpReleased = false;
  }

  if (player.dashTimer <= 0) {
    player.vy = Math.min(MAX_FALL, player.vy + GRAVITY * dt);
  }

  player.prevX = player.x;
  player.prevY = player.y;
  const falling = player.vy > 40;
  const platforms = solidPlatforms();

  player.x += player.vx * dt;
  resolveAxis(player, platforms, "x", player.prevX);

  player.onGround = false;
  player.y += player.vy * dt;
  resolveAxis(player, platforms, "y", player.prevY);

  if (player.y > pitY()) {
    hitPlayer(true);
    return;
  }

  if (player.onGround) {
    if (!wasGrounded && falling && !player.suppressLand) sfx.land();
    player.suppressLand = false;
    player.jumpCutExempt = false;
    if (isSafeStanding(player.x, player.y)) {
      setCheckpoint(player.x, player.y);
    }
    // Collapse platforms underfoot
    for (const p of level.platforms) {
      if (p.kind !== "collapse" || p.fallen) continue;
      if (
        player.x + player.w > p.x &&
        player.x < p.x + p.w &&
        Math.abs(player.y + player.h - p.y) < 3
      ) {
        if (p.collapseTimer <= 0) p.collapseTimer = 0.45;
      }
    }
  }

  if (player.dashTimer > 0) player.anim = "run";
  else if (!player.onGround) player.anim = player.vy < 0 ? "jump" : "fall";
  else if (Math.abs(player.vx) > 20) player.anim = "run";
  else player.anim = "idle";

  const speeds = { idle: 0.18, run: 0.08, jump: 0.12, fall: 0.12 };
  player.frameTimer += dt;
  if (player.frameTimer > speeds[player.anim]) {
    player.frameTimer = 0;
    player.frame = (player.frame + 1) % 4;
  }

  if (player.invuln > 0) player.invuln = Math.max(0, player.invuln - dt);
  pushReplaySample();
}

function bossPhase(e) {
  const ratio = e.hp / e.maxHp;
  if (ratio > 0.62) return 1;
  if (ratio > 0.28) return 2;
  return 3;
}

/** Top Y of a solid platform under a world X near the enemy's feet, if any. */
function floorYUnder(e, atX) {
  const feetY = e.y + e.h;
  let best = null;
  for (const p of level.platforms) {
    if (p.fallen) continue;
    if (atX < p.x || atX > p.x + p.w) continue;
    // Prefer the platform the feet are already on / just above.
    if (p.y < e.y - TILE) continue;
    if (p.y > feetY + TILE * 0.5) continue;
    if (best === null || p.y < best) best = p.y;
  }
  return best;
}

function hasFloorSupport(e, atX) {
  return floorYUnder(e, atX) !== null;
}

/**
 * Keep grounded enemies from walking off platform lips.
 * Returns true if horizontal velocity was reversed at an edge.
 */
function constrainGroundedEnemy(e) {
  if (!e.grounded || e.airborne) return false;
  const lead = e.vx < 0 ? e.x + 6 : e.x + e.w - 6;
  const mid = e.x + e.w * 0.5;
  if (e.vx !== 0 && !hasFloorSupport(e, lead)) {
    e.x = Math.max(e.minX, Math.min(e.maxX - e.w, e.x - Math.sign(e.vx) * 4));
    e.vx = -Math.sign(e.vx || 1) * Math.abs(e.vx || e.baseSpeed || e.speed);
    e.charging = 0;
    const floor = floorYUnder(e, e.x + e.w * 0.5);
    if (floor != null) e.y = floor - e.h;
    return true;
  }
  const floor = floorYUnder(e, mid);
  if (floor != null) e.y = floor - e.h;
  return false;
}

function updateBossChase(e, dt) {
  const playerMid = player.x + player.w * 0.5;
  const enemyMid = e.x + e.w * 0.5;
  const dx = playerMid - enemyMid;
  const dist = Math.abs(dx);
  const inArena =
    player.x + player.w > e.minX - TILE * 4 && player.x < e.maxX + TILE * 4;
  const phase = e.miniboss ? (e.hp <= 2 ? 3 : e.hp <= 3 ? 2 : 1) : bossPhase(e);
  const enraged = phase >= 3;
  const chaseSpeed = e.baseSpeed * (phase === 1 ? 1 : phase === 2 ? 1.2 : 1.4);
  const chargeMult = enraged ? 3.5 : phase === 2 ? 3.1 : 2.85;
  const chargeDur = enraged ? 0.9 : 0.7;
  const chargeCd = enraged ? 0.85 : phase === 2 ? 1.1 : 1.35;

  if (inArena && !e.engaged) {
    e.engaged = true;
    announce(e.miniboss ? BOSS_STORY.sentinelOnline : BOSS_STORY.online);
    sfx.bossRoar();
    setShake(0.25);
  }

  if (phase >= 2 && e.phaseAnnounced < 2) {
    e.phaseAnnounced = 2;
    if (!e.miniboss) {
      announce(BOSS_STORY.armorBreak);
      sfx.bossRoar();
      setShake(0.28);
    }
  }
  if (enraged && e.phaseAnnounced < 3) {
    e.phaseAnnounced = 3;
    e.enrageAnnounced = true;
    announce(BOSS_STORY.overclock);
    sfx.bossRoar();
    setShake(0.3);
  }

  // Phase 2/3 aerial slam — stay inside arena X, land on floor under the boss.
  e.slamTimer = Math.max(0, e.slamTimer - dt);
  if (e.airborne) {
    e.vy += GRAVITY * 1.1 * dt;
    e.y += e.vy * dt;
    const nextX = e.x + Math.sign(dx) * chaseSpeed * 0.55 * dt;
    const clampedX = Math.max(e.minX, Math.min(e.maxX - e.w, nextX));
    // Only slide horizontally when the landing column still has floor.
    if (hasFloorSupport({ ...e, x: clampedX }, clampedX + e.w * 0.5)) {
      e.x = clampedX;
    } else {
      e.x = Math.max(e.minX, Math.min(e.maxX - e.w, e.x));
    }
    const floorY = floorYUnder(e, e.x + e.w * 0.5);
    const ground = floorY != null ? floorY : e.minY + e.h;
    if (e.y + e.h >= ground) {
      e.y = ground - e.h;
      e.vy = 0;
      e.airborne = false;
      e.slamTimer = enraged ? 1.1 : 1.6;
      setShake(0.22);
      sfx.bossCharge();
      constrainGroundedEnemy(e);
    }
    return;
  }

  // Miniboss stays grounded on its arena ledge (no mid-air leaps off thin towers).
  if (
    inArena &&
    !e.miniboss &&
    phase >= 2 &&
    e.slamTimer <= 0 &&
    e.charging <= 0 &&
    dist < 360
  ) {
    e.airborne = true;
    e.vy = enraged ? -780 : -620;
    e.charging = 0;
    return;
  }

  e.chargeCd = Math.max(0, e.chargeCd - dt);
  if (e.charging > 0) {
    e.charging = Math.max(0, e.charging - dt);
    const dir = Math.sign(e.vx) || Math.sign(dx) || 1;
    e.vx = dir * chaseSpeed * chargeMult;
  } else if (inArena && dist > 12) {
    e.vx = Math.sign(dx) * chaseSpeed;
    if (dist > 40 && dist < 480 && e.chargeCd <= 0) {
      e.charging = chargeDur;
      e.chargeCd = chargeCd;
      e.vx = Math.sign(dx) * chaseSpeed * chargeMult;
      sfx.bossCharge();
    }
  } else if (!inArena) {
    if (Math.abs(e.vx) < 1) e.vx = e.baseSpeed;
  }

  e.x += e.vx * dt;
  if (e.x < e.minX) {
    e.x = e.minX;
    e.vx = Math.abs(e.vx);
    e.charging = 0;
  } else if (e.x + e.w > e.maxX) {
    e.x = e.maxX - e.w;
    e.vx = -Math.abs(e.vx);
    e.charging = 0;
  }
  constrainGroundedEnemy(e);
}

function registerStomp(e) {
  const next = nextComboOnStomp(combo, comboTimer);
  setCombo(next);
  setComboTimer(COMBO_WINDOW);
  if (next > 1 && next % COMBO_BONUS_EVERY === 0) {
    awardScore(COMBO_BONUS_DATA);
    sfx.combo();
    announce(`COMBO x${next}`);
  }
}

export function updateEnemies(dt) {
  for (const e of level.enemies) {
    if (state !== "playing") return;
    if (!e.alive) continue;

    e.bob += dt * e.bobSpeed;
    if (e.flash > 0) e.flash = Math.max(0, e.flash - dt);

    if (e.chase) {
      updateBossChase(e, dt);
    } else if (e.axis === "y") {
      e.y += e.vy * dt;
      if (e.y < e.minY) {
        e.y = e.minY;
        e.vy = Math.abs(e.speed);
      } else if (e.y + e.h > e.maxY) {
        e.y = e.maxY - e.h;
        e.vy = -Math.abs(e.speed);
      }
    } else {
      e.x += e.vx * dt;
      if (e.x < e.minX) {
        e.x = e.minX;
        e.vx = Math.abs(e.speed);
      } else if (e.x + e.w > e.maxX) {
        e.x = e.maxX - e.w;
        e.vx = -Math.abs(e.speed);
      }
      if (e.grounded) constrainGroundedEnemy(e);
    }

    if (e.type === "rex" || e.type === "rexBoss" || e.type === "towerSentinel") {
      const chargeBoost = e.charging > 0 ? 2.2 : 1;
      e.walk += dt * (4.2 + Math.abs(e.vx) * 0.035) * chargeBoost;
    }

    const body = enemyBody(e);
    if (!aabb(player, body)) continue;

    const prevBottom = player.prevY + player.h;
    const stomping =
      player.vy > 0 &&
      prevBottom <= body.y + STOMP_SLACK &&
      player.y + player.h >= body.y;

    if (stomping) {
      player.vy = STOMP_BOUNCE;
      player.jumpCutExempt = true;
      player.invuln = Math.max(player.invuln, INVULN_STOMP);
      e.hp -= 1;
      e.charging = 0;
      e.airborne = false;
      if (e.boss) e.chargeCd = Math.min(e.chargeCd, 0.35);
      registerStomp(e);

      if (e.hp <= 0) {
        e.alive = false;
        awardScore(e.score);
        addRunStomp(1);
        setShake(e.boss ? 0.45 : 0.15);
        setHitStop(e.boss ? 0.14 : e.type === "armored" ? 0.1 : 0.05);
        updateHud();
        sfx.stomp();
        if (e.boss) {
          sfx.bossDefeat();
          announce(e.miniboss ? BOSS_STORY.sentinelDown : BOSS_STORY.down);
        }
      } else {
        e.flash = 0.35;
        setShake(e.boss ? 0.16 : 0.08);
        setHitStop(e.boss ? 0.1 : e.type === "armored" ? 0.08 : 0.04);
        sfx.stomp();
      }
      return;
    }

    if (!hitPlayer()) continue;
    return;
  }
}

export function updateCoins(dt) {
  if (state !== "playing") return;
  for (const c of level.coins) {
    if (c.taken) continue;
    c.phase += dt * 4;
    const box = {
      x: c.x - c.r,
      y: c.y - c.r,
      w: c.r * 2,
      h: c.r * 2,
    };
    if (aabb(player, box)) {
      c.taken = true;
      awardScore(SCORE_PACK);
      addRunCoin(1);
      updateHud();
      sfx.coin();
    }
  }
}

export function updateHazards(dt) {
  if (state !== "playing") return;
  const bpm = getSectorTheme(levelIndex).bpm;
  const beat = 60 / bpm;

  for (const h of level.hazards) {
    if (h.kind === "laser") {
      const period = h.period || 1.2;
      const t = (performance.now() / 1000 + h.phase * period) % period;
      h.on = t < period * 0.45;
    } else if (h.kind === "electric") {
      h.on = true;
      h.pulse = 0.5 + 0.5 * Math.sin((performance.now() / 1000) * (Math.PI * 2) / beat);
    }

    if (h.kind === "laser" && !h.on) continue;

    if (
      segmentHitsRect(
        player.prevX,
        player.prevY,
        player.x,
        player.y,
        player.w,
        player.h,
        h
      )
    ) {
      if (!hitPlayer()) continue;
      return;
    }
  }
}

export function updateCollapse(dt) {
  for (const p of level.platforms) {
    if (p.kind !== "collapse") continue;
    if (p.fallen) {
      p.respawnTimer -= dt;
      if (p.respawnTimer <= 0) {
        p.fallen = false;
        p.collapseTimer = 0;
        p.shake = 0;
      }
      continue;
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
}

export function updateCheckpoints() {
  if (state !== "playing") return;
  for (const c of level.checkpoints) {
    if (c.activated) continue;
    if (!aabb(player, c)) continue;
    c.activated = true;
    setCheckpoint(c.x + 8, c.y - player.h);
    player.invuln = Math.max(player.invuln, 0.45);
    sfx.checkpoint();
    announce("CHECKPOINT");
  }
}

function formatClock(s) {
  const mins = Math.floor(s / 60);
  const secs = Math.floor(s % 60);
  const ms = Math.floor((s % 1) * 100);
  return `${mins}:${String(secs).padStart(2, "0")}.${String(ms).padStart(2, "0")}`;
}

function completeSectorOrRun() {
  if (practiceMode) {
    setState("won");
    stopMusic();
    sfx.win();
    presentRunEnd(
      "won",
      "PRACTICE CLEAR",
      "Rex core jacked. Drill again or abort to title.",
      "RETRY REX",
      "REX CORE"
    );
    return;
  }

  const { improved, best } = recordSectorTime(levelIndex, sectorElapsed);
  if (runMode === "timeAttack") {
    setState("won");
    stopMusic();
    sfx.win();
    const clock = formatClock(sectorElapsed);
    const note = improved
      ? `Sector clear in ${clock}. NEW BEST.`
      : `Sector clear in ${clock}. Best ${best > 0 ? formatClock(best) : "--"}.`;
    presentRunEnd("won", "TIME TRIAL", note, "RUN AGAIN", `SECTOR ${level.sector}`);
    return;
  }

  if (levelIndex < getLevelCount() - 1) {
    unlockSector(levelIndex + 1);
    const next = getLevelDef(levelIndex + 1);
    setState("cleared");
    stopMusic();
    sfx.clear();
    setOverlay(
      true,
      "SECTOR CLEARED",
      formatSectorClearTagline(levelIndex, score, next),
      "JACK DEEPER",
      `SECTOR ${level.sector}`
    );
    return;
  }

  unlockSector(getLevelCount() - 1);
  considerScoreUnlocks(score);
  markCleared(runMode === "lockdown");
  const prevBest = getBestClearTime();
  const improvedClear = prevBest === null || runElapsed < prevBest;
  recordClearTime(runElapsed);
  setState("won");
  stopMusic();
  sfx.win();
  const clearClock = formatClock(runElapsed);
  const bestNote = improvedClear
    ? ` Clear ${clearClock} — NEW BEST.`
    : ` Clear ${clearClock}. Best ${formatClock(prevBest)}.`;
  const tag =
    (runMode === "lockdown" ? RUN_STORY.lockdownWin(score) : RUN_STORY.win(score)) +
    bestNote;
  presentRunEnd("won", "JACKPOT", tag, "RUN AGAIN", `SECTOR ${level.sector}`);
}

export function updateExit() {
  if (state !== "playing") return;
  if (!aabb(player, level.exit)) return;

  if (isExitLocked()) {
    const boss = getLivingBoss();
    if (boss && !boss.lockAnnounced) {
      boss.lockAnnounced = true;
      announce(BOSS_STORY.exitLocked);
      sfx.ui();
    }
    player.x = Math.min(player.x, level.exit.x - player.w - 2);
    if (player.vx > 0) player.vx = -120;
    return;
  }

  completeSectorOrRun();
}

export function updateCamera(dt) {
  const targetX = player.x + player.w / 2 - W * 0.38;
  const targetY = player.y + player.h / 2 - H * 0.55;
  camera.x += (targetX - camera.x) * Math.min(1, dt * 6);
  camera.y += (targetY - camera.y) * Math.min(1, dt * 4);
  camera.x = Math.max(0, Math.min(level.width - W, camera.x));
  camera.y = Math.max(0, Math.min(level.height - H, camera.y));

  if (shake > 0 && !reduceMotion) {
    decayShake(dt);
    setShakeOffset((Math.random() - 0.5) * 10 * shake, (Math.random() - 0.5) * 8 * shake);
  } else {
    decayShake(dt);
    setShakeOffset(0, 0);
  }
}

export function finalizeReplayIfDone(elapsed) {
  if (state !== "replaying") return;
  if (elapsed >= 2) {
    setState("dead");
    finishDeathPresentation();
  }
}
