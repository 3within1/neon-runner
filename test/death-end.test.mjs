import { test } from "node:test";
import assert from "node:assert/strict";
import {
  resolveDeathEndPresentation,
  isFatalPlayerHit,
  deathCrackFlashDuration,
} from "../src/state.js";

const TAGLINE = "test tagline";

test("resolveDeathEndPresentation practice mode", () => {
  const r = resolveDeathEndPresentation(true, TAGLINE);
  assert.equal(r.outcome, "dead");
  assert.equal(r.title, "PRACTICE CRASH");
  assert.equal(r.tagline, TAGLINE);
  assert.equal(r.button, "RETRY REX");
  assert.equal(r.eyebrow, "REX CORE");
});

test("resolveDeathEndPresentation campaign mode has no eyebrow", () => {
  const r = resolveDeathEndPresentation(false, TAGLINE);
  assert.equal(r.outcome, "dead");
  assert.equal(r.title, "SYSTEM CRASH");
  assert.equal(r.tagline, TAGLINE);
  assert.equal(r.button, "REBOOT");
  assert.equal(r.eyebrow, undefined);
});

test("isFatalPlayerHit", () => {
  assert.equal(isFatalPlayerHit(0), true);
  assert.equal(isFatalPlayerHit(-1), true);
  assert.equal(isFatalPlayerHit(1), false);
});

test("deathCrackFlashDuration", () => {
  assert.equal(deathCrackFlashDuration(true), 0.2);
  assert.equal(deathCrackFlashDuration(false), 0.85);
});
