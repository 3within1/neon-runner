import { LOGICAL_W, LOGICAL_H } from "./constants.js";

export const canvas = document.getElementById("game");
export const ctx = canvas.getContext("2d");
export const overlay = document.getElementById("overlay");
export const startBtn = document.getElementById("start-btn");
export const scoreEl = document.querySelector("#score b");
export const livesEl = document.querySelector("#lives b");
export const sectorEl = document.querySelector("#sector b");
export const buildVersionEl = document.getElementById("build-version");
export const muteBtn = document.getElementById("mute-btn");
export const hudMuteBtn = document.getElementById("hud-mute-btn");
export const statusLive = document.getElementById("status-live");
export const touchControls = document.getElementById("touch-controls");
export const leaderboardEl = document.getElementById("leaderboard");
export const leaderboardListEl = document.getElementById("leaderboard-list");
export const scoreEntryEl = document.getElementById("score-entry");
export const initialsInput = document.getElementById("initials-input");
export const scoreSaveBtn = document.getElementById("score-save-btn");
export const clearScoresBtn = document.getElementById("clear-scores-btn");
export const runSummaryEl = document.getElementById("run-summary");

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
