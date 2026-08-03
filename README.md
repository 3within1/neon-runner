# NEON RUNNER

Cyberpunk browser platformer. Sprint the grid, stomp drones, jack the exit.

## Run locally

ES modules require a local server (opening `index.html` as a file will fail). Requires **Python 3** on your PATH:

```bash
npm start
```

Then open http://127.0.0.1:5173

## Controls

- Move: ← → / A D
- Jump: Space / W / ↑
- Start / restart / next sector: Enter, Space, or the on-screen button
- Touch: on-screen controls while playing

## Sectors

1. **2084 GRID SPRINT** — classic gaps and floating platforms  
2. **2091 ASCENDER** — vertical climb to a high exit  
3. **2100 NEEDLE PATH** — thin platforms and dense spikes  
4. **2112 SWARM GRID** — drone-heavy patrol lanes  
5. **2125 BLACKOUT RUN** — long finale mixing all of the above  

Clear an exit to uplink to the next sector. Score and lives carry over until a full reboot.

## Source layout

| Module | Role |
|---|---|
| `main.js` | Entry bootstrap |
| `game.js` | Loop, start/restart, wiring |
| `simulation.js` | Player, combat, entities, camera |
| `render.js` | Canvas drawing |
| `level.js` | Level authoring |
| `input.js` | Keyboard / touch |
| `ui.js` | HUD / overlay / a11y announcements |
| `state.js` | Shared mutable session state |
| `physics.js` | Collision helpers |
| `dom.js` | Canvas + DOM refs |
| `constants.js` | Tuning + colors |
