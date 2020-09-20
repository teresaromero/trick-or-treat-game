let game;
let canvas;
let items;
let itemWidth = 50;
let itemHeight = 50;

window.onload = function () {
  renderIntro();
};

window.onresize = function () {
  if (canvas) {
    canvas.width = document.getElementById("main-vp").clientWidth * 0.9;
    canvas.height = document.getElementById("main-vp").clientHeight * 0.8;
  }
};

function startGame(e) {
  e.preventDefault();
  if (!game) {
    document.getElementById("intro").remove();
    canvas = renderCanvas();
    game = new Game(canvas);

    renderControls();
    document.getElementById("pointCount").innerHTML = game.points;
    document.getElementById("lifeCount").innerHTML = game.lifes;

    function init() {
      const expired = canvas.move();
      if (expired) {
        game.lifes = 1;
        if (game.lifes === 0) return endGame();
      }
      canvas.draw();
      game.animation = window.requestAnimationFrame(init);
    }

    function endGame() {
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
          }

          if (game.points <= 0 || game.lifes <= 0) endGame();
        }
      },
      false
    );

    document.getElementById("pause").addEventListener(
      "click",
      (e) => {
        if (game.pause) {
          game.pause = false;
          game.animation = window.requestAnimationFrame(init);
          game.generateItems();
          document.getElementById("pause").innerHTML = "⏸";
        } else {
          game.pause = true;
          clearInterval(game.interval);
          window.cancelAnimationFrame(game.animation);
          document.getElementById("pause").innerHTML = "▶️";
        }
      },
      false
    );
  }
}
