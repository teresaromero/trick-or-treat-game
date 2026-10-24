# Trick or Treat 3.0: roadmap

Branch: `3.0`. Last updated 2026-10-24. The single place for what is left and what changed. Item IDs (U, D, W, L) are kept because commit messages use them.

Working rules:

- A behavior change starts with a red spec (`test/`, or `e2e/` for real-browser bugs). Pure CSS, markup and copy changes don't need one.
- Specs read markup only through `test/driver.js`. If a spec has to change beyond the driver, the behavior changed: stop and check.
- New ideas take the next free ID (`U41`, `D27`, `W17`).

## Pending

Nothing blocks launch. What is left is manual verification and product decisions.

### To verify by hand

- [ ] Whole flow with VoiceOver (start, play, pause, quit, game over). Check "Caught 5" reads cleanly. Include Keyboard play: arrows reach the game inside `role="application"`, and "Pumpkin" / "Fake item" read cleanly.
- [ ] Sprite contrast against the night-sky board is at least 3:1 (1.4.11).
- [ ] Static pages at 375px and 200% zoom.
- [ ] A visual pass (desktop and mobile screenshots) of the finished 3.0 UI.
- [ ] Real-device check of touch input (W01) and board animation cost (W14).
- [ ] Sound on iOS Safari, only if sound ever returns (L08 is moot while it ships off).
- [ ] Teresa to review the wording of the Privacy and Terms pages (U36).

### Product decisions and ideas

- [ ] **U28** Play-test the difficulty curve: levels may bring too many pumpkins too soon. Review the spawn interval (1000 → 450 ms), gravity (1 → 2) and the 10 points per level. Numbers change only after play-testing.
- [ ] **U33** Witch color: undecided. Now `--moon` (`#fff1c9`) at 40% opacity, which reads as a warm grey over the night sky. Try a true grey (`--text-dim` or a new neutral token), or a tint that matches the board (`--fog`, `--faux`), and judge it on desktop and mobile. Keep the board visible through her.
- [ ] **U38** Game-loop ideas (2026-10-17): Witching Hour goal (reaching MAX counts as a win, time at MAX on the end card), best score in the HUD with a mid-run "New best!", per-stat bests and local achievements, a daily seeded challenge with a share button.
- [ ] **Contact** Consider publishing an email address. GitHub issues are the only contact on the privacy and terms pages.

### Later

- [ ] **U26** Score board to compare players (name, score, level). Needs a shared backend, since `localStorage` is per browser. `leaderboard.html` is a `noindex` "coming soon" placeholder, left out of the bottom bar until then. When it ships, add it back to every page, the tests and the e2e `PAGES` list.

## What's new in 3.0

Trick or Treat 3.0 keeps the same game (click the pumpkins, dodge the fake ones, don't let pumpkins fall) and makes it feel like a finished product.

**A game you can feel.** Every catch now answers back: a floating "+1" or "−1", a flame when you're on a streak, a broken heart and a little shake of the board when a pumpkin gets away. Pumpkins glow red as they near the bottom. Ten pumpkins in a row bring a lost heart back.

**A game that grows with you.** There are nine levels. Each one is a bit faster and busier, and every level-up greets you with a big number and a witch flying across the screen, without ever stopping play. Your first moments are gentler too: the game opens with a swirl of fog, and nothing penalizes you while you're still on zero.

**A better start and finish.** The start screen is now the board itself, with a bobbing title, your best score and a "Tap to start". When you lose, the board freezes for a beat and a card shows your score, level, best score and a "New best!" when you earn it, with Play Again or Home. Pause and quit (Esc) are friendly and always one key away.

**Playable by more people.** Keyboard play lets you pick and catch items with the arrow keys and Enter. A slower pace option gives more time. Screen readers announce progress, and the game adapts to small phones, big screens, reduced-motion settings and high-contrast modes.

**A proper little website.** The game is the front door, with How to play, About, Privacy and Terms pages one tap away in a bottom bar. A Leaderboard page is reserved for later.

**A fresh look.** A night-sky board, a consistent Halloween palette, self-hosted fonts and a single design system (`docs/design-system.md`) tie everything together. It loads faster, with no external libraries or tracking beyond anonymous visit counts.
