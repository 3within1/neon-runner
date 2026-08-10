import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir, access } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

async function exists(relPath) {
  try {
    await access(join(ROOT, relPath));
    return true;
  } catch {
    return false;
  }
}

/** Pull every "./..."-style path literal out of sw.js (the precache manifest). */
async function precachedPaths() {
  const sw = await readFile(join(ROOT, "sw.js"), "utf8");
  const raw = [...sw.matchAll(/"(\.\/[^"]*)"/g)].map((m) => m[1]);
  // Normalize: drop the leading "./" and any ?v= cache-busting query, de-dupe.
  const norm = raw.map((p) => p.replace(/^\.\//, "").replace(/\?.*$/, ""));
  return { raw, paths: [...new Set(norm)] };
}

test("every asset precached by sw.js exists on disk", async () => {
  const { paths } = await precachedPaths();
  assert.ok(paths.length >= 10, "expected sw.js to precache a real asset list");
  const missing = [];
  for (const p of paths) {
    if (p === "") continue; // "./" -> app root, served as index.html
    if (!(await exists(p))) missing.push(p);
  }
  assert.deepEqual(missing, [], `sw.js precaches assets that don't exist: ${missing.join(", ")}`);
});

test("every src/*.js module is precached by sw.js", async () => {
  const { paths } = await precachedPaths();
  const precached = new Set(paths);
  const srcFiles = (await readdir(join(ROOT, "src"))).filter((f) => f.endsWith(".js"));
  assert.ok(srcFiles.length > 0, "expected source modules to exist");
  const notPrecached = srcFiles.filter((f) => !precached.has(`src/${f}`));
  assert.deepEqual(
    notPrecached,
    [],
    `these src modules are missing from the sw.js precache list (offline would break): ${notPrecached.join(", ")}`
  );
});
