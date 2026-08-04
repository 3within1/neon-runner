import { getBeatPulse } from "./audio.js";
import { COLORS, TILE } from "./constants.js";
import { ctx, W, H } from "./dom.js";
import { mod } from "./physics.js";
import { getSectorTheme } from "./sectorTheme.js";
import {
  camera,
  level,
  levelIndex,
  player,
  reduceMotion,
  shakeX,
  shakeY,
  state,
  time,
} from "./state.js";

function worldToScreen(x, y) {
  return { x: x - camera.x - shakeX, y: y - camera.y - shakeY };
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

function backdrop() {
  return getSectorTheme(levelIndex);
}

/** 0..1 pulse from the music sequencer; frozen when music is off / reduceMotion. */
function beatPulse() {
  if (reduceMotion) return 0.5;
  return getBeatPulse();
}

function drawSky(bg) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, bg.bgTop);
  g.addColorStop(1, bg.bgBot);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  const pulse = beatPulse();
  const haze = ctx.createRadialGradient(W * 0.5, 0, 20, W * 0.5, 0, H * 0.85);
  haze.addColorStop(0, bg.skyA);
  haze.addColorStop(0.55, bg.skyB);
  haze.addColorStop(1, "transparent");
  ctx.globalAlpha = 0.7 + pulse * 0.3;
  ctx.fillStyle = haze;
  ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = 1;
}

function drawCityBlocks(bg, count, scrollMul, baseH, spread) {
  const scroll = camera.x * scrollMul;
  const detail = !reduceMotion;
  for (let i = 0; i < count; i++) {
    const span = W + 140;
    const bx = mod(i * spread - scroll, span) - 70;
    const bh = baseH + ((i * 37) % 160);
    const bw = 36 + ((i * 19) % 54);
    ctx.fillStyle = i % 3 === 0 ? bg.buildingA : bg.buildingB;
    ctx.fillRect(bx, H - bh - 40, bw, bh);
    if (!detail) continue;
    ctx.fillStyle = bg.window;
    for (let wy = H - bh; wy < H - 50; wy += 16) {
      for (let wx = bx + 8; wx < bx + bw - 8; wx += 12) {
        if ((wx + wy + i) % 5 !== 0) ctx.fillRect(wx, wy, 4, 6);
      }
    }
  }
}

function drawTowers(bg) {
  const scroll = camera.x * 0.2;
  for (let i = 0; i < 14; i++) {
    const span = W + 160;
    const bx = mod(i * 110 - scroll, span) - 80;
    const bh = 140 + ((i * 53) % 220);
    const bw = 22 + (i % 4) * 6;
    ctx.fillStyle = i % 2 === 0 ? bg.buildingA : bg.buildingB;
    ctx.fillRect(bx, H - bh - 30, bw, bh);
    // antenna tip
    ctx.strokeStyle = bg.accent;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(bx + bw / 2, H - bh - 30);
    ctx.lineTo(bx + bw / 2, H - bh - 30 - 18 - (i % 5) * 4);
    ctx.stroke();
    if (reduceMotion) continue;
    ctx.fillStyle = bg.window;
    for (let wy = H - bh; wy < H - 45; wy += 14) {
      ctx.fillRect(bx + 4, wy, bw - 8, 3);
    }
  }
}

function drawNeedles(bg) {
  const scroll = camera.x * 0.18;
  for (let i = 0; i < 22; i++) {
    const span = W + 100;
    const bx = mod(i * 70 - scroll, span) - 40;
    const bh = 100 + ((i * 41) % 240);
    ctx.fillStyle = i % 2 === 0 ? bg.buildingA : bg.buildingB;
    ctx.beginPath();
    ctx.moveTo(bx, H - 36);
    ctx.lineTo(bx + 7, H - bh - 36);
    ctx.lineTo(bx + 14, H - 36);
    ctx.closePath();
    ctx.fill();
    if (i % 4 === 0) {
      ctx.fillStyle = bg.window;
      ctx.fillRect(bx + 5, H - bh - 40, 3, 6);
    }
  }
}

