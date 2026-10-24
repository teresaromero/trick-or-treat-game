// One running game: wires the state (Game) and the board (Board) to the
// screen, the clock and the player's input.
class Session {
  // Arrow keys to the way the keyboard focus moves.
  static DIRECTIONS = {
    arrowleft: "left",
    arrowright: "right",
    arrowup: "up",
    arrowdown: "down",
  };

  // `keyboard` lets the arrow keys pick an item and Enter catch it.
  constructor(game, board, onEnd, { keyboard = false } = {}) {
    this.game = game;
    this.board = board;
    this.onEnd = onEnd;
    this.keyboard = keyboard;
    this.paused = false;
    this.over = false;
    this.quitting = false;
    this.pausedBeforeQuit = false;
    this.animation = undefined;
    this.interval = undefined;
    this.lastFrameTime = undefined;
    this.opening = undefined;
    this.opened = false;

    // Bound once, so end() can remove the very same listeners.
    this.frame = this.frame.bind(this);
    this.togglePause = this.togglePause.bind(this);
    this.onPointerDown = this.onPointerDown.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onVisibilityChange = this.onVisibilityChange.bind(this);
  }

  start() {
    updateScore(this.game.points, this.game.level + 1, this.game.levelProgress);
    updateLives(this.game.lives);
    announce("Game started");

    document.addEventListener("visibilitychange", this.onVisibilityChange);
    document.addEventListener("keydown", this.onKeyDown);
    this.board.canvas.addEventListener("pointerdown", this.onPointerDown);
    startMusic();
    document.getElementById("pause").addEventListener("click", this.togglePause);

    this.animation = window.requestAnimationFrame(this.frame);
    this.startOpening();
  }

  resize() {
    const { width, height } = getCanvasSize();
    this.board.resize(width, height);
    // Resizing clears the canvas, and no frame comes while paused or asking
    // to quit.
    this.board.draw();
    resizeEffects(width, height);
  }

  // A game opens with fog, then the first pumpkin drops out of it. The spawn
  // interval only starts after that, so it doesn't leave the board empty
  // for a whole interval.
  startOpening() {
    if (prefersReducedMotion()) return this.openBoard();
    renderSmoke();
    this.opening = setTimeout(() => this.openBoard(), SMOKE_MS);
  }

  openBoard() {
    this.opening = undefined;
    this.opened = true;
    this.board.spawn({ ...this.game.nextSpawn(), depth: FIRST_SPAWN_DEPTH });
    this.startSpawner();
  }

  // The spawn timer keeps the interval it was created with, so a level-up
  // has to restart it.
  startSpawner() {
    this.interval = setInterval(
      () => this.board.spawn(this.game.nextSpawn()),
      this.game.spawnMs
    );
  }

  frame(time) {
    const frames =
      this.lastFrameTime === undefined
        ? 1
        : Math.min((time - this.lastFrameTime) / FRAME_MS, MAX_FRAMES_PER_STEP);
    this.lastFrameTime = time;

    const lost = this.board.step(frames);
    // The rim never rests on nothing: it goes to the lowest item.
    if (this.keyboard && !this.board.focused) this.board.focusLowest();
    if (lost.length) {
      for (const pumpkin of lost) {
        this.game.loseLife();
        updateLives(this.game.lives);
        this.game.breakStreak();
        renderPopup("lost", "", pumpkin.x + pumpkin.w / 2, this.board.height, {
          icon: HEART_CRACK_ICON,
        });
      }
      flinchBoard();
      if (this.game.isOver) return this.end();
    }
    this.board.draw();
    this.animation = window.requestAnimationFrame(this.frame);
  }

  // React on press, not on release: items keep falling while the button is down.
  onPointerDown(e) {
    if (this.paused || this.over) return;
    e.preventDefault();
    const clicked = this.board.itemAt(e.offsetX, e.offsetY);
    if (clicked) this.catchItem(clicked);
  }

  // Scores an item the board has already taken off, by click or by Enter.
  catchItem(clicked) {
    const x = clicked.x + clicked.w / 2;
    const y = clicked.y + clicked.h / 2;
    playSound(clicked.faux ? "error" : "point");
    const before = this.game.points;
    this.addPoints(clicked.points);
    if (clicked.faux) {
      this.game.hitFaux();
      // At 0 points nothing was taken, so there is nothing to show.
      if (this.game.points < before) renderPopup("faux", "−1", x, y);
    } else {
      this.showCatch(x, y, this.game.catchPumpkin());
      if (this.game.healOnStreak()) this.showHeal(x, y);
    }
  }

  addPoints(delta) {
    const levelsGained = this.game.addPoints(delta);
    if (levelsGained) {
      this.restartSpawner();
      playSound("levelUp");
      renderLevelUp(this.game.level + 1, LEVELS[this.game.level].message);
    }
    updateScore(
      this.game.points,
      this.game.level + 1,
      this.game.levelProgress,
      delta,
      levelsGained ? LEVELS[this.game.level].message : ""
    );
  }

  restartSpawner() {
    if (this.paused || !this.opened) return;
    clearInterval(this.interval);
    this.startSpawner();
  }

  // +1 for a pumpkin; from 5 in a row it gets a flame.
  showCatch(x, y, streak) {
    const onStreak = streak >= STREAK_FROM;
    renderPopup("catch", "+1", x, y, {
      icon: onStreak ? FLAME_ICON : "",
      size: Math.min(streak, 20),
    });
  }

