import {
  overlay,
  startBtn,
  scoreEl,
  packsEl,
  killsEl,
  livesEl,
  sectorEl,
  timerEl,
  comboEl,
  buildVersionEl,
  muteBtn,
  hudMuteBtn,
  statusLive,
  touchControls,
  canvas,
  leaderboardEl,
  leaderboardListEl,
  scoreEntryEl,
  initialsInput,
  scoreSaveBtn,
  clearScoresBtn,
  runSummaryEl,
  modeRowEl,
  settingsPanelEl,
  pauseActionsEl,
  bestClearEl,
  sectorSelectEl,
  sectorButtonsEl,
} from "./dom.js";
import { isAudioAvailable, isMuted, toggleMute, unlockAudio, sfx } from "./audio.js";
import { APP_VERSION } from "./constants.js";
import {
  clearScores,
  formatRunBreakdown,
  getLastInitials,
  getScores,
  isHighScore,
  migrateScoreStorage,
  normalizeInitials,
  submitScore,
} from "./leaderboard.js";
import { getLevelCount, getLevelDef, LEVELS } from "./level.js";
import {
  considerScoreUnlocks,
  formatClock,
  getActiveSkin,
  getBestClearTime,
  getMeta,
  getSectorBestTime,
  getUnlockedSector,
  RUNNER_SKINS,
  saveMeta,
  setSkin,
} from "./meta.js";
import {
  applyBindings,
  getBindings,
  setRebindListener,
  startRebind,
} from "./input.js";
import {
  combo,
  preferTouch,
  practiceMode,
  score,
  lives,
  state,
  levelIndex,
  level,
  runCoins,
  runStomps,
  runElapsed,
  runDeaths,
  maxCombo,
  runMode,
  setState,
} from "./state.js";

/**
 * @typedef {{
 *   outcome: 'won' | 'dead',
 *   baseTagline: string,
 *   sector: number,
 *   coins: number,
 *   stomps: number,
 *   durationSec: number,
 *   score: number,
 * }} PendingScore
 */

/** @type {PendingScore | null} */
let pendingScore = null;
let announcedScoreReset = false;
/** @type {null | ((mode: 'normal' | 'lockdown' | 'timeAttack', sector?: number, practice?: boolean) => void)} */
let onModeStart = null;
/** @type {null | (() => void)} */
let onResume = null;
/** @type {null | (() => void)} */
let onAbort = null;
let mediaRefresh = null;
let trialSector = 0;
/** Campaign start sector selected on the title screen */
let campaignSector = 0;
/** Where SETTINGS should return when DONE is pressed */
let settingsReturn = "title";

export function updateHud() {
  scoreEl.textContent = String(score).padStart(4, "0");
  if (packsEl) packsEl.textContent = String(runCoins).padStart(2, "0");
  if (killsEl) killsEl.textContent = String(runStomps).padStart(2, "0");
  livesEl.textContent = String(Math.max(0, lives)).padStart(2, "0");
  if (sectorEl) {
    sectorEl.textContent = `${String(levelIndex + 1).padStart(2, "0")}/${String(getLevelCount()).padStart(2, "0")}`;
  }
  if (timerEl) timerEl.textContent = formatClock(runElapsed);
  if (comboEl) {
    const wrap = comboEl.parentElement;
    if (combo > 1) {
      if (wrap) wrap.hidden = false;
      comboEl.textContent = `x${combo}`;
    } else if (wrap) {
      wrap.hidden = true;
    }
  }
  const scoreWrap = scoreEl?.parentElement;
  if (scoreWrap) {
    scoreWrap.setAttribute(
      "aria-label",
      `DATA ${score}, ${runCoins} packs, ${runStomps} kills`
    );
  }
}

export function syncBestClear() {
  if (!bestClearEl) return;
  const best = getBestClearTime();
  if (best == null) {
    bestClearEl.hidden = true;
    bestClearEl.textContent = "";
    return;
  }
  bestClearEl.hidden = false;
  bestClearEl.textContent = `BEST CLEAR ${formatClock(best)}`;
}

