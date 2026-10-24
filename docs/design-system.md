# Design system

What the 3.0 UI is made of, as it exists in `css/index.css` and the `js/` files that build it. Everything is plain CSS on a token layer in `:root`; there is no framework. If a value here disagrees with the code, the code wins: fix this file.

## Principles

- **Black page, orange accent.** `--orange` is the one brand color. The board is a night sky inside an orange outline.
- **Score loud, the rest quiet.** The score is the biggest orange item in the HUD; lives and level are subdued.
- **Tokens only.** Colors, sizes, spacing and radii come from `:root` variables. `#f27503` appears once, in the definition. Animation lengths come from `config.js` (`--popup-ms`, `--popup-lost-ms`, `--popup-heal-ms`, `--level-up-ms`, `--smoke-ms`).
- **Classes, not ids, for styles.** State classes are `is-*` (`is-on`, `is-full`, `is-max`, `is-lost`); replayable animations are `anim-*` (`anim-pop`, `anim-wobble`, `anim-flash`, `anim-shake`, `anim-hurt`) and are re-triggered with `replay()` in `hud.js`.
- **Built imperatively.** Components are made with `document.createElement` in `hud.js`, `effects.js` and `screens.js`, so there are no templates to keep in sync.

## Tokens

### Color

| Token | Use |
|---|---|
| `--orange`, `--orange-hover` | Accent: buttons, score, borders, icons. Hover is lighter. |
| `--orange-tint`, `--orange-glow` | Secondary button hover; glow shadows. |
| `--moon` | Keyboard focus ring. |
| `--night-top`, `--night-bottom`, `--fog` | The board's sky gradient and the fog band at the bottom. |
| `--danger`, `--danger-glow` | Lost lives, max-level notches, the red rim near the bottom, the hurt flash. |
| `--faux` | The "−1" popup for faux items. |
| `--ink`, `--text`, `--text-dim` | Black, white, and 75% white for secondary text. |
| `--muted` | Empty hearts and notches (about 5.9:1 on black). |
| `--line` | Hairlines. |
| `--scrim`, `--scrim-strong` | 75% and 90% black behind overlays. |

`Board` reads `--danger` and `--moon` for item rims, with rgba fallbacks for jsdom.

### Type

- `--font-display`: Creepster, for the title, panel titles, HUD level, popups and the level-up number.
- `--font-body`: Arvo, for everything else.
- Sizes: `--text-sm` 0.875, `-md` 1, `-lg` 1.25, `-xl` 1.5, `-2xl` 2, `-3xl` 2.5, `-4xl` 3 (rem).

### Space, shape and size

- Space: `--space-1` 0.25 rem to `--space-6` 2 rem (1: 0.25, 2: 0.5, 3: 0.75, 4: 1, 5: 1.5, 6: 2).
- Radius: `--radius-sm` 0.25 rem (buttons, panels), `--radius-md` 0.5 rem (board), `--radius-pill` 1 rem (badge).
- Glow: `--glow`, `--glow-lg`, `--glow-danger`.
- Icons: `--icon-md` 1.5 rem, `--icon-lg` 2 rem, `--icon-xl` 4 rem. Icons are inline SVG constants in `js/icons.js`.
- `--hit-min`: 2.75 rem (44 px), the minimum touch target for buttons.

## Components

### Button (`.btn`)

The one text button. Orange fill, black text, `--hit-min` high.

| Variant | Class | Use |
|---|---|---|
| Primary | `.btn` | Start Game, Play Again!, Keep playing. |
| Secondary | `.btn .btn-secondary` | Transparent with an orange border: How to play, Quit game. |

States: hover lightens the fill (secondary gets `--orange-tint`), `:active` nudges 1 px down, `:disabled` is 50% opaque with `not-allowed`. Keyboard focus shows a 2 px `--moon` ring (`:focus-visible`).

Accessibility: always a real `<button type="button">`. Each screen focuses its primary action when it opens (Start Game, Play Again!, Keep playing).

### HUD button (`.hud-button`)

The icon-only pause button in the nav. `--hit-min` square, no fill, turns orange on hover. `setPauseIcon()` swaps the Lucide pause/play icon and sets `aria-label` ("Pause" or "Resume") and a `title` with the shortcut. It is disabled when the game ends.

### Panel (`.panel`)

The card for the intro, the game over screen and the quit question: black, 1 px orange border, `--glow-lg`, padding `--space-5`. Contents: `.panel-title` (display font, 2.5 rem, orange), `.panel-text`, then buttons.

