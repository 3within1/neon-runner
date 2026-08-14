# NEON RUNNER

Cyberpunk browser platformer. Sprint the grid, stomp drones, jack the exit.

## Run locally

ES modules require a local server (opening `index.html` as a file will fail). Requires **Python 3** on your PATH:

```bash
npm start
```

Then open http://127.0.0.1:5173

App version is `package.json` / `APP_VERSION` in `src/constants.js` (keep them matched). The title overlay fills `#build-version` from `APP_VERSION`.

## Controls

- Move: ← → / A D
- Jump: Space / W / ↑ (air jump from Needle Path onward)
- Wall cling / jump: hold ←/→ into a wall, then jump (from Ascender onward)
- Dash: Shift / K (from Blackout onward) or on-screen DASH
- Pause: Esc
- Mute: M (or AUDIO ON/OFF)
- Start / restart / next sector: Enter, Space, or the on-screen button
- Touch: on-screen controls while playing
- Remap: Settings on the title / pause overlay

## Modes

- **JACK IN** — full campaign (pick an unlocked start sector on the title screen)
- **LOCKDOWN** — NG+ (faster enemies, 2 lives, 1.5× DATA, **turrets**); unlocks after one full clear
- **TIME TRIAL** — single-sector race; best times saved locally
- **REX PRACTICE** — Cyber-Rex arena drill; unlocks after reaching REX CORE
- **Skins** — GRID default; SIGNAL at 500 DATA; EMBER on clear; LOCKDOWN skin on Lockdown clear

## Install (PWA)

Served over `http://127.0.0.1` / HTTPS, the app registers a service worker (`sw.js`) and exposes `manifest.webmanifest` so browsers can install it as a standalone landscape shortcut.

## Sectors

1. **2084 GRID SPRINT** — classic gaps, optional high route, collapse pads  
2. **2091 ASCENDER** — mirrored tower climb; **wall cling / jump** online; **Tower Sentinel** mini-boss on a continuous summit arena  
3. **2100 NEEDLE PATH** — thin platforms; **air jump** online  
4. **2112 SWARM GRID** — dense swarm packs  
5. **2118 OVERCLOCK SPAN** — armored climb, lasers + electric floors  
6. **2125 BLACKOUT RUN** — finale gauntlet; **dash** online; climb to the vault door  
7. **2126 REX CORE** — Cyber-Rex boss arena with armor-break / slam / overclock phases (exit locked until it falls)

## Features

- Checkpoints, collapsing platforms, electric floors, beat-synced laser gates
- Tracking turrets in **LOCKDOWN** only (Needle Path, Swarm Grid, Blackout Run)
- Wall cling / wall jump from Ascender onward
- Combo stomps, hit-stop juice, death replay, screen crack on crash
- HUD run timer + best full-clear time on the title screen
- Local top-10 board, end-run breakdown (deaths / combo / mode)
- Accessibility: colorblind outlines, reduce-motion toggle
- Procedural SFX + per-sector 8-bit themes; beat-linked backdrops
- Installable PWA (offline cache of core assets)

## Source layout

| Module | Role |
|---|---|
| `main.js` | Entry bootstrap |
| `game.js` | Loop, start/restart, pause, modes |
| `simulation.js` | Player, combat, hazards, camera |
| `render.js` | Canvas drawing |
| `level.js` | Level authoring |
| `audio.js` | Procedural Web Audio SFX + themes |
| `sectorTheme.js` | Shared sector BPM / mood / backdrop |
| `story.js` | Title / sector / boss mission beats |
| `meta.js` | Unlocks, skins, binds, best times |
| `leaderboard.js` | Local top-10 high scores |
| `input.js` | Keyboard / touch / rebind |
| `ui.js` | HUD / overlay / settings |
| `state.js` | Shared mutable session state |
| `physics.js` | Collision helpers |
| `dom.js` | Canvas + DOM refs |
| `constants.js` | Tuning + colors |
