import {
  COMBO_WINDOW,
  DASH_COOLDOWN,
  DASH_DURATION,
  DASH_SPEED,
  DOUBLE_JUMP_VELOCITY,
  GRAVITY,
  INVULN_HIT,
  INVULN_STOMP,
  JUMP_CUT_FACTOR,
  JUMP_CUT_THRESHOLD,
  JUMP_VELOCITY,
  MAX_FALL,
  SCORE_PACK,
  STOMP_BOUNCE,
  TILE,
} from "./constants.js";
import { W, H } from "./dom.js";
import { input } from "./input.js";
import {
  armCollapsePlatform,
  advanceProjectile,
  bossPhaseFromHp,
  buildLevel,
  checkpointTouchResult,
  electricHazardPulse,
  enemyBody,
  floorYUnderEntity,
  getLevelCount,
  getLevelDef,
  getLivingBoss,
  hasFloorSupportAt,
  isExitLocked,
  isLaserHazardOn,
  isSafeStandingAt,
  isStompHit,
  makeTurretBolt,
  minibossPhaseFromHp,
  projectileCanHurtPlayer,
  projectileExpired,
  resolveBossAirborneGroundY,
  resolveBossAirborneSlideX,
  solidPlatforms,
  stepPatrol1D,
  tickCollapsePlatform,
  turretCanFire,
} from "./level.js";
import {
  aabb,
  capWallSlideFall,
  integrateRunVelocity,
  resolveAxis,
  segmentHitsRect,
  shouldApplyRunClamp,
  wallClingDir,
  wallJumpVelocity,
} from "./physics.js";
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
  abilitiesForSector,
  comboBonusForStomp,
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
  tickCoyote,
  tickInvuln,
  tickJumpBuffer,
  tickWallClingGrace,
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

let abilityAnnouncedWall = false;
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
  const { maxAirJumps, canDash, canWallCling } = abilitiesForSector(levelIndex);
  player.maxAirJumps = maxAirJumps;
  player.canDash = canDash;
  player.canWallCling = canWallCling;
  if (player.canWallCling && !abilityAnnouncedWall) {
    abilityAnnouncedWall = true;
    announce(ABILITY_STORY.wallCling);
  }
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
  return isSafeStandingAt(feet, player.onGround, level.hazards, level.enemies, level.platforms);
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
  player.wallDir = 0;
  player.wallCling = 0;
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
    abilityAnnouncedWall = false;
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
  player.wallDir = 0;
  player.wallCling = 0;
  sfx.dash();
}

function detectWallCling(dt) {
  if (!player.canWallCling || player.onGround || player.dashTimer > 0) {
    player.wallDir = 0;
    player.wallCling = 0;
    return;
  }
  const dir = wallClingDir(player, solidPlatforms(), input.left, input.right);
  const next = tickWallClingGrace(player.wallCling, player.wallDir, dir, dt);
  player.wallDir = next.wallDir;
  player.wallCling = next.wallCling;
}

function tryWallJump() {
  if (player.wallCling <= 0 || player.wallDir === 0 || player.onGround) return false;
  const impulse = wallJumpVelocity(player.wallDir);
  player.vy = impulse.vy;
  player.vx = impulse.vx;
  player.facing = impulse.facing;
  player.wallCling = 0;
  player.wallDir = 0;
  player.jumpBuffer = 0;
  player.coyote = 0;
  player.jumpCutExempt = false;
  sfx.jump();
  return true;
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
    // A dash started this frame: keep its full velocity (don't run the normal
    // ground-movement accel/friction, which would clamp vx down to maxSpeed).
    if (shouldApplyRunClamp(player.dashTimer)) {
      if (input.left) player.facing = -1;
      else if (input.right) player.facing = 1;
      player.vx = integrateRunVelocity(player.vx, {
        left: input.left,
        right: input.right,
        onGround: player.onGround,
        dt,
      });
    }
  }

  const wasGrounded = player.onGround;

  if (player.onGround) player.airJumps = player.maxAirJumps;
  player.coyote = tickCoyote(player.coyote, player.onGround, dt);
  player.jumpBuffer = tickJumpBuffer(player.jumpBuffer, input.jumpPressed, dt);
  input.jumpPressed = false;

  if (player.dashTimer <= 0 && player.jumpBuffer > 0) {
    if (tryWallJump()) {
      /* wall jump consumed the buffer */
    } else if (player.coyote > 0) {
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
    player.vy = capWallSlideFall(player.vy, player.wallCling, player.wallDir);
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
  detectWallCling(dt);

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
      if (
        player.x + player.w > p.x &&
        player.x < p.x + p.w &&
        Math.abs(player.y + player.h - p.y) < 3
      ) {
        armCollapsePlatform(p);
      }
    }
  }

  if (player.dashTimer > 0) player.anim = "run";
  else if (player.wallCling > 0 && player.wallDir !== 0 && !player.onGround) {
    player.anim = "cling";
  } else if (!player.onGround) player.anim = player.vy < 0 ? "jump" : "fall";
  else if (Math.abs(player.vx) > 20) player.anim = "run";
  else player.anim = "idle";

  const speeds = { idle: 0.18, run: 0.08, jump: 0.12, fall: 0.12, cling: 0.16 };
  player.frameTimer += dt;
  if (player.frameTimer > (speeds[player.anim] || 0.12)) {
    player.frameTimer = 0;
    player.frame = (player.frame + 1) % 4;
  }

  if (player.invuln > 0) player.invuln = tickInvuln(player.invuln, dt);
  pushReplaySample();
}

