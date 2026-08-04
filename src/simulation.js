import {
  COYOTE_TIME,
  GRAVITY,
  INVULN_HIT,
  INVULN_STOMP,
  JUMP_BUFFER,
  JUMP_CUT_FACTOR,
  JUMP_CUT_THRESHOLD,
  JUMP_VELOCITY,
  MAX_FALL,
  SCORE_PACK,
  SCORE_STOMP,
  START_LIVES,
  STOMP_BOUNCE,
  STOMP_SLACK,
} from "./constants.js";
import { W, H } from "./dom.js";
import { input } from "./input.js";
import { buildLevel, getLevelCount, getLevelDef } from "./level.js";
import { aabb, resolveAxis, segmentHitsRect } from "./physics.js";
import { sfx, stopMusic } from "./audio.js";
import {
  addRunCoin,
  addRunStomp,
  addScore,
  camera,
  checkpoint,
  decayShake,
  level,
  levelIndex,
  lives,
  player,
  reduceMotion,
  resetRunStats,
  score,
  setLevelIndex,
  setLives,
  setScore,
  setShake,
  setShakeOffset,
  setState,
  shake,
  state,
} from "./state.js";
import { setOverlay, updateHud, presentRunEnd } from "./ui.js";

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
    const body = { x: e.x, y: e.y + Math.sin(e.bob) * 3, w: e.w, h: e.h };
    if (aabb(feet, body)) return false;
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
}

export function resetRun(full = false) {
  if (full) {
    setLevelIndex(0);
    setScore(0);
    setLives(START_LIVES);
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
  if (!force && player.invuln > 0) return false;

  const nextLives = lives - 1;
  setLives(Math.max(0, nextLives));
  setShake(0.35);
  updateHud();

  if (nextLives <= 0) {
    setState("dead");
    player.invuln = Infinity;
    stopMusic();
    sfx.die();
    presentRunEnd(
      "dead",
      "SYSTEM CRASH",
      "The grid swallowed you. Try again, runner.",
      "REBOOT"
    );
    return true;
  }

  sfx.hit();
  resetPlayer(checkpoint);
  return true;
}

export function updatePlayer(dt) {
  const accel = player.onGround ? 3200 : 2200;
  const maxSpeed = 280;
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

  if (player.onGround) player.coyote = COYOTE_TIME;
  else player.coyote = Math.max(0, player.coyote - dt);

  if (input.jumpPressed) player.jumpBuffer = JUMP_BUFFER;
  else player.jumpBuffer = Math.max(0, player.jumpBuffer - dt);
  input.jumpPressed = false;

  if (player.jumpBuffer > 0 && player.coyote > 0) {
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

  player.prevX = player.x;
  player.prevY = player.y;
  const falling = player.vy > 40;

  player.x += player.vx * dt;
  resolveAxis(player, level.platforms, "x", player.prevX);

  player.onGround = false;
  player.y += player.vy * dt;
  resolveAxis(player, level.platforms, "y", player.prevY);

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

  if (!player.onGround) {
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
}

export function updateEnemies(dt) {
  for (const e of level.enemies) {
    if (state !== "playing") return;
    if (!e.alive) continue;
    e.bob += dt * 6;
    e.x += e.vx * dt;
    if (e.x < e.minX) {
      e.x = e.minX;
      e.vx = Math.abs(e.vx);
    } else if (e.x + e.w > e.maxX) {
      e.x = e.maxX - e.w;
      e.vx = -Math.abs(e.vx);
    }

    const body = { x: e.x, y: e.y + Math.sin(e.bob) * 3, w: e.w, h: e.h };
    if (!aabb(player, body)) continue;

    const prevBottom = player.prevY + player.h;
    const stomping =
      player.vy > 0 &&
      prevBottom <= body.y + STOMP_SLACK &&
      player.y + player.h >= body.y;

    if (stomping) {
      e.alive = false;
      player.vy = STOMP_BOUNCE;
      player.jumpCutExempt = true;
      player.invuln = Math.max(player.invuln, INVULN_STOMP);
      addScore(SCORE_STOMP);
      addRunStomp(1);
      setShake(0.15);
      updateHud();
      sfx.stomp();
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
      addScore(SCORE_PACK);
      addRunCoin(1);
      updateHud();
      sfx.coin();
    }
  }
}

export function updateHazards() {
  if (state !== "playing") return;
  for (const h of level.hazards) {
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

export function updateExit() {
  if (state !== "playing") return;
  if (!aabb(player, level.exit)) return;

  if (levelIndex < getLevelCount() - 1) {
    const next = getLevelDef(levelIndex + 1);
    setState("cleared");
    stopMusic();
    sfx.clear();
    setOverlay(
      true,
      "SECTOR CLEARED",
      `${level.name} jacked. Next uplink: ${next.name}. DATA ${String(score).padStart(4, "0")}.`,
      "JACK DEEPER",
      `SECTOR ${level.sector}`
    );
    return;
  }

  setState("won");
  stopMusic();
  sfx.win();
  presentRunEnd(
    "won",
    "JACKPOT",
    `All sectors cleared. DATA ${String(score).padStart(4, "0")} jacked.`,
    "RUN AGAIN",
    `SECTOR ${level.sector}`
  );
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
