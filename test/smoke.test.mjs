import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const HOST = "127.0.0.1";
const PORT = 5199; // dedicated test port, avoids clashing with dev server on 5173
const BASE = `http://${HOST}:${PORT}`;

let server;

async function waitForServer(timeoutMs = 10000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${BASE}/index.html`);
      if (res.ok) return;
    } catch {
      // server not up yet
    }
    await new Promise((r) => setTimeout(r, 150));
  }
  throw new Error(`static server did not become ready on ${BASE}`);
}

before(async () => {
  server = spawn(
    "python3",
    ["-m", "http.server", String(PORT), "--bind", HOST],
    { cwd: ROOT, stdio: "ignore" }
  );
  await waitForServer();
});

after(() => {
  if (server && server.pid) server.kill("SIGTERM");
});

test("serves index.html", async () => {
  const res = await fetch(`${BASE}/index.html`);
  assert.equal(res.status, 200);
  const body = await res.text();
  assert.match(body, /NEON RUNNER/);
  assert.match(body, /src\/main\.js/);
});

test("serves JS modules with a JavaScript content-type", async () => {
  const res = await fetch(`${BASE}/src/main.js`);
  assert.equal(res.status, 200);
  const type = res.headers.get("content-type") || "";
  assert.match(type, /javascript/, `unexpected content-type: ${type}`);
});

test("serves PWA manifest and service worker", async () => {
  for (const path of ["/manifest.webmanifest", "/sw.js"]) {
    const res = await fetch(`${BASE}${path}`);
    assert.equal(res.status, 200, `${path} should return 200`);
  }
});

test("every source module referenced by the service worker is reachable", async () => {
  const swBody = await (await fetch(`${BASE}/sw.js`)).text();
  const modules = [...swBody.matchAll(/"\.(\/src\/[a-zA-Z0-9_.-]+\.js)"/g)].map((m) => m[1]);
  assert.ok(modules.length >= 5, "expected sw.js to precache several source modules");
  for (const mod of modules) {
    const res = await fetch(`${BASE}${mod}`);
    assert.equal(res.status, 200, `${mod} should return 200`);
  }
});
