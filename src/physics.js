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
