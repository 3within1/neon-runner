import { test } from "node:test";
import assert from "node:assert/strict";
import { ABILITY_STORY, nextAbilityAnnouncements } from "../src/story.js";

test("nextAbilityAnnouncements fires each unlock once then stays quiet", () => {
  const first = nextAbilityAnnouncements(
    { canWallCling: true, maxAirJumps: 0, canDash: false },
    {}
  );
  assert.deepEqual(first.messages, [ABILITY_STORY.wallCling]);
  assert.deepEqual(first.announced, { wall: true, double: false, dash: false });

  const again = nextAbilityAnnouncements(
    { canWallCling: true, maxAirJumps: 0, canDash: false },
    first.announced
  );
  assert.deepEqual(again.messages, [], "does not re-announce wall cling");

  const double = nextAbilityAnnouncements(
    { canWallCling: true, maxAirJumps: 1, canDash: false },
    again.announced
  );
  assert.deepEqual(double.messages, [ABILITY_STORY.doubleJump]);

  const dash = nextAbilityAnnouncements(
    { canWallCling: true, maxAirJumps: 1, canDash: true },
    double.announced
  );
  assert.deepEqual(dash.messages, [ABILITY_STORY.dash]);
  assert.deepEqual(dash.announced, { wall: true, double: true, dash: true });
});

test("nextAbilityAnnouncements can unlock several abilities in one sector jump", () => {
  const burst = nextAbilityAnnouncements(
    { canWallCling: true, maxAirJumps: 1, canDash: true },
    { wall: false, double: false, dash: false }
  );
  assert.deepEqual(burst.messages, [
    ABILITY_STORY.wallCling,
    ABILITY_STORY.doubleJump,
    ABILITY_STORY.dash,
  ]);
});
