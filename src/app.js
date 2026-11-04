import {
  createRun,
  generateSuggestions,
  getLeaderboardRows,
  isValidPlayerName,
  makeLevelKey,
  pressJump,
  resetRun,
  stepRun
} from "./game-core.js?v=47";
import { drawGame, drawPreview } from "./renderer.js?v=4";

const byId = (id) => document.getElementById(id);
const screens = {
  setup: byId("setup-screen"),
  preview: byId("preview-screen"),
  game: byId("game-screen"),
  complete: byId("complete-screen")
};
const setupForm = byId("setup-form");
const uploadInput = byId("upload-photo");
const cameraInput = byId("camera-photo");
const suggestButton = byId("suggest-button");
const setupError = byId("setup-error");
const previewError = byId("preview-error");
const suggestions = byId("suggestions");
const canvas = byId("game-canvas");
const context = canvas.getContext("2d");
const mediaTouch = window.matchMedia("(pointer: coarse)");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const sourceBranch = document.querySelector('meta[name="game-source-branch"]')?.content || "Not injected";
const sourceCommit = document.querySelector('meta[name="game-source-commit"]')?.content || "Not injected";

const state = {
  imageFile: null,
  photo: null,
  imageData: null,
  photoHash: "",
  options: [],
  selectedLevel: null,
  run: null,
  players: [],
  round: 1,
  nextAnimation: 0,
  previousFrame: 0,
  lastEventCount: 0,
  keys: new Set(),
  touch: { x: 0, y: 0, jump: false, drill: false, shoot: false },
  currentAttemptId: null
};

byId("version-info").textContent = `Version: ${sourceBranch} · ${sourceCommit}`;

function showScreen(name) {
  for (const [screenName, element] of Object.entries(screens)) {
    element.hidden = screenName !== name;
  }
}

function showError(element, message) {
  element.textContent = message;
  element.hidden = !message;
}

async function sha256(file) {
  if (!crypto.subtle) throw new Error("Secure browser hashing is unavailable; open the game on localhost or HTTPS.");
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function readPhoto(file) {
  if (!file || !file.type.startsWith("image/")) throw new Error("Choose an image file to build a course.");
  let photo = null;
  let bitmapError = null;
  if ("createImageBitmap" in window) {
    try {
      photo = await createImageBitmap(file);
    } catch (error) {
      bitmapError = error;
    }
  }
  if (!photo) {
    const objectUrl = URL.createObjectURL(file);
    try {
      photo = await new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error("That photo could not be opened. Please choose another one."));
        image.src = objectUrl;
      });
    } catch (error) {
      if (bitmapError) {
        throw new Error(`The photo could not be decoded by this browser: ${error.message || bitmapError.message}`);
      }
      throw error;
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }
  const analysisCanvas = document.createElement("canvas");
  analysisCanvas.width = photo.width;
  analysisCanvas.height = photo.height;
  const analysisContext = analysisCanvas.getContext("2d", { willReadFrequently: true });
  analysisContext.drawImage(photo, 0, 0);
  const imageData = analysisContext.getImageData(0, 0, photo.width, photo.height);
  return { photo, imageData, photoHash: await sha256(file) };
}

async function selectPhoto(event) {
  const file = event.currentTarget.files?.[0];
  if (!file) return;
  suggestButton.disabled = true;
  showError(setupError, "");
  byId("photo-status").textContent = "Reading this photo locally…";
  try {
    const result = await readPhoto(file);
    state.imageFile = file;
    state.photo = result.photo;
    state.imageData = result.imageData;
    state.photoHash = result.photoHash;
    byId("photo-status").textContent = `${file.name} is ready. Your image stays on this device.`;
    suggestButton.disabled = false;
  } catch (error) {
    byId("photo-status").textContent = "Photos stay on this device and are never uploaded.";
    showError(setupError, error.message);
  }
}

uploadInput.addEventListener("change", selectPhoto);
cameraInput.addEventListener("change", selectPhoto);

function renderSuggestions() {
  suggestions.replaceChildren();
  for (const [index, option] of state.options.entries()) {
    const card = document.createElement("article");
    card.className = "suggestion-card";
    const preview = document.createElement("canvas");
    preview.width = 480;
    preview.height = 270;
    preview.setAttribute("aria-label", `${option.biome} ${option.layout} course preview`);
    drawPreview(preview, option, state.photo, reducedMotion.matches);
    const title = document.createElement("h2");
    title.textContent = `${option.biome} · ${option.layout}`;
    const description = document.createElement("p");
    description.textContent = `${option.route.sectionCount} route sections · ${option.checkpoints.length} checkpoints`;
    const choose = document.createElement("button");
    choose.className = "button";
    choose.type = "button";
    choose.textContent = "Race this course";
    choose.setAttribute("aria-label", `Race course ${index + 1}: ${option.biome}, ${option.layout}`);
    choose.addEventListener("click", () => startSelectedCourse(option));
    card.append(preview, title, description, choose);
    suggestions.append(card);
  }
}

