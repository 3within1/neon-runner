import { test } from "node:test";
import assert from "node:assert/strict";
import { playerCanBeHit } from "../src/state.js";

test("playerCanBeHit rejects when not playing", () => {
  assert.equal(playerCanBeHit({ playing: false, invuln: 0 }), false);
  assert.equal(playerCanBeHit({ playing: false, invuln: 0, force: true }), false);
});

test("playerCanBeHit blocks during i-frames unless forced", () => {
  assert.equal(playerCanBeHit({ playing: true, invuln: 0.5 }), false);
  assert.equal(playerCanBeHit({ playing: true, invuln: 0.5, force: true }), true);
});

test("playerCanBeHit allows hits at zero invuln", () => {
  assert.equal(playerCanBeHit({ playing: true, invuln: 0 }), true);
});

test("playerCanBeHit treats Infinity invuln like active i-frames", () => {
  assert.equal(playerCanBeHit({ playing: true, invuln: Infinity }), false);
  assert.equal(playerCanBeHit({ playing: true, invuln: Infinity, force: true }), true);
});
