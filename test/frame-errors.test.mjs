import { test } from "node:test";
import assert from "node:assert/strict";
import { noteFrameError } from "../src/state.js";

test("noteFrameError logs the first occurrence of a message", () => {
  const counts = new Map();
  const first = noteFrameError(counts, new Error("updatePlayer blew up"));
  assert.equal(first.kind, "first");
  assert.equal(first.count, 1);
  assert.equal(first.key, "updatePlayer blew up");
  assert.equal(counts.get("updatePlayer blew up"), 1);
});

test("noteFrameError stays silent until the 300th repeat cadence", () => {
  const counts = new Map();
  noteFrameError(counts, "boom");
  for (let i = 2; i < 300; i++) {
    const mid = noteFrameError(counts, "boom");
    assert.equal(mid.kind, "silent", `occurrence ${i} should be silent`);
  }
  const repeat = noteFrameError(counts, "boom");
  assert.equal(repeat.kind, "repeat");
  assert.equal(repeat.count, 300);
});

test("noteFrameError tracks distinct messages independently", () => {
  const counts = new Map();
  assert.equal(noteFrameError(counts, new Error("a")).kind, "first");
  assert.equal(noteFrameError(counts, new Error("b")).kind, "first");
  assert.equal(noteFrameError(counts, new Error("a")).kind, "silent");
  assert.equal(counts.get("a"), 2);
  assert.equal(counts.get("b"), 1);
});
