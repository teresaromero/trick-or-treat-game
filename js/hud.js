// The icon is the visual; the label is the accessible name and the hover hint.
function setPauseIcon(button, paused) {
  const label = paused ? "Resume" : "Pause";
  button.innerHTML = paused ? PLAY_ICON : PAUSE_ICON;
  button.setAttribute("aria-label", label);
  button.setAttribute("title", `${label} (P or Space)`);
}

function createPauseLi(id) {
  const li = document.createElement("li");

  const button = document.createElement("button");
  button.setAttribute("type", "button");
  button.setAttribute("class", "hud-item hud-button");
  button.setAttribute("id", id);
  setPauseIcon(button, false);
  li.appendChild(button);

  return li;
}

function setMuteIcon(button, muted) {
  button.innerHTML = muted ? SOUND_OFF_ICON : SOUND_ON_ICON;
  button.setAttribute("aria-pressed", String(muted));
}

// Speaker buttons live in the HUD, on the start board and in the bottom bar:
// the data-mute mark lets toggleMuted() keep them all in step.
function createMuteButton(className) {
  const button = document.createElement("button");
  button.setAttribute("type", "button");
  button.setAttribute("class", className);
  button.setAttribute("data-mute", "");
  button.setAttribute("aria-label", "Mute");
  button.setAttribute("title", "Mute (M)");
  setMuteIcon(button, isMuted());
  button.addEventListener("click", toggleMuted);
  // Hidden (and out of the accessibility tree) while the game has no sound.
  button.hidden = !SOUND_ENABLED;
  return button;
}

function createMuteLi(id) {
  const li = document.createElement("li");

  const button = createMuteButton("hud-item hud-button");
  button.setAttribute("id", id);
  li.appendChild(button);

  return li;
}

function createLiCount(id, countId, icon) {
  const li = document.createElement("li");
  li.setAttribute("id", id);

  const span = document.createElement("span");
  span.setAttribute("class", "hud-item score");
  span.setAttribute("role", "img");
  span.setAttribute("aria-label", "0 points");

  const iconEl = document.createElement("span");
  iconEl.setAttribute("class", "score-icon");
  iconEl.innerHTML = icon;
  span.appendChild(iconEl);

  const count = document.createElement("span");
  count.setAttribute("id", countId);
  count.setAttribute("class", "point-count");
  count.textContent = "0";
  span.appendChild(count);
  li.appendChild(span);

  return li;
}

function createHeartsLi(id) {
  const li = document.createElement("li");
  li.setAttribute("id", id);

  const hearts = document.createElement("span");
  hearts.setAttribute("class", "hud-item hearts");
  hearts.setAttribute("role", "img");
  hearts.setAttribute("id", "lifeCount");
  for (let i = 0; i < START_LIVES; i++) {
    const heart = document.createElement("span");
    heart.setAttribute("class", "heart-icon is-full");
    heart.innerHTML = HEART_ICON;
    hearts.appendChild(heart);
  }
  li.appendChild(hearts);

  return li;
}

function createLevelLi(id) {
  const li = document.createElement("li");
  li.setAttribute("id", id);

  const level = document.createElement("span");
  level.setAttribute("class", "hud-item level");

  const badge = document.createElement("span");
  badge.setAttribute("class", "level-badge");
  badge.setAttribute("aria-hidden", "true");
  level.appendChild(badge);

  const bar = document.createElement("span");
  bar.setAttribute("class", "notches");
  bar.setAttribute("role", "progressbar");
  bar.setAttribute("aria-label", "Level progress");
  bar.setAttribute("aria-valuemin", "0");
  bar.setAttribute("aria-valuemax", String(POINTS_PER_LEVEL));
  for (let i = 0; i < POINTS_PER_LEVEL; i++) {
    const notch = document.createElement("span");
    notch.setAttribute("class", "notch");
    bar.appendChild(notch);
  }
  level.appendChild(bar);
  li.appendChild(level);

  return li;
}

// Remove and re-add a class so a CSS animation plays again.
function replay(element, className) {
  element.classList.remove(className);
  void element.offsetWidth;
  element.classList.add(className);
}

function announce(message) {
  const announcer = document.getElementById("announcer");
  if (announcer) announcer.textContent = message;
}

function updateLives(lives) {
  const hearts = document.getElementById("lifeCount");
  const label = `${lives} ${lives === 1 ? "life" : "lives"}`;
  hearts.setAttribute("aria-label", label);
  if (lives < START_LIVES) announce(`${label} left`);
  hearts.querySelectorAll(".heart-icon").forEach((heart, i) => {
    const full = i < lives;
    const wasFull = heart.classList.contains("is-full");
    if (wasFull && !full) replay(heart, "is-lost");
    if (!wasFull && full) replay(heart, "anim-pop");
    heart.classList.toggle("is-full", full);
  });
}

// `filled` is the notches toward the next level, undefined on the last level.
function updateScore(points, level, filled, delta = 0, note = "") {
  const count = document.getElementById("pointCount");
  count.textContent = points;
  if (delta !== 0) {
    count.classList.remove(delta > 0 ? "anim-wobble" : "anim-pop");
    replay(count, delta > 0 ? "anim-pop" : "anim-wobble");
  }
  const label = `${points} ${points === 1 ? "point" : "points"}`;
  count.parentElement.setAttribute("aria-label", label);
  // Every catch would queue up at higher levels: only milestones are spoken.
  if (note) announce(`${label}. ${note}`);
  else if (delta > 0 && points % ANNOUNCE_EVERY === 0) announce(label);

  const bar = document.querySelector(".notches");
  const badge = document.querySelector(".level-badge");
  const max = filled === undefined;
  const leveledUp = badge.textContent !== `LV ${level}` && badge.textContent;

  badge.textContent = `LV ${level}`;
  bar.classList.toggle("is-max", max);
  bar.setAttribute("aria-valuenow", max ? POINTS_PER_LEVEL : filled);
  bar.setAttribute(
    "aria-valuetext",
    max
      ? `Level ${level}, max`
      : `Level ${level}, ${filled} of ${POINTS_PER_LEVEL} to level ${level + 1}`
  );
  bar.querySelectorAll(".notch").forEach((notch, i) => {
    const on = max || i < filled;
    if (!notch.classList.contains("is-on") && on && delta > 0) {
      replay(notch, "anim-pop");
    }
    notch.classList.toggle("is-on", on);
  });

  if (leveledUp) {
    replay(badge, "anim-pop");
    replay(bar, "anim-flash");
  } else if (delta < 0) {
    replay(bar, "anim-shake");
  }
}

function renderControls() {
  const group = document.createElement("ul");
  group.setAttribute("id", "controls");

  const points = createLiCount("points", "pointCount", PUMPKIN_ICON);

  const level = createLevelLi("level");

  const lives = createHeartsLi("lifes");

  const pause = createPauseLi("pause");

  const mute = createMuteLi("mute");

  group.appendChild(lives);
  group.appendChild(level);
  group.appendChild(points);
  group.appendChild(pause);
  group.appendChild(mute);

  const hud = document.querySelector(".hud");
  // Once the start board is gone nothing else names the page.
  const heading = document.createElement("h1");
  heading.setAttribute("id", "game-heading");
  heading.setAttribute("class", "sr-only");
  heading.setAttribute("translate", "no");
  heading.textContent = "Trick or Treat";
  hud.append(heading, group);
}
