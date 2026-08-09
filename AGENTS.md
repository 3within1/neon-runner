# NEON RUNNER

Cyberpunk browser platformer. 100% client-side static web app (HTML5 Canvas + vanilla ES modules + Web Audio). No backend, no database, no bundler, and no npm dependencies. Persistence (leaderboard, unlocks, best times) is browser `localStorage`.

## Cursor Cloud specific instructions

- This is a static site with a single "service": a static HTTP file server. Run it with `npm start` (or `npm run dev`), which is `python3 -m http.server 5173 --bind 127.0.0.1`. Then open `http://127.0.0.1:5173`.
- ES modules and the service worker require serving over HTTP; opening `index.html` via `file://` will fail. Always test through the running server.
- There are no dependencies to install (no lockfile, no `node_modules`), no build step, and no lint or automated test tooling in this repo. "Build" == serve the static files as-is.
- `python3` on PATH is the only hard requirement. Node/npm is only used as a convenience wrapper for the run scripts.
- Keep `APP_VERSION` in `src/constants.js` matched with `version` in `package.json` (the title overlay renders `APP_VERSION` into `#build-version`).
