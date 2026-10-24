# 🎃 Trick or Treat 👻

> Pumpkins are falling from the sky! Catch them before they hit the ground, and don't get fooled by the tricks. 🦇

**▶️ Play it now:** https://teresaromero.github.io/trick-or-treat-game

Trick or Treat is a spooky little browser click game. It was my first coding project, built for the Game Project of the **Ironhack Part-Time Web Development Bootcamp** in Madrid 🇪🇸 (October 2018). In September 2020 it got a "2.0" refactor, and in 2026 a "3.0" one: a new look, levels, sound and a small site around the game. 🧙‍♀️

I like to come back to it every now and then as my career moves forward. Each visit, I apply what I've learned since: cleaner code, tests, fixes for old bugs. It's my way of seeing how far I've come. 🌱

🤖 3.0 was built with today's AI tooling. 🪄

---

## 🕹️ How to play

1. Press **Tap to start** (or click anywhere on the start board) to start the night. 🌙
2. Pumpkins 🎃 and *faux* Halloween objects 🕸️ fall down the screen.
3. **Click or tap the pumpkins** to collect them: each one gives you **+1 point**. ⭐
4. **Avoid the faux items!** Clicking one takes away **1 point**. 💀
5. **Don't let pumpkins reach the bottom.** Each pumpkin you miss costs **1 life**, and you start with **3 lives**. ❤️❤️❤️
6. **Catch 10 pumpkins in a row** and a lost heart comes back. 💗

At 0 points everything that falls is a pumpkin, and fakes cost nothing, so you can't lose points you don't have.

### ⌨️ Controls

| Key | What it does |
|---|---|
| Click / tap | Catch an item |
| `P` or `Space` | Pause and resume (hiding the tab pauses too) |
| `Esc` | Ask to quit (a second `Esc` keeps playing); on the game over screen, back to the start |
| `M` | Sound on or off (remembered) |

The board is pointer-only: catching needs a mouse or a finger.

### ☠️ Game over

- You run out of lives. (Your score never drops below 0.)
- The card shows your score, level, best score and your run (caught, faux hit, best streak).

Then press **Play Again!** for another round, or **Home** to go back to the start. 🔁

### 🌪️ It gets harder

There are 9 levels, one every 10 points. Levels only go up: a fake can cost you points but not a level.

| Level | Score | What happens |
|---|---|---|
| 1 | 0 | Pumpkins fall slowly, one a second |
| 2 | 10 | Pumpkins fall faster 💨 |
| 3 | 20 | The wind starts blowing them sideways 🍂 |
| 4 | 30 | A storm is brewing: stronger wind 🌪️ |
| 5–8 | 40–70 | The witches get mad: faster and more pumpkins 🧙‍♀️ |
| 9 | 80 | Witching hour: max level 🌕 |

Every number lives in `js/config.js`.

---

## 🧪 Built with

- 🧱 Plain **HTML**, **CSS** and vanilla **ES6 JavaScript** (classes, getters and setters)
- 🖼️ The HTML5 **`<canvas>`** for the falling items
- 🔤 Self-hosted fonts: **Creepster** for the spooky header and **Arvo** for the body text
- 🔊 Plain `Audio` elements for the sound, so it works from `file://` too
- 📊 [GoatCounter](https://www.goatcounter.com) for anonymous, cookieless visit and game-action counts (see `privacy.html`; it ignores `localhost`)

There's no build step and no runtime dependencies of our own. It's just a static site, deployed to GitHub Pages only after both test suites pass. ✨

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
index.html        🏠 the game page (entry point)
leaderboard.html, how-to-play.html, about.html, privacy.html, terms.html
                  📄 static content pages, same bottom bar
css/              🎨 theme (black + #f27503 orange, night-sky board)
js/config.js      ⚙️ every tuning constant (levels, lives, timings, sizes)
js/icons.js       🔣 inline SVG icons
js/assets.js      🖼️ sprite names, image cache, preload
js/storage.js     💾 best score and mute choice in localStorage
js/analytics.js   📊 anonymous GoatCounter events
js/sound.js       🔊 effects, looping music, mute
js/item.js        🎃 Item: position, size, image, gravity and wind
js/game.js        🎮 Game: lives, points, level and streak (state only)
js/board.js       🕸️ Board: owns the items, moves, draws, spawns and hit-tests them
js/hud.js         ❤️ HUD: controls, score, level and lives
js/effects.js     ✨ popups, level-up banner and witch, board layers
js/screens.js     🧩 start board, pause overlay, quit prompt and game over
js/session.js     🔁 Session: one running game (loops, input, pause, end)
js/main.js        🚪 entry point
assets/img/       🖌️ pumpkins (NNN.png), faux items (NNN-faux.png), social image
assets/sound/     🔊 sound effects and music
docs/             📚 3.0 tracker, design system, launch review
test/  e2e/       🧪 test suites
```

---

## 🙏 Credits for resources

- 🎃 <a href="https://www.flaticon.com/free-icons/pumpkin" title="pumpkin icons">Pumpkin icons created by Good Ware - Flaticon</a>
- 🕸️ <a href="https://www.flaticon.com/free-icons/halloween" title="halloween icons">Halloween icons created by mavadee - Flaticon</a>
- 🧙‍♀️ Witch silhouette by [Freepik](https://www.magnific.com/free-vector/halloween-witch-silhuette_3126056.htm)
- 🔣 Interface icons from [Lucide](https://lucide.dev) and the pumpkin from MingCute, via [Iconify](https://iconify.design)

---

<p align="center">Made with 🧡 and a cauldron of ☕ by <a href="https://github.com/teresaromero">Teresa Romero</a>. Happy Halloween! 🎃👻🦇</p>
