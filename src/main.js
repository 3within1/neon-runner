const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const overlay = document.getElementById("overlay");
const startBtn = document.getElementById("start-btn");
const scoreEl = document.querySelector("#score b");
const livesEl = document.querySelector("#lives b");

const W = canvas.width;
const H = canvas.height;
const TILE = 48;
const GRAVITY = 2000;
const MAX_FALL = 1400;
const JUMP_VELOCITY = -980;
const STOMP_BOUNCE = -620;

const keys = new Set();
const input = { left: false, right: false, jump: false, jumpPressed: false };

window.addEventListener("keydown", (e) => {
  const k = e.key.toLowerCase();
  if (["arrowleft", "arrowright", "arrowup", " ", "a", "d", "w"].includes(k)) {
    e.preventDefault();
  }
  if (!keys.has(k)) {
    if (k === " " || k === "w" || k === "arrowup") input.jumpPressed = true;
  }
  keys.add(k);
  syncInput();
});

window.addEventListener("keyup", (e) => {
  keys.delete(e.key.toLowerCase());
  syncInput();
});

function syncInput() {
  input.left = keys.has("arrowleft") || keys.has("a");
  input.right = keys.has("arrowright") || keys.has("d");
  input.jump = keys.has(" ") || keys.has("w") || keys.has("arrowup");
}

const COLORS = {
  bgTop: "#12061c",
  bgBot: "#05030c",
  cyan: "#35f0ff",
  magenta: "#ff2bd6",
  lime: "#b6ff3b",
  amber: "#ffb347",
  platform: "#1a1030",
  platformEdge: "#ff2bd6",
  grid: "rgba(53, 240, 255, 0.08)",
};

/** @type {'title' | 'playing' | 'dead' | 'won'} */
let state = "title";
let score = 0;
let lives = 3;
let time = 0;
let shake = 0;
let message = "";

const camera = { x: 0, y: 0 };

const level = {
  width: 80 * TILE,
  height: 12 * TILE,
  spawn: { x: 2 * TILE, y: 8 * TILE },
  exit: { x: 76 * TILE, y: 7 * TILE, w: TILE * 1.2, h: TILE * 2 },
  platforms: [],
  hazards: [],
  coins: [],
  enemies: [],
};

function rect(x, y, w, h) {
  return { x, y, w, h };
}

function buildLevel() {
  level.platforms = [];
  level.hazards = [];
  level.coins = [];
  level.enemies = [];

  // Ground stretches with gaps
  addPlatform(0, 10, 14, 2);
  addPlatform(16, 10, 10, 2);
  addPlatform(28, 10, 8, 2);
  addPlatform(40, 10, 18, 2);
  addPlatform(62, 10, 18, 2);

  // Floating platforms
  addPlatform(6, 7, 3, 1);
  addPlatform(12, 5, 3, 1);
  addPlatform(18, 7, 2, 1);
  addPlatform(22, 4, 3, 1);
  addPlatform(30, 6, 4, 1);
  addPlatform(36, 3, 3, 1);
  addPlatform(44, 7, 3, 1);
  addPlatform(50, 5, 4, 1);
  addPlatform(56, 3, 3, 1);
  addPlatform(64, 7, 4, 1);
  addPlatform(70, 5, 3, 1);
  addPlatform(74, 9, 4, 1);

  // Hazards (neon spikes)
  addHazard(14, 9.5, 2, 0.5);
  addHazard(26, 9.5, 2, 0.5);
  addHazard(38, 9.5, 2, 0.5);
  addHazard(58, 9.5, 4, 0.5);

  // Data chips
  const chipSpots = [
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
  ];
  for (const [tx, ty] of chipSpots) {
    level.coins.push({
      x: tx * TILE + 14,
      y: ty * TILE + 14,
      r: 10,
      taken: false,
      phase: Math.random() * Math.PI * 2,
    });
  }

  // Patrol drones
  spawnEnemy(8 * TILE, 9 * TILE, 6 * TILE, 12 * TILE);
  spawnEnemy(18 * TILE, 9 * TILE, 16 * TILE, 24 * TILE);
  spawnEnemy(32 * TILE, 5 * TILE, 30 * TILE, 34 * TILE);
  spawnEnemy(46 * TILE, 9 * TILE, 42 * TILE, 54 * TILE);
  spawnEnemy(52 * TILE, 4 * TILE, 50 * TILE, 54 * TILE);
  spawnEnemy(66 * TILE, 6 * TILE, 64 * TILE, 68 * TILE);
}

