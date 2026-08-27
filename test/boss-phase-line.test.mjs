import { test } from "node:test";
import assert from "node:assert/strict";
import { collectBossPhaseAnnounces } from "../src/physics.js";
import { BOSS_STORY } from "../src/story.js";

test("collectBossPhaseAnnounces emits armorBreak at phase 2 for Cyber-Rex", () => {
  const result = collectBossPhaseAnnounces(2, false, 1);
  assert.equal(result.phaseAnnounced, 2);
  assert.equal(result.enrageAnnounced, false);
  assert.deepEqual(result.announceKeys, ["armorBreak"]);
  assert.ok(BOSS_STORY.armorBreak);
});

test("collectBossPhaseAnnounces skips armorBreak for miniboss at phase 2", () => {
  const result = collectBossPhaseAnnounces(2, true, 1);
  assert.equal(result.phaseAnnounced, 2);
  assert.equal(result.enrageAnnounced, false);
  assert.deepEqual(result.announceKeys, []);
});

test("collectBossPhaseAnnounces emits overclock at phase 3", () => {
  const result = collectBossPhaseAnnounces(3, false, 2);
  assert.equal(result.phaseAnnounced, 3);
  assert.equal(result.enrageAnnounced, true);
  assert.deepEqual(result.announceKeys, ["overclock"]);
  assert.ok(BOSS_STORY.overclock);
});

test("collectBossPhaseAnnounces phase 1 to 3 emits both keys for Cyber-Rex", () => {
  const result = collectBossPhaseAnnounces(3, false, 1);
  assert.equal(result.phaseAnnounced, 3);
  assert.equal(result.enrageAnnounced, true);
  assert.deepEqual(result.announceKeys, ["armorBreak", "overclock"]);
  for (const key of result.announceKeys) {
    assert.ok(key in BOSS_STORY, `${key} is a BOSS_STORY property`);
  }
});

test("collectBossPhaseAnnounces returns empty keys when already announced", () => {
  const result = collectBossPhaseAnnounces(3, false, 3);
  assert.equal(result.phaseAnnounced, 3);
  assert.equal(result.enrageAnnounced, false);
  assert.deepEqual(result.announceKeys, []);
});
