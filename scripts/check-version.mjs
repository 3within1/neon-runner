#!/usr/bin/env node
/**
 * Version sync check.
 *
 * `package.json` "version" is the single source of truth. The same version is
 * duplicated in several places for cache-busting / display, and they must stay
 * matched (see README + the "Keep in sync with package.json" note in
 * src/constants.js). This script fails if any of them drift.
 */
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

async function read(rel) {
  return readFile(join(ROOT, rel), "utf8");
}

/** Collect every distinct `?v=<version>` cache-busting param in a file. */
function queryVersions(text) {
  return [...text.matchAll(/\?v=([0-9]+\.[0-9]+\.[0-9]+)/g)].map((m) => m[1]);
}

export async function checkVersions() {
  const pkg = JSON.parse(await read("package.json"));
  const expected = pkg.version;
  const checks = [];

  const add = (name, value) =>
    checks.push({ name, value, ok: value === expected });

  const constants = await read("src/constants.js");
  const appVersion = constants.match(/APP_VERSION\s*=\s*"([^"]+)"/)?.[1] ?? null;
  add("src/constants.js APP_VERSION", appVersion);

  const html = await read("index.html");
  const htmlVersions = queryVersions(html);
  if (htmlVersions.length === 0) {
    checks.push({ name: "index.html ?v= params", value: null, ok: false });
  } else {
    htmlVersions.forEach((v, i) => add(`index.html ?v= param #${i + 1}`, v));
  }

  const sw = await read("sw.js");
  const cacheName = sw.match(/CACHE\s*=\s*"neon-runner-v([^"]+)"/)?.[1] ?? null;
  add("sw.js CACHE name", cacheName);
  queryVersions(sw).forEach((v, i) => add(`sw.js ?v= param #${i + 1}`, v));

  const errors = checks
    .filter((c) => !c.ok)
    .map((c) => `${c.name}: expected "${expected}", found ${JSON.stringify(c.value)}`);

  return { expected, checks, errors };
}

async function main() {
  const { expected, checks, errors } = await checkVersions();
  for (const c of checks) {
    process.stdout.write(`${c.ok ? "OK " : "BAD"}  ${c.name} = ${JSON.stringify(c.value)}\n`);
  }
  if (errors.length > 0) {
    process.stderr.write(`\nVersion mismatch (expected ${expected}):\n- ${errors.join("\n- ")}\n`);
    process.exit(1);
  }
  process.stdout.write(`\nAll version references match ${expected}.\n`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    process.stderr.write(`${err.stack || err}\n`);
    process.exit(1);
  });
}
