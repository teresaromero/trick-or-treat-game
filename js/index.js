const itemsAssets = [
  {
    id: 1,
    src: "./assets/img/001-owl.png",
    points: -1,
    lifes: 0,
  },
  {
    id: 2,
    src: "./assets/img/001.png",
    points: 1,
    lifes: 0,
  },
  {
    id: 3,
    src: "./assets/img/002.png",
    points: 1,
    lifes: 0,
  },
  {
    id: 4,
    src: "./assets/img/003.png",
    points: 1,
    lifes: 0,
  },
];

let game;
let canvas;
let items;

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
    items = itemsAssets.map((i) => {
      const x = getRandom(0, canvas.canvas.width);
      const y = getRandom(-20, 0);
      return new Item({ canvas, ...i, x });
    });
    game = new Game(canvas, items);

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
  console.log("click");
  if (game.paused) {
    game.unpause();
    document.getElementById("pause").innerHTML = "⏸";
  } else {
    game.pause();
    document.getElementById("pause").innerHTML = "▶️";
  }
}

function endGame() {
  game = undefined;
  canvas = undefined;
  items = undefined;
  document.getElementById("canvas").remove();
  document.getElementById("controls").remove();
  renderIntro();
}