function clampCampaignSector() {
  const unlocked = Math.min(getLevelCount() - 1, getUnlockedSector());
  campaignSector = Math.max(0, Math.min(unlocked, campaignSector));
}

/** Selected campaign start sector on the title screen (0-based). */
export function getCampaignSector() {
  clampCampaignSector();
  return campaignSector;
}

export function renderSectorSelect() {
  if (!sectorButtonsEl || !sectorSelectEl) return;
  clampCampaignSector();
  const unlocked = Math.min(getLevelCount() - 1, getUnlockedSector());
  sectorButtonsEl.replaceChildren();
  for (let i = 0; i < getLevelCount(); i++) {
    const def = getLevelDef(i);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "sector-btn";
    btn.textContent = String(i + 1).padStart(2, "0");
    btn.disabled = i > unlocked;
    btn.title = btn.disabled
      ? `Sector ${def.sector}: ${def.name} (locked)`
      : `Start from sector ${def.sector}: ${def.name}`;
    btn.setAttribute(
      "aria-label",
      btn.disabled
        ? `Sector ${i + 1} locked: ${def.name}`
        : `Start sector ${i + 1}: ${def.name}`
    );
    if (i === campaignSector) btn.classList.add("is-selected");
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (btn.disabled) return;
      campaignSector = i;
      renderSectorSelect();
      sfx.ui();
    });
    sectorButtonsEl.appendChild(btn);
  }
}

function setSectorSelectVisible(show) {
  if (sectorSelectEl) sectorSelectEl.hidden = !show;
  if (show) renderSectorSelect();
}

export function announce(text) {
  if (statusLive) statusLive.textContent = text;
}

export function setTouchVisible(playing) {
  if (!touchControls) return;
  touchControls.hidden = !playing || !preferTouch;
}

export function syncBuildVersion() {
  if (buildVersionEl) buildVersionEl.textContent = `v${APP_VERSION}`;
}

function syncOneMuteButton(btn) {
  if (!btn) return;
  if (!isAudioAvailable()) {
    btn.textContent = "AUDIO N/A";
    btn.setAttribute("aria-pressed", "true");
    btn.setAttribute("aria-label", "AUDIO N/A. Sound is unavailable in this browser.");
    btn.classList.add("is-muted");
    btn.disabled = true;
    return;
  }
  btn.disabled = false;
  const off = isMuted();
  btn.textContent = off ? "AUDIO OFF" : "AUDIO ON";
  btn.setAttribute("aria-pressed", off ? "true" : "false");
  btn.setAttribute(
    "aria-label",
    off ? "AUDIO OFF. Sound is muted. Activate to unmute." : "AUDIO ON. Sound is on. Activate to mute."
  );
  btn.classList.toggle("is-muted", off);
}

export function syncMuteButton() {
  syncOneMuteButton(muteBtn);
  syncOneMuteButton(hudMuteBtn);
}

function releaseMuteFocus(e) {
  const target = e?.currentTarget;
  if (target instanceof HTMLElement) target.blur();
  if (state === "playing") {
    canvas?.focus({ preventScroll: true });
  }
}

async function handleMuteClick(e) {
  e?.stopPropagation?.();
  if (!isAudioAvailable()) {
    syncMuteButton();
    return;
  }

  releaseMuteFocus(e);

  const willUnmute = isMuted();
  toggleMute();
  syncMuteButton();

  if (willUnmute) {
    await unlockAudio();
    sfx.ui();
  }
}

export function initMuteControl() {
  syncMuteButton();
  muteBtn?.addEventListener("click", handleMuteClick);
  hudMuteBtn?.addEventListener("click", handleMuteClick);

  window.addEventListener("keydown", (e) => {
    if (e.code !== getBindings().mute && e.code !== "KeyM") return;
    if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.target instanceof Element) {
      const tag = e.target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || e.target.isContentEditable) return;
    }
    e.preventDefault();
    handleMuteClick();
  });
}

function snapshotRun(outcome) {
  return {
    score,
    coins: runCoins,
    stomps: runStomps,
    sector: levelIndex + 1,
    durationSec: runElapsed,
    outcome,
    deaths: runDeaths,
    maxCombo,
    mode: runMode,
  };
}