function drawSwarmCity(bg) {
  const blocks = reduceMotion ? 14 : 26;
  const mid = reduceMotion ? 10 : 20;
  drawCityBlocks(bg, blocks, 0.3, 70, 70);
  // denser mid-layer
  const scroll = camera.x * 0.45;
  for (let i = 0; i < mid; i++) {
    const span = W + 80;
    const bx = mod(i * 55 - scroll, span) - 40;
    const bh = 40 + ((i * 29) % 90);
    ctx.fillStyle = bg.buildingA;
    ctx.fillRect(bx, H - bh - 28, 18 + (i % 3) * 8, bh);
  }
}

function drawBlackout(bg) {
  drawCityBlocks(bg, 12, 0.15, 100, 120);
  // Amber flash near musical downbeats (audio-clock pulse)
  const pulse = beatPulse();
  if (!reduceMotion && pulse > 0.92) {
    ctx.fillStyle = "rgba(255, 120, 40, 0.06)";
    ctx.fillRect(0, 0, W, H);
  }
  ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
  ctx.fillRect(0, 0, W, H * 0.35);
}

function drawPerspectiveGrid(bg) {
  ctx.strokeStyle = bg.grid;
  ctx.lineWidth = 1;
  const gridOff = -mod(camera.x * 0.4, TILE);
  const horizon = bg.style === "towers" ? H * 0.62 : H * 0.55;
  for (let x = gridOff; x < W; x += TILE) {
    ctx.beginPath();
    ctx.moveTo(x, horizon);
    ctx.lineTo(x + (x - W / 2) * 0.2, H);
    ctx.stroke();
  }
  for (let y = horizon; y < H; y += 28) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
}

function drawBackdropParticles(bg) {
  if (reduceMotion) return;
  ctx.strokeStyle = bg.particle;
  const count = Math.round(16 + bg.density * 50);
  // Particle drift speed scales with the sector track BPM
  const speed = bg.bpm * (bg.style === "towers" ? 0.7 : 1.05);
  const pulse = beatPulse();
  ctx.globalAlpha = 0.55 + pulse * 0.45;
  for (let i = 0; i < count; i++) {
    const rx = mod(i * 97 + time * speed + camera.x * 0.1, W + 40) - 20;
    let ry;
    if (bg.style === "towers") {
      ry = H - mod(i * 53 + time * (bg.bpm * 1.5), H + 60);
    } else {
      ry = mod(i * 53 + time * (bg.bpm * 2.8), H + 60) - 30;
    }
    ctx.beginPath();
    if (bg.style === "towers") {
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx, ry - 12);
    } else if (bg.style === "needles") {
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx + 8, ry + 2);
    } else {
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx - 2, ry + 14);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function drawBackground() {
  const bg = backdrop();
  drawSky(bg);

  const buildingCount = Math.round((reduceMotion ? 8 : 10) + bg.density * (reduceMotion ? 10 : 20));
  switch (bg.style) {
    case "towers":
      drawTowers(bg);
      break;
    case "needles":
      drawNeedles(bg);
      break;
    case "swarm":
      drawSwarmCity(bg);
      break;
    case "blackout":
      drawBlackout(bg);
      break;
    default:
      drawCityBlocks(bg, buildingCount, 0.25, 80, 90);
      break;
  }

  drawPerspectiveGrid(bg);
  drawBackdropParticles(bg);
}

function drawPlatforms() {
  for (const p of level.platforms) {
    const s = worldToScreen(p.x, p.y);
    if (s.x + p.w < -20 || s.x > W + 20) continue;

    ctx.shadowColor = COLORS.magenta;
    ctx.shadowBlur = reduceMotion ? 0 : 16;
    ctx.fillStyle = COLORS.platform;
    ctx.fillRect(s.x, s.y, p.w, p.h);
    ctx.shadowBlur = 0;

    const strip = ctx.createLinearGradient(s.x, s.y, s.x + p.w, s.y);
    strip.addColorStop(0, COLORS.cyan);
    strip.addColorStop(0.5, COLORS.magenta);
    strip.addColorStop(1, COLORS.cyan);
    ctx.fillStyle = strip;
    ctx.fillRect(s.x, s.y, p.w, 4);

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
    const dx = h.drawX ?? h.x;
    const dy = h.drawY ?? h.y;
    const dw = h.drawW ?? h.w;
    const dh = h.drawH ?? h.h;
    const s = worldToScreen(dx, dy);
    if (s.x + dw < -20 || s.x > W + 20) continue;
    const spikes = Math.max(2, Math.floor(dw / 16));
    for (let i = 0; i < spikes; i++) {
      const sx = s.x + (i + 0.5) * (dw / spikes);
      ctx.beginPath();
      ctx.moveTo(sx - 8, s.y + dh);
      ctx.lineTo(sx, s.y);
      ctx.lineTo(sx + 8, s.y + dh);
      ctx.closePath();
      ctx.fillStyle = COLORS.amber;
      ctx.shadowColor = COLORS.amber;
      ctx.shadowBlur = reduceMotion ? 0 : 12;
      ctx.fill();
    }
    ctx.shadowBlur = 0;
  }
}

