import { DEFAULT_BINDINGS, getMeta, saveMeta } from "./meta.js";

export const input = {
  left: false,
  right: false,
  jump: false,
  jumpPressed: false,
  jumpReleased: false,
  dash: false,
  dashPressed: false,
  pausePressed: false,
};

/** Physical key codes currently held */
const heldCodes = new Set();
const touch = { left: false, right: false, jump: false, dash: false };

/** @type {Record<string, string>} action -> code */
let bindings = { ...DEFAULT_BINDINGS, ...getMeta().bindings };

/** Reverse map code -> action */
function codeMap() {
  /** @type {Record<string, string>} */
  const map = {};
  for (const [action, code] of Object.entries(bindings)) {
    map[code] = action;
  }
  // Always allow WASD / arrows as secondary defaults unless remapped away
  if (!map.KeyA) map.KeyA = "left";
  if (!map.KeyD) map.KeyD = "right";
  if (!map.KeyW) map.KeyW = "jump";
  if (!map.ArrowUp) map.ArrowUp = "jump";
  if (!map.ArrowLeft) map.ArrowLeft = "left";
  if (!map.ArrowRight) map.ArrowRight = "right";
  if (!map.ShiftRight) map.ShiftRight = "dash";
  if (!map.KeyK) map.KeyK = "dash";
  return map;
}

let lastDir = "right";
/** @type {null | (() => void)} */
let onStartRequest = null;
/** @type {null | (() => void)} */
let onPauseRequest = null;
/** @type {null | ((action: string, code: string) => void)} */
let onRebind = null;
/** @type {string | null} */
let listeningAction = null;

function isInteractiveTarget(el) {
  if (!(el instanceof Element)) return false;
  return Boolean(el.closest("button, a, input, textarea, select, [role='button']"));
}

function actionFromCodes() {
  const map = codeMap();
  let left = touch.left;
  let right = touch.right;
  let jump = touch.jump;
  let dash = touch.dash;
  for (const code of heldCodes) {
    const action = map[code];
    if (action === "left") left = true;
    else if (action === "right") right = true;
    else if (action === "jump") jump = true;
    else if (action === "dash") dash = true;
  }
  return { left, right, jump, dash };
}

function syncInput() {
  const { left, right, jump, dash } = actionFromCodes();
  if (left && right) {
    input.left = lastDir === "left";
    input.right = lastDir === "right";
  } else {
    input.left = left;
    input.right = right;
  }
  input.jump = jump;
  input.dash = dash;
}

export function getBindings() {
  return { ...bindings };
}

export function startRebind(action) {
  listeningAction = action;
}

export function cancelRebind() {
  listeningAction = null;
}

export function isRebinding() {
  return listeningAction != null;
}

/**
 * Assign `code` to `action` and clear any other action that used the same code
 * so a rebind never leaves two actions on one key.
 * @param {Record<string, string>} current
 * @param {string} action
 * @param {string} code
 */
export function bindingsWithExclusiveCode(current, action, code) {
  const next = { ...current, [action]: code };
  for (const key of Object.keys(next)) {
    if (key !== action && next[key] === code) next[key] = "";
  }
  return next;
}

export function applyBindings(next) {
  bindings = { ...DEFAULT_BINDINGS, ...next };
  saveMeta({ bindings });
  syncInput();
}

export function getLastDir() {
  return lastDir;
}

export function clearInput() {
  heldCodes.clear();
  touch.left = touch.right = touch.jump = touch.dash = false;
  input.left = input.right = input.jump = input.dash = false;
  input.jumpPressed = false;
  input.jumpReleased = false;
  input.dashPressed = false;
  input.pausePressed = false;
  syncInput();
}

function bindTouchButton(el, prop) {
  if (!el) return;
  const set = (v) => {
    const before = actionFromCodes();
    touch[prop] = v;
    if (prop === "left" && v) lastDir = "left";
    if (prop === "right" && v) lastDir = "right";
    syncInput();
    if (prop === "jump") {
      if (v && !before.jump) input.jumpPressed = true;
      if (!v && before.jump && !actionFromCodes().jump) input.jumpReleased = true;
    }
    if (prop === "dash") {
      if (v && !before.dash) input.dashPressed = true;
    }
  };
  const down = (e) => {
    e.preventDefault();
    set(true);
  };
  const up = (e) => {
    e.preventDefault();
    set(false);
  };
  el.addEventListener("pointerdown", down);
  el.addEventListener("pointerup", up);
  el.addEventListener("pointercancel", up);
  el.addEventListener("pointerleave", up);
}

/**
 * @param {{
 *   isMenuOpen: () => boolean,
 *   onStart: () => void,
 *   onPause?: () => void,
 *   touchLeft: HTMLElement | null,
 *   touchRight: HTMLElement | null,
 *   touchJump: HTMLElement | null,
 *   touchDash?: HTMLElement | null,
 * }} options
 */
export function initInput(options) {
  onStartRequest = options.onStart;
  onPauseRequest = options.onPause || null;
  bindings = { ...DEFAULT_BINDINGS, ...getMeta().bindings };

  window.addEventListener("keydown", (e) => {
    if (listeningAction) {
      e.preventDefault();
      if (e.code === "Escape") {
        listeningAction = null;
        onRebind?.(listeningAction, "");
        return;
      }
      const action = listeningAction;
      const next = bindingsWithExclusiveCode(bindings, action, e.code);
      applyBindings(next);
      listeningAction = null;
      onRebind?.(action, e.code);
      return;
    }

    const map = codeMap();
    if (map[e.code] === "pause" || e.code === "Escape") {
      if (!isInteractiveTarget(e.target) && !e.repeat) {
        e.preventDefault();
        input.pausePressed = true;
        onPauseRequest?.();
      }
      return;
    }

    if (
      (e.code === "Enter" || e.code === "Space") &&
      options.isMenuOpen() &&
      !isInteractiveTarget(e.target)
    ) {
      e.preventDefault();
      onStartRequest?.();
      return;
    }

    const action = map[e.code];
    if (!action || action === "mute" || action === "pause") return;
    if (!isInteractiveTarget(e.target)) e.preventDefault();

    const before = actionFromCodes();
    const isNew = !heldCodes.has(e.code);
    heldCodes.add(e.code);
    if (action === "left") lastDir = "left";
    if (action === "right") lastDir = "right";
    syncInput();
    if (action === "jump" && isNew && !before.jump) input.jumpPressed = true;
    if (action === "dash" && isNew && !before.dash) input.dashPressed = true;
  });

  window.addEventListener("keyup", (e) => {
    const map = codeMap();
    const action = map[e.code];
    if (!action) return;
    const before = actionFromCodes();
    heldCodes.delete(e.code);
    syncInput();
    if (action === "jump" && before.jump && !actionFromCodes().jump) {
      input.jumpReleased = true;
    }
  });

  const onFocusLost = () => clearInput();
  window.addEventListener("blur", onFocusLost);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) onFocusLost();
  });

  bindTouchButton(options.touchLeft, "left");
  bindTouchButton(options.touchRight, "right");
  bindTouchButton(options.touchJump, "jump");
  bindTouchButton(options.touchDash || null, "dash");
}

export function setRebindListener(fn) {
  onRebind = fn;
}