function setRunSummary(text) {
  if (!runSummaryEl) return;
  if (!text) {
    runSummaryEl.hidden = true;
    runSummaryEl.textContent = "";
    return;
  }
  runSummaryEl.hidden = false;
  runSummaryEl.textContent = text;
}

function renderLeaderboard() {
  if (!leaderboardListEl) return;
  const scores = getScores();
  leaderboardListEl.replaceChildren();

  if (clearScoresBtn) {
    clearScoresBtn.hidden = scores.length === 0;
  }

  if (scores.length === 0) {
    const empty = document.createElement("li");
    empty.className = "lb-empty";
    empty.textContent = "NO RUNS LOGGED";
    leaderboardListEl.appendChild(empty);
    return;
  }

  scores.forEach((entry, i) => {
    const li = document.createElement("li");
    const rank = document.createElement("span");
    rank.className = "lb-rank";
    rank.textContent = String(i + 1).padStart(2, "0");
    const name = document.createElement("span");
    name.className = "lb-name";
    name.textContent = entry.initials;
    const pts = document.createElement("span");
    pts.className = "lb-score";
    pts.textContent = String(entry.score).padStart(4, "0");
    const out = document.createElement("span");
    out.className = "lb-out";
    out.textContent = entry.outcome === "won" ? "W" : "X";
    const sectorBit = entry.sector ? ` · S${entry.sector}` : "";
    out.title =
      entry.outcome === "won"
        ? `Full clear${sectorBit}`
        : `System crash${sectorBit}`;
    li.append(rank, name, pts, out);
    leaderboardListEl.appendChild(li);
  });
}

function setScoreEntryVisible(show) {
  if (!scoreEntryEl) return;
  scoreEntryEl.hidden = !show;
  if (show && initialsInput) {
    initialsInput.value = getLastInitials();
  }
}

function setLeaderboardVisible(show) {
  if (!leaderboardEl) return;
  leaderboardEl.hidden = !show;
  if (show) renderLeaderboard();
}

function hideScorePrompt() {
  pendingScore = null;
  setScoreEntryVisible(false);
}

function pendingPayload(initials) {
  if (!pendingScore) return null;
  return {
    score: pendingScore.score,
    initials,
    outcome: pendingScore.outcome,
    sector: pendingScore.sector,
    coins: pendingScore.coins,
    stomps: pendingScore.stomps,
    durationSec: pendingScore.durationSec,
  };
}

function flushPendingScore() {
  if (!pendingScore) return;
  const payload = pendingPayload(initialsInput?.value || getLastInitials());
  if (payload) submitScore(payload);
  hideScorePrompt();
}

function commitPendingScore() {
  if (!pendingScore) return;
  const initials = normalizeInitials(initialsInput?.value || getLastInitials());
  const payload = pendingPayload(initials);
  if (!payload) return;
  const result = submitScore(payload);
  const base = pendingScore.baseTagline;
  hideScorePrompt();
  renderLeaderboard();

  const panel = overlay.querySelector(".panel");
  const taglineEl = panel?.querySelector(".tagline");
  let note = base;
  if (result.rank != null) {
    note = result.isNewBest
      ? `${base} NEW BEST — RANK #${result.rank}.`
      : `${base} RANK #${result.rank}.`;
  } else {
    note = `${base} Run logged, but it did not place on TOP RUNS.`;
  }
  if (taglineEl) taglineEl.textContent = note;
  announce(note);
  sfx.ui();
  queueMicrotask(() => startBtn.focus());
}

function handleClearBoard(e) {
  e?.preventDefault?.();
  e?.stopPropagation?.();
  if (getScores().length === 0) return;
  const ok = window.confirm("Wipe all local TOP RUNS on this device?");
  if (!ok) return;
  clearScores();
  hideScorePrompt();
  setRunSummary("");
  renderLeaderboard();
  sfx.ui();
  announce("Top runs board cleared.");
}

