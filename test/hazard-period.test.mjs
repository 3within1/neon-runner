import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildLevel,
  getLevelCount,
  getLevelDef,
} from "../src/level.js";
import { level } from "../src/state.js";

test("built hazards preserve kind and laser period from the level def", () => {
  const n = getLevelCount();
  for (let i = 0; i < n; i++) {
    const def = getLevelDef(i);
    buildLevel(i);
    assert.equal(
      level.hazards.length,
      def.hazards.length,
      `sector ${i} hazard count matches def`
    );

    for (let h = 0; h < def.hazards.length; h++) {
      const raw = def.hazards[h];
      const kind = raw[4] || "spike";
      const period = raw[5] ?? 1.2;
      const built = level.hazards[h];
      assert.equal(built.kind, kind, `sector ${i} hazard ${h} kind`);
      assert.equal(built.period, period, `sector ${i} hazard ${h} period`);
      assert.ok(
        Number.isFinite(built.period) && built.period > 0,
        `sector ${i} hazard ${h} needs a positive period for duty-cycle math`
      );
    }
  }
});

test("Needle Path and Blackout keep custom laser periods under 1s", () => {
  buildLevel(2);
  const needleLasers = level.hazards.filter((h) => h.kind === "laser");
  assert.ok(needleLasers.length >= 2, "Needle Path teaches lasers");
  assert.ok(
    needleLasers.every((h) => h.period <= 1.0),
    "Needle Path lasers stay at or under 1s"
  );

  buildLevel(5);
  const blackoutLasers = level.hazards.filter((h) => h.kind === "laser");
  assert.ok(blackoutLasers.length >= 2, "Blackout Run keeps lasers in the gauntlet");
  assert.ok(
    blackoutLasers.every((h) => h.period > 0 && h.period < 1.2),
    "Blackout lasers stay faster than the default 1.2s spike/electric period"
  );
});
