import {
  BOSS_FANFARE_DURATION,
  COMBO_WINDOW,
  COYOTE_TIME,
  GRAVITY,
  HARD_COYOTE_TIME,
  HARD_JUMP_BUFFER,
  HARD_START_LIVES,
  INVULN_HIT,
  INVULN_STOMP,
  JUMP_BUFFER,
  JUMP_CUT_FACTOR,
  JUMP_CUT_THRESHOLD,
  JUMP_VELOCITY,
  MAX_FALL,
  POWERUP_MAGNET_DURATION,
  POWERUP_MAGNET_RADIUS,
  POWERUP_SHIELD_DURATION,
  POWERUP_SPEED_DURATION,
  POWERUP_SPEED_MULT,
  SCORE_COMBO_STEP,
  SCORE_PACK,
  START_LIVES,
  STOMP_BOUNCE,
  STOMP_SLACK,
  TILE,
  WALL_CLING_GRACE,
  WALL_JUMP_VX,
  WALL_JUMP_VY,
  WALL_SLIDE_SPEED,
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
  spawnRuntimeEnemy,
} from "./level.js";
import { aabb, resolveAxis, segmentHitsRect } from "./physics.js";
import { sfx, stopMusic } from "./audio.js";
import { recordClearTime, unlockSector } from "./progress.js";
import {
  addRunCoin,
  addRunStomp,
  addScore,
  camera,
  checkpoint,
  combo,
  comboTimer,
  decayShake,
  hardMode,
  level,
  levelIndex,
  lives,
  magnetBoost,
  player,
  practiceMode,
  reduceMotion,
  resetRunStats,
  runElapsed,
  score,
  setCombo,
  setLevelIndex,
  setLives,
  setMagnetBoost,
  setPracticeMode,
  setScore,
  setShake,
  setShakeOffset,
  setShieldBoost,
  setSpeedBoost,
  setState,
  shake,
  shieldBoost,
  speedBoost,
  state,
} from "./state.js";
import {
  BOSS_STORY,
  formatSectorClearTagline,
  RUN_STORY,
} from "./story.js";
import { announce, setOverlay, updateHud, presentRunEnd } from "./ui.js";

function awardScore(delta) {
  const gained = addScore(delta);
  if (gained > 0) {
    const label = gained === 1 ? "EXTRA LIFE" : `${gained} EXTRA LIVES`;
    announce(`${label}. Lives ${lives}.`);
    sfx.extraLife();
  }
  return gained;
}

function coyoteTime() {
  return hardMode ? HARD_COYOTE_TIME : COYOTE_TIME;
}

function jumpBufferTime() {
  return hardMode ? HARD_JUMP_BUFFER : JUMP_BUFFER;
}

function startLives() {
  return hardMode ? HARD_START_LIVES : START_LIVES;
}

export function setCheckpoint(x, y) {
  checkpoint.x = x;
  checkpoint.y = y;
}