export function initLeaderboard() {
  migrateScoreStorage();
  if (!announcedScoreReset) {
    announcedScoreReset = true;
    try {
      if (localStorage.getItem("neon-runner-scoring-notice") !== "1.5") {
        localStorage.setItem("neon-runner-scoring-notice", "1.5");
        announce("Scoring updated — packs +10, stomps +20. Local TOP RUNS board reset.");
      }
    } catch {
      /* ignore */
    }
  }
  renderLeaderboard();
  setScoreEntryVisible(false);
  setRunSummary("");

  scoreSaveBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    commitPendingScore();
  });

  clearScoresBtn?.addEventListener("click", handleClearBoard);

  initialsInput?.addEventListener("input", () => {
    const start = initialsInput.selectionStart;
    initialsInput.value = initialsInput.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 3);
    if (typeof start === "number") {
      initialsInput.setSelectionRange(start, start);
    }
  });

  initialsInput?.addEventListener("keydown", (e) => {
    if (e.code === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      commitPendingScore();
    }
  });
}

function setModeRowVisible(show) {
  if (modeRowEl) modeRowEl.hidden = !show;
}

function setSettingsVisible(show) {
  if (settingsPanelEl) settingsPanelEl.hidden = !show;
}

function setPauseActionsVisible(show) {
  if (pauseActionsEl) pauseActionsEl.hidden = !show;
}

function renderModeRow() {
  if (!modeRowEl) return;
  const meta = getMeta();
  clampCampaignSector();
  modeRowEl.replaceChildren();

  const mk = (label, mode, disabled = false, title = "", practice = false) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "mode-btn";
    btn.textContent = label;
    btn.disabled = disabled;
    if (title) btn.title = title;
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (mode === "timeAttack") {
        setSectorSelectVisible(false);
        renderTrialPicker();
        return;
      }
      if (practice) {
        onModeStart?.(mode, getLevelCount() - 1, true);
        return;
      }
      if (mode === "lockdown") {
        onModeStart?.(mode, 0, false);
        return;
      }
      onModeStart?.(mode, campaignSector, false);
    });
    modeRowEl.appendChild(btn);
  };

  mk("JACK IN", "normal", false, `Start from sector ${campaignSector + 1}`);
  mk(
    "LOCKDOWN",
    "lockdown",
    !meta.hasCleared,
    meta.hasCleared ? "Harder NG+ run" : "Unlock by clearing the grid once"
  );
  mk("TIME TRIAL", "timeAttack");
  const rexUnlocked = getUnlockedSector() >= getLevelCount() - 1 || meta.hasCleared;
  mk(
    "REX PRACTICE",
    "normal",
    !rexUnlocked,
    rexUnlocked ? "Drill the Cyber-Rex arena" : "Unlock by reaching REX CORE",
    true
  );

  const settingsBtn = document.createElement("button");
  settingsBtn.type = "button";
  settingsBtn.className = "mode-btn ghost";
  settingsBtn.textContent = "SETTINGS";
  settingsBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    openSettings();
  });
  modeRowEl.appendChild(settingsBtn);
}

function renderTrialPicker() {
  if (!modeRowEl) return;
  modeRowEl.replaceChildren();
  const label = document.createElement("p");
  label.className = "trial-label";
  const def = LEVELS[trialSector];
  const best = getSectorBestTime(trialSector);
  label.textContent = `${def.name} · BEST ${best > 0 ? formatClock(best) : "--:--.--"}`;
  modeRowEl.appendChild(label);

  const row = document.createElement("div");
  row.className = "trial-nav";
  const prev = document.createElement("button");
  prev.type = "button";
  prev.textContent = "◀";
  prev.addEventListener("click", (e) => {
    e.stopPropagation();
    trialSector = (trialSector + LEVELS.length - 1) % LEVELS.length;
    renderTrialPicker();
  });
  const go = document.createElement("button");
  go.type = "button";
  go.className = "mode-btn";
  go.textContent = "START TRIAL";
  go.addEventListener("click", (e) => {
    e.stopPropagation();
    onModeStart?.("timeAttack", trialSector);
  });
  const next = document.createElement("button");
  next.type = "button";
  next.textContent = "▶";
  next.addEventListener("click", (e) => {
    e.stopPropagation();
    trialSector = (trialSector + 1) % LEVELS.length;
    renderTrialPicker();
  });
  row.append(prev, go, next);
  modeRowEl.appendChild(row);

  const back = document.createElement("button");
  back.type = "button";
  back.className = "mode-btn ghost";
  back.textContent = "BACK";
  back.addEventListener("click", (e) => {
    e.stopPropagation();
    renderModeRow();
    setSectorSelectVisible(true);
    syncBestClear();
  });
  modeRowEl.appendChild(back);
}