setupForm.addEventListener("submit", (event) => {
  event.preventDefault();
  showError(setupError, "");
  const names = [byId("player-one").value.trim(), byId("player-two").value.trim()];
  if (!names.every(isValidPlayerName)) {
    showError(setupError, "Enter both names using letters and spaces only, up to 32 characters.");
    return;
  }
  if (!state.imageData) {
    showError(setupError, "Choose or take a photo before generating courses.");
    return;
  }
  state.players = names;
  try {
    const seed = Number.parseInt(state.photoHash.slice(0, 8), 16) >>> 0;
    state.options = generateSuggestions(state.imageData, seed);
    if (state.options.length !== 3 || state.options.some((option) => !option.route.verified)) {
      throw new Error("Safe routes could not be verified for this photo. Please choose another one.");
    }
    renderSuggestions();
    showError(previewError, "");
    showScreen("preview");
  } catch (error) {
    showError(setupError, error.message);
  }
});

byId("change-photo").addEventListener("click", () => showScreen("setup"));

function startSelectedCourse(option, playerIndex = 0) {
  state.selectedLevel = option;
  state.run = createRun(option, state.players);
  state.run.playerIndex = playerIndex;
  state.round = playerIndex === 0 && state.round === 1 ? 1 : state.round + 1;
  state.lastEventCount = 0;
  byId("round-label").textContent = `Round ${state.round} · ${state.players[playerIndex]}`;
  byId("game-title").textContent = `${option.biome} ${option.layout} course`;
  byId("game-status").textContent = "Move or jump to start the timer. Collect every checkpoint to open the exit.";
  showScreen("game");
  drawGame(canvas, state.run, state.photo, { touch: mediaTouch.matches });
  if (!state.nextAnimation) {
    state.previousFrame = 0;
    state.nextAnimation = requestAnimationFrame(gameFrame);
  }
}

function clearControls() {
  state.keys.clear();
  state.touch = { x: 0, y: 0, jump: false, drill: false, shoot: false };
  if (state.run) {
    state.run.input = { x: 0, y: 0, drill: false, shoot: false, jump: false };
    state.run.player.jumpLockedUntilRelease = false;
  }
  const handle = document.querySelector(".joystick-handle");
  if (handle) handle.style.transform = "";
}

function restartSelectedCourse() {
  if (!state.run) return;
  clearControls();
  resetRun(state.run);
  state.lastEventCount = 0;
  byId("game-status").textContent = "Run reset. Move or jump when you are ready.";
  showScreen("game");
}

byId("reset-button").addEventListener("click", restartSelectedCourse);
byId("completion-reset").addEventListener("click", restartSelectedCourse);

function isEditable(target) {
  return target instanceof HTMLElement &&
    (target.isContentEditable || target.closest("input, textarea, select, button, a, [role='button']"));
}

const KEY_TO_CONTROL = {
  KeyA: ["x", -1],
  ArrowLeft: ["x", -1],
  KeyD: ["x", 1],
  ArrowRight: ["x", 1],
  KeyW: ["y", -1],
  ArrowUp: ["y", -1],
  KeyS: ["y", 1],
  ArrowDown: ["y", 1],
  Enter: ["drill", true],
  KeyX: ["shoot", true],
  Space: ["jump", true]
};

document.addEventListener("keydown", (event) => {
  if (!state.run || isEditable(event.target)) return;
  const control = KEY_TO_CONTROL[event.code];
  if (!control) return;
  event.preventDefault();
  state.keys.add(event.code);
  if (event.code === "Space" && !event.repeat && state.run.player.climbing) {
    pressJump(state.run, performance.now());
  }
});

document.addEventListener("keyup", (event) => {
  state.keys.delete(event.code);
  if (event.code === "Space" && state.run) state.run.player.jumpLockedUntilRelease = false;
});

window.addEventListener("blur", clearControls);

function keyboardAxis(negative, positive) {
  return Number([...state.keys].some((code) => KEY_TO_CONTROL[code]?.[0] === positive && KEY_TO_CONTROL[code]?.[1] === 1)) -
    Number([...state.keys].some((code) => KEY_TO_CONTROL[code]?.[0] === negative && KEY_TO_CONTROL[code]?.[1] === -1));
}

