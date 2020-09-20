class Canvas {
  constructor() {
    this.canvas = document.getElementById("canvas");
    this.ctx = this.canvas.getContext("2d");
    this._items = [];
  }

  get width() {
    return this.canvas.width;
  }

  get height() {
    return this.canvas.height;
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let i = 0; i <= this.items.length - 1; i++) {
      this.ctx.drawImage(
        this.items[i].img,
        this.items[i].x,
        this.items[i].y,
        this.items[i].w,
        this.items[i].h
      );
    }
  }

  move() {
    for (let i = 0; i <= this.items.length - 1; i++) {
      this.items[i].move = this.items[i].gravity;

      if (
        this.items[i].x + this.items[i].wind >
          this.canvas.width - this.items[i].w ||
        this.items[i].x + this.items[i].wind < this.items[i].w
      ) {
        this.items[i].wind = -this.items[i].wind;
      }
      this.items[i].x += this.items[i].wind;

      // condition for ending game, a non faux object cross Y limit
      if (this.items[i].y > this.canvas.height && !this.items[i].faux) {
        this.delete = i;
        return true;
      }
    }
  }

  get items() {
    return this._items;
  }

  get itemsCount() {
    return this._items.length;
  }

  set add(item) {
    this._items.push(item);
  }
  set delete(i) {
    this.items.splice(i, 1);
  }

  checkClick(e) {
    e.preventDefault();
    const { offsetX, offsetY } = e;

    let clicked;
    for (let i = 0; i <= this.items.length - 1; i++) {
      const { x, y, points, lifes, w, h } = this.items[i];
      if (
        offsetX >= x &&
        offsetX <= x + w &&
        offsetY >= y &&
        offsetY <= y + h
      ) {
        clicked = this.items[i];
        this.delete = i;
        break;
      }
    }
    return clicked;
  }

  newItem({ faux = false, w = 50, h = 50, wind = 0, gravity = 1 }) {
    const baseItem = getAsset(faux);
    const newItem = new Item({ w, h });
    newItem.faux = baseItem.faux;
    newItem.imgSrc = baseItem.src;
    newItem.points = baseItem.points;
    newItem.lifes = baseItem.lifes;
    newItem.setXY(this.items, this.canvas);

    newItem.gravity = gravity;
    newItem.wind = wind;

    this.add = newItem;
  }
}
