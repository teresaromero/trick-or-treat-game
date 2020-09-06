class Item {
  constructor({
    canvas,
    game,
    width = itemWidth,
    height = itemHeight,
    x = 0,
    y = 0,
    gravity,
    wind = 0,
    src,
    id,
    points,
    lifes,
    faux = false,
  }) {
    this.game = game;
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
    this.faux = faux;
  }

  move() {
    this.x += this.wind;
    this.y += this.gravity;
    if (this.y > this.canvas.canvas.height && !this.faux) endGame();
  }

  draw() {
    this.ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
  }
}
