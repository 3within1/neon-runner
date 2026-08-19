import { test } from "node:test";
import assert from "node:assert/strict";
import { canAdvanceLevel, resolveSectorClearKind } from "../src/state.js";

const LAST = 5;

test("resolveSectorClearKind sends practice runs to the Rex clear path", () => {
  assert.equal(
    resolveSectorClearKind({
      practiceMode: true,
      runMode: "normal",
      levelIndex: LAST,
      levelCount: LAST + 1,
    }),
    "practice"
  );
  assert.equal(
    resolveSectorClearKind({
      practiceMode: true,
      runMode: "timeAttack",
      levelIndex: 0,
      levelCount: LAST + 1,
    }),
    "practice",
    "practice wins over mode"
  );
});

test("resolveSectorClearKind ends time attack without unlocking further sectors", () => {
  assert.equal(
    resolveSectorClearKind({
      practiceMode: false,
      runMode: "timeAttack",
      levelIndex: 2,
      levelCount: LAST + 1,
    }),
    "timeAttack"
  );
});

test("resolveSectorClearKind continues mid-campaign and wins on the finale", () => {
  assert.equal(
    resolveSectorClearKind({
      practiceMode: false,
      runMode: "normal",
      levelIndex: 0,
      levelCount: LAST + 1,
    }),
    "continue"
  );
  assert.equal(
    resolveSectorClearKind({
      practiceMode: false,
      runMode: "lockdown",
      levelIndex: LAST - 1,
      levelCount: LAST + 1,
    }),
    "continue"
  );
  assert.equal(
    resolveSectorClearKind({
      practiceMode: false,
      runMode: "normal",
      levelIndex: LAST,
      levelCount: LAST + 1,
    }),
    "campaignWin"
  );
  assert.equal(
    resolveSectorClearKind({
      practiceMode: false,
      runMode: "lockdown",
      levelIndex: LAST,
      levelCount: LAST + 1,
    }),
    "campaignWin"
  );
});

test("canAdvanceLevel blocks only time-attack mid-run sector hops", () => {
  assert.equal(canAdvanceLevel("timeAttack"), false);
  assert.equal(canAdvanceLevel("normal"), true);
  assert.equal(canAdvanceLevel("lockdown"), true);
});
