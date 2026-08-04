import { getSectorTheme, getSectorThemeCount } from "./sectorTheme.js";

const STORAGE_KEY = "neon-runner-muted";
const MASTER_GAIN = 0.55;
const MUSIC_GAIN = 0.45;

/** @type {AudioContext | null} */
let ctx = null;
/** @type {GainNode | null} */
let master = null;
/** @type {GainNode | null} */
let sfxBus = null;
/** @type {GainNode | null} */
let musicBus = null;
/** @type {AudioBuffer | null} */
let noiseBuffer = null;
let muted = false;
let audioFailed = false;
let musicWanted = false;
/** @type {number | null} */
let musicTimer = null;
let musicStep = 0;
/** AudioContext time of the next sequencer step */
let nextNoteTime = 0;
/** Active sector theme index (0–4) */
let themeIndex = 0;
/** @type {(() => void) | null} */
let detachUnlockGestures = null;

try {
  muted = localStorage.getItem(STORAGE_KEY) === "1";
} catch {
  muted = false;
}

function isRunning() {
  return Boolean(ctx && ctx.state === "running");
}

function ensureContext() {
  if (audioFailed) return null;
  if (!ctx) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) {
        audioFailed = true;
        return null;
      }
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : MASTER_GAIN;
      master.connect(ctx.destination);

      sfxBus = ctx.createGain();
      sfxBus.gain.value = 1;
      sfxBus.connect(master);

      musicBus = ctx.createGain();
      musicBus.gain.value = MUSIC_GAIN;
      musicBus.connect(master);

      const length = Math.max(1, Math.floor(ctx.sampleRate * 0.2));
      noiseBuffer = ctx.createBuffer(1, length, ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;

      ctx.addEventListener("statechange", () => {
        if (!ctx) return;
        if (ctx.state !== "running") {
          pauseMusicClock();
          armUnlockGestures();
        } else if (musicWanted && !muted) {
          ensureMusicLoop();
        }
      });
    } catch {
      audioFailed = true;
      ctx = null;
      master = null;
      sfxBus = null;
      musicBus = null;
      return null;
    }
  }
  return ctx;
}

function armUnlockGestures() {
  if (detachUnlockGestures) return;
  const onGesture = () => {
    void unlockAudio();
  };
  window.addEventListener("pointerdown", onGesture);
  window.addEventListener("keydown", onGesture);
  detachUnlockGestures = () => {
    window.removeEventListener("pointerdown", onGesture);
    window.removeEventListener("keydown", onGesture);
    detachUnlockGestures = null;
  };
}

export function isMuted() {
  return muted;
}

export function isAudioAvailable() {
  return !audioFailed;
}

function applyMasterGain() {
  if (!master || !ctx) return;
  const now = ctx.currentTime;
  const target = muted ? 0 : MASTER_GAIN;
  master.gain.cancelScheduledValues(now);
  master.gain.setValueAtTime(target, now);
}

function setMusicBusGain(level, rampSec = 0) {
  if (!musicBus || !ctx) return;
  const now = ctx.currentTime;
  musicBus.gain.cancelScheduledValues(now);
  if (rampSec > 0) {
    musicBus.gain.setValueAtTime(Math.max(musicBus.gain.value, 0.0001), now);
    musicBus.gain.linearRampToValueAtTime(Math.max(level, 0.0001), now + rampSec);
  } else {
    musicBus.gain.setValueAtTime(level, now);
  }
}

export function setMuted(next) {
  muted = Boolean(next);
  try {
    localStorage.setItem(STORAGE_KEY, muted ? "1" : "0");
  } catch {
    /* ignore */
  }
  applyMasterGain();
  if (muted) {
    pauseMusicClock();
  } else if (musicWanted) {
    void unlockAudio();
  }
}

export function toggleMute() {
  setMuted(!muted);
  return muted;
}

