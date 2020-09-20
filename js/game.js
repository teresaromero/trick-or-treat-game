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
    this._ms -= ms;
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
    if (this.points > 40 && this.points % 5 === 0) {
      this.ms = 100;
    }
  }

  generateItems() {
    this.interval = setInterval(() => {
      const faux = Math.random() >= 0.8;
      let wind;
      let gravity;

      if (this.points > 30) {
        wind = Math.random() >= 0.5 ? 1.5 : -1.5;
        gravity = 1.5;
      } else if (this.points <= 30 && this.points > 20) {
        wind = Math.random() >= 0.5 ? 1 : -1;
        gravity = 1.5;
      } else if (this.points <= 20 && this.points > 10) {
        wind = 0;
        gravity = 1.5;
      } else {
        wind = 0;
        gravity = 1;
      }

      this.canvas.newItem({ faux, wind, gravity });
    }, this.ms);
  }
}