  // A heart comes back: the hearts refill and a heart rises from the catch.
  showHeal(x, y) {
    updateLives(this.game.lives);
    renderPopup("heal", "", x, y - this.board.itemSize / 2, {
      icon: HEART_ICON,
    });
  }

  onKeyDown(e) {
    if (e.repeat) return;
    // Cmd/Ctrl/Alt combos belong to the browser (print, minimise, ...).
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const key = e.key.toLowerCase();
    if (key === "escape") {
      if (this.over) return;
      if (this.quitting) this.keepPlaying();
      else this.askQuit();
    } else if (key === "m") {
      toggleMuted();
    } else if (this.quitting) {
      // Only Esc counts while the question is open.
      return;
    } else if (this.keyboard && Session.DIRECTIONS[key]) {
      this.moveFocus(e, Session.DIRECTIONS[key]);
    } else if (this.keyboard && key === "enter") {
      this.catchFocused(e);
    } else if (key === "p") {
      this.togglePause();
    } else if (key === " ") {
      // A focused button already toggles on Space by itself.
      if (e.target.tagName === "BUTTON") return;
      e.preventDefault();
      this.togglePause();
    }
  }

  // A focused button or link keeps its own Enter and arrows.
  keyIsForControl(e) {
    return Boolean(e.target.closest?.("button, a"));
  }

  moveFocus(e, direction) {
    if (this.paused || this.over || this.keyIsForControl(e)) return;
    e.preventDefault();
    const item = this.board.moveFocus(direction);
    if (!item) return;
    announce(item.faux ? "Fake item" : "Pumpkin");
    this.board.draw();
  }

  catchFocused(e) {
    if (this.paused || this.over || this.keyIsForControl(e)) return;
    const item = this.board.focused;
    if (!item) return;
    e.preventDefault();
    this.board.remove(item);
    this.catchItem(item);
    this.board.focusLowest();
    this.board.draw();
  }

  // Frames stop in a hidden tab but timers don't, so items would pile up.
  onVisibilityChange() {
    if (document.hidden && !this.paused) this.pause();
  }

  togglePause() {
    if (this.over || this.quitting) return;
    if (this.paused) {
      this.resume();
    } else {
      track(EVENTS.pause);
      this.pause();
    }
  }

  // Freezes the clock without showing anything.
  hold() {
    this.paused = true;
    clearTimeout(this.opening);
    clearSmoke();
    clearInterval(this.interval);
    window.cancelAnimationFrame(this.animation);
    pauseMusic();
  }

  pause() {
    this.hold();
    this.focusBeforePause = document.activeElement;
    setPauseIcon(document.getElementById("pause"), true);
    renderPausedOverlay(() => this.resume()).focus();
  }

  resume() {
    // The paused overlay can still be reached under the quit question.
    if (this.quitting) return;
    this.paused = false;
    this.lastFrameTime = undefined;
    this.animation = window.requestAnimationFrame(this.frame);
    // Still in the fog: it plays again from the start.
    if (this.opened) this.startSpawner();
    else this.startOpening();
    startMusic();
    const pauseButton = document.getElementById("pause");
    setPauseIcon(pauseButton, false);
    const overlay = document.getElementById("paused");
    // Give focus back only if the overlay had it, so a click elsewhere stays put.
    const hadFocus = overlay && document.activeElement === overlay;
    overlay?.remove();
    if (hadFocus) {
      const back = this.focusBeforePause;
      // Where focus was before pausing, or the Pause button if that is gone.
      (back?.isConnected && back !== document.body ? back : pauseButton).focus();
    }
  }

  // Esc holds the game while the player decides; cancelling puts it back as
  // it was, paused or not.
  askQuit() {
    track(EVENTS.quitPrompt);
    this.quitting = true;
    this.pausedBeforeQuit = this.paused;
    this.focusBeforeQuit = document.activeElement;
    if (!this.paused) this.hold();
    renderQuitPrompt(
      () => this.keepPlaying(),
      () => this.quit()
    );
  }

  keepPlaying() {
    track(EVENTS.quitKeepPlaying);
    this.quitting = false;
    document.getElementById("quit").remove();
    setBackgroundInert(false);
    if (!this.pausedBeforeQuit) this.resume();
    if (this.focusBeforeQuit?.isConnected) this.focusBeforeQuit.focus();
  }

  quit() {
    track(EVENTS.quitConfirmed);
    this.stop();
    this.onEnd();
    backToStart();
  }

  // Stops the loops and the listeners: the game is not running any more.
  stop() {
    document.removeEventListener("visibilitychange", this.onVisibilityChange);
    document.removeEventListener("keydown", this.onKeyDown);
    clearTimeout(this.opening);
    clearSmoke();
    clearInterval(this.interval);
    window.cancelAnimationFrame(this.animation);
    stopMusic();
    this.over = true;
  }

  // The board freezes right away so you see how you lost; the card comes
  // after a short beat.
  end() {
    track(EVENTS.gameOver);
    this.stop();
    document.getElementById("level-up")?.remove();
    document.getElementById("pause").disabled = true;

    const stats = this.game.stats;
    const previous = loadBest();
    const newBest = stats.score > previous;
    playSound(newBest ? "newBest" : "gameOver");
    setTimeout(() => {
      if (newBest) saveBest(stats.score);
      this.onEnd();
      renderEndGame({
        ...stats,
        best: Math.max(previous, stats.score),
        newBest,
      });
    }, GAME_OVER_BEAT_MS);
  }
}