/** Resume AudioContext after a user gesture (autoplay policy). */
export async function unlockAudio() {
  const audio = ensureContext();
  if (!audio) return false;
  if (audio.state === "suspended" || audio.state === "interrupted") {
    try {
      await audio.resume();
    } catch {
      /* ignore */
    }
  }
  const running = audio.state === "running";
  if (running && detachUnlockGestures) detachUnlockGestures();
  if (running && musicWanted && !muted) ensureMusicLoop();
  return running;
}

/** True when SFX/music may schedule into a live context. Does not create a context. */
function audioReady() {
  return Boolean(!muted && !audioFailed && sfxBus && isRunning());
}

function tone(freq, duration, type = "square", gain = 0.12, slideTo = null, delay = 0) {
  if (muted || audioFailed) return;
  if (!ensureContext() || !sfxBus || !isRunning()) return;

  const audio = ctx;
  const now = audio.currentTime + delay;
  const osc = audio.createOscillator();
  const env = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  if (slideTo != null) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), now + duration);
  }
  env.gain.setValueAtTime(0.0001, now);
  env.gain.exponentialRampToValueAtTime(gain, now + 0.012);
  env.gain.exponentialRampToValueAtTime(0.0001, now + Math.max(duration, 0.02));
  osc.connect(env);
  env.connect(sfxBus);
  osc.start(now);
  osc.stop(now + duration + 0.02);
}

function noiseBurst(duration, gain = 0.08, filterFreq = 1200) {
  if (!audioReady() || !noiseBuffer) return;
  const audio = ctx;
  const now = audio.currentTime;
  const src = audio.createBufferSource();
  src.buffer = noiseBuffer;
  const filter = audio.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = filterFreq;
  filter.Q.value = 0.8;
  const env = audio.createGain();
  env.gain.setValueAtTime(gain, now);
  env.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  src.connect(filter);
  filter.connect(env);
  env.connect(sfxBus);
  src.start(now);
  src.stop(now + duration + 0.02);
}

export const sfx = {
  ui() {
    tone(880, 0.06, "triangle", 0.08);
  },
  jump() {
    tone(220, 0.12, "square", 0.12, 520);
  },
  land() {
    noiseBurst(0.06, 0.06, 400);
    tone(90, 0.07, "triangle", 0.06);
  },
  coin() {
    tone(880, 0.05, "square", 0.08);
    tone(1320, 0.1, "square", 0.06, 1760, 0.05);
  },
  stomp() {
    noiseBurst(0.08, 0.1, 600);
    tone(160, 0.12, "sawtooth", 0.09, 60);
  },
  hit() {
    noiseBurst(0.18, 0.14, 900);
    tone(180, 0.2, "sawtooth", 0.1, 55);
  },
  die() {
    noiseBurst(0.35, 0.16, 700);
    tone(320, 0.45, "sawtooth", 0.12, 40);
  },
  clear() {
    tone(440, 0.1, "square", 0.09);
    tone(554, 0.1, "square", 0.09, null, 0.08);
    tone(659, 0.18, "square", 0.1, null, 0.16);
  },
  win() {
    tone(523, 0.12, "square", 0.1);
    tone(659, 0.12, "square", 0.1, null, 0.1);
    tone(784, 0.12, "square", 0.1, null, 0.2);
    tone(1046, 0.28, "triangle", 0.11, null, 0.3);
  },
  start() {
    tone(110, 0.2, "sawtooth", 0.09, 440);
    noiseBurst(0.15, 0.05, 2000);
  },
};

/*
 * Original 8-bit sector themes (NOT copies of licensed tracks).
 * Each LEVELS[] index maps to one theme — distinct BPM / harmony / density.
 */
