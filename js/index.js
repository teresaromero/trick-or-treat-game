let game;
let canvas;
let items;
let gravity = 5;
let itemWidth = 60;
let itemHeight = 60;

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
    renderCanvas();
    canvas = new Canvas();
    game = new Game(canvas);

    game.addItems();

    renderControls();
    document.getElementById("pointCount").innerHTML = game.points;
    document.getElementById("lifeCount").innerHTML = game.lifes;

    game.start();

    document.getElementById("canvas").addEventListener(
      "click",
      (e) => {
        game.checkClick(e);
      },
      false
    );
  }
}

function pauseGame() {
  if (game.paused) {
    game.unpause();
    document.getElementById("pause").innerHTML = "⏸";
  } else {
    game.pause();
    document.getElementById("pause").innerHTML = "▶️";
  }
}

function endGame() {
  game.end();
  const score = game.points;
  const lifes = game.lifes;
  game = undefined;
  canvas = undefined;
  items = undefined;
  gravity = 5;
  document.getElementById("canvas").remove();
  document.getElementById("controls").remove();
  renderEndGame(score, lifes);
}
