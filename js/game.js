class Game {
  constructor(canvas, lifes = 3, points = 0) {
    this._lifes = lifes;
    this._points = points;
    this.canvas = canvas;
    this._paused = false;
    this._animation = undefined;
    this._interval = undefined;
    this._ms = 1000;
  }

  set ms(ms) {
    this._ms = ms;
  }

  get ms() {
    return this._ms;
  }

  set interval(callback) {
    this._interval = callback;
  }

  get interval() {
    return this._interval;
  }

  set animation(a) {
    this._animation = a;
  }

  get animation() {
    return this._animation;
  }

  set pause(value) {
    this._pause = value;
  }

  get pause() {
    return this._pause;
  }

  get lifes() {
    return this._lifes;
  }

  set lifes(l) {
    this._lifes -= l;
    document.getElementById("lifeCount").innerHTML = this.lifes;
  }

  get points() {
    return this._points;
  }

  set points(p) {
    this._points += p;
    document.getElementById("pointCount").innerHTML = this.points;
  }

  generateItems() {
    this.interval = setInterval(() => {
      const faux = Math.random() >= 0.8;
      this.canvas.newItem(faux);
    }, this.ms);
  }
}