const NOTE = {
  rest: 0,
  a2: 110.0,
  b2: 123.47,
  c3: 130.81,
  d3: 146.83,
  ds3: 155.56,
  e3: 164.81,
  f3: 174.61,
  fs3: 185.0,
  g3: 196.0,
  gs3: 207.65,
  a3: 220.0,
  as3: 233.08,
  b3: 246.94,
  c4: 261.63,
  d4: 293.66,
  ds4: 311.13,
  e4: 329.63,
  f4: 349.23,
  fs4: 369.99,
  g4: 392.0,
  gs4: 415.3,
  a4: 440.0,
  as4: 466.16,
  b4: 493.88,
  c5: 523.25,
  d5: 587.33,
  ds5: 622.25,
  e5: 659.25,
};

/** @typedef {{ bass: number[], arps: number[], lead: number[], hats: number[], hatRate?: number }} ThemePattern */

/** Pattern data only — BPM / mood come from sectorTheme.js (same index). */
/** @type {ThemePattern[]} */
const THEMES = [
  // 0 GRID SPRINT — classic neon pulse
  {
    bass: [
      NOTE.a2, 0, NOTE.a2, 0, NOTE.a2, 0, NOTE.e3, 0,
      NOTE.a2, 0, NOTE.a2, 0, NOTE.g3, 0, NOTE.e3, 0,
      NOTE.f3, 0, NOTE.f3, 0, NOTE.f3, 0, NOTE.c3, 0,
      NOTE.e3, 0, NOTE.e3, 0, NOTE.g3, 0, NOTE.e3, 0,
    ],
    arps: [
      NOTE.a3, NOTE.c4, NOTE.e4, NOTE.a4, NOTE.e4, NOTE.c4, NOTE.a3, NOTE.e3,
      NOTE.a3, NOTE.c4, NOTE.e4, NOTE.a4, NOTE.e4, NOTE.c4, NOTE.a3, NOTE.e3,
      NOTE.f3, NOTE.a3, NOTE.c4, NOTE.f4, NOTE.c4, NOTE.a3, NOTE.f3, NOTE.c3,
      NOTE.e3, NOTE.g3, NOTE.b3, NOTE.e4, NOTE.b3, NOTE.g3, NOTE.e3, NOTE.b2,
    ],
    lead: [
      NOTE.a4, 0, NOTE.a4, NOTE.g4, NOTE.e4, 0, NOTE.c4, 0,
      NOTE.d4, NOTE.e4, 0, NOTE.g4, NOTE.a4, 0, 0, 0,
      NOTE.c5, 0, NOTE.a4, 0, NOTE.g4, NOTE.a4, NOTE.e4, 0,
      NOTE.d4, 0, NOTE.c4, NOTE.e4, NOTE.a3, 0, 0, 0,
    ],
    hats: [
      1, 0, 1, 0, 1, 0, 1, 1,
      1, 0, 1, 0, 1, 0, 1, 1,
      1, 0, 1, 0, 1, 0, 1, 1,
      1, 0, 1, 1, 1, 0, 1, 1,
    ],
  },
  // 1 ASCENDER — climbing motifs, slightly slower
  {
    bass: [
      NOTE.e3, 0, NOTE.e3, 0, NOTE.g3, 0, NOTE.b3, 0,
      NOTE.e3, 0, NOTE.e3, 0, NOTE.a3, 0, NOTE.b3, 0,
      NOTE.c3, 0, NOTE.c3, 0, NOTE.e3, 0, NOTE.g3, 0,
      NOTE.d3, 0, NOTE.d3, 0, NOTE.fs3, 0, NOTE.a3, 0,
    ],
    arps: [
      NOTE.e3, NOTE.g3, NOTE.b3, NOTE.e4, NOTE.g4, NOTE.e4, NOTE.b3, NOTE.g3,
      NOTE.e3, NOTE.a3, NOTE.c4, NOTE.e4, NOTE.a4, NOTE.e4, NOTE.c4, NOTE.a3,
      NOTE.c3, NOTE.e3, NOTE.g3, NOTE.c4, NOTE.e4, NOTE.c4, NOTE.g3, NOTE.e3,
      NOTE.d3, NOTE.fs3, NOTE.a3, NOTE.d4, NOTE.fs4, NOTE.d4, NOTE.a3, NOTE.fs3,
    ],
    lead: [
      NOTE.e4, NOTE.g4, 0, NOTE.b4, NOTE.e5, 0, 0, NOTE.b4,
      NOTE.a4, 0, NOTE.g4, NOTE.e4, 0, NOTE.c4, 0, 0,
      NOTE.c5, 0, NOTE.g4, 0, NOTE.e4, NOTE.g4, NOTE.c5, 0,
      NOTE.d5, NOTE.a4, 0, NOTE.fs4, NOTE.d4, 0, 0, 0,
    ],
    hats: [
      1, 0, 0, 1, 1, 0, 1, 0,
      1, 0, 0, 1, 1, 0, 1, 1,
      1, 0, 0, 1, 1, 0, 1, 0,
      1, 0, 1, 0, 1, 1, 0, 1,
    ],
  },
  // 2 NEEDLE PATH — tense, sparse, higher
  {
    bass: [
      NOTE.a2, 0, 0, NOTE.a2, 0, 0, NOTE.gs3, 0,
      NOTE.a2, 0, 0, NOTE.a2, 0, NOTE.e3, 0, 0,
      NOTE.f3, 0, 0, NOTE.f3, 0, 0, NOTE.ds3, 0,
      NOTE.e3, 0, NOTE.e3, 0, 0, NOTE.b2, 0, 0,
    ],
    arps: [
      NOTE.a4, 0, NOTE.e4, 0, NOTE.c5, 0, NOTE.e4, 0,
      NOTE.a4, 0, NOTE.ds4, 0, NOTE.e4, 0, NOTE.a3, 0,
      NOTE.f4, 0, NOTE.c4, 0, NOTE.gs4, 0, NOTE.c4, 0,
      NOTE.e4, 0, NOTE.b3, 0, NOTE.gs4, 0, NOTE.e4, 0,
    ],
    lead: [
      NOTE.e5, 0, 0, NOTE.ds5, NOTE.e5, 0, NOTE.c5, 0,
      0, NOTE.a4, 0, 0, NOTE.gs4, NOTE.a4, 0, 0,
      NOTE.f4, 0, NOTE.gs4, 0, NOTE.a4, 0, 0, NOTE.e4,
      0, 0, NOTE.ds4, NOTE.e4, 0, NOTE.b3, 0, 0,
    ],
    hats: [
      1, 0, 0, 1, 0, 0, 1, 0,
      1, 0, 1, 0, 0, 1, 0, 1,
      1, 0, 0, 1, 0, 0, 1, 0,
      1, 1, 0, 1, 0, 1, 0, 0,
    ],
    hatRate: 3.2,
  },
  // 3 SWARM GRID — faster, denser, aggressive
  {
    bass: [
      NOTE.a2, NOTE.a2, 0, NOTE.a2, NOTE.e3, 0, NOTE.a2, 0,
      NOTE.a2, NOTE.a2, 0, NOTE.g3, NOTE.e3, 0, NOTE.a2, 0,
      NOTE.f3, NOTE.f3, 0, NOTE.f3, NOTE.c3, 0, NOTE.f3, 0,
      NOTE.e3, NOTE.e3, 0, NOTE.g3, NOTE.e3, NOTE.e3, 0, NOTE.b2,
    ],
    arps: [
      NOTE.a3, NOTE.e4, NOTE.a4, NOTE.e4, NOTE.a3, NOTE.e4, NOTE.c5, NOTE.e4,
      NOTE.a3, NOTE.e4, NOTE.a4, NOTE.e4, NOTE.g4, NOTE.e4, NOTE.a4, NOTE.e4,
      NOTE.f3, NOTE.c4, NOTE.f4, NOTE.c4, NOTE.f3, NOTE.c4, NOTE.a4, NOTE.c4,
      NOTE.e3, NOTE.b3, NOTE.e4, NOTE.b3, NOTE.g4, NOTE.b3, NOTE.e4, NOTE.b3,
    ],
    lead: [
      NOTE.a4, NOTE.a4, NOTE.g4, 0, NOTE.e4, NOTE.e4, 0, NOTE.c5,
      NOTE.a4, 0, NOTE.g4, NOTE.a4, NOTE.e5, 0, 0, NOTE.a4,
      NOTE.f4, NOTE.f4, NOTE.a4, 0, NOTE.c5, 0, NOTE.a4, 0,
      NOTE.e4, NOTE.g4, NOTE.b4, NOTE.e5, 0, NOTE.b4, NOTE.g4, 0,
    ],
    hats: [
      1, 1, 1, 0, 1, 1, 1, 1,
      1, 1, 1, 0, 1, 1, 0, 1,
      1, 1, 1, 0, 1, 1, 1, 1,
      1, 0, 1, 1, 1, 1, 1, 1,
    ],
    hatRate: 2.8,
  },
  // 4 BLACKOUT RUN — dark finale, heavier low end
  {
    bass: [
      NOTE.a2, 0, NOTE.a2, NOTE.a2, 0, NOTE.e3, NOTE.a2, 0,
      NOTE.g3, 0, NOTE.e3, 0, NOTE.a2, NOTE.a2, 0, NOTE.e3,
      NOTE.f3, 0, NOTE.f3, NOTE.f3, 0, NOTE.c3, NOTE.f3, 0,
      NOTE.e3, 0, NOTE.e3, NOTE.ds3, NOTE.e3, 0, NOTE.b2, 0,
    ],
    arps: [
      NOTE.a3, 0, NOTE.c4, NOTE.e4, 0, NOTE.a4, 0, NOTE.e4,
      NOTE.g3, 0, NOTE.b3, NOTE.e4, 0, NOTE.g4, 0, NOTE.e4,
      NOTE.f3, 0, NOTE.a3, NOTE.c4, 0, NOTE.f4, 0, NOTE.c4,
      NOTE.e3, 0, NOTE.gs3, NOTE.b3, 0, NOTE.e4, NOTE.gs4, 0,
    ],
    lead: [
      NOTE.a4, 0, 0, NOTE.e4, NOTE.a4, NOTE.c5, 0, 0,
      NOTE.b4, 0, NOTE.g4, 0, NOTE.e4, 0, NOTE.g4, 0,
      NOTE.a4, NOTE.f4, 0, NOTE.c5, 0, 0, NOTE.a4, 0,
      NOTE.gs4, NOTE.e4, 0, NOTE.b4, NOTE.e5, 0, 0, 0,
    ],
    hats: [
      1, 0, 1, 1, 0, 1, 0, 1,
      1, 0, 1, 1, 0, 1, 1, 1,
      1, 0, 1, 1, 0, 1, 0, 1,
      1, 1, 0, 1, 1, 0, 1, 1,
    ],
    hatRate: 2.0,
  },
];

