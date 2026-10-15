# 🎃 Trick or Treat 2.0 👻

> Pumpkins are falling from the sky! Catch them before they hit the ground, and don't get fooled by the tricks. 🦇

**▶️ Play it now:** https://teresaromero.github.io/trick-or-treat-game

Trick or Treat is a spooky little browser click game. It was my first coding project, built for the Game Project of the **Ironhack Part-Time Web Development Bootcamp** in Madrid 🇪🇸 (October 2018). In September 2020 it got a "2.0" refactor. 🧙‍♀️

I like to come back to it every now and then as my career moves forward. Each visit, I apply what I've learned since: cleaner code, tests, fixes for old bugs. It's my way of seeing how far I've come. 🌱

🤖 **Coming up: 3.0!** The game is getting a revamp with today's AI tooling. 🪄

---

## 🕹️ How to play

1. Press **Go!** to start the night. 🌙
2. Pumpkins 🎃 and *faux* Halloween objects 🕸️ fall down the screen.
3. **Click the pumpkins** to collect them: each one gives you **+1 point**. ⭐
4. **Avoid the faux items!** Clicking one takes away **1 point**. 💀
5. **Don't let pumpkins reach the bottom.** Each pumpkin you miss costs **1 life**, and you start with **3 lives**. ❤️❤️❤️
6. Need a break? Hit **pause** ⏸️ and resume when you're ready.

### ☠️ Game over

- You run out of lives, or
- a click on a faux item drops your score to 0 or below.

Then press **Play Again!** for another round. 🔁

### 🌪️ It gets harder

| Score | What happens |
|---|---|
| > 10 | Pumpkins fall faster 💨 |
| > 20 | The wind starts blowing them sideways 🍂 |
| > 30 | The wind gets stronger 🌪️ |

---

## 🧪 Built with

- 🧱 Plain **HTML**, **CSS** and vanilla **ES6 JavaScript** (classes, getters and setters)
- 🖼️ The HTML5 **`<canvas>`** for the falling items
- 🎨 **Bootstrap** and **Feather icons** from CDNs
- 🔤 Google Fonts: **Creepster** for the spooky header and **Arvo** for the body text

There's no build step and no runtime dependencies. It's just a static site. ✨

## 🏚️ Run it locally

```sh
npm install
npm start
```

Then open http://localhost:8000 🎃

You can also open `index.html` directly in your browser.

## 🔮 Tests

`package.json` only holds dev-time tooling: the test runners and the local `serve` server.

```sh
npm install

# 🧟 Behavior tests (Vitest + jsdom)
npm test

# 🕷️ End-to-end smoke tests (Playwright, Chromium)
npx playwright install chromium   # first time only
npm run test:e2e
```

The tests are black-box: they play the game like a player would (clicking, reading the score and lives, looking at what's drawn) instead of poking at internals.

## 🗂️ Project structure

```
index.html        🏠 page shell
css/              🎨 theme (black + #f27503 orange)
js/utils.js       🧩 DOM rendering (intro, controls, canvas, end screen)
js/canvas.js      🖼️ Canvas: owns the items, moves, draws and hit-tests them
js/item.js        🎃 Item: position, size, image, gravity and wind
js/game.js        🎮 Game: lives, points, spawn speed and difficulty
js/index.js       🚪 entry point and game loop
assets/img/       🖌️ pumpkins (NNN.png) and faux items (NNN-faux.png)
assets/sound/     🔊 sound effects and music (not wired up yet)
test/  e2e/       🧪 test suites
```

---

## 🙏 Credits for resources

- 🎃 Pumpkin icons designed by [Good Ware](https://www.flaticon.com/authors/good-ware) from [Flaticon](https://www.flaticon.com/)
- 🕸️ Misc object icons designed by [Mavadee](https://www.flaticon.com/authors/mavadee) from [Flaticon](https://www.flaticon.com/)
- ❤️ Life and score icons designed by [Smashicons](https://www.flaticon.com/authors/smashicons) from [Flaticon](https://www.flaticon.com/)
- 🌌 Background pattern from Free Vectors by [Vecteezy](https://www.vecteezy.com)
- 🎵 Music by [WaveToys](https://wavetoysmusic.com/) (Royalty Free Background Music For Videos)
- 🔔 Sound effects from [ZapSplat](https://www.zapsplat.com)

---

<p align="center">Made with 🧡 and a cauldron of ☕ by <a href="https://github.com/teresaromero">Teresa Romero</a>. Happy Halloween! 🎃👻🦇</p>
