# CLAUDE.md

Trick or Treat 2.0: a browser click game. Pumpkins and "faux" Halloween objects fall down a canvas. Click pumpkins to score, avoid faux items, and don't let pumpkins reach the bottom. This was Teresa's first coding project, built for the Ironhack Part-Time Web Development Bootcamp (Madrid, Oct 2018). It was refactored to "2.0" in Sep 2020 (PR #1).

Live at https://teresaromero.github.io/trick-or-treat-game (GitHub Pages, served from `master`).

## Stack

- Plain HTML, CSS and vanilla ES6 JavaScript (classes, getters and setters). No build step and no modules. `package.json` exists only for dev-time tooling (tests, plus `serve` as the local static server); the site ships with no runtime dependencies.
- No CSS framework or icon library: all styling lives in `css/index.css` (Bootstrap and Feather were dropped in 3.0). Icons are Lucide SVGs, plus the pumpkin from MingCute copied from Iconify (`api.iconify.design/<set>/<name>.svg`), all inlined as constants in `js/icons.js`. The only runtime script is GoatCounter (`gc.zgo.at/count.js`, `async`, last in the `<body>` of every page): anonymous, cookieless visit counts, dashboard at https://trick-or-treat-game.goatcounter.com. It ignores `localhost`, and `test/driver.js` drops it with the other `https:` script tags.
- Fonts: Creepster (header) and Arvo (body), self-hosted as latin `woff2` in `assets/fonts/` (`@font-face` at the top of `css/index.css`, `display=swap`). Every page preloads Creepster. No request goes to Google.
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
- A constant random value of `0.5` spawns a pumpkin and `0.9` spawns a faux item, but only once the score is above 0 (at 0 points everything spawns as a pumpkin). Constant randomness puts every item in the same column. A game opens with `SMOKE_MS` (2 s) of fog and the first item only appears after it, so specs advance past it before waiting for items (`driver.smokeShowing()`; `openGame({ reducedMotion: true })` skips the fog).

## Layout

```
index.html        the game page (the site's entry point): HUD header, <main>, bottom bar; loads all scripts as globals
leaderboard.html (unlinked placeholder, noindex), how-to-play.html, about.html, privacy.html, terms.html
                  static content pages: no game scripts, same bottom bar (copied by hand into each page)
css/index.css     theme (black page, #f27503 orange, fonts; night-sky board on the canvas via outline + gradients)
js/config.js      every tuning constant: LEVELS, lives, timings, sizes, popup durations, the opening fog (SMOKE_MS) and spawn depth
js/icons.js       inline SVG constants (Lucide, MingCute)
js/assets.js      getRandom, sprite names, shared Image cache, preload (sprites and fog textures), randomSprite
js/storage.js     best score and mute choice in localStorage (loadBest / saveBest, loadMuted / saveMuted)
js/analytics.js   EVENTS names and track(name): anonymous GoatCounter events, a no-op when the script is missing
js/sound.js       effects and looping music (plain audio elements), mute toggle; dormant while `SOUND_ENABLED` (config.js) is false
js/item.js        class Item: plain data (position, size, image, points, faux, gravity, wind)
js/game.js        class Game: pure state (lives, points, level, streak, stats), no DOM and no timers
js/board.js       class Board: wraps the <canvas>, owns the items, step/draw/spawn/itemAt
js/hud.js         HUD in the <nav>: controls, score, level notches, hearts, announcer
js/effects.js     board and #effects layers, popups, opening fog, level-up number and witch, board flinch
js/screens.js     start board, paused overlay, end screen
js/session.js     class Session: one running game, wires Game + Board to the loops, input, pause and end
js/main.js        window.onload/onresize, startGame, backToStart, clearBoard
assets/img/       NNN.png = pumpkins (001–016), NNN-faux.png = faux items (001–007), fog1–3.webp = the opening fog textures (560×315, generated, ~70 KB each), meta.png = OG image (1200×630, night-sky board with the title), favicon.ico, favicon-32.png, apple-touch-icon.png, icon-192/512.png
assets/sound/     empty: the mp3s were removed (see 8)
docs/design-system.md  tokens and component reference for the UI (3.0)
test/             jsdom driver + behavior specs (Vitest)
e2e/              Playwright smoke tests
```

All scripts share the global scope; there are no imports. Script tags use plain `defer`, so they run in the order listed in `index.html` (config first, main last); keep that order when adding a file. Nothing runs until `window.onload`.

## Game flow

0. On `window.onload`, `preloadAssets()` requests every sprite once (shared `Image` cache in `assets.js`), so no item first appears blank.
1. `renderStart()` draws the start screen as a board (`#start.board`, same size as the canvas): the title bobbing up and down (`anim-bob`), the best score, a speaker button, a **Tap to start** button and two switches (`.start-options`, `createSwitch()`): **Keyboard play** and **Slower pace**, remembered in `localStorage` (`loadKeyboardPlay`/`loadSlowPace`). Keyboard play is not offered, and ignored if stored, on phones and tablets (`isTouchDevice()`: `(hover: none) and (pointer: coarse)`); the driver's `openGame({ touchDevice: true })` fakes it. A click anywhere on the board starts, except on a switch; the rules are on `how-to-play.html`. The bottom bar (`.site-nav`) is on every page and always visible: Game, How to play, About on the left, Privacy, Terms and (game page only) a speaker button on the right.
2. `startGame` removes the start board, creates the `<canvas>` (90%×80% of `#main-vp`), creates `Board`, `Game` and a `Session`, and renders the points/lives/pause controls in the `<nav>`.
   A game opens with fog (`Session.startOpening()`, `renderSmoke()`, `SMOKE_MS` = 2000 ms, three `assets/img/fog*.webp` mist layers covering the whole board inside `#effects`, no random calls). When it clears, `openBoard()` spawns the first pumpkin close to the top edge (`FIRST_SPAWN_DEPTH`; later items use `SPAWN_DEPTH`) and starts the spawn interval. Pausing or Esc during the fog cancels it and resume plays it again; reduced motion skips it and spawns at once.
3. Two loops run (the spawn interval restarts on every level-up):
   - **Render loop** (`requestAnimationFrame(session.frame)`): `board.step(frames)` applies gravity and wind scaled by the elapsed time in 60 Hz frames, so speed doesn't depend on the screen's refresh rate (wind bounces off the side walls), then `board.draw()`.
   - **Spawn loop** (`Session.startSpawner()`, `setInterval` every `game.spawnMs`): adds an item. 20% are faux, but none while the score is 0. Gravity, wind and spawn speed come from the `LEVELS` table in `js/game.js`.
   - **Levels** change every 10 points, 9 in all, and only go up (a fake item can't take you back a level). gravity ramps 1 → 2 in steps of 1/8 and the spawn interval drops 100 ms per level up to level 4, then 50 ms (1000 → 450 ms at MAX); wind is ±1 from level 3 and ±1.5 from level 4. The HUD shows hearts, `LV n` plus a 10-notch bar (one notch per point toward the next level, full at MAX) and the score; each level-up grows the new level as a big number from the middle of the screen until it fades out, with a caption (`#level-up`, the caption is `role="status"`) and a see-through witch silhouette flying across the screen from a random side (`.witch`, decorative; it takes one `Math.random` call per level-up) for 2.4 s while the game keeps running (no particles, no pause).
   The canvas backing store has one pixel per device pixel (`Board.setSize`: CSS size from `style`, `ctx.scale(devicePixelRatio)`, re-read on every resize), while `Board.width/height`, item coordinates and `offsetX/Y` stay in CSS pixels.
   Items are square, 12% of the board's shorter side, clamped to 40–80 px (`Board.itemSize`); on resize existing items keep their size and are moved proportionally to the new board (`Board.resize`).
4. **Keyboard play** (switch on): the canvas is a focusable `role="application"` and takes focus on start. `Board.focused` is the picked item (rim: solid `--moon` frame, `FOCUS_RIM`); it falls to the lowest on-board item (`focusLowest()`) whenever it is gone. Arrows call `Board.moveFocus(dir)` (nearest that way, wraps) and announce "Pumpkin"/"Fake item"; Enter calls `Session.catchFocused()`, which shares `catchItem()` with the click path. Keys are ignored for a focused button/link/switch, while paused, quitting or over. **Slower pace** (switch on): `Game({ pace: SLOW_PACE })` scales gravity, wind and the spawn interval; levels and `Math.random` order are unchanged.
   Clicking hit-tests items newest-first (`board.itemAt`, the one drawn on top) and removes the clicked one. Pumpkins give +1 point (`point` sound), faux items −1 (`error`); a level-up plays its own sound. Each click floats a label in `#effects` (a layer exactly over the canvas, resized with it): "+1", "−1", and from 5 pumpkins in a row a "+1" with a flame icon (labels only, no particles). A faux click or a lost pumpkin resets the streak, a missed click doesn't. Every `HEAL_STREAK` (10) pumpkins in a row while below 3 lives bring one heart back (`Game.healOnStreak()`, a rising heart popup and a pop on the heart; no sound).
5. A non-faux item falling past the bottom costs 1 life. You start with 3 lives. `board.step()` returns the lost pumpkins so the session can show a broken heart where each fell and flinch the board (`flinchBoard`). Pumpkins past 85% of the board height are drawn with a red rim (`DANGER_LINE`).
6. The game ends when lives hit 0. Points never go below 0. `Session.end` stops both loops and freezes the board (`session.over`: clicks and pause are ignored, the HUD stays), and after `GAME_OVER_BEAT_MS` (800 ms) fades in the `#end` dialog over the dimmed board and calls `renderEndGame(stats)`: score, level, best score (`localStorage`, "New best!"), caught / faux hit / best streak, **Play Again!** (focused) and **Home** (back to the start screen). `clearBoard()` removes the canvas, effects and HUD when a new game or the intro starts.
7. Esc during a game (`Session.askQuit`) freezes the game (no pause overlay) and shows `#quit` (`role="alertdialog"`, "Keep playing" focused). Esc again or Keep playing restores the previous state (paused or running); "Quit game" calls `stop()`, `onEnd` and `backToIntro()`. P/Space are ignored while it is open. On the game over screen a document-level listener in `main.js` sends Esc to the start screen.
8. **The game ships without sound** (`SOUND_ENABLED = false` in `config.js`, decision 2026-10-18): no `Audio` is created, nothing is requested, the speaker buttons are `hidden` (CSS also hides their `<li>`), M does nothing and no `sound-on/off` events fire; all the code stays. To bring sound back: add the mp3s named in `sound.js` to `assets/sound/`, set the flag, and update `privacy.html`/`how-to-play.html` (the M key). The driver patches the flag on by default (`openGame({ sound: false })` runs as shipped), so the sound specs still cover the dormant code. When on: music loops while a game runs; `hold()` pauses it and `stop()` ends it. Game over plays `try-again`, or `you-win` on a new best. M or any speaker button (HUD, start board, bottom bar; they carry `data-mute` and `toggleMuted()` updates all) mutes everything (kept in `localStorage`, sound on by default; the Start Game click is the gesture browsers need). Audio is plain `Audio` elements so `file://` works, and `play()` rejections are swallowed.
9. Pause clears the interval (or the fog timer, if the game is still in the opening fog) and cancels the animation frame. Resume restarts them; during the fog it plays again from the start. Hiding the tab pauses the game; the player resumes it.

## Conventions and quirks

- **State never touches the DOM.** `Game` and `Item` are plain state; methods like `game.addPoints(n)` and `game.loseLife()` return what happened. `Session` turns that into HUD updates, popups and banners, and owns the timers and listeners (it removes its own on `end()`).
- `Board` knows items, not rules: `step()` returns the lost pumpkins, `itemAt()` removes and returns the hit item. Scoring is the session's job.
- **Events go through `track(EVENTS.x)`** (GoatCounter): `game-start`, `start-sound-off`, `start-keyboard-play` and `start-slow-pace` (`startGame`), `game-over`, `pause` (deliberate pauses only, not the tab-hidden one), `quit-prompt`, `quit-keep-playing`, `quit-confirmed` (`Session`), `sound-on`/`sound-off` (`toggleMuted`). Never attach scores or other data to an event (`privacy.html` promises that); a new event also needs a line in the privacy page. The driver fakes `window.goatcounter` and exposes `eventsCounted()`; `openGame({ counter: false })` plays without it. `openGame({ keyboardPlay, slowPace })` seeds the options; `focusedItem()` reads the solid stroke (the danger frame is dashed) and the driver's context records `strokeRect`.
- Spawn order matters to seeded specs: `Game.nextSpawn()` and `Board.spawn()` must keep their `Math.random` call order.
- Tuning numbers go in `config.js`, not inline.
- CSS naming: state classes are `is-*` (`is-on`, `is-full`, `is-max`, `is-lost`), replayable animations are `anim-*` (`anim-pop`, `anim-hurt`, ...), and styles target classes, not ids. `config.js` writes the animation lengths to `--popup-ms`, `--popup-lost-ms` and `--level-up-ms` on `:root`. `Board` reads `--danger` and `--moon` for the item rims (rgba fallbacks when no stylesheet, as in jsdom).
- One `<nav>` and the HUD: the HUD lives in `.hud` (a `role="group"`, hidden while empty, with a visually hidden `h1` once a game starts), the site menu is `.site-nav`. Scope selectors to one of them. `getCanvasSize()` measures `header` and `.site-nav`, and the bar must stay in the layout (no margin) or the page scrolls.
- Content pages share `.page` styles. Adding a page means copying the bottom bar, the three favicon `<link>`s (`404.html` uses absolute paths) and the GoatCounter script tag into it, adding it to the e2e `PAGES` list, and adding it to `pages.yml` (it copies `*.html`).
- **Share and SEO tags are copied by hand into every indexable page** (no build step): `canonical` plus `og:type`, `og:site_name`, `og:url`, `og:title`, `og:description`, `og:image`, `og:image:alt` and `twitter:card` (X falls back to the `og:*` tags for the rest). A new page also goes into `sitemap.xml`; placeholders like `leaderboard.html` and `404.html` get `noindex` instead. `404.html` uses absolute `/trick-or-treat-game/...` paths because Pages serves it at any URL.
- The DOM ids keep the old "lifes" spelling (`lifes`, `lifeCount`); JS identifiers say "lives".
- UI is built imperatively with `document.createElement` in `hud.js`, `effects.js` and `screens.js`, not templates.

## Loose ends (left as-is unless asked)

- `getRandom(min, max)` excludes `max`; callers pass `max` one past the last wanted value.
- An earlier commit added Google Analytics, but the 2.0 refactor dropped it. Visit counting is GoatCounter now (see Stack).
