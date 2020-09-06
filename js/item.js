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
