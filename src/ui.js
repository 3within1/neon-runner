import {
  overlay,
  startBtn,
  scoreEl,
  livesEl,
  sectorEl,
  buildVersionEl,
  muteBtn,
  hudMuteBtn,
  statusLive,
  touchControls,
  canvas,
} from "./dom.js";
import { isAudioAvailable, isMuted, toggleMute, unlockAudio, sfx } from "./audio.js";
import { APP_VERSION } from "./constants.js";
import { getLevelCount, getLevelDef } from "./level.js";
import { preferTouch, score, lives, state, levelIndex, level } from "./state.js";

export function updateHud() {
  scoreEl.textContent = String(score).padStart(3, "0");
  livesEl.textContent = String(Math.max(0, lives)).padStart(2, "0");
  if (sectorEl) {
    sectorEl.textContent = `${String(levelIndex + 1).padStart(2, "0")}/${String(getLevelCount()).padStart(2, "0")}`;
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
    overlay.inert = false;
    overlay.classList.add("visible");
    overlay.setAttribute("aria-hidden", "false");
    queueMicrotask(() => startBtn.focus());
    announce(`${title}. ${tagline}`);
  } else {
    const active = document.activeElement;
    if (
      active === startBtn ||
      active === muteBtn ||
      active === hudMuteBtn ||
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
