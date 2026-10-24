// Anonymous counts of a few game actions, sent to GoatCounter as events.
// Never attach scores or anything else: privacy.html promises they stay here.
const EVENTS = Object.freeze({
  gameStart: "game-start",
  gameOver: "game-over",
  startSoundOff: "start-sound-off",
  startKeyboardPlay: "start-keyboard-play",
  startSlowPace: "start-slow-pace",
  pause: "pause",
  quitPrompt: "quit-prompt",
  quitKeepPlaying: "quit-keep-playing",
  quitConfirmed: "quit-confirmed",
  soundOn: "sound-on",
  soundOff: "sound-off",
});

// The counter may be blocked, still loading or off (localhost): the game
// works without it.
function track(name) {
  try {
    window.goatcounter?.count?.({ path: name, event: true });
  } catch (e) {}
}
