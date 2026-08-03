import {
  overlay,
  startBtn,
  scoreEl,
  livesEl,
  sectorEl,
  statusLive,
  touchControls,
  canvas,
} from "./dom.js";
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

export function setOverlay(show, title, tagline, buttonLabel, eyebrow) {
  const panel = overlay.querySelector(".panel");
  const def = getLevelDef(levelIndex);
  panel.querySelector(".eyebrow").textContent =
    eyebrow ?? `SECTOR ${level.sector || def.sector}`;
  panel.querySelector("h1").textContent = title;
  panel.querySelector(".tagline").textContent = tagline;
  startBtn.textContent = buttonLabel;

  if (show) {
    overlay.inert = false;
    overlay.classList.add("visible");
    overlay.setAttribute("aria-hidden", "false");
    queueMicrotask(() => startBtn.focus());
    announce(`${title}. ${tagline}`);
  } else {
    if (document.activeElement === startBtn || overlay.contains(document.activeElement)) {
      startBtn.blur();
      canvas?.focus({ preventScroll: true });
    }
    overlay.classList.remove("visible");
    overlay.setAttribute("aria-hidden", "true");
    overlay.inert = true;
  }

  setTouchVisible(!show && state === "playing");
}
