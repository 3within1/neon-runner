import { WALL_JUMP_VX, WALL_JUMP_VY, WALL_SLIDE_SPEED } from "./constants.js";

export function rect(x, y, w, h) {
  return { x, y, w, h };
}

export function mod(n, m) {
  return ((n % m) + m) % m;
}

export function aabb(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

/** Sampled sweep of a moving AABB against a rect (thin hazards). */
export function segmentHitsRect(x0, y0, x1, y1, w, h, r) {
  const samples = 4;
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const box = {
      x: x0 + (x1 - x0) * t,
      y: y0 + (y1 - y0) * t,
      w,
      h,
    };
    if (aabb(box, r)) return true;
  }
  return false;
}

/**
 * Direction of a wall the box is holding into, or 0.
 * Probe includes a 1px inbound slop so flush collision (x+w === wall.x) still counts
 * if float rounding leaves a hairline gap.
 * @param {{ x: number, y: number, w: number, h: number }} box
 * @param {{ x: number, y: number, w: number, h: number, fallen?: boolean }[]} platforms
 * @param {boolean} holdLeft
 * @param {boolean} holdRight
 * @param {number} [probe]
 * @returns {-1 | 0 | 1}
 */
export function wallClingDir(box, platforms, holdLeft, holdRight, probe = 8) {
  for (const p of platforms) {
    if (p.fallen) continue;
    const overlapY = box.y + box.h > p.y + 4 && box.y < p.y + p.h - 4;
    if (!overlapY) continue;
    if (holdRight && box.x + box.w >= p.x - 1 && box.x + box.w <= p.x + probe) {
      return 1;
    }
    if (holdLeft && box.x <= p.x + p.w + 1 && box.x >= p.x + p.w - probe) {
      return -1;
    }
  }
  return 0;
}

/**
 * Ground/air run integration with the usual accel/friction/maxSpeed clamp.
 * Callers must skip this on the frame a dash starts (and while dashing) so
 * DASH_SPEED is not crushed down to maxSpeed.
 */
export function integrateRunVelocity(
  vx,
  { left, right, onGround, dt, maxSpeed = 280 }
) {
  const accel = onGround ? 3200 : 2200;
  const friction = onGround ? 2400 : 400;
  let next = vx;
  if (left) next -= accel * dt;
  else if (right) next += accel * dt;
  else {
    const s = Math.sign(next);
    next -= s * friction * dt;
    if (Math.sign(next) !== s) next = 0;
  }
  return Math.max(-maxSpeed, Math.min(maxSpeed, next));
}

/** False while a dash is active — run clamp must not overwrite dash vx. */
export function shouldApplyRunClamp(dashTimer) {
  return dashTimer <= 0;
}

/**
 * Impulse for a wall jump away from the clung face.
 * @param {-1 | 1} wallDir
 */
export function wallJumpVelocity(wallDir) {
  return {
    vx: -wallDir * WALL_JUMP_VX,
    vy: WALL_JUMP_VY,
    facing: -wallDir,
  };
}

/** Cap downward speed while sliding on a wall cling. */
export function capWallSlideFall(vy, wallCling, wallDir) {
  if (wallCling > 0 && wallDir !== 0 && vy > 0) {
    return Math.min(vy, WALL_SLIDE_SPEED);
  }
  return vy;
}

export function resolveAxis(entity, platforms, axis, prev) {
  for (const p of platforms) {
    if (!aabb(entity, p)) continue;

    if (axis === "x") {
      if (prev + entity.w <= p.x) entity.x = p.x - entity.w;
      else if (prev >= p.x + p.w) entity.x = p.x + p.w;
      else {
        const left = entity.x + entity.w - p.x;
        const right = p.x + p.w - entity.x;
        if (left < right) entity.x = p.x - entity.w;
        else entity.x = p.x + p.w;
      }
      entity.vx = 0;
    } else if (prev + entity.h <= p.y) {
      entity.y = p.y - entity.h;
      entity.vy = 0;
      entity.onGround = true;
    } else if (prev >= p.y + p.h) {
      entity.y = p.y + p.h;
      entity.vy = 0;
    } else {
      const up = entity.y + entity.h - p.y;
      const down = p.y + p.h - entity.y;
      if (up < down) {
        entity.y = p.y - entity.h;
        entity.vy = 0;
        entity.onGround = true;
      } else {
        entity.y = p.y + p.h;
        entity.vy = 0;
      }
    }
  }
}

/**
 * Horizontal dash direction from held axes, falling back to facing.
 * Opposite holds cancel to facing; a zero/falsy facing falls back to +1.
 * @param {boolean} left
 * @param {boolean} right
 * @param {number} facing
 * @returns {-1 | 1}
 */
export function resolveDashDir(left, right, facing) {
  if (left && !right) return -1;
  if (right && !left) return 1;
  return /** @type {-1 | 1} */ (facing || 1);
}

/**
 * Gate for beginning a dash (ability unlocked, timers clear, press latched).
 * @param {{ canDash: boolean, dashCd: number, dashTimer: number, dashPressed: boolean }} opts
 */
export function canStartDash({ canDash, dashCd, dashTimer, dashPressed }) {
  return !!canDash && dashCd <= 0 && dashTimer <= 0 && !!dashPressed;
}

/**
 * Brief i-frames granted at dash start (fraction of dash duration).
 * @param {number} invuln
 * @param {number} dashDuration
 */
export function dashInvulnBoost(invuln, dashDuration) {
  return Math.max(invuln, dashDuration * 0.85);
}