function currentInput() {
  const x = keyboardAxis("x", "x");
  const y = [...state.keys].some((code) => ["KeyW", "ArrowUp"].includes(code)) ? -1 :
    [...state.keys].some((code) => ["KeyS", "ArrowDown"].includes(code)) ? 1 : 0;
  return {
    x: x || state.touch.x,
    y: y || state.touch.y,
    jump: state.keys.has("Space") || state.touch.jump,
    drill: state.keys.has("Enter") || state.touch.drill,
    shoot: state.keys.has("KeyX") || state.touch.shoot
  };
}

function formatTime(seconds) {
  const sign = seconds < 0 ? "-" : "";
  const absolute = Math.abs(seconds);
  const minutes = Math.floor(absolute / 60);
  const remainder = (absolute % 60).toFixed(2).padStart(5, "0");
  return `${sign}${String(minutes).padStart(2, "0")}:${remainder}`;
}

function updateTimer() {
  byId("timer").textContent = formatTime(state.run?.timer || 0);
}

function gameFrame(timestamp) {
  state.nextAnimation = requestAnimationFrame(gameFrame);
  if (!state.run || screens.game.hidden) {
    state.previousFrame = timestamp;
    return;
  }
  const dt = state.previousFrame ? Math.min((timestamp - state.previousFrame) / 1000, 0.1) : 0;
  state.previousFrame = timestamp;
  stepRun(state.run, currentInput(), dt, timestamp);
  updateTimer();
  handleEvents();
  drawGame(canvas, state.run, state.photo, {
    now: reducedMotion.matches ? 0 : timestamp,
    touch: mediaTouch.matches,
    reducedMotion: reducedMotion.matches
  });
}

function handleEvents() {
  const events = state.run.events.slice(state.lastEventCount);
  state.lastEventCount = state.run.events.length;
  for (const event of events) {
    if (event.type === "mushroom") {
      byId("game-status").textContent = "Mushroom collected: 2 seconds subtracted from your time.";
    } else if (event.type === "checkpoint") {
      byId("game-status").textContent = "Checkpoint collected.";
    } else if (event.type === "speed") {
      byId("game-status").textContent = "Speed boost! Movement is doubled for five seconds.";
    } else if (event.type === "reset") {
      clearControls();
      byId("game-status").textContent = event.message;
      updateTimer();
    } else if (event.type === "finish") {
      finishRun();
    }
  }
}

function cookieName(levelKey) {
  return `prb_${levelKey.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
}

function readCookie(name) {
  const prefix = `${name}=`;
  const cookie = document.cookie.split("; ").find((entry) => entry.startsWith(prefix));
  if (!cookie) return [];
  try {
    const value = JSON.parse(decodeURIComponent(cookie.slice(prefix.length)));
    if (!Array.isArray(value)) throw new Error("The saved leaderboard cookie is not a score list.");
    return value;
  } catch (error) {
    throw new Error(`Saved leaderboard data could not be read: ${error.message}`);
  }
}

function writeCookie(name, value) {
  document.cookie = `${name}=${encodeURIComponent(JSON.stringify(value))}; Max-Age=31536000; Path=/; SameSite=Lax`;
  if (!document.cookie.split("; ").some((entry) => entry.startsWith(`${name}=`))) {
    throw new Error("This browser did not save the leaderboard cookie.");
  }
}

function completionMessage(rank, time) {
  if (rank === 1) return "Record pace! Somewhere, a stopwatch just asked for your autograph.";
  if (rank && rank <= 3) return "Podium power! Your shoes would like a victory lap.";
  if (rank) return `Nice run! You landed at #${rank}; the photo never stood a chance.`;
  return time < 0
    ? "You bent the clock so far it owes you change."
    : "Course complete! The patrols are already asking for a rematch.";
}

async function finishRun() {
  if (document.fullscreenElement) {
    try {
      await document.exitFullscreen();
    } catch (error) {
      byId("game-status").textContent = `Finished, but could not exit full screen: ${error.message}`;
    }
  }
  const levelKey = makeLevelKey(state.photoHash, state.selectedLevel);
  const name = state.players[state.run.playerIndex];
  const attempt = {
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    name,
    time: state.run.timer
  };
  state.currentAttemptId = attempt.id;
  const nameForCookie = cookieName(levelKey);
  let rows;
  try {
    const oldEntries = readCookie(nameForCookie);
    const allEntries = [...oldEntries, attempt];
    rows = getLeaderboardRows(allEntries, attempt.id);
    const stored = rows.ranked.map(({ id, name: entryName, time }) => ({
      id,
      name: entryName,
      time
    }));
    writeCookie(nameForCookie, stored);
  } catch (error) {
    byId("score-storage-status").textContent = error.message;
    rows = getLeaderboardRows([attempt], attempt.id);
  }
  renderCompletion(rows, attempt);
  showScreen("complete");
}

