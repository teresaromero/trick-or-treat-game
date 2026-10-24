// Storage can be missing or blocked (private windows): the game works without.
function loadBest() {
  try {
    return Number(localStorage.getItem(BEST_KEY)) || 0;
  } catch (e) {
    return 0;
  }
}

function saveBest(score) {
  try {
    localStorage.setItem(BEST_KEY, score);
  } catch (e) {}
}

const MUTED_KEY = "trick-or-treat:muted";
function loadMuted() {
  try {
    return localStorage.getItem(MUTED_KEY) === "1";
  } catch (e) {
    return false;
  }
}

function saveMuted(muted) {
  try {
    localStorage.setItem(MUTED_KEY, muted ? "1" : "0");
  } catch (e) {}
}

// The start options are kept in memory too: with storage blocked, a switch
// still has to mean what it shows for the rest of the visit.
let keyboardPlay;
let slowPace;

function loadKeyboardPlay() {
  if (keyboardPlay === undefined) {
    try {
      keyboardPlay = localStorage.getItem(KEYBOARD_KEY) === "1";
    } catch (e) {
      keyboardPlay = false;
    }
  }
  return keyboardPlay;
}

function saveKeyboardPlay(on) {
  keyboardPlay = on;
  try {
    localStorage.setItem(KEYBOARD_KEY, on ? "1" : "0");
  } catch (e) {}
}

function loadSlowPace() {
  if (slowPace === undefined) {
    try {
      slowPace = localStorage.getItem(SLOW_KEY) === "1";
    } catch (e) {
      slowPace = false;
    }
  }
  return slowPace;
}

function saveSlowPace(on) {
  slowPace = on;
  try {
    localStorage.setItem(SLOW_KEY, on ? "1" : "0");
  } catch (e) {}
}