function isSafeStanding(px, py) {
  const feet = { x: px, y: py, w: player.w, h: player.h };
  for (const h of level.hazards) {
    if (aabb(feet, h)) return false;
  }
  for (const e of level.enemies) {
    if (!e.alive) continue;
    if (aabb(feet, enemyBody(e))) return false;
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
  player.anim = "idle";
  player.frame = 0;
  player.frameTimer = 0;
  player.invuln = INVULN_HIT;
  player.jumpCutExempt = false;
  player.suppressLand = true;
  player.wallDir = 0;
  player.wallCling = 0;
}

/**
 * @param {boolean} full
 * @param {{ startIndex?: number, practice?: boolean }} [opts]
 */
export function resetRun(full = false, opts = {}) {
  if (full) {
    const startIndex = Math.max(0, Math.min(getLevelCount() - 1, opts.startIndex ?? 0));
    setPracticeMode(!!opts.practice);
    setLevelIndex(startIndex);
    setScore(0);
    setLives(startLives());
    resetRunStats();
  }
  buildLevel(levelIndex);
  setCheckpoint(level.spawn.x, level.spawn.y);
  resetPlayer(checkpoint);
  camera.x = 0;
  camera.y = 0;
  setShake(0);
  setShakeOffset(0, 0);
  updateHud();
}

export function advanceLevel() {
  const next = levelIndex + 1;
  if (next >= getLevelCount()) return false;
  setLevelIndex(next);
  buildLevel(next);
  setCheckpoint(level.spawn.x, level.spawn.y);
  resetPlayer(checkpoint);
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

export function hitPlayer(force = false) {
  if (state !== "playing") return false;
  if (!force && (player.invuln > 0 || shieldBoost > 0)) return false;

  const nextLives = lives - 1;
  setLives(Math.max(0, nextLives));
  setShake(0.35);
  setCombo(0, 0);
  updateHud();

  if (nextLives <= 0) {
    setState("dead");
    player.invuln = Infinity;
    stopMusic();
    sfx.die();
    if (!practiceMode) {
      presentRunEnd("dead", "SYSTEM CRASH", RUN_STORY.death, "REBOOT");
    } else {
      setOverlay(true, "PRACTICE CRASH", RUN_STORY.death, "RETRY REX", "REX CORE");
    }
    return true;
  }

  sfx.hit();
  resetPlayer(checkpoint);
  return true;
}

function detectWallCling(dt) {
  if (player.onGround) {
    player.wallDir = 0;
    player.wallCling = 0;
    return;
  }
  const probe = 3;
  let dir = 0;
  for (const p of level.platforms) {
    const overlapY = player.y + player.h > p.y + 4 && player.y < p.y + p.h - 4;
    if (!overlapY) continue;
    if (player.x + player.w >= p.x && player.x + player.w <= p.x + probe && input.right) {
      dir = 1;
      break;
    }
    if (player.x <= p.x + p.w && player.x >= p.x + p.w - probe && input.left) {
      dir = -1;
      break;
    }
  }
  if (dir !== 0) {
    player.wallDir = dir;
    player.wallCling = WALL_CLING_GRACE;
  } else {
    player.wallCling = Math.max(0, player.wallCling - dt);
    if (player.wallCling <= 0) player.wallDir = 0;
  }
}

export function updatePlayer(dt) {
  const accel = player.onGround ? 3200 : 2200;
  const speedMult = speedBoost > 0 ? POWERUP_SPEED_MULT : 1;
  const maxSpeed = 280 * speedMult;
  const friction = player.onGround ? 2400 : 400;
  const wasGrounded = player.onGround;

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

  if (player.onGround) player.coyote = coyoteTime();
  else player.coyote = Math.max(0, player.coyote - dt);

  if (input.jumpPressed) player.jumpBuffer = jumpBufferTime();
  else player.jumpBuffer = Math.max(0, player.jumpBuffer - dt);
  input.jumpPressed = false;

  if (player.jumpBuffer > 0 && player.wallCling > 0 && player.wallDir !== 0 && !player.onGround) {
    player.vy = WALL_JUMP_VY;
    player.vx = -player.wallDir * WALL_JUMP_VX;
    player.facing = -player.wallDir;
    player.wallCling = 0;
    player.wallDir = 0;
    player.jumpBuffer = 0;
    player.coyote = 0;
    player.jumpCutExempt = false;
    sfx.jump();
  } else if (player.jumpBuffer > 0 && player.coyote > 0) {
    player.vy = JUMP_VELOCITY;
    player.onGround = false;
    player.coyote = 0;
    player.jumpBuffer = 0;
    player.jumpCutExempt = false;
    sfx.jump();
  }

  if (input.jumpReleased) {
    if (!player.jumpCutExempt && player.vy < JUMP_CUT_THRESHOLD) {
      player.vy *= JUMP_CUT_FACTOR;
    }
    input.jumpReleased = false;
  }

  player.vy = Math.min(MAX_FALL, player.vy + GRAVITY * dt);
  if (player.wallCling > 0 && player.wallDir !== 0 && player.vy > 0) {
    player.vy = Math.min(player.vy, WALL_SLIDE_SPEED);
  }

  player.prevX = player.x;
  player.prevY = player.y;
  const falling = player.vy > 40;

  player.x += player.vx * dt;
  resolveAxis(player, level.platforms, "x", player.prevX);

  player.onGround = false;
  player.y += player.vy * dt;
  resolveAxis(player, level.platforms, "y", player.prevY);
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
  }

  if (player.wallCling > 0 && player.wallDir !== 0 && !player.onGround) {
    player.anim = "fall";
  } else if (!player.onGround) {
    player.anim = player.vy < 0 ? "jump" : "fall";
  } else if (Math.abs(player.vx) > 20) {
    player.anim = "run";
  } else {
    player.anim = "idle";
  }

  const speeds = { idle: 0.18, run: 0.08, jump: 0.12, fall: 0.12 };
  player.frameTimer += dt;
  if (player.frameTimer > speeds[player.anim]) {
    player.frameTimer = 0;
    player.frame = (player.frame + 1) % 4;
  }

  if (player.invuln > 0) player.invuln = Math.max(0, player.invuln - dt);
  if (speedBoost > 0) setSpeedBoost(speedBoost - dt);
  if (magnetBoost > 0) setMagnetBoost(magnetBoost - dt);
  if (shieldBoost > 0) setShieldBoost(shieldBoost - dt);
  if (comboTimer > 0) {
    const next = comboTimer - dt;
    if (next <= 0) setCombo(0, 0);
    else setCombo(combo, next);
  }
}

function spawnShockwave(x, y, facing) {
  level.shockwaves.push({
    x: x - 20,
    y: y + 20,
    w: 40,
    h: 28,
    vx: facing * 420,
    life: 0.55,
    hurt: true,
  });
}

function updateBossChase(e, dt) {
  const playerMid = player.x + player.w * 0.5;
  const enemyMid = e.x + e.w * 0.5;
  const dx = playerMid - enemyMid;
  const dist = Math.abs(dx);
  const inArena =
    player.x + player.w > e.minX - TILE * 4 && player.x < e.maxX + TILE * 4;
  const phase2 = e.hp <= Math.ceil(e.maxHp * 0.5) || hardMode;
  const phase3 = e.hp <= Math.ceil(e.maxHp * 0.25);
  const chaseSpeed = e.speed * (phase2 ? 1.35 : 1) * (hardMode ? 1.12 : 1);
  const chargeMult = phase2 ? 3.4 : 2.95;
  const chargeDur = phase2 ? 0.85 : 0.7;
  const chargeCd = phase2 ? 0.95 : 1.35;

  if (inArena && !e.engaged) {
    e.engaged = true;
    announce(BOSS_STORY.online);
    sfx.bossRoar();
    setShake(0.25);
  }

  if (phase2 && !e.enrageAnnounced) {
    e.enrageAnnounced = true;
    announce(BOSS_STORY.overclock);
    sfx.bossRoar();
    setShake(0.3);
  }

  if (phase3 && !e.phase3Announced) {
    e.phase3Announced = true;
    announce("CYBER-REX PHASE 3. SWARM PROTOCOL.");
    sfx.bossRoar();
    setShake(0.35);
    // Summon escort drones + temporary floor spikes
    spawnRuntimeEnemy("swarm", e.minX + TILE * 2, e.y, e.minX, e.maxX);
    spawnRuntimeEnemy("swarm", e.maxX - TILE * 4, e.y, e.minX, e.maxX);
    spawnRuntimeEnemy("needle", e.x, e.y - TILE, e.minX, e.maxX);
    const floorY = 11.65;
    for (const tx of [10, 18, 26]) {
      const hit = {
        x: tx * TILE,
        y: floorY * TILE,
        w: 2.2 * TILE,
        h: 0.35 * TILE,
        drawX: (tx - 0.15) * TILE,
        drawY: (floorY - 0.15) * TILE,
        drawW: 2.5 * TILE,
        drawH: 0.5 * TILE,
        temporary: true,
        life: 12,
      };
      level.hazards.push(hit);
    }
  }

  e.chargeCd = Math.max(0, e.chargeCd - dt);
  const wasCharging = e.charging > 0;
  if (e.charging > 0) {
    e.charging = Math.max(0, e.charging - dt);
    const dir = Math.sign(e.vx) || Math.sign(dx) || 1;
    e.vx = dir * chaseSpeed * chargeMult;
    if (wasCharging && e.charging <= 0 && phase2) {
      spawnShockwave(e.x + e.w * 0.5, e.y + e.h - 30, dir);
      sfx.shockwave();
      setShake(0.2);
    }
  } else if (inArena && dist > 12) {
    e.vx = Math.sign(dx) * chaseSpeed;
    if (dist > 40 && dist < 480 && e.chargeCd <= 0) {
      e.charging = chargeDur;
      e.chargeCd = chargeCd;
      e.vx = Math.sign(dx) * chaseSpeed * chargeMult;
      sfx.bossCharge();
    }
  } else if (!inArena) {
    if (Math.abs(e.vx) < 1) e.vx = e.speed;
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
}

function updateTurret(e, dt) {
  e.vx = 0;
  e.fireCd = Math.max(0, e.fireCd - dt);
  const dx = player.x + player.w * 0.5 - (e.x + e.w * 0.5);
  const dy = player.y + player.h * 0.5 - (e.y + e.h * 0.35);
  const dist = Math.hypot(dx, dy);
  if (dist < TILE * 14 && e.fireCd <= 0 && Math.abs(dy) < TILE * 3.5) {
    const dir = Math.sign(dx) || 1;
    level.projectiles.push({
      x: e.x + e.w * 0.5 - 6,
      y: e.y + e.h * 0.35,
      w: 14,
      h: 8,
      vx: dir * 320,
      vy: 0,
      life: 2.2,
    });
    e.fireCd = hardMode ? 1.05 : 1.35;
    sfx.turret();
  }
}

function registerStompKill(e) {
  const nextCombo = comboTimer > 0 ? combo + 1 : 1;
  setCombo(nextCombo, COMBO_WINDOW);
  let points = e.score;
  if (nextCombo > 1) {
    const bonus = (nextCombo - 1) * SCORE_COMBO_STEP;
    points += bonus;
    announce(`COMBO x${nextCombo} +${bonus} DATA`);
  }
  awardScore(points);
  addRunStomp(1);
}

export function updateEnemies(dt) {
  const speedScale = hardMode ? 1.12 : 1;
  for (const e of level.enemies) {
    if (state !== "playing") return;
    if (!e.alive) continue;

    e.bob += dt * e.bobSpeed;
    if (e.flash > 0) e.flash = Math.max(0, e.flash - dt);

    if (e.chase) {
      updateBossChase(e, dt);
    } else if (e.turret) {
      updateTurret(e, dt);
    } else if (e.axis === "y") {
      e.y += e.vy * dt * speedScale;
      if (e.y < e.minY) {
        e.y = e.minY;
        e.vy = Math.abs(e.speed);
      } else if (e.y + e.h > e.maxY) {
        e.y = e.maxY - e.h;
        e.vy = -Math.abs(e.speed);
      }
    } else {
      e.x += e.vx * dt * speedScale;
      if (e.x < e.minX) {
        e.x = e.minX;
        e.vx = Math.abs(e.speed);
      } else if (e.x + e.w > e.maxX) {
        e.x = e.maxX - e.w;
        e.vx = -Math.abs(e.speed);
      }
    }

    if (e.type === "rex" || e.type === "rexBoss") {
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
      if (e.boss) {
        e.chargeCd = Math.min(e.chargeCd, 0.35);
        if (e.hp > 0 && e.hp <= Math.ceil(e.maxHp * 0.5)) {
          spawnShockwave(e.x + e.w * 0.5, e.y + e.h - 30, player.facing);
        }
      }
      if (e.hp <= 0) {
        e.alive = false;
        registerStompKill(e);
        setShake(e.boss ? 0.45 : 0.15);
        updateHud();
        sfx.stomp();
        if (e.boss) {
          sfx.bossDefeat();
          sfx.victorySting();
          level.bossFanfare = BOSS_FANFARE_DURATION;
          announce(BOSS_STORY.down);
        }
      } else {
        e.flash = 0.35;
        setShake(e.boss ? 0.16 : 0.08);
        sfx.stomp();
      }
      return;
    }

    if (!hitPlayer()) continue;
    return;
  }
}

export function updateProjectiles(dt) {
  if (state !== "playing") return;
  for (let i = level.projectiles.length - 1; i >= 0; i--) {
    const p = level.projectiles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
    if (p.life <= 0 || p.x < -40 || p.x > level.width + 40) {
      level.projectiles.splice(i, 1);
      continue;
    }
    if (aabb(player, p)) {
      level.projectiles.splice(i, 1);
      hitPlayer();
      return;
    }
  }
}

export function updateShockwaves(dt) {
  if (state !== "playing") return;
  for (let i = level.shockwaves.length - 1; i >= 0; i--) {
    const w = level.shockwaves[i];
    w.x += w.vx * dt;
    w.life -= dt;
    w.w += 80 * dt;
    if (w.life <= 0) {
      level.shockwaves.splice(i, 1);
      continue;
    }
    if (w.hurt && aabb(player, w)) {
      hitPlayer();
      return;
    }
  }
}

export function updateCoins(dt) {
  if (state !== "playing") return;
  for (const c of level.coins) {
    if (c.taken) continue;
    c.phase += dt * 4;
    if (magnetBoost > 0) {
      const dx = player.x + player.w * 0.5 - c.x;
      const dy = player.y + player.h * 0.5 - c.y;
      const dist = Math.hypot(dx, dy);
      if (dist < POWERUP_MAGNET_RADIUS && dist > 1) {
        c.x += (dx / dist) * 220 * dt;
        c.y += (dy / dist) * 220 * dt;
      }
    }
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

export function updatePowerups(dt) {
  if (state !== "playing") return;
  for (const p of level.powerups) {
    if (p.taken) continue;
    p.phase += dt * 3;
    if (aabb(player, p)) {
      p.taken = true;
      if (p.kind === "magnet") {
        setMagnetBoost(POWERUP_MAGNET_DURATION);
        announce("MAGNET ONLINE. Packs inbound.");
      } else {
        setSpeedBoost(POWERUP_SPEED_DURATION);
        setShieldBoost(POWERUP_SHIELD_DURATION);
        announce("OVERCLOCK. Speed + shield.");
      }
      sfx.powerup();
      updateHud();
    }
  }
}

export function updateCheckpoints() {
  if (state !== "playing") return;
  for (const c of level.checkpoints) {
    if (c.taken) continue;
    if (!aabb(player, c)) continue;
    c.taken = true;
    setCheckpoint(player.x, Math.min(player.y, c.y - player.h));
    announce("CHECKPOINT UPLINK SAVED.");
    sfx.checkpoint();
  }
}

export function updateHazards(dt = 0) {
  if (state !== "playing") return;
  for (let i = level.hazards.length - 1; i >= 0; i--) {
    const h = level.hazards[i];
    if (h.temporary) {
      h.life -= dt;
      if (h.life <= 0) {
        level.hazards.splice(i, 1);
        continue;
      }
    }
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

export function updateBossFanfare(dt) {
  if (level.bossFanfare <= 0) return;
  const before = level.bossFanfare;
  level.bossFanfare = Math.max(0, level.bossFanfare - dt);
  if (before > 0 && level.bossFanfare <= 0) {
    announce("EXIT ONLINE. Jack the core.");
    sfx.clear();
  }
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

  if (levelIndex < getLevelCount() - 1) {
    if (!practiceMode) unlockSector(levelIndex + 1);
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

  setState("won");
  stopMusic();
  sfx.win();
  if (!practiceMode) {
    unlockSector(getLevelCount() - 1);
    recordClearTime(runElapsed);
    presentRunEnd(
      "won",
      "JACKPOT",
      RUN_STORY.win(score),
      "RUN AGAIN",
      `SECTOR ${level.sector}`
    );
  } else {
    setOverlay(
      true,
      "PRACTICE CLEAR",
      "Cyber-Rex down. Core drill complete.",
      "RETRY REX",
      "REX CORE"
    );
  }
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