function addPlatform(tx, ty, tw, th) {
  level.platforms.push(rect(tx * TILE, ty * TILE, tw * TILE, th * TILE));
}

function addHazard(tx, ty, tw, th) {
  level.hazards.push(rect(tx * TILE, ty * TILE, tw * TILE, th * TILE));
}

function spawnEnemy(x, y, minX, maxX) {
  level.enemies.push({
    x,
    y,
    w: 36,
    h: 28,
    vx: 80,
    minX,
    maxX,
    alive: true,
    bob: Math.random() * Math.PI * 2,
  });
}

const player = {
  x: 0,
  y: 0,
  w: 28,
  h: 40,
  vx: 0,
  vy: 0,
  facing: 1,
  onGround: false,
  coyote: 0,
  jumpBuffer: 0,
  anim: "idle",
  frame: 0,
  frameTimer: 0,
  invuln: 0,
  deadTimer: 0,
};

/** Last solid footing — used when you fall in a pit */
const checkpoint = { x: 0, y: 0 };

function setCheckpoint(x, y) {
  checkpoint.x = x;
  checkpoint.y = y;
}

function resetPlayer(at = checkpoint) {
  player.x = at.x;
  player.y = at.y;
  player.vx = 0;
  player.vy = 0;
  player.facing = 1;
  player.onGround = false;
  player.coyote = 0;
  player.jumpBuffer = 0;
  player.anim = "idle";
  player.frame = 0;
  player.invuln = 1.2;
  player.deadTimer = 0;
}

function resetRun(full = false) {
  buildLevel();
  setCheckpoint(level.spawn.x, level.spawn.y);
  resetPlayer(checkpoint);
  camera.x = 0;
  camera.y = 0;
  shake = 0;
  if (full) {
    score = 0;
    lives = 3;
  }
  updateHud();
}

function updateHud() {
  scoreEl.textContent = String(score).padStart(2, "0");
  livesEl.textContent = String(lives).padStart(2, "0");
}

