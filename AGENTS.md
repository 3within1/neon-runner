# NEON RUNNER

Cyberpunk browser platformer. 100% client-side static web app (HTML5 Canvas + vanilla ES modules + Web Audio). No backend, no database, no bundler, and no npm dependencies. Persistence (leaderboard, unlocks, best times) is browser `localStorage`.

## Cursor Cloud specific instructions

- This is a static site with a single "service": a static HTTP file server. Run it with `npm start` (or `npm run dev`), which is `python3 -m http.server 5173 --bind 127.0.0.1`. Then open `http://127.0.0.1:5173`.
- ES modules and the service worker require serving over HTTP; opening `index.html` via `file://` will fail. Always test through the running server.
- There is no build/bundle step. "Build" == serve the static files as-is. `python3` on PATH is required to serve; Node/npm is required for lint/tests.
- Lint: `npm run lint` (ESLint flat config in `eslint.config.mjs`; `src/**` is treated as browser ES modules, `sw.js` as a service worker, `scripts/`+`test/` as Node).
- Test: `npm test` runs the version-sync check then the Node built-in test runner (`test/*.test.mjs`). The smoke test (`test/smoke.test.mjs`) boots its own static server on port `5199`, so it won't clash with the dev server on `5173`. Tests use only Node built-ins; ESLint is the only devDependency.
- Version sync: all version strings must match `package.json` "version" — `APP_VERSION` in `src/constants.js`, the `?v=` cache-busting params in `index.html`, and the `CACHE` name + `?v=` params in `sw.js`. Run `npm run check:version` (also enforced by `npm test`). Bump every one of these together when releasing (the title overlay renders `APP_VERSION` into `#build-version`).
