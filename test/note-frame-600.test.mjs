import { test } from "node:test";
import assert from "node:assert/strict";
import { noteFrameError } from "../src/state.js";

// After the first log, repeats surface every 300 occurrences so a stuck error
// remains visible without per-frame spam. 600 must also be a "repeat".

test("noteFrameError re-logs on every 300th subsequent occurrence", () => {
  const counts = new Map();
  assert.equal(noteFrameError(counts, "loop").kind, "first");

  for (let i = 2; i < 300; i++) {
    assert.equal(noteFrameError(counts, "loop").kind, "silent");
  }
  assert.deepEqual(noteFrameError(counts, "loop"), {
    key: "loop",
    kind: "repeat",
    count: 300,
  });

  for (let i = 301; i < 600; i++) {
    assert.equal(noteFrameError(counts, "loop").kind, "silent");
  }
  assert.deepEqual(noteFrameError(counts, "loop"), {
    key: "loop",
    kind: "repeat",
    count: 600,
  });
});