function renderSettings() {
  if (!settingsPanelEl) return;
  const meta = getMeta();
  const binds = getBindings();
  settingsPanelEl.replaceChildren();

  const title = document.createElement("p");
  title.className = "settings-title";
  title.textContent = "SETTINGS";
  settingsPanelEl.appendChild(title);

  const a11y = document.createElement("div");
  a11y.className = "settings-block";
  const cb = document.createElement("label");
  cb.className = "toggle";
  const cbInput = document.createElement("input");
  cbInput.type = "checkbox";
  cbInput.checked = !!meta.colorblind;
  cbInput.addEventListener("change", () => {
    saveMeta({ colorblind: cbInput.checked });
    mediaRefresh?.();
    sfx.ui();
  });
  cb.append(cbInput, document.createTextNode(" Colorblind outlines"));
  a11y.appendChild(cb);

  const rm = document.createElement("label");
  rm.className = "toggle";
  const rmInput = document.createElement("input");
  rmInput.type = "checkbox";
  rmInput.checked = meta.forceReduceMotion === true;
  rmInput.addEventListener("change", () => {
    saveMeta({ forceReduceMotion: rmInput.checked ? true : null });
    mediaRefresh?.();
    sfx.ui();
  });
  rm.append(rmInput, document.createTextNode(" Reduce motion"));
  a11y.appendChild(rm);
  settingsPanelEl.appendChild(a11y);

  const skins = document.createElement("div");
  skins.className = "settings-block";
  const skinTitle = document.createElement("p");
  skinTitle.textContent = "RUNNER SKIN";
  skins.appendChild(skinTitle);
  const skinRow = document.createElement("div");
  skinRow.className = "skin-row";
  for (const skin of Object.values(RUNNER_SKINS)) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "skin-btn";
    btn.textContent = skin.name;
    btn.disabled = !meta.unlockedSkins.includes(skin.id);
    btn.style.borderColor = skin.accent;
    if (meta.skin === skin.id) btn.classList.add("active");
    btn.title = btn.disabled
      ? skin.id === "signal"
        ? "Unlock at 500 DATA"
        : skin.id === "ember"
          ? "Unlock by clearing the grid"
          : skin.id === "lockdown"
            ? "Unlock by clearing LOCKDOWN"
            : "Locked"
      : skin.name;
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      setSkin(skin.id);
      renderSettings();
      sfx.ui();
    });
    skinRow.appendChild(btn);
  }
  skins.appendChild(skinRow);
  settingsPanelEl.appendChild(skins);

  const bindsBlock = document.createElement("div");
  bindsBlock.className = "settings-block";
  const bindTitle = document.createElement("p");
  bindTitle.textContent = "CONTROLS (click to rebind)";
  bindsBlock.appendChild(bindTitle);
  for (const action of ["left", "right", "jump", "dash", "pause"]) {
    const row = document.createElement("button");
    row.type = "button";
    row.className = "bind-row";
    row.textContent = `${action.toUpperCase()}: ${binds[action] || "—"}`;
    row.addEventListener("click", (e) => {
      e.stopPropagation();
      row.textContent = `${action.toUpperCase()}: …`;
      startRebind(action);
    });
    bindsBlock.appendChild(row);
  }
  settingsPanelEl.appendChild(bindsBlock);

  const back = document.createElement("button");
  back.type = "button";
  back.className = "mode-btn";
  back.textContent = "DONE";
  back.addEventListener("click", (e) => {
    e.stopPropagation();
    closeSettings();
  });
  settingsPanelEl.appendChild(back);
}

