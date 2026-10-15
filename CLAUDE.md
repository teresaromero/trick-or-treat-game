# CLAUDE.md

Trick or Treat 2.0: a browser click game. Pumpkins and "faux" Halloween objects fall down a canvas. Click pumpkins to score, avoid faux items, and don't let pumpkins reach the bottom. This was Teresa's first coding project, built for the Ironhack Part-Time Web Development Bootcamp (Madrid, Oct 2018). It was refactored to "2.0" in Sep 2020 (PR #1).

Live at https://teresaromero.github.io/trick-or-treat-game (GitHub Pages, served from `master`).

## Stack

- Plain HTML, CSS and vanilla ES6 JavaScript (classes, getters and setters). No build step and no modules. `package.json` exists only for dev-time tooling (tests, plus `serve` as the local static server); the site ships with no runtime dependencies.
- Bootstrap and Feather icons come from CDNs. The CSS is Bootstrap **4.5.2**, but the JS bundle is **5.0.0-alpha1** (a mismatch). Only Bootstrap's CSS classes are actually used.
- Google Fonts: Creepster (header) and Arvo (body).
- `.prettierrc` and `.vscode` are gitignored, so formatting is whatever Prettier defaults produced (double quotes, semicolons, 2 spaces).

## Running

Open `index.html` in a browser, or run `npm start` (which uses `serve`), then visit http://localhost:8000. Assets use relative `./assets/...` paths, so serving from the repo root matters.

## Testing

- `npm test`: Vitest + jsdom behavior suite (`test/game.spec.js`), which runs in under a second.
- `npm run test:e2e`: Playwright smoke tests in Chromium (`e2e/smoke.spec.js`). Run `npx playwright install chromium` once first. It serves the repo with `npm start` on port 8000, and CDN assets need network access.

The tests are **black-box on purpose**, so they survive the planned refactor:
- `test/driver.js` loads the real `index.html` into jsdom, inlining the local scripts and dropping CDN tags. It fakes timers and rAF (`@sinonjs/fake-timers`), makes `Math.random` controllable, and stubs `getContext("2d")` with a recorder. The game is observed through what a player sees: HUD text, screens, and the `drawImage` calls of the last frame (`visibleItems()`; the kind comes from the `-faux.png` filename).
- Specs use only the driver's player-level API. They never touch `game`, `canvas`, `Item`, ids or selectors. Every markup assumption lives in `driver.js`. If a spec has to change during a refactor, the behavior changed: stop and check.
- Known bugs aren't asserted. Each bug fix starts with a red spec that reproduces it (in the jsdom suite, or the e2e suite for real-browser bugs like resize and layout).
- A constant random value of `0.5` spawns a pumpkin and `0.9` spawns a faux item. Constant randomness puts every item in the same column.

## Layout

```
index.html        page shell: header/nav, <main>, footer; loads all scripts as globals
css/index.css     theme (black background, #f27503 orange, fonts)
css/fire.css      .mo-fire flame animation, currently unused
js/utils.js       DOM rendering (intro, controls, canvas, end screen), getRandom, getAsset
js/canvas.js      class Canvas: wraps the <canvas>, owns the items array, move/draw/hit-test
js/item.js        class Item: position, size, image, points, lifes, faux, gravity, wind
js/game.js        class Game: lifes, points, spawn interval, difficulty
js/index.js       entry point: window.onload -> renderIntro; startGame wires up the loop and events
assets/img/       NNN.png = pumpkins (001–016), NNN-faux.png = faux items (001–007), meta.png = OG image
assets/sound/     mp3s, not referenced by any code yet
test/             jsdom driver + behavior specs (Vitest)
e2e/              Playwright smoke tests
```

All scripts share the global scope; there are no imports. Every script tag is `async defer` (in practice `async`), so load order isn't guaranteed. Things work because nothing runs until `window.onload`.

## Game flow

1. `renderIntro()` shows a card with a "Go!" button that calls `startGame`.
2. `startGame` removes the intro, creates the `<canvas>` (90%×80% of `#main-vp`), creates `Canvas` and `Game`, and renders the points/lives/pause controls in the `<nav>`.
3. Two loops run:
   - **Render loop** (`requestAnimationFrame(init)`): `canvas.move()` applies gravity and wind (wind bounces off the side walls), then `canvas.draw()`.
   - **Spawn loop** (`game.generateItems()`, `setInterval` every `game.ms`): adds an item. 20% are faux. Speed depends on score: >10 gives gravity 1.5, >20 adds wind ±1, >30 gives wind ±1.5.
4. Clicking hit-tests items (`canvas.checkClick`) and removes the clicked one. Pumpkins give +1 point, faux items −1.
5. A non-faux item falling past the bottom costs 1 life. You start with 3 lives.
6. The game ends when lives hit 0, or when a click leaves points ≤ 0. `endGame` clears both loops, removes the canvas and controls, and calls `renderEndGame(score)`, which has a "Play Again!" button.
7. Pause clears the interval and cancels the animation frame. Resume restarts both.

## Conventions and quirks

- **Setters are used as actions, not assignments.** `game.points = 1` *adds* 1, `game.lifes = 1` *subtracts* 1, `game.ms = 100` *subtracts* 100 ms, `item.move = g` adds `g` to `y`, `canvas.add = item` pushes, and `canvas.delete = i` splices. Read setters carefully before changing call sites.
- "lifes" (not "lives") is spelled that way everywhere: ids `lifeCount`, properties `_lifes`, and so on. The spawn speed is `ms`.
- Game classes update the DOM directly (`Game` setters write to `#pointCount`/`#lifeCount`).
- UI is built imperatively with `document.createElement` in `utils.js`, not templates.

## Known bugs and loose ends (left as-is unless asked)

- `getRandom(min, max)` excludes `max`, so `getAsset` never picks `016.png` or `007-faux.png`.
- `Item.setXY` overlap check computes the Y overlap from `x` coordinates, and its condition is inverted, so spawn de-overlapping doesn't really work.
- Faux items that fall off the bottom are never removed from `canvas.items`, so the array grows over a long game.
- `window.onresize` assigns `canvas.width`/`height` on the `Canvas` wrapper, which only has getters. The assignment silently does nothing, so the canvas doesn't resize.
- Speed-up (`ms` decreases past 40 points) only takes effect when `generateItems` is called again, i.e. after a pause/resume.
- `Game` constructor sets `_paused`, but the getter and setter use `_pause`.
- Clicking a faux item at 0 points ends the game immediately.
- Unused: `renderModal`, `suffleArray`, `css/fire.css`, all sounds, and the "Hall of Fame" link (`href="#"`). The README "How to play" section is empty.
- An earlier commit added Google Analytics, but the 2.0 refactor dropped it.
