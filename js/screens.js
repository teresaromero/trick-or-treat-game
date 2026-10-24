// While a dialog is open the rest of the page can't take focus or clicks.
function setBackgroundInert(on) {
  document.querySelectorAll("header, .site-nav, #paused").forEach((el) => {
    el.toggleAttribute("inert", on);
  });
}

function renderPausedOverlay(onResume) {
  const overlay = document.createElement("button");
  overlay.setAttribute("type", "button");
  overlay.setAttribute("id", "paused");
  overlay.setAttribute("class", "paused");
  overlay.innerHTML = `${PLAY_ICON}Paused<small>Tap, click, P or Space to resume</small>`;
  overlay.addEventListener("click", onResume);

  document.querySelector("main").appendChild(overlay);
  return overlay;
}

// Esc during a game: a dimmed board with a question on top.
function renderQuitPrompt(onKeep, onQuit) {
  const div = document.createElement("div");
  div.setAttribute("id", "quit");
  div.setAttribute("class", "end-screen");
  div.setAttribute("role", "alertdialog");
  div.setAttribute("aria-modal", "true");
  div.setAttribute("aria-labelledby", "quit-title");
  div.setAttribute("aria-describedby", "quit-text");

  const panel = document.createElement("div");
  panel.setAttribute("class", "panel");
  div.appendChild(panel);

  const title = document.createElement("h2");
  title.setAttribute("class", "panel-title");
  title.setAttribute("id", "quit-title");
  title.textContent = "Quit this game?";
  panel.appendChild(title);

  const text = document.createElement("p");
  text.setAttribute("class", "panel-text");
  text.setAttribute("id", "quit-text");
  text.textContent = "Your score won’t be saved.";
  panel.appendChild(text);

  const keep = document.createElement("button");
  keep.setAttribute("type", "button");
  keep.setAttribute("class", "btn");
  keep.textContent = "Keep playing";
  keep.addEventListener("click", onKeep);
  panel.appendChild(keep);

  const quit = document.createElement("button");
  quit.setAttribute("type", "button");
  quit.setAttribute("class", "btn btn-secondary");
  quit.textContent = "Quit game";
  quit.addEventListener("click", onQuit);
  panel.appendChild(quit);

  document.querySelector("main").appendChild(div);
  setBackgroundInert(true);
  keep.focus();
}

// The start screen is the board itself: the title bobs on the night sky, and
// a click or tap anywhere (or Enter on the button) starts the game.
function renderStart() {
  const div = document.createElement("div");
  div.setAttribute("id", "start");
  div.setAttribute("class", "board start");
  div.addEventListener("click", startGame);
  sizeStart(div);

  const sound = createMuteButton("board-button hud-button");
  sound.addEventListener("click", (e) => e.stopPropagation());
  div.appendChild(sound);

  const best = document.createElement("p");
  best.setAttribute("class", "best");
  const bestNum = document.createElement("strong");
  bestNum.textContent = loadBest();
  best.append(bestNum, document.createElement("span"));
  best.lastChild.textContent = "Best";
  div.appendChild(best);

  const title = document.createElement("div");
  title.setAttribute("class", "start-title anim-bob");
  const heading = document.createElement("h1");
  heading.setAttribute("translate", "no");
  heading.append("Trick or Treat?");
  title.appendChild(heading);
  div.appendChild(title);

  const sprite = document.createElement("img");
  sprite.setAttribute("src", "./assets/img/001.png");
  sprite.setAttribute("alt", "");
  sprite.setAttribute("width", "128");
  sprite.setAttribute("height", "128");
  sprite.setAttribute("class", "start-sprite anim-bob");
  div.appendChild(sprite);

  const text = document.createElement("p");
  text.setAttribute("class", "panel-text");
  text.textContent = "Catch the pumpkins, dodge the fakes.";
  div.appendChild(text);

  const start = document.createElement("button");
  start.setAttribute("type", "button");
  start.setAttribute("class", "btn");
  start.textContent = "Tap to start";
  div.appendChild(start);

  const howTo = document.createElement("a");
  howTo.setAttribute("href", "./how-to-play.html");
  howTo.setAttribute("class", "start-link");
  howTo.textContent = "How to play";
  howTo.addEventListener("click", (e) => e.stopPropagation());
  div.appendChild(howTo);

  const options = document.createElement("div");
  options.setAttribute("class", "start-options");
  options.setAttribute("role", "group");
  options.setAttribute("aria-label", "Options");
  if (!isTouchDevice()) {
    options.appendChild(
      createSwitch("Keyboard play", loadKeyboardPlay(), saveKeyboardPlay)
    );
  }
  options.appendChild(
    createSwitch("Slower pace", loadSlowPace(), saveSlowPace)
  );
  div.appendChild(options);

  document.querySelector("main").appendChild(div);
  start.focus();
}