function renderCompletion(rows, attempt) {
  byId("completion-time").textContent = formatTime(attempt.time);
  byId("completion-message").textContent = completionMessage(rows.current?.rank, attempt.time);
  const list = byId("leaderboard");
  list.replaceChildren();
  for (const entry of rows.ranked) {
    const item = document.createElement("li");
    item.className = entry.id === state.currentAttemptId ? "your-run" : "";
    item.value = entry.rank;
    item.append(document.createTextNode(`${entry.name}${entry.id === state.currentAttemptId ? " — Your run" : ""}`));
    const time = document.createElement("span");
    time.className = "score-time";
    time.textContent = formatTime(entry.time);
    item.append(time);
    list.append(item);
  }
  if (rows.current?.rank === null) {
    const item = document.createElement("li");
    item.className = "your-run";
    item.value = 11;
    item.append(document.createTextNode(`${rows.current.name} — Your run`));
    const time = document.createElement("span");
    time.className = "score-time";
    time.textContent = formatTime(rows.current.time);
    item.append(time);
    list.append(item);
  }
  const actions = byId("next-player-actions");
  actions.replaceChildren();
  state.players.forEach((name, index) => {
    const button = document.createElement("button");
    button.className = "button button-primary";
    button.type = "button";
    button.textContent = `Next round — ${name}`;
    button.addEventListener("click", () => {
      state.round += 1;
      clearControls();
      state.run = createRun(state.selectedLevel, state.players);
      state.run.playerIndex = index;
      state.lastEventCount = 0;
      byId("round-label").textContent = `Round ${state.round} · ${name}`;
      byId("game-status").textContent = "Same course, fresh run. Move or jump when ready.";
      showScreen("game");
    });
    actions.append(button);
  });
}

byId("fullscreen-button").addEventListener("click", async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await byId("game-frame").requestFullscreen();
  } catch (error) {
    byId("game-status").textContent = `Full-screen mode is unavailable: ${error.message}`;
  }
});

document.addEventListener("fullscreenchange", () => {
  byId("fullscreen-button").textContent = document.fullscreenElement ? "Exit full screen" : "Full screen";
});

function bindTouchButton(button) {
  const control = button.dataset.control;
  const setPressed = (pressed) => {
    state.touch[control] = pressed;
    button.classList.toggle("pressed", pressed);
  };
  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    setPressed(true);
    if (control === "jump" && state.run?.player.climbing) pressJump(state.run, performance.now());
  });
  for (const type of ["pointerup", "pointercancel", "lostpointercapture"]) {
    button.addEventListener(type, () => setPressed(false));
  }
}

document.querySelectorAll(".touch-button").forEach(bindTouchButton);

document.querySelectorAll(".file-button").forEach((label) => {
  label.addEventListener("keydown", (event) => {
    if (event.code === "Enter" || event.code === "Space") {
      event.preventDefault();
      label.click();
    }
  });
});

const joystick = byId("joystick");
const joystickHandle = joystick.querySelector(".joystick-handle");
function updateJoystick(event) {
  const bounds = joystick.getBoundingClientRect();
  const radius = bounds.width * 0.36;
  const dx = event.clientX - (bounds.left + bounds.width / 2);
  const dy = event.clientY - (bounds.top + bounds.height / 2);
  const distance = Math.hypot(dx, dy);
  const scale = distance > radius ? radius / distance : 1;
  const x = dx * scale;
  const y = dy * scale;
  joystickHandle.style.transform = `translate(${x}px, ${y}px)`;
  state.touch.x = Math.abs(x) < radius * 0.18 ? 0 : x / radius;
  state.touch.y = Math.abs(y) < radius * 0.18 ? 0 : y / radius;
}
joystick.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  joystick.setPointerCapture(event.pointerId);
  updateJoystick(event);
});
joystick.addEventListener("pointermove", (event) => {
  if (joystick.hasPointerCapture(event.pointerId)) updateJoystick(event);
});
for (const type of ["pointerup", "pointercancel", "lostpointercapture"]) {
  joystick.addEventListener(type, () => {
    state.touch.x = 0;
    state.touch.y = 0;
    joystickHandle.style.transform = "";
  });
}

document.querySelectorAll("[data-feedback]").forEach((button) => {
  button.addEventListener("click", () => {
    const category = button.dataset.feedback;
    const severity = byId("feedback-severity").value;
    const version = `Branch: ${sourceBranch}\nCommit: ${sourceCommit}`;
    const title = `[${category} - ${severity}]`;
    const body = `Category: ${category}\nSeverity: ${severity}\n${version}\n\nFeedback:\n\nReproduction steps (optional):\n`;
    const url = new URL("https://github.com/ckloecker/dic-pic/issues/new");
    url.searchParams.set("template", "feedback.yml");
    url.searchParams.set("title", title);
    url.searchParams.set("body", body);
    window.open(url.toString(), "_blank", "noopener,noreferrer");
  });
});