function openSettings() {
  settingsReturn = state === "paused" ? "paused" : "title";
  setState("settings");
  setModeRowVisible(false);
  setSectorSelectVisible(false);
  if (bestClearEl) bestClearEl.hidden = true;
  setSettingsVisible(true);
  setPauseActionsVisible(false);
  setLeaderboardVisible(false);
  setRunSummary("");
  renderSettings();
  setOverlay(true, "SETTINGS", "Remap inputs, skins, and accessibility.", "JACK IN", "SYSTEM");
  startBtn.hidden = true;
}

function closeSettings() {
  startBtn.hidden = false;
  setSettingsVisible(false);
  if (settingsReturn === "paused") {
    setState("paused");
    showPauseOverlay();
    return;
  }
  setState("title");
  showTitleModes();
}

export function showTitleModes() {
  startBtn.hidden = false;
  setPauseActionsVisible(false);
  setSettingsVisible(false);
  setModeRowVisible(true);
  syncBestClear();
  setSectorSelectVisible(true);
  renderModeRow();
  setOverlay(
    true,
    "NEON RUNNER",
    "Jack the stolen city core before lockdown seals the grid for good.",
    "JACK IN",
    "SECTOR 2084"
  );
  // Primary CTA still works; mode row offers alternatives.
  startBtn.textContent = "JACK IN";
}

export function showPauseOverlay() {
  startBtn.hidden = false;
  setModeRowVisible(false);
  setSectorSelectVisible(false);
  if (bestClearEl) bestClearEl.hidden = true;
  setSettingsVisible(false);
  setLeaderboardVisible(false);
  setScoreEntryVisible(false);
  setRunSummary("");
  setPauseActionsVisible(true);
  if (pauseActionsEl) {
    pauseActionsEl.replaceChildren();
    const resume = document.createElement("button");
    resume.type = "button";
    resume.className = "mode-btn";
    resume.textContent = "RESUME";
    resume.addEventListener("click", (e) => {
      e.stopPropagation();
      onResume?.();
    });
    const settings = document.createElement("button");
    settings.type = "button";
    settings.className = "mode-btn ghost";
    settings.textContent = "SETTINGS";
    settings.addEventListener("click", (e) => {
      e.stopPropagation();
      openSettings();
    });
    const abort = document.createElement("button");
    abort.type = "button";
    abort.className = "mode-btn ghost";
    abort.textContent = "ABORT RUN";
    abort.addEventListener("click", (e) => {
      e.stopPropagation();
      onAbort?.();
    });
    pauseActionsEl.append(resume, settings, abort);
  }
  setOverlay(true, "PAUSED", "Grid frozen. Resume, tweak settings, or abort.", "RESUME", "HOLD");
}

/**
 * @param {{
 *   onMode: (mode: 'normal' | 'lockdown' | 'timeAttack', sector?: number, practice?: boolean) => void,
 *   onResume: () => void,
 *   onAbort: () => void,
 *   refreshMedia?: () => void,
 * }} handlers
 */
export function initMetaUi(handlers) {
  onModeStart = handlers.onMode;
  onResume = handlers.onResume;
  onAbort = handlers.onAbort;
  mediaRefresh = handlers.refreshMedia || null;
  clampCampaignSector();
  syncBestClear();
  renderSectorSelect();

  setRebindListener((action, code) => {
    if (action && code) {
      announce(`${action} bound to ${code}`);
      renderSettings();
      sfx.ui();
    }
  });

  void getActiveSkin;
  void applyBindings;
}

/**
 * Show end-of-run overlay and optionally prompt for leaderboard initials.
 * @param {'won' | 'dead'} outcome
 * @param {string} title
 * @param {string} tagline
 * @param {string} buttonLabel
 * @param {string} [eyebrow]
 */
