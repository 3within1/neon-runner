import {
  overlay,
  startBtn,
  scoreEl,
  packsEl,
  killsEl,
  livesEl,
  sectorEl,
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
import { getLevelCount, getLevelDef } from "./level.js";
import {
  preferTouch,
  score,
  lives,
  state,
  levelIndex,
  level,
  runCoins,
  runStomps,
  runElapsed,
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

export function updateHud() {
  scoreEl.textContent = String(score).padStart(4, "0");
  if (packsEl) packsEl.textContent = String(runCoins).padStart(2, "0");
  if (killsEl) killsEl.textContent = String(runStomps).padStart(2, "0");
  livesEl.textContent = String(Math.max(0, lives)).padStart(2, "0");
  if (sectorEl) {
    sectorEl.textContent = `${String(levelIndex + 1).padStart(2, "0")}/${String(getLevelCount()).padStart(2, "0")}`;
  }
  const scoreWrap = scoreEl?.parentElement;
  if (scoreWrap) {
    scoreWrap.setAttribute(
      "aria-label",
      `DATA ${score}, ${runCoins} packs, ${runStomps} kills`
    );
  }
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
    if (e.code !== "KeyM") return;
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

/** Persist a qualifying run if the player starts again without pressing SAVE. */
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
  const breakdown = formatRunBreakdown({
    score: snap.score,
    coins: snap.coins,
    stomps: snap.stomps,
    sectorIndex: levelIndex,
    sectorTotal: getLevelCount(),
    durationSec: snap.durationSec,
    outcome,
  });
  const fullTagline = tagline;
  const qualifies = isHighScore(snap);
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

  setScoreEntryVisible(qualifies);
  setOverlay(true, title, fullTagline, buttonLabel, eyebrow);
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
  startBtn.textContent = buttonLabel;
  syncBuildVersion();
  syncMuteButton();

  if (show) {
    const showBoard = state === "title" || state === "dead" || state === "won";
    setLeaderboardVisible(showBoard);
    if (state === "title" || state === "cleared" || state === "playing") {
      hideScorePrompt();
      if (state !== "dead" && state !== "won") setRunSummary("");
    }

    overlay.inert = false;
    overlay.classList.add("visible");
    overlay.setAttribute("aria-hidden", "false");
    if (!(scoreEntryEl && !scoreEntryEl.hidden)) {
      queueMicrotask(() => startBtn.focus());
    }
    announce(`${title}. ${tagline}`);
  } else {
    flushPendingScore();
    setLeaderboardVisible(false);
    setRunSummary("");
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
