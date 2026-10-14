// Player-level driver for the game, running the real index.html in jsdom.
//
// Specs talk only to this driver: they click what a player clicks, let time
// pass, and read what a player sees (HUD text, screens, what is drawn on the
// canvas). Every markup or implementation assumption lives in this file, so
// a refactor of js/ should only ever require changes here, never in the specs.

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";
import FakeTimers from "@sinonjs/fake-timers";
import { queryByRole, getByRole } from "@testing-library/dom";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// index.html with CDN tags dropped and local scripts inlined in page order.
function pageHtml() {
  return readFileSync(join(ROOT, "index.html"), "utf8")
    .replace(/<script[^>]*src="https?:[^"]*"[^>]*>\s*<\/script>/g, "")
    .replace(/<link[^>]*href="https?:[^"]*"[^>]*\/?>/g, "")
    .replace(
      /<script src="\.\/(js\/[\w-]+\.js)"[^>]*>\s*<\/script>/g,
      (_, path) => `<script>${readFileSync(join(ROOT, path), "utf8")}</script>`
    );
}

// Small seeded PRNG so "random" games are reproducible.
export function seeded(seed = 1) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function toRandom(random) {
  if (typeof random === "function") return random;
  if (typeof random === "number") return () => random;
  return seeded(1);
}

// A 2D context that records what gets drawn. A frame starts at each full
// clearRect, so `lastFrame` is what is currently on screen.
function recordingContext() {
  const ctx = {
    lastFrame: [],
    pending: [],
    clearRect() {
      ctx.pending = [];
      ctx.lastFrame = ctx.pending;
    },
    drawImage(img, x, y, w, h) {
      ctx.pending.push({ src: img.src, x, y, w, h });
    },
  };
  return ctx;
}

export async function openGame({
  random,
  viewport = { width: 1000, height: 400 },
} = {}) {
  let rng = toRandom(random);
  let clock;
  const contexts = new WeakMap();

  const dom = new JSDOM(pageHtml(), {
    url: "http://localhost/",
    runScripts: "dangerously",
    pretendToBeVisual: true,
    beforeParse(window) {
      clock = FakeTimers.withGlobal(window).install({
        toFake: [
          "setTimeout",
          "clearTimeout",
          "setInterval",
          "clearInterval",
          "requestAnimationFrame",
          "cancelAnimationFrame",
        ],
      });
      window.Math.random = () => rng();
      window.feather = { replace() {} };
      window.HTMLCanvasElement.prototype.getContext = function () {
        if (!contexts.has(this)) contexts.set(this, recordingContext());
        return contexts.get(this);
      };
      for (const [prop, size] of [
        ["clientWidth", viewport.width],
        ["clientHeight", viewport.height],
      ]) {
        Object.defineProperty(window.HTMLElement.prototype, prop, {
          configurable: true,
          get() {
            return this.id === "main-vp" ? size : 0;
          },
        });
      }
    },
  });

  const { window } = dom;
  const { document } = window;
  if (document.readyState !== "complete") {
    await new Promise((resolve) => window.addEventListener("load", resolve));
  }

  const nav = () => document.querySelector("nav");
  const canvasEl = () => document.querySelector("canvas");

  const hudNumber = (emoji) => {
    for (const li of nav().querySelectorAll("li")) {
      const match = li.textContent.match(new RegExp(`(-?\\d+)\\s*${emoji}`));
      if (match) return Number(match[1]);
    }
    return undefined;
  };

  const pauseControl = () =>
    [...nav().querySelectorAll("li span")].find((el) =>
      ["⏸", "▶️"].includes(el.textContent.trim())
    );

  const g = {

    setRandom(next) {
      rng = toRandom(next);
    },

    screen() {
      if (queryByRole(document.body, "button", { name: "Play Again!" }))
        return "game over";
      if (queryByRole(document.body, "button", { name: "Go!" }))
        return "intro";
      if (canvasEl()) return "playing";
      return "unknown";
    },

    start() {
      getByRole(document.body, "button", { name: "Go!" }).click();
    },

    playAgain() {
      getByRole(document.body, "button", { name: "Play Again!" }).click();
    },

    hasCanvas() {
      return Boolean(canvasEl());
    },

    hasHud() {
      return g.score() !== undefined || g.lives() !== undefined;
    },

    score() {
      return hudNumber("⭐️");
    },

    lives() {
      return hudNumber("🧡");
    },

    finalScore() {
      const match = document.body.textContent.match(/You scored (-?\d+)/);
      return match ? Number(match[1]) : undefined;
    },

    canvasSize() {
      const el = canvasEl();
      return { width: el.width, height: el.height };
    },

    // What is on screen right now, in draw order (later = on top).
    visibleItems() {
      const el = canvasEl();
      if (!el) return [];
      return el
        .getContext("2d")
        .lastFrame.map(({ src, x, y, w, h }) => ({
          kind: /-faux\.png$/.test(src) ? "faux" : "pumpkin",
          x,
          y,
          w,
          h,
        }));
    },

    clickAt(x, y) {
      const event = new window.MouseEvent("click", {
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(event, "offsetX", { value: x });
      Object.defineProperty(event, "offsetY", { value: y });
      canvasEl().dispatchEvent(event);
    },

    click(item) {
      g.clickAt(item.x + item.w / 2, item.y + item.h / 2);
    },

    advanceFrames(n = 1) {
      for (let i = 0; i < n; i++) clock.runToFrame();
    },

    advanceTime(ms) {
      clock.tick(ms);
    },

    // Advance frame by frame until `predicate()` holds. Fails loudly instead
    // of hanging when it never does.
    advanceUntil(predicate, { maxFrames = 5000 } = {}) {
      for (let i = 0; i < maxFrames; i++) {
        if (predicate()) return;
        clock.runToFrame();
      }
      if (!predicate()) {
        throw new Error(`condition not met within ${maxFrames} frames`);
      }
    },

    togglePause() {
      pauseControl().click();
    },

    isPaused() {
      return pauseControl().textContent.trim() === "▶️";
    },

    close() {
      clock.uninstall();
      window.close();
    },
  };

  return g;
}
