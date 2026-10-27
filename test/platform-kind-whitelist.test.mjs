import { test } from "node:test";
import assert from "node:assert/strict";
import { buildLevel, getLevelCount, getLevelDef } from "../src/level.js";
import { configureRunMode, level } from "../src/state.js";

test("built platforms are only solid or collapse, matching LEVELS defs", () => {
  configureRunMode("normal");
  const n = getLevelCount();
  for (let i = 0; i < n; i++) {
    const def = getLevelDef(i);
    buildLevel(i);
    const tag = `sector ${i} (${def.name})`;

    for (const p of level.platforms) {
      assert.ok(
        p.kind === "solid" || p.kind === "collapse",
        `${tag}: unexpected platform kind ${p.kind}`
      );
    }

    const defCollapse = def.platforms.filter((row) => row[4] === "collapse").length;
    const builtCollapse = level.platforms.filter((p) => p.kind === "collapse").length;
    assert.equal(
      builtCollapse,
      defCollapse,
      `${tag}: collapse count must match declarative platforms`
    );
    assert.equal(
      level.platforms.length,
      def.platforms.length,
      `${tag}: platform count must match declarative platforms`
    );
  }
});