function aabb(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function resolvePlatforms(entity, prevX, prevY) {
  entity.onGround = false;
  for (const p of level.platforms) {
    if (!aabb(entity, p)) continue;

    const overlapX =
      Math.min(entity.x + entity.w, p.x + p.w) - Math.max(entity.x, p.x);
    const overlapY =
      Math.min(entity.y + entity.h, p.y + p.h) - Math.max(entity.y, p.y);

    if (overlapX < overlapY) {
      if (prevX + entity.w <= p.x) entity.x = p.x - entity.w;
      else if (prevX >= p.x + p.w) entity.x = p.x + p.w;
      entity.vx = 0;
    } else {
      if (prevY + entity.h <= p.y) {
        entity.y = p.y - entity.h;
        entity.vy = 0;
        entity.onGround = true;
      } else if (prevY >= p.y + p.h) {
        entity.y = p.y + p.h;
        entity.vy = 0;
      }
    }
  }
}

function setOverlay(show, title, tagline, buttonLabel) {
  const panel = overlay.querySelector(".panel");
  panel.querySelector(".eyebrow").textContent = "SECTOR 2084";
  panel.querySelector("h1").textContent = title;
  panel.querySelector(".tagline").textContent = tagline;
  startBtn.textContent = buttonLabel;
  overlay.classList.toggle("visible", show);
}

function startGame() {
  resetRun(true);
  state = "playing";
  overlay.classList.remove("visible");
  message = "";
}

startBtn.addEventListener("click", () => {
  if (state === "title" || state === "dead" || state === "won") startGame();
});

function updatePlayer(dt) {
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

  if (player.onGround) player.coyote = 0.1;
  else player.coyote = Math.max(0, player.coyote - dt);

  if (input.jumpPressed) player.jumpBuffer = 0.12;
  else player.jumpBuffer = Math.max(0, player.jumpBuffer - dt);
  input.jumpPressed = false;

  if (player.jumpBuffer > 0 && player.coyote > 0) {
    player.vy = JUMP_VELOCITY;
    player.onGround = false;
    player.coyote = 0;
    player.jumpBuffer = 0;
  }

  // Variable jump: releasing early shortens the hop, but held jumps clear platforms
  if (!input.jump && player.vy < -280) {
    player.vy *= 0.65;
  }

  player.vy = Math.min(MAX_FALL, player.vy + GRAVITY * dt);

  const prevX = player.x;
  const prevY = player.y;
  player.x += player.vx * dt;
  player.y += player.vy * dt;
  resolvePlatforms(player, prevX, prevY);

  if (player.y > level.height + 80) hitPlayer(true);

  // Remember solid ground for pit respawns
  if (player.onGround) {
    setCheckpoint(player.x, player.y);
  }

  // Animation state
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

  if (player.invuln > 0) player.invuln -= dt;
}

function hitPlayer(force = false) {
  if (!force && player.invuln > 0) return;

  const pitDeath = player.y > level.height;
  // Respawn where you died; if you fell off the map, use last footing
  const respawn = pitDeath
    ? { x: checkpoint.x, y: checkpoint.y }
    : { x: player.x, y: player.y };

  lives -= 1;
  shake = 0.35;
  updateHud();
  if (lives <= 0) {
    state = "dead";
    setOverlay(true, "SYSTEM CRASH", "The grid swallowed you. Try again, runner.", "REBOOT");
  } else {
    setCheckpoint(respawn.x, respawn.y);
    resetPlayer(respawn);
  }
}

function updateEnemies(dt) {
  for (const e of level.enemies) {
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

    // Soft float
    const baseY = e.y;
    const body = { x: e.x, y: e.y + Math.sin(e.bob) * 3, w: e.w, h: e.h };

    if (!aabb(player, body)) continue;

    const stomping = player.vy > 0 && player.y + player.h - body.y < 18;
    if (stomping) {
      e.alive = false;
      player.vy = STOMP_BOUNCE;
      score += 1;
      shake = 0.15;
      updateHud();
    } else {
      hitPlayer();
    }
    e.y = baseY;
  }
}

function updateCoins(dt) {
  for (const c of level.coins) {
    if (c.taken) continue;
    c.phase += dt * 4;
    const dx = player.x + player.w / 2 - c.x;
    const dy = player.y + player.h / 2 - c.y;
    if (dx * dx + dy * dy < (c.r + 14) * (c.r + 14)) {
      c.taken = true;
      score += 1;
      updateHud();
    }
  }
}

function updateHazards() {
  for (const h of level.hazards) {
    if (aabb(player, h)) hitPlayer();
  }
}

function updateExit() {
  if (aabb(player, level.exit)) {
    state = "won";
    setOverlay(
      true,
      "JACKPOT",
      `Sector cleared. You jacked ${String(score).padStart(2, "0")} data packs.`,
      "RUN AGAIN"
    );
  }
}

function updateCamera(dt) {
  const targetX = player.x + player.w / 2 - W * 0.38;
  const targetY = player.y + player.h / 2 - H * 0.55;
  camera.x += (targetX - camera.x) * Math.min(1, dt * 6);
  camera.y += (targetY - camera.y) * Math.min(1, dt * 4);
  camera.x = Math.max(0, Math.min(level.width - W, camera.x));
  camera.y = Math.max(0, Math.min(level.height - H, camera.y));
  if (shake > 0) {
    shake = Math.max(0, shake - dt);
    camera.x += (Math.random() - 0.5) * 10 * shake;
    camera.y += (Math.random() - 0.5) * 8 * shake;
  }
}

function drawBackground() {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, COLORS.bgTop);
  g.addColorStop(1, COLORS.bgBot);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // Parallax skyline
  const scroll = camera.x * 0.25;
  for (let i = 0; i < 18; i++) {
    const bx = ((i * 90 - scroll) % (W + 120)) - 60;
    const bh = 80 + ((i * 37) % 160);
    const bw = 40 + ((i * 19) % 50);
    ctx.fillStyle = i % 3 === 0 ? "rgba(255, 43, 214, 0.12)" : "rgba(53, 240, 255, 0.08)";
    ctx.fillRect(bx, H - bh - 40, bw, bh);
    // Windows
    ctx.fillStyle = "rgba(255, 200, 80, 0.25)";
    for (let wy = H - bh; wy < H - 50; wy += 16) {
      for (let wx = bx + 8; wx < bx + bw - 8; wx += 12) {
        if ((wx + wy + i) % 5 !== 0) ctx.fillRect(wx, wy, 4, 6);
      }
    }
  }

  // Far grid floor
  ctx.strokeStyle = COLORS.grid;
  ctx.lineWidth = 1;
  const gridOff = -((camera.x * 0.4) % TILE);
  for (let x = gridOff; x < W; x += TILE) {
    ctx.beginPath();
    ctx.moveTo(x, H * 0.55);
    ctx.lineTo(x + (x - W / 2) * 0.2, H);
    ctx.stroke();
  }
  for (let y = H * 0.55; y < H; y += 28) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  // Neon rain
  ctx.strokeStyle = "rgba(53, 240, 255, 0.18)";
  for (let i = 0; i < 40; i++) {
    const rx = ((i * 97 + time * 120 + camera.x * 0.1) % (W + 40)) - 20;
    const ry = ((i * 53 + time * 340) % (H + 60)) - 30;
    ctx.beginPath();
    ctx.moveTo(rx, ry);
    ctx.lineTo(rx - 2, ry + 14);
    ctx.stroke();
  }
}

