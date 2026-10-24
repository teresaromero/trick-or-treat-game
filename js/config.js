// Every tuning number of the game lives here.

// Levels only go up: difficulty is the highest level reached, not the score.
// Gravity is in px per 60 Hz frame (see FRAME_MS) and ramps in steps of 1/8,
// so no level feels like a jump. Fewer, faster items: the spawn interval
// drops 100 ms per level at first, then 50 ms, and ends at 450 ms.
const POINTS_PER_LEVEL = 10;
const MIN_BOARD_HEIGHT = 160; // px, however short the screen
const ANNOUNCE_EVERY = 5; // points between score announcements to screen readers
const LEVELS = [
  { at: 0, gravity: 1, wind: 0, ms: 1000 },
  {
    at: 10,
    gravity: 1.125,
    wind: 0,
    ms: 900,
    message: "Level 2: the pumpkins fall faster!",
  },
  {
    at: 20,
    gravity: 1.25,
    wind: 1,
    ms: 800,
    message: "Level 3: the wind picks up!",
  },
  {
    at: 30,
    gravity: 1.375,
    wind: 1.5,
    ms: 700,
    message: "Level 4: a storm is brewing!",
  },
  ...[40, 50, 60, 70].map((at, i) => ({
    at,
    gravity: 1.5 + i * 0.125,
    wind: 1.5,
    ms: 650 - i * 50,
    message: `Level ${i + 5}: the witches get mad! Faster pumpkins!`,
  })),
  {
    at: 80,
    gravity: 2,
    wind: 1.5,
    ms: 450,
    message: "Witching hour! Max level",
  },
];

const START_LIVES = 3;

// Share of the spawned items that are faux, once the score is above 0.
const FAUX_CHANCE = 0.2;

// How far above the board an item spawns, in item heights: anywhere from
// that high up to just off the edge, so it takes a moment to fall into view.
// The first item of a game starts close, right out of the opening fog.
const SPAWN_DEPTH = 2;
const FIRST_SPAWN_DEPTH = 0.5;

// Catches in a row before the streak shows, and between celebrations.
const STREAK_FROM = 5;

// Pumpkins in a row that bring back a lost heart (while below START_LIVES).
const HEAL_STREAK = 10;

// The frozen board stays in view this long before the game over card.
const GAME_OVER_BEAT_MS = 800;

// Speeds are tuned per frame of a 60 Hz screen.
const FRAME_MS = 1000 / 60;

// A long gap (slow tab, debugger) must not teleport items down the board.
const MAX_FRAMES_PER_STEP = 3;

// Fraction of the board height past which a falling item is "in danger".
const DANGER_LINE = 0.85;

// Items are a share of the shorter side of the board, within these bounds.
const ITEM_SIZE_RATIO = 0.12;
const ITEM_SIZE_MIN = 40;
const ITEM_SIZE_MAX = 80;

// Moving items are hard to hit exactly, so the hit box is a bit bigger.
const HIT_SLOP = 8;

// The game ships without audio; sound is a future feature. Set to true, with
// files in assets/sound/, to bring back the sounds, the speaker buttons and
// the M key.
const SOUND_ENABLED = false;

// Audio volumes, from 0 to 1. iOS Safari ignores them (only muting works).
const SOUND_VOLUME = { music: 0.35, effects: 0.8 };

// Slower pace (a start option): gravity and wind are multiplied by this and
// the spawn interval divided by it, so the board looks the same, just slower.
const SLOW_PACE = 0.6;

// The focus rim drawn around the item picked with the arrow keys.
const FOCUS_RIM = { width: 3, gap: 4 };

const POPUP_MS = { lost: 1100, catch: 900, faux: 900, heal: 1100 };
const LEVEL_UP_MS = 2400;

// The fog that opens a game; the first pumpkin comes out when it clears.
const SMOKE_MS = 2000;

// The CSS animations take their length from here.
const rootStyle = document.documentElement.style;
rootStyle.setProperty("--popup-ms", `${POPUP_MS.catch}ms`);
rootStyle.setProperty("--popup-lost-ms", `${POPUP_MS.lost}ms`);
rootStyle.setProperty("--popup-heal-ms", `${POPUP_MS.heal}ms`);
rootStyle.setProperty("--level-up-ms", `${LEVEL_UP_MS}ms`);
rootStyle.setProperty("--smoke-ms", `${SMOKE_MS}ms`);

const BEST_KEY = "trick-or-treat:best";
const KEYBOARD_KEY = "trick-or-treat:keyboard";
const SLOW_KEY = "trick-or-treat:slow";
