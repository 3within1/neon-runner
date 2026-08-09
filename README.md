# NEON RUNNER

Cyberpunk browser platformer. Sprint the grid, stomp drones, jack the exit.

## Run locally

ES modules require a local server (opening `index.html` as a file will fail). Requires **Python 3** on your PATH:

```bash
npm start
```

Then open http://127.0.0.1:5173

App version is `package.json` / `APP_VERSION` in `src/constants.js` (keep them matched). The title overlay fills `#build-version` from `APP_VERSION`.

Installable as a **PWA** (manifest + service worker) when served over localhost/HTTPS.

## Controls

- Move: ← → / A D
- Jump: Space / W / ↑
- Wall cling / wall jump: hold toward a wall in air, then jump
- Pause: Esc / P (or touch ❚❚)
- Mute: M (or AUDIO ON/OFF in HUD / menus)
- Start / restart / next sector: Enter, Space, or the on-screen button
- Touch: on-screen controls while playing
- Title extras: **HARD** toggle, **SECTOR SELECT** (unlocked sectors), **REX PRACTICE**
- Audio: procedural SFX + per-sector 8-bit theme during play; mute preference saved
- Visuals: per-sector backdrop; sky/particle pulse follows the audio beat while music plays
- High scores: local top-10 board on full clear or game over; best clear time tracked; end-run breakdown
- Scoring: packs **+10**, stomps **+20**, turret **+30**, armored **+40**, rex **+60**, boss **+200**; stomp **combo** adds bonus DATA
- Extra lives: **+1** life every **500** DATA (soft cap **9**)
- Pickups: **OVERCLOCK** (speed + shield), **MAGNET** (pulls packs)
- Story: short mission beats on title, sector start/clear, win, and Cyber-Rex announces
- Hard mode: 1 life, tighter coyote, faster foes, Rex overclocked from the start

## Sectors

1. **2084 GRID SPRINT** — classic gaps and drones  
2. **2091 ASCENDER** — vertical climb; climber drones; wall jumps shine here  
3. **2100 NEEDLE PATH** — thin platforms, needles, turret emplacement  
4. **2112 SWARM GRID** — swarm packs + warm-up Cyber-Rex  
5. **2125 BLACKOUT RUN** — finale gauntlet; climb to the vault door; gauntlet Rex  
6. **2126 REX CORE** — Cyber-Rex boss arena (8 stomps, chase/charge, phase 2 shockwaves, phase 3 swarm protocol, victory sting before exit unlocks, +200 DATA)  

Clear an exit to uplink to the next sector. Score and lives carry over until a full reboot. Cleared sectors unlock for sector select.

## Source layout

| Module | Role |
|---|---|
| `main.js` | Entry bootstrap |
| `game.js` | Loop, start/pause/practice, wiring |
| `simulation.js` | Player, combat, entities, camera |
| `render.js` | Canvas drawing |
| `level.js` | Level authoring |
| `audio.js` | Procedural Web Audio SFX, per-sector theme loops, mute |
| `sectorTheme.js` | Shared sector BPM / mood / backdrop identity |
| `story.js` | Title / sector / boss mission beats |
| `progress.js` | Sector unlocks, best clear, hard-mode preference |
| `leaderboard.js` | Local top-10 high scores |
| `input.js` | Keyboard / touch |
| `ui.js` | HUD / overlay / a11y announcements |
| `state.js` | Shared mutable session state |
| `physics.js` | Collision helpers |
| `dom.js` | Canvas + DOM refs |
| `constants.js` | Tuning + colors |