| Panel | Where | Notes |
|---|---|---|
| Intro | `#intro` | Guide (`.guide`, good and bad sprites with captions), rules list (`.rules`), Start Game. |
| Game over | `#end`, `.end-screen` | `role="dialog"`, `aria-modal`, labelled by its title, described by its text. Score, level, best (`.badge` "New best!"), three `.stat`s (caught, faux hit, best streak), Play Again!, How to play. |
| Quit question | `#quit`, `.end-screen` | `role="alertdialog"`, `aria-modal`, labelled by its title. "Quit this game?", Keep playing (focused), Quit game. |

`.end-screen` is the overlay for the last two: it fills the `<main>` cell, dims the board with `--scrim` (fade `dim`) and brings the panel in (`card-in`), 24 rem wide at most.

### Mute button (`#mute`)

The speaker button after pause, same look as the pause button. `setMuteIcon()` swaps the Lucide volume-2/volume-x icon and sets `aria-pressed`; the label stays "Mute" (a toggle), with the title "Mute (M)". It silences music and effects together, the choice is kept in `localStorage`, and it keeps working on the game over screen.

### Pause overlay (`.paused`)

A single `<button id="paused">` over the board with `--scrim-strong`: a big play icon, "Paused" in the display font and a small hint ("Tap, click, P or Space to resume"). Clicking it resumes. Its focus ring is drawn inside (`outline-offset: -4px`).

### HUD (`#controls`)

A `<ul>` in the `<nav>`, at most 40 rem wide: lives on the left, level in the middle, score, pause and mute on the right.

- **Hearts** (`.hearts`, `.heart-icon`): one per life. `is-full` fills them orange; an empty heart is a `--muted` outline. Losing one plays `shake` (`is-lost`); getting one back plays `pop` (`anim-pop`). The group is a `role="img"` labelled "N lives".
- **Level** (`.level`): `.level-badge` ("LV n", decorative) and `.notches`, ten `.notch` boxes, one per point toward the next level. `is-on` fills a notch; `is-max` turns all of them red. It is a `role="progressbar"` with `aria-valuetext` like "Level 2, 3 of 10 to level 3". Animations: `anim-pop` on a new notch and on a level-up badge, `anim-flash` on level-up, `anim-shake` on a lost point.
- **Score** (`.score`, `.point-count`): pumpkin icon and a 2.5 rem orange number, `role="img"` labelled "N points". `anim-pop` when it goes up, `anim-wobble` (red) when it goes down.
- **Announcer** (`#announcer`, `.sr-only`, `aria-live="polite"`): score and lives are read here as short messages, so a screen reader doesn't re-read the whole HUD.

### Key diagram (`.keys`)