function worldToScreen(x, y) {
  return { x: x - camera.x, y: y - camera.y };
}

function drawPlatforms() {
  for (const p of level.platforms) {
    const s = worldToScreen(p.x, p.y);
    if (s.x + p.w < -20 || s.x > W + 20) continue;

    // Glow edge
    ctx.shadowColor = COLORS.magenta;
    ctx.shadowBlur = 16;
    ctx.fillStyle = COLORS.platform;
    ctx.fillRect(s.x, s.y, p.w, p.h);
    ctx.shadowBlur = 0;

    // Top neon strip
    const strip = ctx.createLinearGradient(s.x, s.y, s.x + p.w, s.y);
    strip.addColorStop(0, COLORS.cyan);
    strip.addColorStop(0.5, COLORS.magenta);
    strip.addColorStop(1, COLORS.cyan);
    ctx.fillStyle = strip;
    ctx.fillRect(s.x, s.y, p.w, 4);

    // Circuit lines
    ctx.strokeStyle = "rgba(53, 240, 255, 0.25)";
    ctx.beginPath();
    for (let x = s.x + 12; x < s.x + p.w - 8; x += 24) {
      ctx.moveTo(x, s.y + 10);
      ctx.lineTo(x + 10, s.y + 10);
      ctx.lineTo(x + 10, s.y + Math.min(22, p.h - 6));
    }
    ctx.stroke();
  }
}

function drawHazards() {
  for (const h of level.hazards) {
    const s = worldToScreen(h.x, h.y);
    const spikes = Math.max(2, Math.floor(h.w / 16));
    for (let i = 0; i < spikes; i++) {
      const sx = s.x + (i + 0.5) * (h.w / spikes);
      ctx.beginPath();
      ctx.moveTo(sx - 8, s.y + h.h);
      ctx.lineTo(sx, s.y);
      ctx.lineTo(sx + 8, s.y + h.h);
      ctx.closePath();
      ctx.fillStyle = COLORS.amber;
      ctx.shadowColor = COLORS.amber;
      ctx.shadowBlur = 12;
      ctx.fill();
    }
    ctx.shadowBlur = 0;
  }
}

