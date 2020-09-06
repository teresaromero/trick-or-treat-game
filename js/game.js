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
