# Code review rules — NEON RUNNER

Note: despite the filename, this file is the custom review-criteria file read by in-editor
**Agent Review** (and by Bugbot, if it is ever enabled). Keeping this file costs nothing on
its own — it only shapes reviews when a review actually runs.

NEON RUNNER is a 100% client-side static browser game (HTML5 Canvas + vanilla ES modules + Web Audio). No backend, no bundler, no npm runtime deps. Review with these repo-specific priorities and don't restate what ESLint already enforces.

## Must-check (high signal for this repo)

- Version sync: any change to already-shipped `src/**` assets must bump the version in ALL of `package.json`, `src/constants.js` (`APP_VERSION`), `index.html` (`?v=`), and `sw.js` (`CACHE` + `?v=`). A code fix without a version bump will NOT reach returning users because `sw.js` is cache-first. Flag mismatched or missing bumps. (`npm run check:version` enforces this.)
- ES module correctness: every identifier used in a module must be imported or defined in scope. This repo shipped a lock-up caused by referencing an un-imported `state.js` export (`comboTimer`) — a `no-undef` that only throws on a specific branch. Flag any use of a `state.js`/module export that isn't in the import list.
- Frame-loop safety: `src/game.js`'s `requestAnimationFrame` loop must always reschedule (it is wrapped in try/catch/finally). Flag changes that could throw before rescheduling or that remove the guard — a single unhandled exception previously froze the whole game.
- Browser-only globals: `src/**` and `sw.js` run in the browser (`window`, `document`, `localStorage`, `AudioContext`, service-worker globals). Code that may be imported by Node tests must guard access — see how `meta.js` wraps `localStorage` in try/catch so tests can import it.

## Style / scope

- Prefer minimal, focused diffs; do not refactor unrelated code.
- No narration comments; comments should explain non-obvious intent only.

## Testing expectations

- `npm run lint` and `npm test` must pass. `test/*.test.mjs` cover the DOM-free logic modules (`physics`, `state`, `meta`) and a static-server smoke test on port 5199.
- Non-trivial gameplay/UI changes should be validated in the browser via `npm start` (there is no build step), not just by lint/tests.

## Out of scope (do not flag)

- Absence of a build step, bundler, framework, or npm runtime dependencies — these are intentional.