const LOOKAHEAD_SEC = 0.12;
const SCHEDULE_MS = 25;

function currentTheme() {
  return THEMES[themeIndex] || THEMES[0];
}

function stepSec() {
  // Half-beat step; BPM lives in sectorTheme.js (shared with visuals).
  return 60 / getSectorTheme(themeIndex).bpm / 2;
}

/** Number of music pattern slots (must match LEVELS / SECTOR_THEMES). */
export function getMusicThemeCount() {
  return THEMES.length;
}

/**
 * 0..1 visual pulse locked to the audio sequencer (peak on musical downbeats).
 * Frozen at 0.5 when music is not actively scheduling (title, mute, stop, tab pause).
 */
export function getBeatPulse() {
  if (!musicWanted || muted || !ctx || musicTimer == null) return 0.5;
  const step = stepSec();
  if (!(step > 0)) return 0.5;
  const stepsAhead = (nextNoteTime - ctx.currentTime) / step;
  const currentStep = musicStep - stepsAhead;
  // 2 half-beat steps = 1 beat; cos so phase 0 (downbeat) → pulse 1
  const beatPhase = ((currentStep / 2) % 1 + 1) % 1;
  return 0.5 + 0.5 * Math.cos(beatPhase * Math.PI * 2);
}

function playMusicTone(freq, when, duration, type, gain) {
  if (!freq || !musicBus || !ctx || muted || !isRunning()) return;
  const osc = ctx.createOscillator();
  const env = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, when);
  env.gain.setValueAtTime(0.0001, when);
  env.gain.exponentialRampToValueAtTime(gain, when + 0.01);
  env.gain.exponentialRampToValueAtTime(0.0001, when + Math.max(duration, 0.02));
  osc.connect(env);
  env.connect(musicBus);
  osc.start(when);
  osc.stop(when + duration + 0.02);
}