export function presentRunEnd(outcome, title, tagline, buttonLabel, eyebrow) {
  const snap = snapshotRun(outcome);

  if (practiceMode) {
    pendingScore = null;
    setModeRowVisible(true);
    renderModeRow();
    setSectorSelectVisible(false);
    if (bestClearEl) bestClearEl.hidden = true;
    setPauseActionsVisible(false);
    setSettingsVisible(false);
    startBtn.hidden = false;
    setScoreEntryVisible(false);
    setRunSummary("");
    setLeaderboardVisible(false);
    setOverlay(true, title, tagline, buttonLabel, eyebrow);
    announce(`${title}. ${tagline}`);
    return;
  }

  considerScoreUnlocks(snap.score);
  const breakdown = formatRunBreakdown({
    score: snap.score,
    coins: snap.coins,
    stomps: snap.stomps,
    sectorIndex: levelIndex,
    sectorTotal: getLevelCount(),
    durationSec: snap.durationSec,
    outcome,
    deaths: snap.deaths,
    maxCombo: snap.maxCombo,
    mode: snap.mode,
  });
  const qualifies = isHighScore(snap) && runMode !== "timeAttack";
  pendingScore = qualifies
    ? {
        outcome,
        baseTagline: tagline,
        sector: snap.sector,
        coins: snap.coins,
        stomps: snap.stomps,
        durationSec: snap.durationSec,
        score: snap.score,
      }
    : null;

  setModeRowVisible(outcome === "won" || outcome === "dead");
  if (modeRowEl && (outcome === "won" || outcome === "dead")) renderModeRow();
  setSectorSelectVisible(false);
  syncBestClear();
  setPauseActionsVisible(false);
  setSettingsVisible(false);
  startBtn.hidden = false;
  setScoreEntryVisible(qualifies);
  setOverlay(true, title, tagline, buttonLabel, eyebrow);
  setRunSummary(breakdown);
  setLeaderboardVisible(true);

  if (qualifies) {
    queueMicrotask(() => {
      initialsInput?.focus();
      initialsInput?.select();
    });
    announce(`${title}. Enter initials for the top runs board. ${breakdown}`);
  } else {
    announce(`${title}. ${tagline}. ${breakdown}`);
  }
}

export function setOverlay(show, title, tagline, buttonLabel, eyebrow) {
  const panel = overlay.querySelector(".panel");
  const def = getLevelDef(levelIndex);
  panel.querySelector(".eyebrow").textContent =
    eyebrow ?? `SECTOR ${level.sector || def.sector}`;
  panel.querySelector("h1").textContent = title;
  panel.querySelector(".tagline").textContent = tagline;
  if (!startBtn.hidden) startBtn.textContent = buttonLabel;
  syncBuildVersion();
  syncMuteButton();

  if (show) {
    const showBoard =
      !practiceMode && (state === "title" || state === "dead" || state === "won");
    if (state !== "paused" && state !== "settings") {
      setLeaderboardVisible(showBoard);
    }
    if (state === "title" || state === "cleared" || state === "playing") {
      hideScorePrompt();
      if (state !== "dead" && state !== "won") setRunSummary("");
    }
    if (state === "title") {
      setModeRowVisible(true);
      syncBestClear();
      setSectorSelectVisible(true);
      if (modeRowEl && !modeRowEl.childElementCount) renderModeRow();
    }

    overlay.inert = false;
    overlay.classList.add("visible");
    overlay.setAttribute("aria-hidden", "false");
    if (!(scoreEntryEl && !scoreEntryEl.hidden) && !startBtn.hidden) {
      queueMicrotask(() => startBtn.focus());
    }
    announce(`${title}. ${tagline}`);
  } else {
    flushPendingScore();
    setLeaderboardVisible(false);
    setRunSummary("");
    setModeRowVisible(false);
    setSectorSelectVisible(false);
    setSettingsVisible(false);
    setPauseActionsVisible(false);
    startBtn.hidden = false;
    const active = document.activeElement;
    if (
      active === startBtn ||
      active === muteBtn ||
      active === hudMuteBtn ||
      active === initialsInput ||
      active === scoreSaveBtn ||
      active === clearScoresBtn ||
      overlay.contains(active)
    ) {
      if (active instanceof HTMLElement) active.blur();
      canvas?.focus({ preventScroll: true });
    }
    overlay.classList.remove("visible");
    overlay.setAttribute("aria-hidden", "true");
    overlay.inert = true;
  }

  setTouchVisible(!show && state === "playing");
}
