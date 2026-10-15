let game;
let canvas;

window.onload = function () {
  renderIntro();
};

window.onresize = function () {
  if (canvas) {
    const { width, height } = getCanvasSize();
    canvas.resize(width, height);
  }
};

function startGame(e) {
  e.preventDefault();
  if (!game) {
    document.getElementById("intro").remove();
    // Controls first: they make the header taller, which the canvas must allow for.
    renderControls();
    canvas = renderCanvas();
    game = new Game(canvas);

    document.getElementById("pointCount").innerHTML = game.points;
    document.getElementById("lifeCount").innerHTML = game.lifes;

    function init() {
      const expired = canvas.move();
      if (expired) {
        for (let i = 0; i < expired; i++) game.lifes = 1;
        if (game.lifes <= 0) return endGame();
      }
      canvas.draw();
      game.animation = window.requestAnimationFrame(init);
    }

    function pauseGame() {
      game.pause = true;
      clearInterval(game.interval);
      window.cancelAnimationFrame(game.animation);
      document.getElementById("pause").innerHTML = "▶️";
    }

    function resumeGame() {
      game.pause = false;
      game.animation = window.requestAnimationFrame(init);
      game.generateItems();
      document.getElementById("pause").innerHTML = "⏸";
    }

    // Frames stop in a hidden tab but timers don't, so items would pile up.
    function onVisibilityChange() {
      if (document.hidden && !game.pause) pauseGame();
    }
    document.addEventListener("visibilitychange", onVisibilityChange);

    function endGame() {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      clearInterval(game.interval);
      window.cancelAnimationFrame(game.animation);
      document.getElementById("canvas").remove();
      document.getElementById("controls").remove();
      const points = game.points;
      game = undefined;
      canvas = undefined;
      renderEndGame(points);
    }

    game.animation = window.requestAnimationFrame(init);
    game.generateItems();

    document.getElementById("canvas").addEventListener(
      "click",
      (e) => {
        if (!game.pause) {
          const clicked = canvas.checkClick(e);
          if (clicked) {
            game.points = clicked.points;
            game.lifes = clicked.lifes;
            if (game.lifes <= 0) endGame();
          }
        }
      },
      false
    );

    document.getElementById("pause").addEventListener(
      "click",
      (e) => {
        if (game.pause) resumeGame();
        else pauseGame();
      },
      false
    );
  }
}
