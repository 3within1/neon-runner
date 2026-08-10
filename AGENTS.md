# NEON RUNNER

Cyberpunk browser platformer. 100% client-side static web app (HTML5 Canvas + vanilla ES modules + Web Audio). No backend, no database, no bundler, and no npm dependencies. Persistence (leaderboard, unlocks, best times) is browser `localStorage`.

## Cursor Cloud specific instructions

- This is a static site with a single "service": a static HTTP file server. Run it with `npm start` (or `npm run dev`), which is `python3 -m http.server 5173 --bind 127.0.0.1`. Then open `http://127.0.0.1:5173`.
- ES modules and the service worker require serving over HTTP; opening `index.html` via `file://` will fail. Always test through the running server.
- There is no build/bundle step. "Build" == serve the static files as-is. `python3` on PATH is required to serve; Node/npm is required for lint/tests.
- Lint: `npm run lint` (ESLint flat config in `eslint.config.mjs`; `src/**` is treated as browser ES modules, `sw.js` as a service worker, `scripts/`+`test/` as Node).
- Test: `npm test` runs the version-sync check then the Node built-in test runner (`test/*.test.mjs`). Tests use only Node built-ins; ESLint is the only devDependency. Node runs each test file in its own process, so module-level singletons (e.g. `state.js`, `meta.js`) don't leak between files.
  - `test/smoke.test.mjs` boots its own static server on port `5199` (won't clash with the dev server on `5173`).
  - `test/physics.test.mjs`, `test/state.test.mjs`, `test/meta.test.mjs` cover the DOM-free logic modules. These modules are importable under Node because `meta.js` wraps its `localStorage` access in try/catch and falls back to in-memory defaults.
- CI: `.github/workflows/ci.yml` runs `npm ci`, `npm run lint`, and `npm test` on every push to `main` and on all PRs (`python3` for the smoke server is preinstalled on the runner).
- `package.json` has `"type": "module"`; the `src/**/*.js` files are ES modules (Node would otherwise warn when importing them in tests). This does not affect how the browser loads them.
- Version sync: all version strings must match `package.json` "version" — `APP_VERSION` in `src/constants.js`, the `?v=` cache-busting params in `index.html`, and the `CACHE` name + `?v=` params in `sw.js`. Run `npm run check:version` (also enforced by `npm test`). Bump every one of these together when releasing (the title overlay renders `APP_VERSION` into `#build-version`).
- Service worker cache busting (IMPORTANT): `sw.js` is cache-first, so any JS/CSS fix to already-shipped assets will NOT reach returning users until the version is bumped. Bumping the version changes the `sw.js` `CACHE` name (and the `?v=` params + `sw.js` file content), which triggers the browser to install the new worker; its `activate` handler purges the old cache and re-fetches fresh assets. So a code fix in `src/**` must be paired with a version bump to actually ship.

## Recommended workflow (planner → implementer → verifier)

For non-trivial changes, use the repo-scoped subagents in `.cursor/agents/` (pinned to Composer 2.5 to stay in the included Cursor Models usage pool):

1. `@planner` — read-only; produces an ordered, testable plan (respects the rules above, incl. version-sync).
2. `@implementer` — makes the minimal change and runs `npm run lint` + `npm test`, reporting output.
3. `@verifier` — skeptical, read-only gate; re-runs the checks and validates the diff against the plan and the version-sync rule before the work is trusted.

Model guidance: keep the loop on Composer 2.5 (or Grok 4.5 at `medium` effort for heavier multi-file reasoning). Only escalate to a frontier model if `@verifier` keeps failing on the same issue. Review with Agent Review (Quick) locally and Bugbot on PRs; Bugbot uses `.cursor/BUGBOT.md` for this repo's review priorities (note: `.cursor/rules/*` do NOT apply to Bugbot).
