import { LOGICAL_W, LOGICAL_H } from "./constants.js";

export const canvas = document.getElementById("game");
export const ctx = canvas.getContext("2d");
export const overlay = document.getElementById("overlay");
export const startBtn = document.getElementById("start-btn");
export const scoreEl = document.querySelector("#score b");
export const livesEl = document.querySelector("#lives b");
export const sectorEl = document.querySelector("#sector b");
export const statusLive = document.getElementById("status-live");
export const touchControls = document.getElementById("touch-controls");

export let W = LOGICAL_W;
export let H = LOGICAL_H;

export function setupCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  W = LOGICAL_W;
  H = LOGICAL_H;
  canvas.width = Math.round(LOGICAL_W * dpr);
  canvas.height = Math.round(LOGICAL_H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

export function initDom() {
  setupCanvas();
  window.addEventListener("resize", setupCanvas);
}
