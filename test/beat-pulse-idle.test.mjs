import { test } from "node:test";
import assert from "node:assert/strict";
import { getBeatPulse, setMuted } from "../src/audio.js";

// Visual pulse locks to the music sequencer. When music is not scheduling
// (title, mute, stop), getBeatPulse must freeze mid-scale so HUD glow does not
// drift or stick at a peak between sectors.

test("getBeatPulse freezes at 0.5 when music is not actively scheduling", () => {
  setMuted(false);
  assert.equal(getBeatPulse(), 0.5, "no sequencer → neutral pulse");

  setMuted(true);
  assert.equal(getBeatPulse(), 0.5, "muted still freezes the pulse");
});
