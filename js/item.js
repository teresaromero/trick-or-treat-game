class Item {
  constructor({
    w = 50,
    h = 50,
    x = 0,
    y = 0,
    src,
    points,
    lifes,
    faux = false,
  }) {
    this._w = w;
    this._h = h;
    this._x = x;
    this._y = y;
    this._gravity = 1;
    this._wind = 2;
    this._img = new Image(this.w, this.h);
    this._img.src = src;
    this._points = points;
    this._lifes = lifes;
    this._faux = faux;
  }

  get x() {
    return this._x;
  }

  set x(x) {
    this._x = x;
  }

  get y() {
    return this._y;
  }

  set y(y) {
    this._y = y;
  }
  set move(gravity) {
    this._y += gravity;
  }

  get w() {
    return this._w;
  }

  get h() {
    return this._h;
  }

  get points() {
    return this._points;
  }

  set points(points) {
    this._points = points;
  }

  get lifes() {
    return this._lifes;
  }

  set lifes(lifes) {
    this._lifes = lifes;
  }

  get faux() {
    return this._faux;
  }

  set faux(faux) {
    this._faux = faux;
  }

  get img() {
    return this._img;
  }

  set imgSrc(src) {
    this._img.src = src;
  }

  setXY(items, canvas) {
    const randomCoords = () => ({
      x: getRandom(this.w, canvas.width - this.w),
      y: getRandom(-this.h * 2, 0),
    });
    const overlaps = (coords) =>
      items.some(
        (item) =>
          Math.abs(coords.x - item.x) < this.w &&
          Math.abs(coords.y - item.y) < this.h
      );

    // Give up after a few tries on a crowded board and take the last spot.
    let coords = randomCoords();
    for (let tries = 0; tries < 50 && overlaps(coords); tries++) {
      coords = randomCoords();
    }

    this.x = coords.x;
    this.y = coords.y;
  }
}
