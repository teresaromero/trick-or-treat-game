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
function pageHtml(sound) {
  return readFileSync(join(ROOT, "index.html"), "utf8")
    .replace(/<script[^>]*src="https?:[^"]*"[^>]*>\s*<\/script>/g, "")
    .replace(/<link[^>]*href="https?:[^"]*"[^>]*\/?>/g, "")
    .replace(
      /<script src="\.\/(js\/[\w-]+\.js)"[^>]*>\s*<\/script>/g,
      (_, path) => {
        const code = readFileSync(join(ROOT, path), "utf8");
        // The shipped game has its sound switched off; specs turn it on.
        const patched = sound
          ? code.replace("SOUND_ENABLED = false", "SOUND_ENABLED = true")
          : code;
        return `<script>${patched}</script>`;
      }
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
  const saved = [];
  const ctx = {
    lastFrame: [],
    pending: [],
    lastStrokes: [],
    pendingStrokes: [],
    dash: [],
    scale() {},
    save() {
      saved.push(ctx.dash);
    },
    restore() {
      ctx.dash = saved.pop() ?? [];
    },
    setLineDash(dash) {
      ctx.dash = dash;
    },
    // The frames that outline a rectangle, dashed or solid.
    strokeRect(x, y, w, h) {
      ctx.pendingStrokes.push({ x, y, w, h, dashed: ctx.dash.length > 0 });
    },
    clearRect() {
      ctx.pending = [];
      ctx.lastFrame = ctx.pending;
      ctx.pendingStrokes = [];
      ctx.lastStrokes = ctx.pendingStrokes;
    },
    drawImage(img, x, y, w, h) {
      ctx.pending.push({
        src: img.src,
        x,
        y,
        w,
        h,
        shadowColor: ctx.shadowColor,
      });
    },
  };
  return ctx;
}

export async function openGame({
  random,
  viewport = { width: 1000, height: 400 },
  // Time between screen refreshes: 16 is a 60 Hz screen, 8 a 120 Hz one.
  frameMs = 16,
  // Whether the visit counter's script is there (visitors with an ad blocker
  // play without it).
  counter = true,
  // Whether the visitor asked their system for less motion.
  reducedMotion = false,
  // Whether the game has its sound switched on (the shipped one does not).
  sound = true,
  // The accessibility switches on the start board, as a returning visitor
  // left them.
  keyboardPlay = false,
  slowPace = false,
  // Whether the browser lets the page keep anything (private windows and
  // strict settings don't).
  storage = true,
  // Whether the visitor's main input is a finger (a phone or a tablet).
  touchDevice = false,
} = {}) {
  let rng = toRandom(random);
  let clock;
  let tabHidden = false;
  const contexts = new WeakMap();
  const requestedImages = new Set();
  // jsdom does not play media: the stubbed elements are tracked here.
  const playing = new Set();
  const heard = [];
  // What the visit counter was told, by event name.
  const counted = [];

  const dom = new JSDOM(pageHtml(sound), {
    url: "http://localhost/",
    runScripts: "dangerously",
    pretendToBeVisual: true,
    beforeParse(window) {
      if (!storage) {
        Object.defineProperty(window, "localStorage", {
          get() {
            throw new window.DOMException("blocked", "SecurityError");
          },
        });
      }
      if (keyboardPlay) window.localStorage.setItem("trick-or-treat:keyboard", "1");
      if (slowPace) window.localStorage.setItem("trick-or-treat:slow", "1");
      window.matchMedia = (query) => ({
        matches:
          (reducedMotion && /prefers-reduced-motion:\s*reduce/.test(query)) ||
          (touchDevice && /pointer:\s*coarse/.test(query)),
      });
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
      // Like a real browser, animation frames stop while the tab is hidden
      // but timers keep running.
      const frameIds = new Map();
      let nextFrameId = 1;
      // Frames land on every multiple of `frameMs`, like a screen refreshing.
      const untilNextFrame = () => frameMs - (clock.now % frameMs);
      window.requestAnimationFrame = (callback) => {
        const id = nextFrameId++;
        const schedule = () =>
          frameIds.set(
            id,
            window.setTimeout(() => {
              if (tabHidden) return schedule();
              frameIds.delete(id);
              callback(clock.now);
            }, untilNextFrame())
          );
        schedule();
        return id;
      };
      window.cancelAnimationFrame = (id) => {
        window.clearTimeout(frameIds.get(id));
        frameIds.delete(id);
      };
      // Every sprite the page asks the browser to load, by file name.
      const srcProp = Object.getOwnPropertyDescriptor(
        window.HTMLImageElement.prototype,
        "src"
      );
      Object.defineProperty(window.HTMLImageElement.prototype, "src", {
        ...srcProp,
        set(value) {
          requestedImages.add(String(value).split("/").pop());
          srcProp.set.call(this, value);
        },
      });
      // What a player hears, by the file played.
      const effectNames = {
        "punto.mp3": "point",
        "error.mp3": "error",
        "level-up.mp3": "level up",
        "try-again.mp3": "game over",
        "you-win.mp3": "new best",
      };
      window.HTMLMediaElement.prototype.play = function () {
        const file = this.src.split("/").pop();
        playing.add(this);
        if (effectNames[file] && !this.muted) heard.push(effectNames[file]);
        return Promise.resolve();
      };
      window.HTMLMediaElement.prototype.pause = function () {
        playing.delete(this);
      };
      if (counter) {
        window.goatcounter = {
          count({ path, event }) {
            if (event) counted.push(path);
          },
        };
      }
      window.Math.random = () => rng();
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

  const nav = () => document.querySelector(".hud");
  const siteNav = () => document.querySelector(".site-nav");
  const startBoard = () => document.getElementById("start");
  const canvasEl = () => document.querySelector("canvas");

  const levelBar = () => queryByRole(nav(), "progressbar");

  const pauseControl = () =>
    getByRole(nav(), "button", { name: /^(Pause|Resume)$/ });

  const optionSwitch = (name) =>
    getByRole(startBoard(), "switch", { name });

  const muteControl = () => getByRole(nav(), "button", { name: "Mute" });

  const pausedOverlay = () =>
    queryByRole(document.body, "button", { name: /to resume/i });

  const setTabHidden = (hidden) => {
    tabHidden = hidden;
    Object.defineProperty(document, "hidden", {
      configurable: true,
      get: () => hidden,
    });
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => (hidden ? "hidden" : "visible"),
    });
    document.dispatchEvent(new window.Event("visibilitychange"));
  };

  const g = {

    setRandom(next) {
      rng = toRandom(next);
    },

    screen() {
      if (queryByRole(document.body, "button", { name: "Play Again!" }))
        return "game over";
      if (queryByRole(document.body, "button", { name: "Tap to start" }))
        return "intro";
      if (canvasEl()) return "playing";
      return "unknown";
    },

    start() {
      getByRole(document.body, "button", { name: "Tap to start" }).click();
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
      const stars = queryByRole(nav(), "img", { name: /^-?\d+ points?$/ });
      const match = stars?.getAttribute("aria-label").match(/(-?\d+)/);
      return match ? Number(match[1]) : undefined;
    },

    lives() {
      const hearts = queryByRole(nav(), "img", { name: /\d+ lives?/ });
      const match = hearts?.getAttribute("aria-label").match(/(\d+)/);
      return match ? Number(match[1]) : undefined;
    },

    level() {
      const match = levelBar()
        ?.getAttribute("aria-valuetext")
        .match(/Level (\d+)/);
      return match ? Number(match[1]) : undefined;
    },

    // Notches filled toward the next level, or "max" on the last level.
    levelProgress() {
      const bar = levelBar();
      if (/max/i.test(bar.getAttribute("aria-valuetext"))) return "max";
      return {
        filled: Number(bar.getAttribute("aria-valuenow")),
        of: Number(bar.getAttribute("aria-valuemax")),
      };
    },

    // The "witches get mad" banner over the board, if shown.
    levelMessage() {
      const banner = document.querySelector("#level-up .level-up-caption");
      return banner ? banner.textContent.trim() : undefined;
    },

    // The big number that grows over the board on a level-up, if shown.
    levelUpNumber() {
      return document.querySelector("#level-up .level-up-number")?.textContent;
    },

    // How many witches are flying across the screen right now.
    witchesFlying() {
      return document.querySelectorAll(".witch").length;
    },

    // Which way the witch is flying: "rightwards" or "leftwards".
    witchDirection() {
      const witch = document.querySelector(".witch");
      if (!witch) return undefined;
      return witch.classList.contains("is-leftwards") ? "leftwards" : "rightwards";
    },

    // Whether every flying witch is hidden from screen readers.
    witchIsDecorative() {
      return [...document.querySelectorAll(".witch")].every(
        (witch) => witch.getAttribute("aria-hidden") === "true"
      );
    },

    finalScore() {
      const match = document.body.textContent.match(/You scored (-?\d+)/);
      return match ? Number(match[1]) : undefined;
    },

    finalLevel() {
      const match = document.body.textContent.match(/You reached level (\d+)/);
      return match ? Number(match[1]) : undefined;
    },

    // The game over card: best score, and what the run was made of.
    endStats() {
      const stat = (label) => {
        const el = [...document.querySelectorAll("#end .stat")].find(
          (item) => item.textContent.trim().endsWith(label)
        );
        return el ? Number(el.querySelector("strong").textContent) : undefined;
      };
      const best = [...document.querySelectorAll("#end p")]
        .map((p) => p.textContent.match(/Best: (\d+)/))
        .find(Boolean);
      return {
        best: best ? Number(best[1]) : undefined,
        caught: stat("Caught"),
        fauxHit: stat("Faux hit"),
        bestStreak: stat("Best streak"),
      };
    },

    isNewBest() {
      // Scoped to the card: the inlined scripts also live in the body.
      return /New best!/.test(document.getElementById("end")?.textContent ?? "");
    },

    // The player picks "Home" on the game over card.
    backToIntro() {
      getByRole(document.body, "button", { name: "Home" }).click();
    },

    // The name of the button that has keyboard focus, if any.
    focusedButton() {
      const el = document.activeElement;
      return el?.tagName === "BUTTON" ? el.textContent.trim() : undefined;
    },

    // Enter on whatever is focused, like a keyboard player.
    pressEnterOnFocus() {
      const el = document.activeElement;
      el.dispatchEvent(
        new window.KeyboardEvent("keydown", { key: "Enter", bubbles: true })
      );
      el.click();
    },

    // The accessible name of the board, if it has one.
    boardLabel() {
      const board = queryByRole(document.body, "img", { name: /game board/i });
      return board?.getAttribute("aria-label");
    },

    // The switches on the start board, as the player sees them.
    // `keyboardPlay` is undefined when the start board doesn't offer it.
    startOptions() {
      const checked = (el) => el.getAttribute("aria-checked") === "true";
      const keyboard = queryByRole(startBoard(), "switch", {
        name: /keyboard play/i,
      });
      return {
        keyboardPlay: keyboard ? checked(keyboard) : undefined,
        slowPace: checked(optionSwitch(/slower pace/i)),
      };
    },

    toggleKeyboardPlay() {
      const el = optionSwitch(/keyboard play/i);
      el.focus();
      el.click();
    },

    toggleSlowPace() {
      const el = optionSwitch(/slower pace/i);
      el.focus();
      el.click();
    },

    // The name of the switch that has keyboard focus, if any.
    focusedSwitch() {
      const el = document.activeElement;
      return el?.getAttribute("role") === "switch"
        ? el.textContent.trim()
        : undefined;
    },

    // Whether the board takes keyboard focus, and has it right now.
    boardFocusable() {
      return canvasEl()?.hasAttribute("tabindex") ?? false;
    },

    boardHasFocus() {
      return document.activeElement === canvasEl();
    },

    // What a screen reader is told about the board's role and name.
    boardRole() {
      return canvasEl().getAttribute("role");
    },

    boardDescription() {
      return canvasEl().getAttribute("aria-label");
    },

    // The item wearing the focus rim (a solid frame, unlike the dashed
    // danger frame), if any.
    focusedItem() {
      const el = canvasEl();
      if (!el) return undefined;
      const ctx = el.getContext("2d");
      const rim = ctx.lastStrokes.find((stroke) => !stroke.dashed);
      if (!rim) return undefined;
      return g
        .visibleItems()
        .find(
          (item) =>
            rim.x <= item.x &&
            rim.y <= item.y &&
            rim.x + rim.w >= item.x + item.w &&
            rim.y + rim.h >= item.y + item.h
        );
    },

    // The text a screen reader gets from the polite live region.
    announcement() {
      const region = document.querySelector('[aria-live="polite"]');
      return region ? region.textContent.trim() : undefined;
    },

    // The sprite files the page has asked the browser to load so far.
    requestedImages() {
      return [...requestedImages];
    },

    canvasSize() {
      const el = canvasEl();
      return { width: el.width, height: el.height };
    },

    // What is on screen right now, in draw order (later = on top).
    // Whether the fog that opens a game is over the board.
    smokeShowing() {
      return document.querySelector("#effects .smoke") !== null;
    },

    visibleItems() {
      const el = canvasEl();
      if (!el) return [];
      return el
        .getContext("2d")
        .lastFrame.map(({ src, x, y, w, h }) => ({
          kind: /-faux\.png$/.test(src) ? "faux" : "pumpkin",
          image: src.split("/").pop(),
          x,
          y,
          w,
          h,
        }));
    },

    // Floating labels over the board, oldest first. `kind` is catch, faux
    // or lost; x and y are in canvas coordinates. `hasIcon` is
    // whether the label carries an icon next to its text.
    popups() {
      return [...document.querySelectorAll("#effects > *")].map((el) => ({
        kind: el.dataset.kind,
        text: el.textContent.trim(),
        hasIcon: el.querySelector("svg") !== null,
        x: parseFloat(el.style.left),
        y: parseFloat(el.style.top),
      }));
    },

    // Whether the board is showing its "you lost a life" reaction.
    boardFlinched() {
      return canvasEl().classList.contains("anim-hurt");
    },

    // How the score number last reacted: "up", "down" or undefined.
    scoreReaction() {
      const classes = document.getElementById("pointCount").classList;
      if (classes.contains("anim-pop")) return "up";
      if (classes.contains("anim-wobble")) return "down";
      return undefined;
    },

    // Items drawn with the red danger rim, because they are about to be lost.
    itemsInDanger() {
      const el = canvasEl();
      if (!el) return [];
      return el
        .getContext("2d")
        .lastFrame.filter(({ shadowColor }) => /255, 59, 48/.test(shadowColor))
        .map(({ src, x, y, w, h }) => ({
          kind: /-faux\.png$/.test(src) ? "faux" : "pumpkin",
          x,
          y,
          w,
          h,
        }));
    },

    clickAt(x, y) {
      const event = new window.MouseEvent("pointerdown", {
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
      for (let i = 0; i < n; i++) clock.tick(frameMs);
    },

    advanceTime(ms) {
      clock.tick(ms);
    },

    // Advance frame by frame until `predicate()` holds. Fails loudly instead
    // of hanging when it never does.
    advanceUntil(predicate, { maxFrames = 5000 } = {}) {
      for (let i = 0; i < maxFrames; i++) {
        if (predicate()) return;
        clock.tick(frameMs);
      }
      if (!predicate()) {
        throw new Error(`condition not met within ${maxFrames} frames`);
      }
    },

    // The player switches to another tab (or comes back).
    hideTab() {
      setTabHidden(true);
    },

    showTab() {
      setTabHidden(false);
    },

    // The player presses a key with nothing in particular focused.
    pressKey(key, modifiers = {}) {
      document.dispatchEvent(
        new window.KeyboardEvent("keydown", { key, bubbles: true, ...modifiers })
      );
    },

    togglePause() {
      pauseControl().click();
    },

    // The player tabs to the Pause button.
    focusPauseControl() {
      pauseControl().focus();
    },

    // The effects played so far, in order, as the player heard them.
    soundsHeard() {
      return [...heard];
    },

    clearSounds() {
      heard.length = 0;
    },

    // The game events the visit counter has received so far, in order.
    eventsCounted() {
      return [...counted];
    },

    // Whether the background music is audible right now.
    musicPlaying() {
      return [...playing].some(
        (el) => el.src.endsWith("audioGame.mp3") && !el.muted
      );
    },

    // The player clicks the speaker button in the HUD.
    toggleMute() {
      muteControl().click();
    },

    isMuted() {
      return muteControl().getAttribute("aria-pressed") === "true";
    },

    // Speaker buttons outside the HUD: on the start board and in the bottom bar.
    toggleStartMute() {
      getByRole(startBoard(), "button", { name: "Mute" }).click();
    },

    toggleMenuMute() {
      getByRole(siteNav(), "button", { name: "Mute" }).click();
    },

    // What every speaker button on the page says, as aria-pressed values.
    speakerStates() {
      return [...document.querySelectorAll('button[aria-label="Mute"]')]
        .filter((el) => !el.hidden)
        .map((el) => el.getAttribute("aria-pressed"));
    },

    // The best score shown on the start board.
    startBest() {
      return startBoard()?.querySelector(".best strong")?.textContent;
    },

    // The player clicks the empty board, not a button.
    clickStartBoard() {
      startBoard().click();
    },

    // The title on the start board.
    startTitle() {
      return startBoard()?.querySelector("h1")?.textContent;
    },

    // Links in the bottom bar, by name.
    menuLinks() {
      return [...siteNav().querySelectorAll("a")].map((a) => a.textContent.trim());
    },

    // The "Quit this game?" question over the board, if shown.
    quitPrompt() {
      const prompt = queryByRole(document.body, "alertdialog");
      return prompt ? prompt.textContent.trim() : undefined;
    },

    // The text a screen reader reads as the question's description.
    quitDescription() {
      const prompt = queryByRole(document.body, "alertdialog");
      const id = prompt?.getAttribute("aria-describedby");
      return id ? document.getElementById(id)?.textContent.trim() : undefined;
    },

    // Moves keyboard focus to a link of the bottom bar.
    focusMenuLink(name) {
      getByRole(siteNav(), "link", { name }).focus();
    },

    // The name of the link that has keyboard focus, if any.
    focusedLink() {
      const el = document.activeElement;
      return el?.tagName === "A" ? el.textContent.trim() : undefined;
    },

    // Text of every heading on the page, as a screen reader's heading list.
    headings() {
      return [...document.querySelectorAll("h1")].map((h) => h.textContent.trim());
    },

    confirmQuit() {
      getByRole(document.body, "button", { name: "Quit game" }).click();
    },

    keepPlaying() {
      getByRole(document.body, "button", { name: "Keep playing" }).click();
    },

    // What the pause control offers: pausing or resuming.
    pauseControlLabel() {
      return pauseControl().getAttribute("aria-label");
    },

    isPaused() {
      return pauseControl().getAttribute("aria-label") === "Resume";
    },

    // The "Paused, click to resume" message over the board, if shown.
    pausedMessage() {
      const overlay = pausedOverlay();
      return overlay ? overlay.textContent.trim() : undefined;
    },

    // Shift+Tab (or any other way) lands on the paused message.
    focusPausedMessage() {
      pausedOverlay().focus();
    },

    resumeFromOverlay() {
      pausedOverlay().click();
    },

    close() {
      clock.uninstall();
      window.close();
    },
  };

  return g;
}
