import { test } from "node:test";
import assert from "node:assert/strict";
import { checkVersions } from "../scripts/check-version.mjs";

test("all version references are in sync with package.json", async () => {
  const { expected, checks, errors } = await checkVersions();
  assert.match(expected, /^\d+\.\d+\.\d+$/, "package.json version should be semver");
  assert.ok(checks.length > 0, "expected at least one version reference to check");
  assert.deepEqual(errors, [], `version drift detected:\n${errors.join("\n")}`);
});