A `<figure aria-hidden="true">` on How to play, built from `<kbd>` keycaps (HTML, not SVG, so the text doesn't shrink on a phone and wraps with `flex-wrap`): arrows in an inverted T ("Pick an item"), Enter in orange ("Catch it"), P and Space ("Pause"), Esc ("Quit"). Decorative: the Controls list above it carries the same information for assistive tech, so keep the two in step.

### Switch (`.switch`)

An on/off option on the start board (`createSwitch()` in `screens.js`): a `<button role="switch" aria-checked>` with a pill track (`.switch-track`) and the label. The thumb moves from left to right and the track turns orange, so the state doesn't rest on color alone. It reuses the `--moon` focus ring and a 44 px hit area, and under `forced-colors` the track uses `CanvasText` and the on thumb `Highlight`. Two sit in `.start-options` (`role="group"`, "Options"): Keyboard play and Slower pace. Clicking one never starts the game.

### Board (`canvas`)

Night-sky gradient, orange outline and glow. Outline and shadow take no layout space, so `getCanvasSize()` stays exact. `role="img"` with a label that explains the game; with keyboard play it is a focusable `role="application"` and the item picked with the arrow keys wears a solid `--moon` frame (`FOCUS_RIM`; the danger frame is dashed). `anim-hurt` (red flash and shake) plays when a pumpkin is lost. Pumpkins past the danger line are drawn with a red rim.

Contrast modes: `prefers-contrast: more` drops the gradient and the glow and thickens the outline; `forced-colors: active` uses `CanvasText`.

### Popup (`.popup`, `#effects`)

A label that floats from where something happened, in a layer exactly over the board (`#effects`, `aria-hidden`, no pointer events). Created by `renderPopup(kind, text, x, y, { icon, size })`, removed after `POPUP_MS[kind]`.

| Kind | Look | Motion |
|---|---|---|
| `catch` | Orange "+1"; from a 5-pumpkin streak it carries a flame icon and grows with the streak (`--n`, capped at 20) | rises and fades (`rise`) |
| `faux` | `--faux` purple "−1" | sinks and fades (`sink`) |
| `heal` | Orange filled heart, 2 rem, above the caught pumpkin | rises, longer (`--popup-heal-ms`) |
| `lost` | Red broken heart, 2 rem, anchored above the bottom edge | rises, longer (`--popup-lost-ms`) |

Popups are decorative: the announcer carries the information.

### Level-up (`.level-up`)

The level-up moment, fixed over the whole screen (`overflow: hidden`, `pointer-events: none`, the game keeps running). The new level (`.level-up-number`, `MAX` on the last level) is a big orange display-font number with `--glow-lg`: it pops in at the middle of the screen, holds readable for about a second, then grows to 14 times its size while fading to nothing (`level-grow`, over `--level-up-ms`, 2.4 s). It is never fully opaque and is almost gone by the time it fills the screen, so the board stays playable. Under it a small caption (`.level-up-caption`, no box, dark text shadow) says what got harder and fades out before the number does (`level-caption`). The caption is `role="status"` (announced politely); the number is `aria-hidden`. The wrapper (`#level-up`) removes itself, and a new level-up replaces one still showing. With reduced motion both stay still for 2.4 s.

### Opening fog (`.smoke`, `#effects`)

Over the whole board for `--smoke-ms` (`SMOKE_MS`, 2 s) when a game starts or resumes from a pause before the first pumpkin: three `.smoke-puff` layers (`is-a`, `is-b`, `is-c`), each a mist texture (`assets/img/fog1-3.webp`, about 70 KB each, lavender on transparent with soft rectangular edges) that swells, drifts and fades. The layers are 32% bigger than the board (`inset: -16%`), so the faded edges stay outside it and every corner is covered; their peak opacity is 0.45 each, so the board shows through (`smoke-drift`, staggered by `--delay`, all ending together). No random calls. The textures are generated, not copied (see the decision note), and `preloadAssets()` fetches them with the sprites. The first pumpkin spawns when it ends. It is decorative (inside `aria-hidden` `#effects`), and with reduced motion it is not shown and the pumpkin comes right away.

### Witch (`.witch`)

Shown with every level-up: a `--moon` silhouette of a witch on a broom (`WITCH_ICON`, by Freepik, credited in the footer) fixed to the viewport. It is 40% opaque, so the board stays visible through it, and flies from one edge to the other over `--level-up-ms` while bobbing (`witch-fly`, `witch-bob`). The side is random on each level-up so it can't be predicted: from the left by default, or `is-leftwards` (from the right, mirrored, `witch-fly-back`). It is `aria-hidden` and `pointer-events: none`; the caption carries the message. With reduced motion it simply waits off screen, on its starting side. A new level-up replaces a witch still flying.

## Motion and accessibility

- With `prefers-reduced-motion: reduce` no animation runs, except popups, which fade in place (`fade`). The opening fog, the level-up number and the witch are not shown at all, and the first pumpkin comes right away.
- Every control is reachable and operable with the keyboard: Enter starts, P or Space pauses, M mutes, Esc asks to quit (Esc on the game over screen goes to the intro). Space on a focused button keeps its own meaning.
- Targets are at least 44 px (`--hit-min`). The board uses `touch-action: manipulation`.
- Text and icon colors are chosen for contrast on black (`--muted` is the lowest, about 5.9:1).
- Modal screens (`#end`, `#quit`) use `aria-modal` and move focus to their primary action.

## Site structure (3.0)

- **Bottom bar** (`.site-nav`): on every page, 56 px tall, `--bar` background. Logo link, then page links on the left; Privacy, Terms and (game page) a speaker button on the right. The current page has `aria-current="page"` and a lighter background. On phones the logo text hides and the bar scrolls sideways.
- **Board** (`.board`): the night-sky frame shared by the `<canvas>` and the start screen.
- **Start screen** (`#start.board.start`): title (`h1`, Creepster, glow) and pumpkin in `.anim-bob`, `.best` top right, `.board-button` top left, one `.btn` "Tap to start", a "How to play" link. Same size as the canvas, so starting doesn't move the page.
- **`anim-bob`**: a 2.4 s alternate `translateY` float; off with `prefers-reduced-motion`.
- **Content page** (`main.page`): a 45rem column, Creepster `h1`/`h2` in orange, dim body text, a "▶ Play Trick or Treat" `.btn` first. Needs `place-items: normal` because `main` centers its grid children.