// An on/off switch that remembers its choice. A click on it never starts the
// game, though the board around it does.
function createSwitch(label, on, onChange) {
  const button = document.createElement("button");
  button.setAttribute("type", "button");
  button.setAttribute("role", "switch");
  button.setAttribute("class", "switch");
  button.setAttribute("aria-checked", String(on));

  const track = document.createElement("span");
  track.setAttribute("class", "switch-track");
  track.setAttribute("aria-hidden", "true");
  button.appendChild(track);
  button.append(label);

  button.addEventListener("click", (e) => {
    e.stopPropagation();
    const next = button.getAttribute("aria-checked") !== "true";
    button.setAttribute("aria-checked", String(next));
    onChange(next);
  });
  return button;
}

// Same size as the game board, so starting a game doesn't make the page jump.
function sizeStart(start = document.getElementById("start")) {
  if (!start) return;
  const { width, height } = getCanvasSize();
  start.style.width = `${width}px`;
  start.style.height = `${height}px`;
}

function createStat(label, value, icon = "") {
  const stat = document.createElement("div");
  stat.setAttribute("class", "stat");

  const number = document.createElement("strong");
  if (icon) number.insertAdjacentHTML("beforeend", icon);
  number.append(value);

  const caption = document.createElement("span");
  caption.textContent = label;

  stat.appendChild(number);
  stat.appendChild(caption);
  return stat;
}

// Game over: a dimmed overlay over the frozen board, with the panel on top.
function renderEndGame({
  score = 0,
  level = 1,
  best = 0,
  newBest = false,
  caught = 0,
  fauxHit = 0,
  bestStreak = 0,
} = {}) {
  const div = document.createElement("div");
  div.setAttribute("id", "end");
  div.setAttribute("class", "end-screen");
  div.setAttribute("role", "dialog");
  div.setAttribute("aria-modal", "true");
  div.setAttribute("aria-labelledby", "end-title");

  const panel = document.createElement("div");
  panel.setAttribute("class", "panel");
  div.appendChild(panel);

  const title = document.createElement("h2");
  title.setAttribute("class", "panel-title");
  title.setAttribute("id", "end-title");
  title.textContent = "Game over!";
  panel.appendChild(title);

  const text1 = document.createElement("p");
  text1.setAttribute("class", "panel-text end-score");
  const scoreNum = document.createElement("strong");
  scoreNum.textContent = score;
  text1.append("You scored ", scoreNum, ` ${score === 1 ? "point" : "points"}`);
  panel.appendChild(text1);

  const text2 = document.createElement("p");
  text2.setAttribute("class", "panel-text");
  text2.textContent = `You reached level ${level}${level === LEVELS.length ? " (max!)" : ""}`;
  panel.appendChild(text2);

  const bestLine = document.createElement("p");
  bestLine.setAttribute("class", "panel-text");
  bestLine.append(`Best: ${best}`);
  if (newBest) {
    const badge = document.createElement("span");
    badge.setAttribute("class", "badge");
    badge.textContent = "New best!";
    bestLine.append(" ", badge);
  }
  panel.appendChild(bestLine);

  const stats = document.createElement("div");
  stats.setAttribute("class", "stats");
  stats.appendChild(createStat("Caught", caught, STAR_ICON));
  stats.appendChild(createStat("Faux hit", fauxHit, FAUX_ICON));
  stats.appendChild(createStat("Best streak", bestStreak, FLAME_ICON));
  panel.appendChild(stats);

  const start = document.createElement("button");
  start.setAttribute("type", "button");
  start.setAttribute("class", "btn");
  start.textContent = "Play Again!";
  start.addEventListener("click", startGame);
  panel.appendChild(start);

  const home = document.createElement("button");
  home.setAttribute("type", "button");
  home.setAttribute("class", "btn btn-secondary");
  home.textContent = "Home";
  home.addEventListener("click", backToStart);
  panel.appendChild(home);

  document.querySelector("main").appendChild(div);
  setBackgroundInert(true);
  start.focus();
}
