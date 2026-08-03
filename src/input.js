export const input = {
  left: false,
  right: false,
  jump: false,
  jumpPressed: false,
  jumpReleased: false,
};

/** Physical key codes currently held */
const heldCodes = new Set();
const touch = { left: false, right: false, jump: false };

const CODE_MAP = {
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowUp: "jump",
  Space: "jump",
  KeyA: "left",
  KeyD: "right",
  KeyW: "jump",
};

let lastDir = "right";
/** @type {null | (() => void)} */
let onStartRequest = null;

function isInteractiveTarget(el) {
  if (!(el instanceof Element)) return false;
  return Boolean(el.closest("button, a, input, textarea, select, [role='button']"));
}

function actionFromCodes() {
  let left = touch.left;
  let right = touch.right;
  let jump = touch.jump;
  for (const code of heldCodes) {
    const action = CODE_MAP[code];
    if (action === "left") left = true;
    else if (action === "right") right = true;
    else if (action === "jump") jump = true;
  }
  return { left, right, jump };
}

function syncInput() {
  const { left, right, jump } = actionFromCodes();
  if (left && right) {
    input.left = lastDir === "left";
    input.right = lastDir === "right";
  } else {
    input.left = left;
    input.right = right;
  }
  input.jump = jump;
}

export function getLastDir() {
  return lastDir;
}

export function clearInput() {
  heldCodes.clear();
  touch.left = touch.right = touch.jump = false;
  input.left = input.right = input.jump = false;
  input.jumpPressed = false;
  input.jumpReleased = false;
  syncInput();
}

function bindTouchButton(el, prop) {
  if (!el) return;
  const set = (v) => {
    const wasJump = actionFromCodes().jump;
    touch[prop] = v;
    if (prop === "left" && v) lastDir = "left";
    if (prop === "right" && v) lastDir = "right";
    syncInput();
    if (prop === "jump") {
      if (v && !wasJump) input.jumpPressed = true;
      if (!v && wasJump && !actionFromCodes().jump) input.jumpReleased = true;
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
 *   touchLeft: HTMLElement | null,
 *   touchRight: HTMLElement | null,
 *   touchJump: HTMLElement | null,
 * }} options
 */
export function initInput(options) {
  onStartRequest = options.onStart;

  window.addEventListener("keydown", (e) => {
    if (
      (e.code === "Enter" || e.code === "Space") &&
      options.isMenuOpen() &&
      !isInteractiveTarget(e.target)
    ) {
      e.preventDefault();
      onStartRequest?.();
      return;
    }

    const action = CODE_MAP[e.code];
    if (!action) return;
    if (!isInteractiveTarget(e.target)) e.preventDefault();

    const before = actionFromCodes();
    const isNew = !heldCodes.has(e.code);
    heldCodes.add(e.code);
    if (action === "left") lastDir = "left";
    if (action === "right") lastDir = "right";
    syncInput();
    if (action === "jump" && isNew && !before.jump) {
      input.jumpPressed = true;
    }
  });

  window.addEventListener("keyup", (e) => {
    const action = CODE_MAP[e.code];
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
}