function scheduleStep(when) {
  const theme = currentTheme();
  const i = musicStep % 32;
  const bass = theme.bass[i];
  const arp = theme.arps[i];
  const lead = theme.lead[i];
  const hat = theme.hats[i];

  if (bass) playMusicTone(bass, when, 0.18, "triangle", 0.16);
  if (arp) playMusicTone(arp, when, 0.1, "square", 0.07);
  if (lead) playMusicTone(lead, when, 0.16, "square", 0.1);
  if (hat && noiseBuffer && musicBus && ctx) {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer;
    src.playbackRate.value = theme.hatRate ?? 2.4;
    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 5000;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.035, when);
    env.gain.exponentialRampToValueAtTime(0.0001, when + 0.04);
    src.connect(filter);
    filter.connect(env);
    env.connect(musicBus);
    src.start(when);
    src.stop(when + 0.05);
  }

  musicStep += 1;
}

function schedulerTick() {
  if (!musicWanted || muted || !ctx || !isRunning()) {
    pauseMusicClock();
    return;
  }

  const horizon = ctx.currentTime + LOOKAHEAD_SEC;
  const step = stepSec();
  while (nextNoteTime < horizon) {
    scheduleStep(nextNoteTime);
    nextNoteTime += step;
  }
}

function pauseMusicClock() {
  if (musicTimer != null) {
    clearInterval(musicTimer);
    musicTimer = null;
  }
}

