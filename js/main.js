// Entry point: nothing runs until the page has loaded.
let session;
// The ended game, kept while its frozen board shows behind the game over card.
let finished;

// Removes what a game leaves on the page: board, effects, HUD and banner.
function clearBoard() {
  finished = undefined;
  setBackgroundInert(false);
  for (const id of ["canvas", "effects", "controls", "game-heading", "level-up", "paused", "quit", "announcer"]) {
    document.getElementById(id)?.remove();
  }
}

function backToStart() {
  document.getElementById("end")?.remove();
  clearBoard();
  renderStart();
}

function startGame(e) {
  e.preventDefault();
  if (session) return;
  document.querySelector("#start, #end").remove();
  clearBoard();
  // Controls first: they make the header taller, which the board must allow for.
  renderControls();
  const keyboard = loadKeyboardPlay() && !isTouchDevice();
  const slow = loadSlowPace();
  const board = renderBoard(keyboard);
  session = new Session(
    new Game({ pace: slow ? SLOW_PACE : 1 }),
    board,
    () => {
      finished = session;
      session = undefined;
    },
    { keyboard }
  );
  session.start();
  if (keyboard) board.canvas.focus();
  track(EVENTS.gameStart);
  if (isMuted()) track(EVENTS.startSoundOff);
  if (keyboard) track(EVENTS.startKeyboardPlay);
  if (slow) track(EVENTS.startSlowPace);
}

window.addEventListener("load", () => {
  preloadAssets();
  preloadSounds();
  // Only the game page has a sound slot in its bottom bar.
  document
    .querySelector("[data-sound-slot]")
    .appendChild(createMuteButton("site-button hud-button"));
  renderStart();
});

window.addEventListener("resize", () => {
  (session ?? finished)?.resize();
  sizeStart();
});

// On the game over screen the session has stopped listening.
document.addEventListener("keydown", (e) => {
  if (!document.getElementById("end")) return;
  if (e.key === "Escape") backToStart();
  else if (e.key.toLowerCase() === "m" && !e.repeat) {
    if (!(e.metaKey || e.ctrlKey || e.altKey)) toggleMuted();
  }
});
