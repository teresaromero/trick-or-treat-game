function getCanvasSize() {
  const viewport = document.getElementById("main-vp");
  const style = window.getComputedStyle(viewport);
  const padding =
    (parseFloat(style.paddingTop) || 0) +
    (parseFloat(style.paddingBottom) || 0);
  const chrome =
    document.querySelector("header").offsetHeight +
    document.querySelector(".site-nav").offsetHeight;
  // The extra pixels cover the gap an inline canvas leaves under itself.
  const free = viewport.clientHeight - padding - chrome - 8;
  return {
    width: viewport.clientWidth * 0.9,
    // On a very short screen the board stays playable and the page scrolls.
    height: Math.max(
      Math.min(viewport.clientHeight * 0.8, free),
      MIN_BOARD_HEIGHT
    ),
  };
}

// With keyboard play the board is an application the arrow keys drive; it
// takes focus so a screen reader passes the keys through.
function renderBoard(keyboard = false) {
  const { width, height } = getCanvasSize();
  const canvas = document.createElement("canvas");
  canvas.setAttribute("id", "canvas");
  canvas.setAttribute("class", "board");
  canvas.setAttribute("role", "img");
  canvas.setAttribute(
    "aria-label",
    "Game board: pumpkins and fake items fall down. Click the pumpkins, avoid the fakes."
  );
  canvas.textContent =
    "Your browser can’t show the game board. Pumpkins fall down; click them and avoid the fake items.";
  if (keyboard) {
    canvas.setAttribute("role", "application");
    canvas.setAttribute(
      "aria-label",
      "Game board: pumpkins and fake items fall down. Arrow keys pick an item, Enter catches it, P pauses. Catch the pumpkins, avoid the fakes."
    );
    canvas.setAttribute("tabindex", "0");
  }

  document.querySelector("main").appendChild(canvas);

  // Score and lives are announced here, not on the visual HUD, so a screen
  // reader hears short messages instead of the whole HUD re-read.
  const announcer = document.createElement("div");
  announcer.setAttribute("id", "announcer");
  announcer.setAttribute("class", "sr-only");
  announcer.setAttribute("aria-live", "polite");
  document.querySelector("main").appendChild(announcer);

  // Floating labels live in their own layer, exactly over the board.
  const effects = document.createElement("div");
  effects.setAttribute("id", "effects");
  effects.setAttribute("aria-hidden", "true");
  document.querySelector("main").appendChild(effects);
  resizeEffects(width, height);

  return new Board(canvas, width, height);
}

function resizeEffects(width, height) {
  const effects = document.getElementById("effects");
  if (!effects) return;
  effects.style.width = `${width}px`;
  effects.style.height = `${height}px`;
}

// A label that floats over the board at canvas coordinates (x, y).
// `kind` is catch, faux or lost; `size` grows the text for streaks.
function renderPopup(kind, text, x, y, { icon = "", size = 0 } = {}) {
  const effects = document.getElementById("effects");
  if (!effects) return;

  const popup = document.createElement("span");
  popup.setAttribute("class", "popup");
  popup.dataset.kind = kind;
  popup.style.left = `${x}px`;
  popup.style.top = `${y}px`;
  popup.style.setProperty("--n", size);
  if (icon) popup.insertAdjacentHTML("beforeend", icon);
  if (text) popup.append(text);
  effects.appendChild(popup);

  setTimeout(() => popup.remove(), POPUP_MS[kind]);
}

// Fog over the top of the board while a game opens. Decorative, and fixed
// (no random calls); it removes itself when it has faded.
function renderSmoke() {
  const effects = document.getElementById("effects");
  if (!effects) return;
  clearSmoke();

  const smoke = document.createElement("div");
  smoke.setAttribute("class", "smoke");
  for (const variant of ["a", "b", "c"]) {
    const puff = document.createElement("div");
    puff.setAttribute("class", `smoke-puff is-${variant}`);
    smoke.appendChild(puff);
  }
  effects.appendChild(smoke);

  setTimeout(() => smoke.remove(), SMOKE_MS);
}

function clearSmoke() {
  document.querySelector("#effects .smoke")?.remove();
}

// A phone or a tablet: the main input is a finger, so there is no keyboard
// to play with.
function isTouchDevice() {
  return window.matchMedia?.("(hover: none) and (pointer: coarse)").matches ?? false;
}

function prefersReducedMotion() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

// The board shakes and flashes red when a pumpkin is lost.
function flinchBoard() {
  const board = document.getElementById("canvas");
  if (board) replay(board, "anim-hurt");
}

// A see-through witch silhouette that flies across the whole screen, from a
// random side each time so it can't be predicted. Decorative: the caption
// carries the message.
function renderWitch() {
  document.querySelector(".witch")?.remove();

  const witch = document.createElement("div");
  witch.setAttribute("class", "witch");
  if (Math.random() >= 0.5) witch.classList.add("is-leftwards");
  witch.setAttribute("aria-hidden", "true");
  witch.innerHTML = WITCH_ICON;
  document.body.appendChild(witch);

  setTimeout(() => witch.remove(), LEVEL_UP_MS);
}

// The level-up moment: the new level grows from the middle of the screen
// until it fills it and fades out, with what got harder underneath, and a
// witch flies by. The game keeps running and nothing blocks clicks. The
// message reaches screen readers through the live region (see updateScore);
// the number and the caption are decoration.
function renderLevelUp(level, message) {
  document.getElementById("level-up")?.remove();
  renderWitch();

  const banner = document.createElement("div");
  banner.setAttribute("id", "level-up");
  banner.setAttribute("class", "level-up");

  const number = document.createElement("span");
  number.setAttribute("class", "level-up-number");
  number.setAttribute("aria-hidden", "true");
  number.textContent = level === LEVELS.length ? "MAX" : level;
  banner.appendChild(number);

  const caption = document.createElement("p");
  caption.setAttribute("class", "level-up-caption");
  caption.setAttribute("aria-hidden", "true");
  caption.textContent = message;
  banner.appendChild(caption);

  document.body.appendChild(banner);

  setTimeout(() => banner.remove(), LEVEL_UP_MS);
}