function ensureMusicLoop(resetPhrase = false) {
  if (!musicWanted || muted) return;
  if (!ensureContext()) return;
  if (!isRunning()) return;
  if (resetPhrase || nextNoteTime === 0) {
    musicStep = 0;
    nextNoteTime = ctx.currentTime + 0.05;
  } else if (nextNoteTime < ctx.currentTime) {
    nextNoteTime = ctx.currentTime + 0.05;
  }
  setMusicBusGain(MUSIC_GAIN);
  if (musicTimer != null) return;
  schedulerTick();
  musicTimer = window.setInterval(schedulerTick, SCHEDULE_MS);
}

/**
 * @param {number} [index] Sector theme index (matches LEVELS index).
 */
export function startMusic(index = 0) {
  const max = Math.min(THEMES.length, getSectorThemeCount()) - 1;
  const next = Math.max(0, Math.min(max, Math.floor(Number(index) || 0)));
  const themeChanged = next !== themeIndex;
  themeIndex = next;
  musicWanted = true;
  if (themeChanged || !musicTimer) {
    pauseMusicClock();
    musicStep = 0;
    nextNoteTime = 0;
    ensureMusicLoop(true);
  } else {
    ensureMusicLoop(false);
  }
}

export function stopMusic() {
  musicWanted = false;
  pauseMusicClock();
  setMusicBusGain(0.0001, 0.08);
}

export function initAudio() {
  armUnlockGestures();
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      pauseMusicClock();
    } else if (musicWanted && !muted) {
      void unlockAudio();
    }
  });
}
