import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveRunStartSector } from "../src/state.js";

test("practice mode always starts at last sector", () => {
  assert.equal(
    resolveRunStartSector({
      practice: true,
      mode: "normal",
      requestedSector: 0,
      unlockedSector: 1,
      lastIndex: 4,
    }),
    4
  );
});

test("timeAttack clamps requested sector to [0, lastIndex]", () => {
  assert.equal(
    resolveRunStartSector({
      practice: false,
      mode: "timeAttack",
      requestedSector: 99,
      unlockedSector: 4,
      lastIndex: 4,
    }),
    4,
    "high request clamped"
  );
  assert.equal(
    resolveRunStartSector({
      practice: false,
      mode: "timeAttack",
      requestedSector: -2,
      unlockedSector: 4,
      lastIndex: 4,
    }),
    0,
    "low request clamped"
  );
  assert.equal(
    resolveRunStartSector({
      practice: false,
      mode: "timeAttack",
      requestedSector: 2,
      unlockedSector: 0,
      lastIndex: 4,
    }),
    2,
    "in-range request passes through regardless of unlock"
  );
});

test("normal and lockdown clamp to unlocked sector", () => {
  for (const mode of ["normal", "lockdown"]) {
    assert.equal(
      resolveRunStartSector({
        practice: false,
        mode,
        requestedSector: 3,
        unlockedSector: 1,
        lastIndex: 4,
      }),
      1,
      `${mode} honors unlock cap`
    );
    assert.equal(
      resolveRunStartSector({
        practice: false,
        mode,
        requestedSector: 0,
        unlockedSector: 3,
        lastIndex: 4,
      }),
      0,
      `${mode} honors requested sector within unlock`
    );
  }
});

test("lastIndex 0 pins every mode to sector 0", () => {
  assert.equal(
    resolveRunStartSector({
      practice: true,
      mode: "normal",
      requestedSector: 5,
      unlockedSector: 5,
      lastIndex: 0,
    }),
    0
  );
  assert.equal(
    resolveRunStartSector({
      practice: false,
      mode: "timeAttack",
      requestedSector: 5,
      unlockedSector: 5,
      lastIndex: 0,
    }),
    0
  );
  assert.equal(
    resolveRunStartSector({
      practice: false,
      mode: "normal",
      requestedSector: 5,
      unlockedSector: 5,
      lastIndex: 0,
    }),
    0
  );
});
