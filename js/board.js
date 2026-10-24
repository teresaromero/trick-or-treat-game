// The play area: owns the items and moves, draws, spawns and hit-tests them.
// It knows nothing about points, lives or levels.
class Board {
  // `width` and `height` are CSS pixels; the canvas backing store gets one
  // pixel per device pixel so sprites stay sharp on retina screens.
  constructor(canvas, width, height) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.items = [];
    // The item picked with the keyboard (keyboard play), wearing the rim.
    this.focused = undefined;
    this.setSize(width, height);

    // Rim colors come from the theme; the fallbacks cover a missing stylesheet.
    const theme = getComputedStyle(document.documentElement);
    const rim = (name, fallback, alpha) => {
      const color = theme.getPropertyValue(name).trim();
      return color
        ? `color-mix(in srgb, ${color} ${alpha * 100}%, transparent)`
        : fallback;
    };
    this.dangerRim = rim("--danger", "rgba(255, 59, 48, 0.9)", 0.9);
    this.moonRim = rim("--moon", "rgba(255, 241, 201, 0.55)", 0.55);
    this.focusRim = rim("--moon", "rgb(255, 241, 201)", 1);
  }

  // Side of an item: scales with the board so it is neither tiny on a big
  // monitor nor crowded on a phone.
  get itemSize() {
    const size = Math.min(this.width, this.height) * ITEM_SIZE_RATIO;
    return Math.round(Math.max(ITEM_SIZE_MIN, Math.min(size, ITEM_SIZE_MAX)));
  }

  setSize(width, height) {
    this.width = Math.floor(width);
    this.height = Math.floor(height);
    const ratio = window.devicePixelRatio || 1;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    // Assigning width or height resets the context, so the scale goes after.
    this.canvas.width = Math.round(this.width * ratio);
    this.canvas.height = Math.round(this.height * ratio);
    this.ctx.scale(ratio, ratio);
  }

  resize(width, height) {
    const oldWidth = this.width;
    const oldHeight = this.height;
    this.setSize(width, height);
    const scaleX = this.width / oldWidth;
    const scaleY = this.height / oldHeight;
    // Items keep their relative place, so a narrower board doesn't pile them
    // against the right edge or drop them below the new bottom.
    for (const item of this.items) {
      item.x = Math.max(0, Math.min(item.x * scaleX, this.width - item.w));
      item.y *= scaleY;
    }
  }

  // A moonlight rim keeps the dark sprites (cat, owl feet) readable at night.
  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    for (const item of this.items) {
      // Close to the fog line the rim turns red: still time to save it.
      const danger = item.y + item.h > this.height * DANGER_LINE;
      this.ctx.shadowColor = danger ? this.dangerRim : this.moonRim;
      this.ctx.shadowBlur = danger ? 12 : 6;
      this.ctx.drawImage(item.img, item.x, item.y, item.w, item.h);
      if (danger) this.drawDangerFrame(item);
    }
    if (this.focused) this.drawFocusRim(this.focused);
  }

  // A solid light frame, unlike the dashed danger one, so the picked item
  // reads on any sprite and without relying on color.
  drawFocusRim(item) {
    const { width, gap } = FOCUS_RIM;
    this.ctx.save();
    this.ctx.shadowBlur = 0;
    this.ctx.strokeStyle = this.focusRim;
    this.ctx.lineWidth = width;
    this.ctx.setLineDash([]);
    this.ctx.strokeRect(
      item.x - gap,
      item.y - gap,
      item.w + gap * 2,
      item.h + gap * 2
    );
    this.ctx.restore();
  }

  // A dashed frame says "in danger" without relying on the red alone.
  drawDangerFrame(item) {
    this.ctx.save();
    this.ctx.shadowBlur = 0;
    this.ctx.strokeStyle = this.dangerRim;
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([5, 4]);
    this.ctx.strokeRect(item.x, item.y, item.w, item.h);
    this.ctx.restore();
  }

  // `frames` is the time since the last step, in 60 Hz frames, so items
  // cover the same distance per second on any screen. Anything past the
  // bottom leaves the board; the pumpkins among them are returned so the
  // caller can charge a life and show where they fell.
  step(frames = 1) {
    const lost = [];
    for (const item of this.items) {
      item.y += item.gravity * frames;

      const dx = item.wind * frames;
      if (item.x + dx > this.width - item.w || item.x + dx < 0) {
        item.wind = -item.wind;
      }
      item.x += item.wind * frames;

      if (item.y > this.height && !item.faux) lost.push(item);
    }
    this.items = this.items.filter((item) => item.y <= this.height);
    this.dropFocusIfGone();
    return lost;
  }

  // Items that have come into view: the ones the keyboard can pick.
  get pickable() {
    return this.items.filter((item) => item.y + item.h > 0);
  }

  dropFocusIfGone() {
    if (this.focused && !this.items.includes(this.focused)) {
      this.focused = undefined;
    }
  }

  // The most urgent item is the lowest one.
  focusLowest() {
    this.focused = this.pickable.reduce(
      (low, item) => (!low || item.y > low.y ? item : low),
      undefined
    );
    return this.focused;
  }

  // Moves the focus to the next item that way ("left", "right", "up" or
  // "down"), or wraps round to the far side when there is none.
  moveFocus(direction) {
    const current = this.focused;
    if (!current || !this.items.includes(current)) return this.focusLowest();

    const axis = direction === "left" || direction === "right" ? "x" : "y";
    const other = axis === "x" ? "y" : "x";
    const sign = direction === "right" || direction === "down" ? 1 : -1;
    const others = this.pickable.filter((item) => item !== current);
    if (!others.length) return current;

    const ahead = others.filter((item) => (item[axis] - current[axis]) * sign > 0);
    const best = (items, cost) =>
      items.reduce((a, b) => (cost(b) < cost(a) ? b : a));
    this.focused = ahead.length
      ? best(
          ahead,
          (item) =>
            Math.abs(item[axis] - current[axis]) * 1000 +
            Math.abs(item[other] - current[other])
        )
      : best(others, (item) => sign * item[axis]);
    return this.focused;
  }

  // Takes an item off the board, as a catch does.
  remove(item) {
    const i = this.items.indexOf(item);
    if (i === -1) return undefined;
    this.items.splice(i, 1);
    this.dropFocusIfGone();
    return item;
  }

  // Removes and returns the item drawn on top at (x, y), if any.
  itemAt(x, y) {
    // Newest first: later items are drawn on top, so they are the ones seen.
    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      if (
        x >= item.x - HIT_SLOP &&
        x <= item.x + item.w + HIT_SLOP &&
        y >= item.y - HIT_SLOP &&
        y <= item.y + item.h + HIT_SLOP
      ) {
        return this.remove(item);
      }
    }
    return undefined;
  }

  spawn({ faux = false, wind = 0, gravity = 1, depth = SPAWN_DEPTH }) {
    const size = this.itemSize;
    const sprite = randomSprite(faux);
    const item = new Item({
      w: size,
      h: size,
      img: getImage(sprite.src),
      points: sprite.points,
      faux: sprite.faux,
      gravity,
      wind,
    });
    this.place(item, depth);
    this.items.push(item);
  }

  // A free spot above the board, so items enter from the top.
  place(item, depth) {
    const randomCoords = () => ({
      x: getRandom(0, this.width - item.w + 1),
      y: getRandom(-item.h * depth, 0),
    });
    const overlaps = (coords) =>
      this.items.some(
        (other) =>
          Math.abs(coords.x - other.x) < item.w &&
          Math.abs(coords.y - other.y) < item.h
      );

    // Give up after a few tries on a crowded board and take the last spot.
    let coords = randomCoords();
    for (let tries = 0; tries < 50 && overlaps(coords); tries++) {
      coords = randomCoords();
    }

    item.x = coords.x;
    item.y = coords.y;
  }
}