function bossPhase(e) {
  return bossPhaseFromHp(e.hp, e.maxHp);
}

/** Top Y of a solid platform under a world X near the enemy's feet, if any. */
function floorYUnder(e, atX) {
  return floorYUnderEntity(level.platforms, e, atX);
}

function hasFloorSupport(e, atX) {
  return hasFloorSupportAt(level.platforms, e, atX);
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
  const phase = e.miniboss ? minibossPhaseFromHp(e.hp) : bossPhase(e);
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
    e.x = resolveBossAirborneSlideX(e, dx, chaseSpeed, dt, level.platforms);
    const ground = resolveBossAirborneGroundY(level.platforms, e);
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
  const bonus = comboBonusForStomp(next);
  if (bonus > 0) {
    awardScore(bonus);
    sfx.combo();
    announce(`COMBO x${next}`);
  }
}

function updateTurret(e, dt) {
  e.vx = 0;
  e.vy = 0;
  e.fireCd = Math.max(0, e.fireCd - dt);
  if (!level.projectiles) level.projectiles = [];
  const dx = player.x + player.w * 0.5 - (e.x + e.w * 0.5);
  const dy = player.y + player.h * 0.5 - (e.y + e.h * 0.35);
  const dist = Math.hypot(dx, dy);
  if (turretCanFire(e.fireCd, dist, dy)) {
    const dir = Math.sign(dx) || 1;
    level.projectiles.push(makeTurretBolt(e, dir));
    e.fireCd = 0.85;
    sfx.turret();
  }
}

export function updateProjectiles(dt) {
  if (state !== "playing") return;
  if (!level.projectiles) level.projectiles = [];
  for (let i = level.projectiles.length - 1; i >= 0; i--) {
    const p = level.projectiles[i];
    const next = advanceProjectile(p, dt);
    p.life = next.life;
    p.x = next.x;
    p.y = next.y;
    if (projectileExpired(p.life)) {
      level.projectiles.splice(i, 1);
      continue;
    }
    if (aabb(player, p)) {
      // While invulnerable, let bolts pass through so they stay visible.
      if (!projectileCanHurtPlayer(player.invuln)) continue;
      level.projectiles.splice(i, 1);
      if (!hitPlayer()) continue;
      return;
    }
  }
}

export function updateEnemies(dt) {
  for (const e of level.enemies) {
    if (state !== "playing") return;
    if (!e.alive) continue;

    e.bob += dt * e.bobSpeed;
    if (e.flash > 0) e.flash = Math.max(0, e.flash - dt);

    if (e.turret) {
      updateTurret(e, dt);
    } else if (e.chase) {
      updateBossChase(e, dt);
    } else if (e.axis === "y") {
      const stepped = stepPatrol1D(e.y, e.h, e.vy, e.minY, e.maxY, e.speed, dt);
      e.y = stepped.pos;
      e.vy = stepped.vel;
    } else {
      const stepped = stepPatrol1D(e.x, e.w, e.vx, e.minX, e.maxX, e.speed, dt);
      e.x = stepped.pos;
      e.vx = stepped.vel;
      if (e.grounded) constrainGroundedEnemy(e);
    }

    if (e.type === "rex" || e.type === "rexBoss" || e.type === "towerSentinel") {
      const chargeBoost = e.charging > 0 ? 2.2 : 1;
      e.walk += dt * (4.2 + Math.abs(e.vx) * 0.035) * chargeBoost;
    }

    const body = enemyBody(e);
    if (!aabb(player, body)) continue;

    const prevBottom = player.prevY + player.h;
    const stomping = isStompHit(
      player.vy,
      prevBottom,
      body.y,
      player.y + player.h
    );

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
      h.on = isLaserHazardOn(performance.now() / 1000, h.phase, h.period || 1.2);
    } else if (h.kind === "electric") {
      h.on = true;
      h.pulse = electricHazardPulse(performance.now() / 1000, beat);
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
    tickCollapsePlatform(p, dt);
  }
}

export function updateCheckpoints() {
  if (state !== "playing") return;
  for (const c of level.checkpoints) {
    const result = checkpointTouchResult(player, c, player.h);
    if (!result) continue;
    c.activated = true;
    setCheckpoint(result.spawn.x, result.spawn.y);
    player.invuln = Math.max(player.invuln, result.invulnBoost);
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