function drawCoins() {
  for (const c of level.coins) {
    if (c.taken) continue;
    const s = worldToScreen(c.x, c.y + Math.sin(c.phase) * 4);
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(c.phase * 0.5);
    ctx.shadowColor = COLORS.lime;
    ctx.shadowBlur = 18;
    ctx.fillStyle = COLORS.lime;
    ctx.beginPath();
    ctx.moveTo(0, -c.r);
    ctx.lineTo(c.r * 0.7, 0);
    ctx.lineTo(0, c.r);
    ctx.lineTo(-c.r * 0.7, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#1a2a08";
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.shadowBlur = 0;
  }
}

function drawExit() {
  const e = level.exit;
  const s = worldToScreen(e.x, e.y);
  const pulse = 0.5 + Math.sin(time * 5) * 0.5;

  ctx.save();
  ctx.shadowColor = COLORS.cyan;
  ctx.shadowBlur = 20 + pulse * 20;
  const grad = ctx.createLinearGradient(s.x, s.y, s.x + e.w, s.y + e.h);
  grad.addColorStop(0, `rgba(53, 240, 255, ${0.2 + pulse * 0.35})`);
  grad.addColorStop(1, `rgba(255, 43, 214, ${0.25 + pulse * 0.3})`);
  ctx.fillStyle = grad;
  ctx.fillRect(s.x, s.y, e.w, e.h);

  ctx.strokeStyle = COLORS.cyan;
  ctx.lineWidth = 2;
  ctx.strokeRect(s.x + 4, s.y + 4, e.w - 8, e.h - 8);

  ctx.fillStyle = COLORS.cyan;
  ctx.font = "700 10px Orbitron, sans-serif";
  ctx.fillText("EXIT", s.x + 10, s.y - 8);
  ctx.restore();
  ctx.shadowBlur = 0;
}

function drawEnemy(e) {
  if (!e.alive) return;
  const bob = Math.sin(e.bob) * 3;
  const s = worldToScreen(e.x, e.y + bob);
  ctx.save();
  ctx.translate(s.x + e.w / 2, s.y + e.h / 2);

  // Body
  ctx.shadowColor = COLORS.magenta;
  ctx.shadowBlur = 14;
  ctx.fillStyle = "#2a0830";
  ctx.strokeStyle = COLORS.magenta;
  ctx.lineWidth = 2;
  roundRect(-e.w / 2, -e.h / 2, e.w, e.h, 8);
  ctx.fill();
  ctx.stroke();

  // Eye
  ctx.shadowColor = COLORS.cyan;
  ctx.fillStyle = COLORS.cyan;
  ctx.beginPath();
  ctx.ellipse(0, -2, 10, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#041018";
  ctx.beginPath();
  ctx.arc(Math.sign(e.vx) * 3, -2, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Thrusters
  ctx.fillStyle = COLORS.amber;
  ctx.globalAlpha = 0.7 + Math.sin(e.bob * 2) * 0.3;
  ctx.fillRect(-8, e.h / 2 - 2, 5, 8 + Math.sin(e.bob * 3) * 3);
  ctx.fillRect(3, e.h / 2 - 2, 5, 8 + Math.cos(e.bob * 3) * 3);
  ctx.restore();
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
}

function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawPlayer() {
  if (player.invuln > 0 && Math.floor(player.invuln * 20) % 2 === 0) return;

  const s = worldToScreen(player.x, player.y);
  const cx = s.x + player.w / 2;
  const cy = s.y + player.h / 2;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(player.facing, 1);

  // Soft ground shadow
  if (player.onGround) {
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.ellipse(0, player.h / 2 - 2, 14, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  const runBob = player.anim === "run" ? Math.sin(player.frame * 1.6) * 2 : 0;
  const legSwing = player.anim === "run" ? Math.sin(player.frame * 1.6) * 0.5 : 0;
  const armSwing = player.anim === "run" ? Math.sin(player.frame * 1.6 + Math.PI) * 0.45 : 0;
  const jumpStretch = player.anim === "jump" ? 1.08 : player.anim === "fall" ? 0.94 : 1;

  ctx.translate(0, runBob);
  ctx.scale(1, jumpStretch);

  // Glow aura
  ctx.shadowColor = COLORS.cyan;
  ctx.shadowBlur = 18;

  // Legs
  ctx.strokeStyle = COLORS.cyan;
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-5, 6);
  ctx.lineTo(-6 + legSwing * 6, 16);
  ctx.moveTo(5, 6);
  ctx.lineTo(6 - legSwing * 6, 16);
  ctx.stroke();

  // Boots
  ctx.fillStyle = COLORS.magenta;
  ctx.fillRect(-10 + legSwing * 4, 15, 8, 4);
  ctx.fillRect(2 - legSwing * 4, 15, 8, 4);

  // Torso
  ctx.fillStyle = "#10182a";
  ctx.strokeStyle = COLORS.cyan;
  ctx.lineWidth = 2;
  roundRect(-10, -12, 20, 22, 5);
  ctx.fill();
  ctx.stroke();

  // Chest core
  ctx.fillStyle = COLORS.lime;
  ctx.shadowColor = COLORS.lime;
  ctx.beginPath();
  ctx.arc(0, -2, 3.5, 0, Math.PI * 2);
  ctx.fill();

  // Arms
  ctx.shadowColor = COLORS.cyan;
  ctx.strokeStyle = COLORS.cyan;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-10, -6);
  ctx.lineTo(-14, 2 + armSwing * 8);
  ctx.moveTo(10, -6);
  ctx.lineTo(14, 2 - armSwing * 8);
  ctx.stroke();

  // Helmet / head
  ctx.fillStyle = "#0b1220";
  ctx.strokeStyle = COLORS.magenta;
  ctx.lineWidth = 2;
  roundRect(-9, -22, 18, 12, 4);
  ctx.fill();
  ctx.stroke();

  // Visor
  const visor = ctx.createLinearGradient(-7, -18, 7, -14);
  visor.addColorStop(0, COLORS.magenta);
  visor.addColorStop(1, COLORS.cyan);
  ctx.fillStyle = visor;
  ctx.fillRect(-7, -18, 14, 4);

  // Antenna
  ctx.strokeStyle = COLORS.lime;
  ctx.beginPath();
  ctx.moveTo(6, -22);
  ctx.lineTo(10, -28 - Math.sin(time * 8) * 2);
  ctx.stroke();
  ctx.fillStyle = COLORS.lime;
  ctx.beginPath();
  ctx.arc(10, -28 - Math.sin(time * 8) * 2, 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
  ctx.shadowBlur = 0;
}

function drawParticles() {
  // Foot sparks when running
  if (state !== "playing" || player.anim !== "run" || !player.onGround) return;
  for (let i = 0; i < 3; i++) {
    const s = worldToScreen(
      player.x + player.w / 2 - player.facing * (8 + i * 4),
      player.y + player.h - 2
    );
    ctx.fillStyle = `rgba(53, 240, 255, ${0.4 - i * 0.1})`;
    ctx.fillRect(s.x, s.y - Math.random() * 4, 2, 2);
  }
}

function draw() {
  drawBackground();
  drawPlatforms();
  drawHazards();
  drawCoins();
  drawExit();
  for (const e of level.enemies) drawEnemy(e);
  if (state !== "dead" || lives > 0) drawPlayer();
  drawParticles();

  // Edge glow
  ctx.strokeStyle = "rgba(53, 240, 255, 0.15)";
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, W - 2, H - 2);
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;
  time += dt;

  if (state === "playing") {
    updatePlayer(dt);
    updateEnemies(dt);
    updateCoins(dt);
    updateHazards();
    updateExit();
    updateCamera(dt);
  } else {
    // Gentle camera drift on menus
    camera.x = (Math.sin(time * 0.15) * 0.5 + 0.5) * (level.width - W) * 0.2;
    camera.y = 40;
  }

  draw();
  requestAnimationFrame(frame);
}

buildLevel();
setCheckpoint(level.spawn.x, level.spawn.y);
resetPlayer(checkpoint);
updateHud();
setOverlay(
  true,
  "NEON RUNNER",
  "Sprint the grid. Stomp the drones. Jack the exit.",
  "JACK IN"
);
requestAnimationFrame(frame);
