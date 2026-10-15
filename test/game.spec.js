// Behavior lock for the game as a player experiences it.
//
// These specs must survive refactors unchanged: they only use the player-level
// driver. If one needs editing during a refactor, the game's behavior changed.
// Known bugs from the tracker are deliberately not asserted here; each fix adds
// its own red spec.

import { afterEach, describe, expect, test } from "vitest";
import { openGame } from "./driver.js";

const PUMPKIN = 0.5; // a random value that spawns a pumpkin
const FAUX = 0.9; // a random value that spawns a faux item

let g;

afterEach(() => g?.close());

async function playing(options) {
  g = await openGame(options);
  g.start();
  return g;
}

function waitForSpawn() {
  const before = g.visibleItems().length;
  g.advanceUntil(() => g.visibleItems().length > before);
  return g.visibleItems().at(-1);
}

// The same item a few frames later: same column and kind, nearest below
// where it was (items only fall).
function findItem({ x, y, kind }) {
  return g
    .visibleItems()
    .filter((item) => item.x === x && item.kind === kind && item.y >= y)
    .sort((a, b) => a.y - b.y)[0];
}

function scorePumpkins(n) {
  while (g.score() < n) {
    let pumpkin = g.visibleItems().find((item) => item.kind === "pumpkin");
    if (!pumpkin) pumpkin = waitForSpawn();
    g.click(pumpkin);
    g.advanceFrames(1);
  }
}

describe("start", () => {
  test("opens on the intro with a Go! button", async () => {
    g = await openGame();

    expect(g.screen()).toBe("intro");
  });

  test("Go! starts a game with 0 points and 3 lives", async () => {
    await playing();

    expect(g.screen()).toBe("playing");
    expect(g.score()).toBe(0);
    expect(g.lives()).toBe(3);
  });

  test("the board is empty when the game starts", async () => {
    await playing();
    g.advanceFrames(1);

    expect(g.visibleItems()).toEqual([]);
  });
});

describe("spawning", () => {
  test("items appear over time", async () => {
    await playing();

    g.advanceTime(3500);
    g.advanceFrames(1);

    expect(g.visibleItems().length).toBeGreaterThanOrEqual(3);
  });

  test("items spawn above the board and fall into view", async () => {
    await playing({ random: PUMPKIN });
    const spawned = waitForSpawn();

    expect(spawned.y).toBeLessThan(0);

    g.advanceFrames(120);
    const later = findItem(spawned);
    expect(later.y).toBeGreaterThan(0);
  });

  test("items fall a little every frame", async () => {
    await playing({ random: PUMPKIN });
    const spawned = waitForSpawn();

    g.advanceFrames(1);
    const next = findItem(spawned);

    expect(next.y).toBeGreaterThan(spawned.y);
  });

  test("spawns pumpkins", async () => {
    await playing({ random: PUMPKIN });

    expect(waitForSpawn().kind).toBe("pumpkin");
  });

  test("spawns faux items", async () => {
    await playing({ random: FAUX });

    expect(waitForSpawn().kind).toBe("faux");
  });

  test("items spawn inside the board horizontally", async () => {
    await playing();
    g.advanceTime(10_000);
    g.advanceFrames(1);
    const { width } = g.canvasSize();

    for (const item of g.visibleItems()) {
      expect(item.x).toBeGreaterThanOrEqual(0);
      expect(item.x + item.w).toBeLessThanOrEqual(width);
    }
  });
});

describe("scoring", () => {
  test("clicking a pumpkin scores 1 point", async () => {
    await playing({ random: PUMPKIN });
    const pumpkin = waitForSpawn();

    g.click(pumpkin);

    expect(g.score()).toBe(1);
  });

  test("a clicked pumpkin disappears", async () => {
    await playing({ random: PUMPKIN });
    const pumpkin = waitForSpawn();

    g.click(pumpkin);
    g.advanceFrames(1);

    expect(g.visibleItems()).toEqual([]);
  });

  test("clicking a faux item takes 1 point", async () => {
    await playing({ random: PUMPKIN });
    scorePumpkins(2);
    g.setRandom(FAUX);
    const faux = waitForSpawn();

    g.click(faux);

    expect(g.score()).toBe(1);
    expect(g.screen()).toBe("playing");
  });

  test("a clicked faux item disappears", async () => {
    await playing({ random: PUMPKIN });
    scorePumpkins(2);
    g.setRandom(FAUX);
    const faux = waitForSpawn();

    g.click(faux);
    g.advanceFrames(1);

    expect(g.visibleItems().filter((i) => i.kind === "faux")).toEqual([]);
  });
});

describe("missed clicks", () => {
  test("missing at 0 points does not end the game", async () => {
    await playing({ random: PUMPKIN });
    waitForSpawn();

    g.clickAt(1, 1);

    expect(g.screen()).toBe("playing");
    expect(g.score()).toBe(0);
  });

  test("missing does not change the score", async () => {
    await playing({ random: PUMPKIN });
    scorePumpkins(3);

    g.clickAt(1, 1);

    expect(g.score()).toBe(3);
  });

  test("missing does not cost a life", async () => {
    await playing({ random: PUMPKIN });

    g.clickAt(1, 1);

    expect(g.lives()).toBe(3);
  });
});

