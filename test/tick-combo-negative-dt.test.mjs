import { test } from "node:test";
import assert from "node:assert/strict";
import {
  combo,
  comboTimer,
  resetRunStats,
  setCombo,
  setComboTimer,
  tickCombo,
} from "../src/state.js";

test("tickCombo with negative dt lengthens the combo window", () => {
  resetRunStats();
  setCombo(2);
  setComboTimer(0.2);

  tickCombo(-0.05);
  assert.equal(comboTimer, 0.25, "negative dt extends the window");
  assert.equal(combo, 2, "chain stays live while the window is open");

  tickCombo(0.3);
  assert.equal(comboTimer, 0);
  assert.equal(combo, 0, "positive overshoot still expires the chain");
});
