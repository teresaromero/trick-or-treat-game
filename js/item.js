// A falling thing on the board: a pumpkin or a faux item.
class Item {
  constructor({ x = 0, y = 0, w, h, img, points, faux, gravity, wind }) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.img = img;
    this.points = points;
    this.faux = faux;
    this.gravity = gravity;
    this.wind = wind;
  }
}
