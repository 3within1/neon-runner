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
- Jump: Space / W / ↑
- Mute: M (or AUDIO ON/OFF in HUD / menus)
- Start / restart / next sector: Enter, Space, or the on-screen button
- Touch: on-screen controls while playing
- Audio: procedural SFX + per-sector 8-bit theme during play; mute with **M** / AUDIO ON/OFF (preference saved)
- Visuals: per-sector backdrop (palette/style from `sectorTheme.js`); sky/particle pulse follows the audio beat while music plays
- High scores: local top-10 board on full clear or game over (initials saved in this browser); end-run breakdown; clear board
- Scoring: data packs **+10** DATA, stomps **+20** DATA (HUD shows DATA / PACKS / KILLS). Weighted scoring uses a fresh local board key.
- Extra lives: **+1** life every **500** DATA (soft cap **9**)

## Sectors

1. **2084 GRID SPRINT** — classic gaps and drones  

2. **2091 ASCENDER** — vertical climb; climber drones on shafts  
3. **2100 NEEDLE PATH** — thin platforms, dense spikes, fast needle drones  
4. **2112 SWARM GRID** — dense swarm packs on patrol lanes  
5. **2125 BLACKOUT RUN** — finale gauntlet into a cyber rex **boss arena** (8 stomps, chase/charge, exit locked until it falls, +200 DATA)  

Clear an exit to uplink to the next sector. Score and lives carry over until a full reboot.

## Source layout

| Module | Role |
|---|---|
| `main.js` | Entry bootstrap |
| `game.js` | Loop, start/restart, wiring |
| `simulation.js` | Player, combat, entities, camera |
| `render.js` | Canvas drawing |
| `level.js` | Level authoring |
| `audio.js` | Procedural Web Audio SFX, per-sector theme loops, mute |
| `sectorTheme.js` | Shared sector BPM / mood / backdrop identity |
| `leaderboard.js` | Local top-10 high scores |
| `input.js` | Keyboard / touch |
| `ui.js` | HUD / overlay / a11y announcements |
| `state.js` | Shared mutable session state |
| `physics.js` | Collision helpers |
| `dom.js` | Canvas + DOM refs |
| `constants.js` | Tuning + colors |