describe("lives", () => {
  test("a pumpkin falling off the bottom costs 1 life", async () => {
    await playing({ random: PUMPKIN });

    g.advanceUntil(() => g.lives() < 3);

    expect(g.lives()).toBe(2);
    expect(g.screen()).toBe("playing");
  });

  test("other items keep falling on the frame a pumpkin is lost", async () => {
    await playing({ random: PUMPKIN });
    const newest = () => g.visibleItems().at(-1).y;

    g.advanceUntil(() => g.lives() === 3 && g.visibleItems().length > 1);
    let previous = newest();
    g.advanceFrames(1);
    const step = newest() - previous;

    while (g.lives() === 3) {
      previous = newest();
      g.advanceFrames(1);
    }

    expect(newest() - previous).toBe(step);
  });

  test("a faux item falling off the bottom costs nothing", async () => {
    await playing({ random: FAUX });
    waitForSpawn();

    // Long enough for the first faux items to fall well past the bottom.
    g.advanceFrames(1000);

    expect(g.lives()).toBe(3);
  });
});

describe("game over", () => {
  test("losing the last life ends the game", async () => {
    await playing();

    g.advanceUntil(() => g.screen() !== "playing");

    expect(g.screen()).toBe("game over");
  });

  test("the end screen shows the final score", async () => {
    await playing({ random: PUMPKIN });
    scorePumpkins(4);

    g.advanceUntil(() => g.screen() !== "playing");

    expect(g.finalScore()).toBe(4);
  });

  test("the board and HUD are removed", async () => {
    await playing();

    g.advanceUntil(() => g.screen() !== "playing");

    expect(g.hasCanvas()).toBe(false);
    expect(g.hasHud()).toBe(false);
  });
});

describe("pause", () => {
  test("the pause control toggles between paused and running", async () => {
    await playing();

    g.togglePause();
    expect(g.isPaused()).toBe(true);

    g.togglePause();
    expect(g.isPaused()).toBe(false);
  });

  test("nothing spawns or falls while paused", async () => {
    await playing({ random: PUMPKIN });
    const pumpkin = waitForSpawn();

    g.togglePause();
    g.advanceTime(5000);
    g.togglePause();
    g.advanceFrames(1);

    expect(g.visibleItems()).toHaveLength(1);
    const resumed = findItem(pumpkin);
    expect(resumed.y - pumpkin.y).toBeLessThanOrEqual(2);
  });

  test("clicks do not score while paused", async () => {
    await playing({ random: PUMPKIN });
    const pumpkin = waitForSpawn();

    g.togglePause();
    g.click(pumpkin);

    expect(g.score()).toBe(0);
  });

  test("no lives are lost while paused", async () => {
    await playing({ random: PUMPKIN });
    waitForSpawn();

    g.togglePause();
    g.advanceTime(60_000);

    expect(g.lives()).toBe(3);
    expect(g.screen()).toBe("playing");
  });
});

describe("play again", () => {
  test("starts a fresh game with 0 points and 3 lives", async () => {
    await playing({ random: PUMPKIN });
    scorePumpkins(2);
    g.advanceUntil(() => g.screen() !== "playing");

    g.playAgain();

    expect(g.screen()).toBe("playing");
    expect(g.score()).toBe(0);
    expect(g.lives()).toBe(3);
  });

  test("the new game starts with an empty board", async () => {
    await playing();
    g.advanceUntil(() => g.screen() !== "playing");

    g.playAgain();
    g.advanceFrames(1);

    expect(g.visibleItems()).toEqual([]);
  });
});

describe("difficulty", () => {
  function fallPerFrame() {
    const spawned = waitForSpawn();
    g.advanceFrames(10);
    return (findItem(spawned).y - spawned.y) / 10;
  }

  test("items fall faster once the score passes 10", async () => {
    await playing({ random: PUMPKIN });
    const slow = fallPerFrame();

    scorePumpkins(11);
    const fast = fallPerFrame();

    expect(fast).toBeGreaterThan(slow);
  });
});

describe("spawn speed", () => {
  const TALL = { width: 1000, height: 20000 };

  // How many items appear in the next `ms` of play.
  function spawnedIn(ms) {
    const before = g.visibleItems().length;
    g.advanceTime(ms);
    g.advanceFrames(1);
    return g.visibleItems().length - before;
  }

  // Lose a point to a faux item and win it back.
  function bounceScore() {
    g.setRandom(FAUX);
    g.click(waitForSpawn());
    g.setRandom(PUMPKIN);
    scorePumpkins(g.score() + 1);
  }

  test("items spawn faster as the score climbs", async () => {
    await playing({ random: PUMPKIN, viewport: TALL });
    const slow = spawnedIn(6000);

    scorePumpkins(60);

    // Without waiting for a pause: the new speed applies right away.
    expect(spawnedIn(6000)).toBeGreaterThan(slow);
  });

  test("going back and forth over a score does not keep speeding the game up", async () => {
    await playing({ random: PUMPKIN, viewport: TALL });
    scorePumpkins(45);

    // Enough landings on 45 to take a 1000 ms spawn interval down to 100 ms.
    for (let i = 0; i < 8; i++) bounceScore();
    // A pause and resume restarts spawning at whatever speed the game has.
    g.togglePause();
    g.togglePause();

    expect(spawnedIn(1000)).toBeLessThanOrEqual(5);
  });
});
