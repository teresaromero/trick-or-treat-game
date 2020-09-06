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

const getRandom = (min, max) => {
  return Math.floor(Math.random() * (max - min)) + min;
};

class Canvas {
  constructor(width = 600, height = 500) {
    this.canvas = document.getElementById("canvas");
    this.ctx = this.canvas.getContext("2d");
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}

class Game {
  constructor(canvas, items = [], lifes = 3, points = 0) {
    this.lifes = lifes;
    this.points = points;
    this.interval;
    this.canvas = canvas;
    this.items = items;
    this.paused = false;
  }

  start() {
    this.interval = setInterval(() => {
      this.items.forEach((item) => {
        item.move();
      });
      this.canvas.clear();
      this.items.forEach((item) => {
        item.draw();
      });
    }, 100);
  }

  pause() {
    clearInterval(this.interval);
    this.paused = true;
  }

  unpause() {
    this.paused = false;
    this.start();
  }

  end() {
    this.canvas.clear();
    clearInterval(this.interval);
    this.items = [];
  }

  checkClick(e) {
    if (!this.paused) {
      const { offsetX, offsetY, ...rest } = e;

      const itemsSet = new Set(this.items);
      const clicked = this.items.filter((i) => {
        const { x, y, points, lifes, width, height } = i;
        const xMin = x - width;
        const xMax = x + width;
        const yMin = y - height;
        const yMax = y + height;

        const isClicked =
          offsetX <= xMax &&
          offsetX >= xMin &&
          offsetY <= yMax &&
          offsetY >= yMin;

        return isClicked;
      });

      if (clicked.length !== 0) {
        clicked.forEach((i) => {
          this.points += i.points;
          this.lifes += i.lifes;
          document.getElementById("pointCount").innerHTML = this.points;
          document.getElementById("lifeCount").innerHTML = this.lifes;

          itemsSet.delete(i);
        });
      } else {
        this.lifes -= 1;
        document.getElementById("lifeCount").innerHTML = this.lifes;
      }

      this.items = [...itemsSet];
      if (this.lifes === 0) endGame();
    }
  }
}

class Item {
  constructor({
    canvas,
    width = 60,
    height = 60,
    x = 0,
    y = 0,
    gravity = 5,
    wind = 0,
    src,
    id,
    points,
    lifes,
  }) {
    this.canvas = canvas;
    this.ctx = canvas.ctx;
    this.width = width;
    this.height = height;
    this.x = x;
    this.y = y;
    this.gravity = gravity;
    this.wind = wind;
    this.img = new Image(width, height);
    this.img.src = src;
    this.img.id = id;
    this.img.class = "game-item";
    this.id = id;
    this.points = points;
    this.lifes = lifes;
  }

  move() {
    this.x += this.wind;
    this.y += this.gravity;
  }

  draw() {
    // this.ctx.fillRect(this.x, this.y, this.width, this.height);
    this.ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
  }
}

const viewport = document.getElementById("main-vp");
const pointsView = document.getElementById("points");
const lifesView = document.getElementById("lifes");

let game;
let canvas;
let items;

window.onload = function () {
  document.getElementById("start").onclick = () => {
    startGame();
  };
};

window.onresize = function () {
  canvas.width = viewport.clientWidth * 0.9;
  canvas.height = viewport.clientHeight * 0.8;
};

function renderModal() {
  const modal = document.createElement("div");
  modal.setAttribute("id", "end-modal");
  modal.setAttribute("class", "modal-dialog modal-dialog-centered fade");
  modal.setAttribute("tabindex", "-1");

  const dialog = document.createElement("div");
  dialog.setAttribute("class", "modal-dialog");
  modal.appendChild(dialog);

  const content = document.createElement("div");
  content.setAttribute("class", "modal-content");

  dialog.appendChild(content);

  const header = document.createElement("div");
  header.setAttribute("class", "modal-header");

  const body = document.createElement("div");
  body.setAttribute("class", "modal-body");

  const footer = document.createElement("div");
  footer.setAttribute("class", "modal-footer");

  content.appendChild(header);
  content.appendChild(body);
  content.appendChild(footer);

  document.body.insertBefore(modal, document.getElementById("main-vp"));
}

function renderCanvas() {
  const canvas = document.createElement("canvas");
  canvas.setAttribute("id", "canvas");
  canvas.setAttribute("width", viewport.clientWidth * 0.9);
  canvas.setAttribute("height", viewport.clientHeight * 0.8);
  document.querySelector("main").appendChild(canvas);
}

function renderControls() {
  const group = document.createElement("ul");
  group.setAttribute("class", "nav justify-content-center");
  group.setAttribute("id", "controls");

  // -----

  const points = document.createElement("li");
  points.setAttribute("id", "points");
  points.setAttribute("class", "nav-item");

  const pointSpan = document.createElement("span");
  pointSpan.setAttribute("class", "nav-link text-nowrap");

  const pointsCount = document.createElement("span");
  pointsCount.setAttribute("id", "pointCount");
  pointsCount.innerHTML = "0";
  pointSpan.appendChild(pointsCount);

  const iconStar = document.createElement("span");
  iconStar.innerHTML = "⭐️";
  pointSpan.appendChild(iconStar);
  points.appendChild(pointSpan);

  // -----

  const lifes = document.createElement("li");
  lifes.setAttribute("id", "lifes");
  lifes.setAttribute("class", "nav-item");

  const lifeSpan = document.createElement("span");
  lifeSpan.setAttribute("class", "nav-link text-nowrap");

  const lifesCount = document.createElement("span");
  lifesCount.setAttribute("id", "lifeCount");
  lifesCount.innerHTML = "0";
  lifeSpan.appendChild(lifesCount);

  const iconHeart = document.createElement("span");
  iconHeart.innerHTML = "❤️";
  lifeSpan.appendChild(iconHeart);
  lifes.appendChild(lifeSpan);

  // -----

  const pause = document.createElement("li");
  pause.setAttribute("class", "nav-item");
  pause.onclick = (e) => pauseGame();
  const iconPause = document.createElement("span");
  iconPause.setAttribute("class", "nav-link");
  iconPause.setAttribute("type", "button");
  iconPause.setAttribute("id", "pause");
  iconPause.innerHTML = "⏸";
  pause.appendChild(iconPause);

  group.appendChild(points);
  group.appendChild(lifes);
  group.appendChild(pause);

  document.querySelector("nav").appendChild(group);
}

function startGame() {
  if (!game) {
    document.getElementById("start").hidden = true;
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
}
