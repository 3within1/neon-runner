import { COLORS, TILE } from "./constants.js";
import { ctx, W, H } from "./dom.js";
import { mod } from "./physics.js";
import {
  camera,
  level,
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

function drawBackground() {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, COLORS.bgTop);
  g.addColorStop(1, COLORS.bgBot);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  const scroll = camera.x * 0.25;
  for (let i = 0; i < 18; i++) {
    const span = W + 120;
    const bx = mod(i * 90 - scroll, span) - 60;
    const bh = 80 + ((i * 37) % 160);
    const bw = 40 + ((i * 19) % 50);
    ctx.fillStyle = i % 3 === 0 ? "rgba(255, 43, 214, 0.12)" : "rgba(53, 240, 255, 0.08)";
    ctx.fillRect(bx, H - bh - 40, bw, bh);
    ctx.fillStyle = "rgba(255, 200, 80, 0.25)";
    for (let wy = H - bh; wy < H - 50; wy += 16) {
      for (let wx = bx + 8; wx < bx + bw - 8; wx += 12) {
        if ((wx + wy + i) % 5 !== 0) ctx.fillRect(wx, wy, 4, 6);
      }
    }
  }

  ctx.strokeStyle = COLORS.grid;
  ctx.lineWidth = 1;
  const gridOff = -mod(camera.x * 0.4, TILE);
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

  if (!reduceMotion) {
    ctx.strokeStyle = "rgba(53, 240, 255, 0.18)";
    for (let i = 0; i < 40; i++) {
      const rx = mod(i * 97 + time * 120 + camera.x * 0.1, W + 40) - 20;
      const ry = mod(i * 53 + time * 340, H + 60) - 30;
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx - 2, ry + 14);
      ctx.stroke();
    }
  }
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
  const bob = reduceMotion ? 0 : Math.sin(e.bob) * 3;
  const s = worldToScreen(e.x, e.y + bob);
  if (s.x + e.w < -20 || s.x > W + 20) return;
  ctx.save();
  ctx.translate(s.x + e.w / 2, s.y + e.h / 2);

  ctx.shadowColor = COLORS.magenta;
  ctx.shadowBlur = reduceMotion ? 0 : 14;
  ctx.fillStyle = "#2a0830";
  ctx.strokeStyle = COLORS.magenta;
  ctx.lineWidth = 2;
  roundRect(-e.w / 2, -e.h / 2, e.w, e.h, 8);
  ctx.fill();
  ctx.stroke();

  ctx.shadowColor = COLORS.cyan;
  ctx.fillStyle = COLORS.cyan;
  ctx.beginPath();
  ctx.ellipse(0, -2, 10, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#041018";
  ctx.beginPath();
  ctx.arc(Math.sign(e.vx) * 3, -2, 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = COLORS.amber;
  ctx.globalAlpha = 0.7 + Math.sin(e.bob * 2) * 0.3;
  ctx.fillRect(-8, e.h / 2 - 2, 5, 8 + Math.sin(e.bob * 3) * 3);
  ctx.fillRect(3, e.h / 2 - 2, 5, 8 + Math.cos(e.bob * 3) * 3);
  ctx.restore();
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
}

function drawPlayer() {
  if (player.invuln > 0 && Math.floor(player.invuln * 20) % 2 === 0) return;

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
