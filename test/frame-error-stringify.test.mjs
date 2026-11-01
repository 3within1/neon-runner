import { test } from "node:test";
import assert from "node:assert/strict";
import { noteFrameError } from "../src/state.js";

// The rAF loop may throw non-Error values. Keying must stay stable so a flood
// of `throw 42` / `throw null` does not spam console on every frame (#18).

test("noteFrameError stringifies null, undefined, and primitives", () => {
  const counts = new Map();
  assert.deepEqual(noteFrameError(counts, null), {
    key: "null",
    kind: "first",
    count: 1,
  });
  assert.deepEqual(noteFrameError(counts, undefined), {
    key: "undefined",
    kind: "first",
    count: 1,
  });
  const num = noteFrameError(counts, 42);
  assert.equal(num.key, "42");
  assert.equal(num.kind, "first");
  assert.equal(noteFrameError(counts, 42).kind, "silent");
  assert.equal(counts.get("42"), 2);
});

test("noteFrameError falls back to String(err) when message is missing", () => {
  const counts = new Map();
  const plain = { code: "EFAIL" };
  const first = noteFrameError(counts, plain);
  assert.equal(first.kind, "first");
  assert.equal(first.key, String(plain));
  assert.equal(noteFrameError(counts, { message: "" }).key, String({ message: "" }));
});
