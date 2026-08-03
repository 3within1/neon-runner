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
 * Original 8-bit neon theme (NOT a copy of any licensed track).
 * Dark minor pulse + square lead — cyberpunk runner energy.
 */
const BPM = 112;
const STEP_SEC = 60 / BPM / 2; // eighth notes
const LOOKAHEAD_SEC = 0.12;
const SCHEDULE_MS = 25;

const NOTE = {
  rest: 0,
  a2: 110.0,
  b2: 123.47,
  c3: 130.81,
  d3: 146.83,
  ds3: 155.56,
  e3: 164.81,
  f3: 174.61,
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
  g4: 392.0,
  gs4: 415.3,
  a4: 440.0,
  c5: 523.25,
  d5: 587.33,
  ds5: 622.25,
};

const BASS = [
  NOTE.a2, 0, NOTE.a2, 0, NOTE.a2, 0, NOTE.e3, 0,
  NOTE.a2, 0, NOTE.a2, 0, NOTE.g3, 0, NOTE.e3, 0,
  NOTE.f3, 0, NOTE.f3, 0, NOTE.f3, 0, NOTE.c3, 0,
  NOTE.e3, 0, NOTE.e3, 0, NOTE.g3, 0, NOTE.e3, 0,
];

const ARPS = [
  NOTE.a3, NOTE.c4, NOTE.e4, NOTE.a4, NOTE.e4, NOTE.c4, NOTE.a3, NOTE.e3,
  NOTE.a3, NOTE.c4, NOTE.e4, NOTE.a4, NOTE.e4, NOTE.c4, NOTE.a3, NOTE.e3,
  NOTE.f3, NOTE.a3, NOTE.c4, NOTE.f4, NOTE.c4, NOTE.a3, NOTE.f3, NOTE.c3,
  NOTE.e3, NOTE.g3, NOTE.b3, NOTE.e4, NOTE.b3, NOTE.g3, NOTE.e3, NOTE.b2,
];

const LEAD = [
  NOTE.a4, 0, NOTE.a4, NOTE.g4, NOTE.e4, 0, NOTE.c4, 0,
  NOTE.d4, NOTE.e4, 0, NOTE.g4, NOTE.a4, 0, 0, 0,
  NOTE.c5, 0, NOTE.a4, 0, NOTE.g4, NOTE.a4, NOTE.e4, 0,
  NOTE.d4, 0, NOTE.c4, NOTE.e4, NOTE.a3, 0, 0, 0,
];

const HATS = [
  1, 0, 1, 0, 1, 0, 1, 1,
  1, 0, 1, 0, 1, 0, 1, 1,
  1, 0, 1, 0, 1, 0, 1, 1,
  1, 0, 1, 1, 1, 0, 1, 1,
];

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
  const i = musicStep % 32;
  const bass = BASS[i];
  const arp = ARPS[i];
  const lead = LEAD[i];
  const hat = HATS[i];

  if (bass) playMusicTone(bass, when, 0.18, "triangle", 0.16);
  if (arp) playMusicTone(arp, when, 0.1, "square", 0.07);
  if (lead) playMusicTone(lead, when, 0.16, "square", 0.1);
  if (hat && noiseBuffer && musicBus && ctx) {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer;
    src.playbackRate.value = 2.4;
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
  while (nextNoteTime < horizon) {
    scheduleStep(nextNoteTime);
    nextNoteTime += STEP_SEC;
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
    // Resume after suspend without restarting the phrase mid-bar harshly.
    nextNoteTime = ctx.currentTime + 0.05;
  }
  setMusicBusGain(MUSIC_GAIN);
  if (musicTimer != null) return;
  schedulerTick();
  musicTimer = window.setInterval(schedulerTick, SCHEDULE_MS);
}

export function startMusic() {
  musicWanted = true;
  musicStep = 0;
  nextNoteTime = 0;
  ensureMusicLoop(true);
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