function drawCoins() {
  for (const c of level.coins) {
    if (c.taken) continue;
    const bob = reduceMotion ? 0 : Math.sin(c.phase) * 4;
    const s = worldToScreen(c.x, c.y + bob);
    if (s.x < -20 || s.x > W + 20) continue;
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(reduceMotion ? 0 : c.phase * 0.5);
    ctx.shadowColor = COLORS.lime;
    ctx.shadowBlur = reduceMotion ? 0 : 18;
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
  const pulse = reduceMotion ? 0.5 : 0.5 + Math.sin(time * 5) * 0.5;

  ctx.save();
  ctx.shadowColor = COLORS.cyan;
  ctx.shadowBlur = reduceMotion ? 0 : 20 + pulse * 20;
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
  const bob = reduceMotion ? 0 : Math.sin(e.bob) * e.bobAmp;
  const drawX = e.axis === "y" ? e.x + bob : e.x;
  const drawY = e.axis === "y" ? e.y : e.y + bob;
  const s = worldToScreen(drawX, drawY);
  if (s.x + e.w < -20 || s.x > W + 20) return;

  const facing =
    e.axis === "y" ? Math.sign(e.vy) || 1 : Math.sign(e.vx) || 1;
  const damaged = e.hp < e.maxHp;
  const flashing = e.flash > 0 && Math.floor(e.flash * 24) % 2 === 0;

  ctx.save();
  ctx.translate(s.x + e.w / 2, s.y + e.h / 2);
  if (flashing) ctx.globalAlpha = 0.45;

  ctx.shadowColor = e.stroke;
  ctx.shadowBlur = reduceMotion ? 0 : e.type === "swarm" ? 10 : 14;
  ctx.fillStyle = flashing ? "#ffffff" : e.fill;
  ctx.strokeStyle = damaged ? COLORS.amber : e.stroke;
  ctx.lineWidth = e.type === "armored" ? 3 : e.type === "needle" ? 1.5 : 2;

  if (e.type === "needle") {
    // Tall diamond silhouette
    ctx.beginPath();
    ctx.moveTo(0, -e.h / 2);
    ctx.lineTo(e.w / 2, 0);
    ctx.lineTo(0, e.h / 2);
    ctx.lineTo(-e.w / 2, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else {
    roundRect(-e.w / 2, -e.h / 2, e.w, e.h, e.radius);
    ctx.fill();
    ctx.stroke();
  }

  if (e.type === "armored") {
    ctx.strokeStyle = damaged ? COLORS.magenta : COLORS.amber;
    ctx.lineWidth = 2;
    ctx.strokeRect(-e.w / 2 + 6, -e.h / 2 + 6, e.w - 12, e.h - 12);
    if (damaged) {
      ctx.beginPath();
      ctx.moveTo(-6, -8);
      ctx.lineTo(4, 6);
      ctx.strokeStyle = COLORS.magenta;
      ctx.stroke();
    }
  }

  ctx.shadowColor = e.eye;
  ctx.fillStyle = e.eye;
  const eyeW = e.type === "swarm" ? 7 : e.type === "needle" ? 6 : 10;
  const eyeH = e.type === "climber" ? 7 : 5;
  ctx.beginPath();
  ctx.ellipse(0, e.type === "climber" ? -4 : -2, eyeW, eyeH, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#041018";
  ctx.beginPath();
  const pupil = e.axis === "y" ? 0 : facing * 3;
  ctx.arc(pupil, e.type === "climber" ? -4 : -2, e.type === "swarm" ? 1.8 : 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = e.thruster;
  ctx.globalAlpha = flashing ? 0.3 : 0.7 + Math.sin(e.bob * 2) * 0.3;
  if (e.axis === "y") {
    // Side thrusters for climbers
    const kick = 6 + Math.sin(e.bob * 3) * 2;
    ctx.fillRect(-e.w / 2 - 2, -4, kick, 4);
    ctx.fillRect(e.w / 2 - kick + 2, 2, kick, 4);
  } else if (e.type === "needle") {
    ctx.fillRect(-3, e.h / 2 - 2, 6, 10 + Math.sin(e.bob * 3) * 3);
  } else if (e.type === "swarm") {
    ctx.fillRect(-6, e.h / 2 - 2, 4, 6 + Math.sin(e.bob * 3) * 2);
    ctx.fillRect(2, e.h / 2 - 2, 4, 6 + Math.cos(e.bob * 3) * 2);
  } else {
    ctx.fillRect(-8, e.h / 2 - 2, 5, 8 + Math.sin(e.bob * 3) * 3);
    ctx.fillRect(3, e.h / 2 - 2, 5, 8 + Math.cos(e.bob * 3) * 3);
  }

  ctx.restore();
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
}

function drawPlayer() {
  if (player.invuln > 0 && !reduceMotion && Math.floor(player.invuln * 20) % 2 === 0) return;

  const s = worldToScreen(player.x, player.y);
  const cx = s.x + player.w / 2;
  const cy = s.y + player.h / 2;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(player.facing, 1);

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

  ctx.shadowColor = COLORS.cyan;
  ctx.shadowBlur = reduceMotion ? 0 : 18;

  ctx.strokeStyle = COLORS.cyan;
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-5, 6);
  ctx.lineTo(-6 + legSwing * 6, 16);
  ctx.moveTo(5, 6);
  ctx.lineTo(6 - legSwing * 6, 16);
  ctx.stroke();

  ctx.fillStyle = COLORS.magenta;
  ctx.fillRect(-10 + legSwing * 4, 15, 8, 4);
  ctx.fillRect(2 - legSwing * 4, 15, 8, 4);

  ctx.fillStyle = "#10182a";
  ctx.strokeStyle = COLORS.cyan;
  ctx.lineWidth = 2;
  roundRect(-10, -12, 20, 22, 5);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = COLORS.lime;
  ctx.shadowColor = COLORS.lime;
  ctx.beginPath();
  ctx.arc(0, -2, 3.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowColor = COLORS.cyan;
  ctx.strokeStyle = COLORS.cyan;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-10, -6);
  ctx.lineTo(-14, 2 + armSwing * 8);
  ctx.moveTo(10, -6);
  ctx.lineTo(14, 2 - armSwing * 8);
  ctx.stroke();

  ctx.fillStyle = "#0b1220";
  ctx.strokeStyle = COLORS.magenta;
  ctx.lineWidth = 2;
  roundRect(-9, -22, 18, 12, 4);
  ctx.fill();
  ctx.stroke();

  const visor = ctx.createLinearGradient(-7, -18, 7, -14);
  visor.addColorStop(0, COLORS.magenta);
  visor.addColorStop(1, COLORS.cyan);
  ctx.fillStyle = visor;
  ctx.fillRect(-7, -18, 14, 4);

  ctx.strokeStyle = COLORS.lime;
  ctx.beginPath();
  const antenna = reduceMotion ? 0 : Math.sin(time * 8) * 2;
  ctx.moveTo(6, -22);
  ctx.lineTo(10, -28 - antenna);
  ctx.stroke();
  ctx.fillStyle = COLORS.lime;
  ctx.beginPath();
  ctx.arc(10, -28 - antenna, 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
  ctx.shadowBlur = 0;
}

function drawParticles() {
  if (reduceMotion) return;
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

export function draw() {
  drawBackground();
  drawPlatforms();
  drawHazards();
  drawCoins();
  drawExit();
  for (const e of level.enemies) drawEnemy(e);
  if (state === "playing") drawPlayer();
  drawParticles();

  ctx.strokeStyle = "rgba(53, 240, 255, 0.15)";
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, W - 2, H - 2);
}
