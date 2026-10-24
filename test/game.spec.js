// Behavior lock for the game as a player experiences it.
//
// These specs must survive refactors unchanged: they only use the player-level
// driver. If one needs editing during a refactor, the game's behavior changed.
// Known bugs from the tracker are deliberately not asserted here; each fix adds
// its own red spec.

import { afterEach, describe, expect, test } from "vitest";
import { openGame, seeded } from "./driver.js";

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
  test("Tap to start starts a game with 0 points and 3 lives", async () => {
    await playing();

    expect(g.screen()).toBe("playing");
    expect(g.score()).toBe(0);
    expect(g.lives()).toBe(3);
  });

});

describe("opening fog", () => {
  test("fog covers the board when the game starts", async () => {
    await playing();

    expect(g.smokeShowing()).toBe(true);
  });

  test("the board stays empty while the fog is thick", async () => {
    await playing({ random: PUMPKIN });
    g.advanceTime(1800);
    g.advanceFrames(1);

    expect(g.smokeShowing()).toBe(true);
    expect(g.visibleItems()).toEqual([]);
  });

  test("the first pumpkin drops out of the fog as it clears", async () => {
    await playing({ random: PUMPKIN });
    g.advanceTime(2100);
    g.advanceFrames(1);

    expect(g.smokeShowing()).toBe(false);
    const [first] = g.visibleItems();
    expect(first.kind).toBe("pumpkin");

    g.advanceTime(400);
    g.advanceFrames(1);
    const [later] = g.visibleItems();
    expect(later.y + later.h).toBeGreaterThan(0);
  });

  test("pausing in the fog and resuming still brings the first pumpkin", async () => {
    await playing({ random: PUMPKIN });
    g.advanceTime(400);
    g.togglePause();
    g.advanceTime(5000);
    g.advanceFrames(1);
    expect(g.visibleItems()).toEqual([]);

    g.togglePause();
    g.advanceTime(2100);
    g.advanceFrames(1);

    expect(g.visibleItems().length).toBeGreaterThanOrEqual(1);
  });

  test("quitting in the fog leaves nothing behind", async () => {
    await playing({ random: PUMPKIN });
    g.advanceTime(300);
    g.pressKey("Escape");
    g.confirmQuit();
    g.advanceTime(5000);

    expect(g.screen()).toBe("intro");
    expect(g.hasCanvas()).toBe(false);
  });

  test("with reduced motion there is no fog and no wait", async () => {
    await playing({ random: PUMPKIN, reducedMotion: true });
    g.advanceFrames(1);

    expect(g.smokeShowing()).toBe(false);
    expect(g.visibleItems()).toHaveLength(1);
  });
});

describe("spawning", () => {
  test("items appear over time", async () => {
    await playing();

    g.advanceTime(4500);
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
    await playing({ random: PUMPKIN });
    scorePumpkins(1);
    g.setRandom(FAUX);

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

describe("item size", () => {
  async function itemWidthAt(viewport) {
    await playing({ random: PUMPKIN, viewport });
    const item = waitForSpawn();
    expect(item.w).toBe(item.h);
    const { width } = g.canvasSize();
    expect(item.x + item.w).toBeLessThanOrEqual(width);
    g.close();
    return item.w;
  }

  test("items are bigger on a big screen than on a phone", async () => {
    const phone = await itemWidthAt({ width: 390, height: 700 });
    const desktop = await itemWidthAt({ width: 1600, height: 900 });

    expect(desktop).toBeGreaterThan(phone);
  });

  test("items stay a tappable size on a phone", async () => {
    const phone = await itemWidthAt({ width: 390, height: 700 });

    expect(phone).toBeGreaterThanOrEqual(36);
  });
});

describe("preloading", () => {
  test("every sprite is requested before anything falls", async () => {
    await playing();

    const files = g.requestedImages();
    for (let n = 1; n <= 16; n++) {
      expect(files).toContain(`${String(n).padStart(3, "0")}.png`);
    }
    for (let n = 1; n <= 7; n++) {
      expect(files).toContain(`${String(n).padStart(3, "0")}-faux.png`);
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

describe("faux items at low scores", () => {
  test("no faux items fall while the score is 0", async () => {
    await playing({ random: FAUX });
    g.advanceTime(10_000);
    g.advanceFrames(1);

    expect(g.visibleItems().filter((i) => i.kind === "faux")).toEqual([]);
  });

  test("clicking a faux item at 1 point drops to 0 without ending the game", async () => {
    await playing({ random: PUMPKIN });
    scorePumpkins(1);
    g.setRandom(FAUX);
    const faux = waitForSpawn();

    g.click(faux);

    expect(g.score()).toBe(0);
    expect(g.screen()).toBe("playing");
  });
});

describe("faux items at 0 points", () => {
  test("clicking a faux item at 0 points shows no -1", async () => {
    await playing({ random: PUMPKIN });
    scorePumpkins(1);
    g.setRandom(FAUX);
    waitForSpawn();
    g.advanceFrames(1);
    waitForSpawn();

    // The first faux item takes the last point; the rest cost nothing.
    for (const item of g.visibleItems().filter((i) => i.kind === "faux")) {
      g.click(item);
    }

    expect(g.score()).toBe(0);
    expect(g.popups().filter((p) => p.kind === "faux")).toHaveLength(1);
  });
});

describe("overlapping items", () => {
  const overlap = (a, b) => ({
    x: (Math.max(a.x, b.x) + Math.min(a.x + a.w, b.x + b.w)) / 2,
    y: (Math.max(a.y, b.y) + Math.min(a.y + a.h, b.y + b.h)) / 2,
  });
  const covers = (item, { x, y }) =>
    x >= item.x && x <= item.x + item.w && y >= item.y && y <= item.y + item.h;

  // A faux item with a pumpkin drawn on top of it, and a point only they cover.
  function pumpkinOverFaux() {
    const items = g.visibleItems();
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        if (items[i].kind !== "faux" || items[j].kind !== "pumpkin") continue;
        const point = overlap(items[i], items[j]);
        const covering = items.filter((item) => covers(item, point));
        const both = covers(items[i], point) && covers(items[j], point);
        if (both && covering.length === 2) return point;
      }
    }
    return undefined;
  }

  test("a click on overlapping items hits the one drawn on top", async () => {
    // Past 20 points items drift sideways and cross each other's path. A
    // narrow board makes that happen often; a tall one keeps pumpkins from
    // falling off during the search.
    await playing({
      random: seeded(1),
      viewport: { width: 300, height: 20000 },
    });
    scorePumpkins(21);
    g.advanceUntil(() => pumpkinOverFaux() !== undefined);
    // Something is on top of something else, and the pumpkin is the visible one.
    const point = pumpkinOverFaux();
    const before = g.score();

    g.clickAt(point.x, point.y);

    expect(g.score()).toBe(before + 1);
  });
});

describe("forgiving hits", () => {
  test("a click just outside a pumpkin's edge still catches it", async () => {
    await playing({ random: PUMPKIN });
    const pumpkin = waitForSpawn();

    g.clickAt(pumpkin.x - 6, pumpkin.y + pumpkin.h / 2);

    expect(g.score()).toBe(1);
  });

  test("a click well away from a pumpkin misses", async () => {
    await playing({ random: PUMPKIN });
    const pumpkin = waitForSpawn();

    g.clickAt(pumpkin.x - 30, pumpkin.y + pumpkin.h / 2);

    expect(g.score()).toBe(0);
  });
});

describe("missed clicks", () => {
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

    g.advanceUntil(() => g.lives() === 3 && g.visibleItems().length > 1);
    let tracked = g.visibleItems().at(-1);
    g.advanceFrames(1);
    const step = findItem(tracked).y - tracked.y;

    let moved;
    while (g.lives() === 3) {
      tracked = findItem(tracked);
      g.advanceFrames(1);
      moved = findItem(tracked).y - tracked.y;
    }

    expect(moved).toBeCloseTo(step);
  });

  test("faux items that fall off the bottom leave the board", async () => {
    await playing({ random: FAUX });
    waitForSpawn();

    g.advanceFrames(1000);

    const { height } = g.canvasSize();
    expect(g.visibleItems().length).toBeGreaterThan(0);
    expect(g.visibleItems().every((item) => item.y <= height)).toBe(true);
  });

  test("a faux item falling off the bottom costs nothing", async () => {
    await playing({ random: PUMPKIN });
    scorePumpkins(1);
    g.setRandom(FAUX);
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

  test("the end screen shows the level reached", async () => {
    await playing({ random: PUMPKIN });
    scorePumpkins(10);

    g.advanceUntil(() => g.screen() !== "playing");

    expect(g.finalLevel()).toBe(2);
  });

  test("the board stays visible behind the game over screen", async () => {
    await playing({ random: PUMPKIN });

    g.advanceUntil(() => g.screen() === "game over");

    expect(g.hasCanvas()).toBe(true);
    expect(g.visibleItems().length).toBeGreaterThan(0);
    expect(g.lives()).toBe(0);
  });

  test("the card waits a beat so you see how you lost", async () => {
    await playing({ random: PUMPKIN });

    g.advanceUntil(() => g.lives() === 0);

    expect(g.screen()).not.toBe("game over");
    g.advanceTime(400);
    expect(g.screen()).not.toBe("game over");
    g.advanceTime(500);
    expect(g.screen()).toBe("game over");
  });

  test("the board is frozen after the last life", async () => {
    await playing({ random: PUMPKIN });
    g.advanceUntil(() => g.lives() === 0);
    const frozen = g.visibleItems();

    g.advanceFrames(20);

    expect(g.visibleItems()).toEqual(frozen);
  });

  test("clicks do not score once the last life is gone", async () => {
    await playing({ random: PUMPKIN });
    scorePumpkins(2);
    g.advanceUntil(() => g.lives() === 0);
    const [item] = g.visibleItems();

    g.click(item);

    expect(g.score()).toBe(2);
  });

  test("the card shows the best score, marked new on a first game", async () => {
    await playing({ random: PUMPKIN });
    scorePumpkins(3);
    g.advanceUntil(() => g.screen() === "game over");

    expect(g.endStats().best).toBe(3);
    expect(g.isNewBest()).toBe(true);
  });

  test("a worse game keeps the old best without the new best mark", async () => {
    await playing({ random: PUMPKIN });
    scorePumpkins(3);
    g.advanceUntil(() => g.screen() === "game over");
    g.playAgain();
    scorePumpkins(1);

    g.advanceUntil(() => g.screen() === "game over");

    expect(g.finalScore()).toBe(1);
    expect(g.endStats().best).toBe(3);
    expect(g.isNewBest()).toBe(false);
  });

  test("the card shows what the run was made of", async () => {
    await playing({ random: PUMPKIN });
    scorePumpkins(4);
    g.setRandom(FAUX);
    g.click(waitForSpawn());
    g.setRandom(PUMPKIN);

    g.advanceUntil(() => g.screen() === "game over");

    expect(g.endStats()).toMatchObject({
      caught: 4,
      fauxHit: 1,
      bestStreak: 4,
    });
  });

  test("Play Again has the focus and Enter starts a new game", async () => {
    await playing({ random: PUMPKIN });
    g.advanceUntil(() => g.screen() === "game over");

    expect(g.focusedButton()).toBe("Play Again!");
    g.pressEnterOnFocus();

    expect(g.screen()).toBe("playing");
    expect(g.score()).toBe(0);
    expect(g.lives()).toBe(3);
  });

  test("Home goes back to the intro and Tap to start starts fresh", async () => {
    await playing({ random: PUMPKIN });
    g.advanceUntil(() => g.screen() === "game over");

    g.backToIntro();
    expect(g.screen()).toBe("intro");
    expect(g.hasCanvas()).toBe(false);

    g.start();
    expect(g.screen()).toBe("playing");
    expect(g.score()).toBe(0);
    expect(g.lives()).toBe(3);
  });
});

describe("pause", () => {
  test("pausing covers the board with a message saying how to resume", async () => {
    await playing();
    expect(g.pausedMessage()).toBeUndefined();

    g.togglePause();
    expect(g.pausedMessage()).toMatch(/paused/i);

    g.togglePause();
    expect(g.pausedMessage()).toBeUndefined();
  });

  test("clicking the message resumes the game", async () => {
    await playing({ random: PUMPKIN });
    waitForSpawn();
    g.togglePause();

    g.resumeFromOverlay();

    expect(g.isPaused()).toBe(false);
    expect(g.pausedMessage()).toBeUndefined();
    g.advanceUntil(() => g.visibleItems().length === 2);
  });

  test("the pause control says what it does", async () => {
    await playing();
    expect(g.pauseControlLabel()).toBe("Pause");

    g.togglePause();
    expect(g.pauseControlLabel()).toBe("Resume");
  });

  test("the P key pauses and resumes", async () => {
    await playing();

    g.pressKey("p");
    expect(g.isPaused()).toBe(true);

    g.pressKey("P");
    expect(g.isPaused()).toBe(false);
  });

  test("P with Ctrl or Cmd (print) doesn't pause", async () => {
    await playing();

    g.pressKey("p", { ctrlKey: true });
    g.pressKey("p", { metaKey: true });

    expect(g.isPaused()).toBe(false);
  });

  test("the Space bar pauses and resumes", async () => {
    await playing();

    g.pressKey(" ");
    expect(g.isPaused()).toBe(true);
    expect(g.pausedMessage()).toMatch(/space/i);

    g.pressKey(" ");
    expect(g.isPaused()).toBe(false);
  });

  test("the pause keys do nothing on the intro", async () => {
    g = await openGame();

    g.pressKey("p");

    expect(g.screen()).toBe("intro");
  });

  test("the pause keys do nothing on the game over screen", async () => {
    await playing({ random: PUMPKIN });
    g.advanceUntil(() => g.screen() === "game over");

    g.pressKey("p");
    g.pressKey(" ");

    expect(g.screen()).toBe("game over");
  });

  describe("keyboard and screen reader details", () => {
    test("the quit question reads its explanation", async () => {
      await playing({ random: PUMPKIN });
      g.pressKey("Escape");
      expect(g.quitDescription()).toMatch(/score/i);
    });

    test("resuming gives focus back to where it was before pausing", async () => {
      await playing({ random: PUMPKIN });
      g.focusMenuLink("About");
      g.pressKey("p");
      g.pressKey("p");
      expect(g.focusedLink()).toBe("About");
    });

    test("the page keeps a heading while playing", async () => {
      await playing({ random: PUMPKIN });
      expect(g.headings()).toEqual(["Trick or Treat"]);
    });
  });

  describe("quitting with Esc", () => {
    test("Esc asks before leaving and holds the game", async () => {
      await playing({ random: PUMPKIN });
      const pumpkin = waitForSpawn();

      g.pressKey("Escape");

      expect(g.quitPrompt()).toMatch(/quit/i);
      expect(g.pausedMessage()).toBeUndefined();
      expect(g.screen()).toBe("playing");
      g.advanceTime(5000);
      expect(g.visibleItems()[0].y).toBe(pumpkin.y);
    });

    test("confirming goes back to the intro", async () => {
      await playing();

      g.pressKey("Escape");
      g.confirmQuit();

      expect(g.screen()).toBe("intro");
      expect(g.hasCanvas()).toBe(false);
      expect(g.hasHud()).toBe(false);
      expect(g.quitPrompt()).toBeUndefined();
    });

    test("keep playing resumes the game", async () => {
      await playing({ random: PUMPKIN });

      g.pressKey("Escape");
      g.keepPlaying();

      expect(g.quitPrompt()).toBeUndefined();
      expect(g.isPaused()).toBe(false);
      g.advanceUntil(() => g.visibleItems().length === 2);
    });

    test("Esc again dismisses the question and resumes", async () => {
      await playing();

      g.pressKey("Escape");
      g.pressKey("Escape");

      expect(g.quitPrompt()).toBeUndefined();
      expect(g.isPaused()).toBe(false);
    });

    test("Esc on a paused game still asks, and cancelling keeps it paused", async () => {
      await playing();
      g.pressKey("p");

      g.pressKey("Escape");
      expect(g.quitPrompt()).toMatch(/quit/i);

      g.keepPlaying();
      expect(g.quitPrompt()).toBeUndefined();
      expect(g.isPaused()).toBe(true);
    });

    test("the paused overlay can't resume the game under the question", async () => {
      await playing({ random: PUMPKIN });
      g.pressKey("p");
      g.pressKey("Escape");

      g.focusPausedMessage();
      g.pressEnterOnFocus();

      expect(g.quitPrompt()).toMatch(/quit/i);
      expect(g.isPaused()).toBe(true);
    });

    test("the pause keys do nothing while the question is open", async () => {
      await playing();
      g.pressKey("Escape");

      g.pressKey("p");

      expect(g.quitPrompt()).toMatch(/quit/i);
    });

    test("a new game starts after quitting", async () => {
      await playing();
      g.pressKey("Escape");
      g.confirmQuit();

      g.start();

      expect(g.screen()).toBe("playing");
      expect(g.lives()).toBe(3);
      expect(g.score()).toBe(0);
    });

    test("Esc on the game over screen goes back to the intro", async () => {
      await playing({ random: PUMPKIN });
      g.advanceUntil(() => g.screen() === "game over");

      g.pressKey("Escape");

      expect(g.screen()).toBe("intro");
    });

    test("Esc does nothing on the intro", async () => {
      g = await openGame();

      g.pressKey("Escape");

      expect(g.screen()).toBe("intro");
      expect(g.quitPrompt()).toBeUndefined();
    });
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

describe("leaving the tab", () => {
  test("the game pauses while the tab is hidden", async () => {
    await playing({ random: PUMPKIN, viewport: { width: 1000, height: 20000 } });
    waitForSpawn();

    g.hideTab();
    g.advanceTime(10_000);
    g.showTab();
    g.advanceFrames(1);

    expect(g.visibleItems()).toHaveLength(1);
    expect(g.isPaused()).toBe(true);
    expect(g.pausedMessage()).toMatch(/paused/i);
  });

  test("the player resumes the game when they are back", async () => {
    await playing({ random: PUMPKIN, viewport: { width: 1000, height: 20000 } });
    waitForSpawn();
    g.hideTab();
    g.showTab();

    g.togglePause();
    g.advanceUntil(() => g.visibleItems().length === 2);

    expect(g.isPaused()).toBe(false);
  });

  test("a game the player paused stays paused when the tab is hidden and shown", async () => {
    await playing({ random: PUMPKIN });
    g.togglePause();

    g.hideTab();
    g.showTab();

    expect(g.isPaused()).toBe(true);
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

  test("items fall faster as soon as the score reaches 10", async () => {
    await playing({ random: PUMPKIN });
    const slow = fallPerFrame();

    scorePumpkins(10);
    const fast = fallPerFrame();

    expect(fast).toBeGreaterThan(slow);
  });

  test("the first level-up is a small step, not a jump", async () => {
    await playing({ random: PUMPKIN });
    const slow = fallPerFrame();

    scorePumpkins(10);
    const fast = fallPerFrame();

    expect(fast / slow).toBeLessThan(1.2);
  });

  test("a level is kept when a faux item drops the score below it", async () => {
    await playing({ random: PUMPKIN });
    const slow = fallPerFrame();
    scorePumpkins(10);

    g.setRandom(FAUX);
    g.click(waitForSpawn());
    expect(g.score()).toBe(9);
    g.setRandom(PUMPKIN);

    expect(fallPerFrame()).toBeGreaterThan(slow);
  });
});

describe("screen refresh rate", () => {
  // How far the first item falls in 900 ms (less than a spawn interval).
  async function fallenIn900ms(options) {
    await playing({ random: PUMPKIN, ...options });
    const spawned = waitForSpawn();
    g.advanceTime(900);
    g.advanceFrames(1);
    const fallen = findItem(spawned).y - spawned.y;
    g.close();
    return fallen;
  }

  test("items fall at the same speed on a 60 Hz and a 120 Hz screen", async () => {
    const at60 = await fallenIn900ms({ frameMs: 16 });
    const at120 = await fallenIn900ms({ frameMs: 8 });

    expect(Math.abs(at120 - at60)).toBeLessThan(2);
  });
});

describe("level indicator", () => {
  const TALL = { width: 1000, height: 20000 };

  test("starts at level 1 with an empty bar", async () => {
    await playing();

    expect(g.level()).toBe(1);
    expect(g.levelProgress()).toEqual({ filled: 0, of: 10 });
    expect(g.levelMessage()).toBeUndefined();
  });

  test("each pumpkin fills one notch", async () => {
    await playing({ random: PUMPKIN, viewport: TALL });
    scorePumpkins(4);

    expect(g.levelProgress()).toEqual({ filled: 4, of: 10 });
  });

  test("a faux item empties a notch", async () => {
    await playing({ random: PUMPKIN, viewport: TALL });
    scorePumpkins(4);

    g.setRandom(FAUX);
    g.click(waitForSpawn());

    expect(g.levelProgress()).toEqual({ filled: 3, of: 10 });
  });

  test("reaching 10 points starts level 2 with an empty bar", async () => {
    await playing({ random: PUMPKIN, viewport: TALL });
    scorePumpkins(10);

    expect(g.level()).toBe(2);
    expect(g.levelProgress()).toEqual({ filled: 0, of: 10 });
  });

  test("a level-up announces what got harder, then goes away", async () => {
    await playing({ random: PUMPKIN, viewport: TALL });
    scorePumpkins(10);

    expect(g.levelMessage()).toMatch(/level 2/i);

    g.advanceTime(2500);
    g.advanceFrames(1);

    expect(g.levelMessage()).toBeUndefined();
  });

  test("a level-up is announced to screen readers along with the score", async () => {
    await playing({ random: PUMPKIN, viewport: TALL });
    scorePumpkins(10);

    expect(g.announcement()).toMatch(/10 points.*level 2/i);
  });

  test("a level-up grows the new level as a big number, then removes it", async () => {
    await playing({ random: PUMPKIN, viewport: TALL });
    expect(g.levelUpNumber()).toBeUndefined();

    scorePumpkins(10);
    expect(g.levelUpNumber()).toBe("2");

    g.advanceTime(2500);
    g.advanceFrames(1);
    expect(g.levelUpNumber()).toBeUndefined();
  });

  test("the last level shows MAX instead of a number", async () => {
    await playing({ random: PUMPKIN, viewport: TALL });
    scorePumpkins(80);

    expect(g.levelUpNumber()).toBe("MAX");
  });

  test("a witch flies across the screen on a level-up, then is gone", async () => {
    await playing({ random: PUMPKIN, viewport: TALL });
    expect(g.witchesFlying()).toBe(0);

    scorePumpkins(10);

    expect(g.witchesFlying()).toBe(1);
    expect(g.witchIsDecorative()).toBe(true);

    g.advanceTime(2500);
    g.advanceFrames(1);

    expect(g.witchesFlying()).toBe(0);
  });

  test("two level-ups in a row show one witch", async () => {
    await playing({ random: PUMPKIN, viewport: TALL });
    scorePumpkins(20);

    expect(g.witchesFlying()).toBe(1);
  });

  test("the level stays when a faux item drops the score below it", async () => {
    await playing({ random: PUMPKIN, viewport: TALL });
    scorePumpkins(10);

    g.setRandom(FAUX);
    g.click(waitForSpawn());

    expect(g.level()).toBe(2);
    expect(g.levelProgress()).toEqual({ filled: 0, of: 10 });
  });

  test("the last level shows a full bar and no next level", async () => {
    await playing({ random: PUMPKIN, viewport: TALL });
    scorePumpkins(80);

    expect(g.level()).toBe(9);
    expect(g.levelProgress()).toBe("max");
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

  test("the spawn rate already picks up in the first levels", async () => {
    await playing({ random: PUMPKIN, viewport: TALL });
    const slow = spawnedIn(10000);

    scorePumpkins(20);

    expect(spawnedIn(10000)).toBeGreaterThan(slow);
  });

  test("the spawn rate steps up at 40 points", async () => {
    await playing({ random: PUMPKIN, viewport: TALL });
    scorePumpkins(39);
    const before = spawnedIn(10000);

    scorePumpkins(40);

    expect(spawnedIn(10000)).toBeGreaterThan(before);
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

describe("item variety", () => {
  // The pictures of every item that shows up over a long game.
  function imagesSeenOver(spawns) {
    const seen = new Set();
    for (let i = 0; i < spawns; i++) {
      g.advanceTime(1000);
      g.advanceFrames(1);
      // Clear the board so no pumpkin reaches the bottom and ends the game.
      for (const item of g.visibleItems()) {
        seen.add(item.image);
        g.click(item);
      }
    }
    return seen;
  }

  test("every pumpkin and every faux picture eventually falls", async () => {
    await playing({ random: seeded(7), viewport: { width: 3000, height: 20000 } });

    const seen = imagesSeenOver(400);

    expect(seen).toContain("016.png");
    expect(seen).toContain("007-faux.png");
  });
});

describe("side walls", () => {
  test("windy items can reach the left edge of the board", async () => {
    await playing({
      random: seeded(5),
      viewport: { width: 300, height: 20000 },
    });
    scorePumpkins(21);

    let leftmost = Infinity;
    for (let i = 0; i < 600; i++) {
      g.advanceFrames(1);
      for (const item of g.visibleItems()) leftmost = Math.min(leftmost, item.x);
    }

    expect(leftmost).toBeLessThan(10);
  });
});

describe("spawn placement", () => {
  const overlaps = (a, b) =>
    Math.abs(a.x - b.x) < a.w && Math.abs(a.y - b.y) < a.h;

  test("a new item does not land on top of another when there is room", async () => {
    await playing({
      random: seeded(11),
      viewport: { width: 300, height: 20000 },
    });

    for (let i = 0; i < 40; i++) {
      const before = g.visibleItems().length;
      g.advanceUntil(() => g.visibleItems().length > before);
      const items = g.visibleItems();
      const fresh = items.at(-1);
      expect(items.slice(0, -1).filter((item) => overlaps(fresh, item))).toEqual([]);
    }
  });
});

describe("spawn columns", () => {
  test("an item can spawn against the left edge", async () => {
    await playing({ random: PUMPKIN });
    g.setRandom(0);

    expect(waitForSpawn().x).toBe(0);
  });

  test("an item can spawn against the right edge", async () => {
    await playing({ random: PUMPKIN });
    g.setRandom(0.999);

    const item = waitForSpawn();

    expect(item.x + item.w).toBeGreaterThan(g.canvasSize().width - 2);
  });
});

describe("feedback", () => {
  const latest = (kind) =>
    g
      .popups()
      .filter((popup) => popup.kind === kind)
      .at(-1);

  function catchPumpkin() {
    const pumpkin =
      g.visibleItems().find((item) => item.kind === "pumpkin") ?? waitForSpawn();
    g.click(pumpkin);
    g.advanceFrames(1);
    return pumpkin;
  }

  test("catching a pumpkin shows +1 where it was caught", async () => {
    await playing({ random: PUMPKIN });
    const pumpkin = waitForSpawn();

    g.click(pumpkin);

    expect(latest("catch").text).toBe("+1");
    expect(latest("catch").x).toBeCloseTo(pumpkin.x + pumpkin.w / 2);
    expect(latest("catch").y).toBeCloseTo(pumpkin.y + pumpkin.h / 2);
    expect(g.scoreReaction()).toBe("up");
  });

  test("clicking a faux item shows -1", async () => {
    await playing({ random: PUMPKIN });
    scorePumpkins(2);
    g.setRandom(FAUX);
    const faux = waitForSpawn();

    g.click(faux);

    expect(latest("faux").text).toBe("\u22121");
    expect(g.scoreReaction()).toBe("down");
  });

  test("a lost pumpkin shows a broken heart at the bottom and the board flinches", async () => {
    await playing({ random: PUMPKIN });
    const pumpkin = waitForSpawn();

    g.advanceUntil(() => g.lives() < 3);

    expect(latest("lost").x).toBeCloseTo(pumpkin.x + pumpkin.w / 2);
    expect(latest("lost").y).toBeGreaterThanOrEqual(g.canvasSize().height - 1);
    expect(g.boardFlinched()).toBe(true);
  });

  test("the +1 fades away after a moment", async () => {
    await playing({ random: PUMPKIN });
    g.click(waitForSpawn());
    expect(g.popups()).not.toEqual([]);

    g.advanceTime(1000);

    expect(g.popups().filter((popup) => popup.kind === "catch")).toEqual([]);
  });

  test("the broken heart fades away after a moment", async () => {
    await playing({ random: PUMPKIN });
    g.advanceUntil(() => g.lives() < 3);
    g.togglePause(); // nothing else falls while we wait

    g.advanceTime(1200);

    expect(g.popups().filter((popup) => popup.kind === "lost")).toEqual([]);
  });

  test("from the fifth pumpkin in a row the +1 gets a flame", async () => {
    await playing({ random: PUMPKIN });
    for (let i = 0; i < 4; i++) catchPumpkin();
    expect(latest("catch")).toMatchObject({ text: "+1", hasIcon: false });

    catchPumpkin();

    expect(latest("catch")).toMatchObject({ text: "+1", hasIcon: true });
    expect(latest("streak")).toBeUndefined();
  });

  test("clicking a faux item breaks the streak", async () => {
    await playing({ random: PUMPKIN });
    for (let i = 0; i < 4; i++) catchPumpkin();
    g.setRandom(FAUX);
    g.click(waitForSpawn());
    g.setRandom(PUMPKIN);

    catchPumpkin();

    expect(latest("catch")).toMatchObject({ text: "+1", hasIcon: false });
  });

  test("losing a pumpkin breaks the streak", async () => {
    await playing({ random: PUMPKIN });
    for (let i = 0; i < 4; i++) catchPumpkin();
    g.advanceUntil(() => g.lives() < 3);

    catchPumpkin();

    expect(latest("catch")).toMatchObject({ text: "+1", hasIcon: false });
  });

  test("a missed click shows nothing and keeps the streak", async () => {
    await playing({ random: PUMPKIN });
    for (let i = 0; i < 4; i++) catchPumpkin();
    g.advanceTime(1000);
    const popups = g.popups().length;

    g.clickAt(2, 2);
    expect(g.popups().length).toBe(popups);
    catchPumpkin();

    expect(latest("catch")).toMatchObject({ text: "+1", hasIcon: true });
  });

  test("a pumpkin close to the bottom is drawn in danger", async () => {
    await playing({ random: PUMPKIN });
    waitForSpawn();
    expect(g.itemsInDanger()).toEqual([]);

    g.advanceUntil(() => g.itemsInDanger().length > 0);

    const [pumpkin] = g.itemsInDanger();
    expect(pumpkin.y + pumpkin.h).toBeGreaterThan(g.canvasSize().height * 0.85);
    expect(g.lives()).toBe(3);
  });
});

describe("healing", () => {
  function catchPumpkins(n) {
    for (let i = 0; i < n; i++) {
      const pumpkin =
        g.visibleItems().find((item) => item.kind === "pumpkin") ??
        waitForSpawn();
      g.click(pumpkin);
      g.advanceFrames(1);
    }
  }

  async function hurt() {
    await playing({ random: PUMPKIN });
    g.advanceUntil(() => g.lives() < 3);
  }

  test("10 pumpkins in a row bring back a lost heart", async () => {
    await hurt();
    expect(g.lives()).toBe(2);

    catchPumpkins(9);
    expect(g.lives()).toBe(2);
    catchPumpkins(1);

    expect(g.lives()).toBe(3);
  });

  test("the returning heart shows a heart label where it was caught", async () => {
    await hurt();
    catchPumpkins(10);

    const heal = g.popups().filter((popup) => popup.kind === "heal").at(-1);
    expect(heal).toMatchObject({ hasIcon: true });
  });

  test("a faux click in the middle starts the count over", async () => {
    await hurt();
    catchPumpkins(5);
    g.setRandom(FAUX);
    g.click(waitForSpawn());
    g.setRandom(PUMPKIN);

    catchPumpkins(9);
    expect(g.lives()).toBe(2);
    catchPumpkins(1);

    expect(g.lives()).toBe(3);
  });

  test("with full lives nothing changes", async () => {
    await playing({ random: PUMPKIN });

    catchPumpkins(10);

    expect(g.lives()).toBe(3);
    expect(g.popups().filter((popup) => popup.kind === "heal")).toEqual([]);
  });

  test("a heart can come back again after the next 10", async () => {
    await hurt();
    catchPumpkins(10);
    g.advanceUntil(() => g.lives() < 3);

    catchPumpkins(10);

    expect(g.lives()).toBe(3);
  });
});

describe("keyboard and screen readers", () => {
  test("the intro focuses Tap to start and Enter starts the game", async () => {
    g = await openGame();

    expect(g.focusedButton()).toBe("Tap to start");
    g.pressEnterOnFocus();

    expect(g.screen()).toBe("playing");
  });

  test("Home gives the focus back to Tap to start", async () => {
    await playing({ random: PUMPKIN });
    g.advanceUntil(() => g.screen() === "game over");
    g.backToIntro();

    expect(g.focusedButton()).toBe("Tap to start");
  });

  test("the board has an accessible name", async () => {
    await playing();

    expect(g.boardLabel()).toMatch(/game board/i);
  });

  test("the start of a game is announced", async () => {
    await playing();

    expect(g.announcement()).toBe("Game started");
  });

  test("a single catch is not announced", async () => {
    await playing({ random: PUMPKIN });
    g.click(waitForSpawn());

    expect(g.announcement()).toBe("Game started");
  });

  test("every fifth point is announced with the score", async () => {
    await playing({ random: PUMPKIN, viewport: { width: 1000, height: 20000 } });
    scorePumpkins(4);
    expect(g.announcement()).toBe("Game started");

    scorePumpkins(5);

    expect(g.announcement()).toMatch(/5 points/);
  });

  test("a lost life is announced", async () => {
    await playing({ random: PUMPKIN });
    g.advanceUntil(() => g.lives() === 2);

    expect(g.announcement()).toMatch(/2 lives/);
  });
});

describe("without sound (as shipped)", () => {
  test("nothing plays and there are no speaker buttons", async () => {
    await playing({ random: PUMPKIN, sound: false });
    g.click(waitForSpawn());
    g.pressKey("m");

    expect(g.soundsHeard()).toEqual([]);
    expect(g.musicPlaying()).toBe(false);
    expect(g.speakerStates()).toEqual([]);
    expect(g.eventsCounted()).toEqual(["game-start"]);
  });
});

describe("start screen", () => {
  test("shows the best score after a game", async () => {
    await playing({ random: PUMPKIN });
    scorePumpkins(2);
    g.advanceUntil(() => g.screen() === "game over");
    g.backToIntro();

    expect(g.startBest()).toBe("2");
  });

  test("clicking the board starts the game", async () => {
    g = await openGame();

    g.clickStartBoard();

    expect(g.screen()).toBe("playing");
  });
});

describe("site menu", () => {
  test("links to the other pages", async () => {
    g = await openGame();

    expect(g.menuLinks()).toEqual([
      "Trick or Treat",
      "Game",
      "How to play",
      "About",
      "Privacy",
      "Terms",
    ]);
  });

});

describe("visit counter events", () => {
  test("starting a game is counted", async () => {
    g = await openGame();
    expect(g.eventsCounted()).toEqual([]);

    g.start();

    expect(g.eventsCounted()).toEqual(["game-start"]);
  });

  test("playing again counts another start", async () => {
    await playing();
    g.advanceUntil(() => g.screen() === "game over");

    g.playAgain();

    expect(g.eventsCounted()).toEqual(["game-start", "game-over", "game-start"]);
  });

  test("losing the last life counts a game over", async () => {
    await playing();

    g.advanceUntil(() => g.screen() === "game over");

    expect(g.eventsCounted()).toEqual(["game-start", "game-over"]);
  });

  test("pausing with the button, P and Space is counted, resuming is not", async () => {
    await playing();

    g.togglePause();
    g.togglePause();
    g.pressKey("p");
    g.pressKey("p");
    g.pressKey(" ");
    g.pressKey(" ");

    expect(g.eventsCounted()).toEqual(["game-start", "pause", "pause", "pause"]);
  });

  test("the pause when the tab is hidden is not counted", async () => {
    await playing();

    g.hideTab();
    g.showTab();

    expect(g.eventsCounted()).toEqual(["game-start"]);
  });

  test("Esc counts the question and keeping on playing counts the answer", async () => {
    await playing();

    g.pressKey("Escape");
    g.keepPlaying();
    g.pressKey("Escape");
    g.pressKey("Escape");

    expect(g.eventsCounted()).toEqual([
      "game-start",
      "quit-prompt",
      "quit-keep-playing",
      "quit-prompt",
      "quit-keep-playing",
    ]);
  });

  test("quitting counts the answer", async () => {
    await playing();

    g.pressKey("Escape");
    g.confirmQuit();

    expect(g.eventsCounted()).toEqual(["game-start", "quit-prompt", "quit-confirmed"]);
  });

  test("the game works without the counter", async () => {
    g = await openGame({ counter: false });

    g.start();
    g.togglePause();
    g.togglePause();
    g.pressKey("m");
    g.pressKey("Escape");
    g.keepPlaying();
    g.advanceUntil(() => g.screen() === "game over");

    expect(g.screen()).toBe("game over");
    expect(g.eventsCounted()).toEqual([]);
  });
});

describe("start options", () => {
  test("both switches start off", async () => {
    g = await openGame();

    expect(g.startOptions()).toEqual({ keyboardPlay: false, slowPace: false });
  });

  test("a switch flips without starting the game", async () => {
    g = await openGame();

    g.toggleKeyboardPlay();
    g.toggleSlowPace();

    expect(g.startOptions()).toEqual({ keyboardPlay: true, slowPace: true });
    expect(g.screen()).toBe("intro");
    expect(g.focusedSwitch()).toBe("Slower pace");
  });

  test("a returning visitor finds the switches as they left them", async () => {
    g = await openGame({ keyboardPlay: true, slowPace: true });

    expect(g.startOptions()).toEqual({ keyboardPlay: true, slowPace: true });
  });

  test("the choice is still there after a game", async () => {
    g = await openGame({ random: PUMPKIN });
    g.toggleKeyboardPlay();
    g.start();
    g.advanceUntil(() => g.screen() === "game over");

    g.backToIntro();

    expect(g.startOptions()).toEqual({ keyboardPlay: true, slowPace: false });
  });
});

describe("start options without storage", () => {
  test("a switch still works when the browser keeps nothing", async () => {
    g = await openGame({ storage: false });
    g.toggleKeyboardPlay();
    g.toggleSlowPace();

    g.start();

    expect(g.boardFocusable()).toBe(true);
    expect(g.eventsCounted()).toContain("start-keyboard-play");
    expect(g.eventsCounted()).toContain("start-slow-pace");
  });

  test("the choice is still there after a game", async () => {
    g = await openGame({ storage: false, random: PUMPKIN });
    g.toggleKeyboardPlay();
    g.start();
    g.advanceUntil(() => g.screen() === "game over");

    g.backToIntro();

    expect(g.startOptions()).toEqual({ keyboardPlay: true, slowPace: false });
  });
});

describe("keyboard play on phones and tablets", () => {
  test("is not offered, but the slower pace is", async () => {
    g = await openGame({ touchDevice: true });

    expect(g.startOptions()).toEqual({
      keyboardPlay: undefined,
      slowPace: false,
    });
  });

  test("stays off even if it was switched on before", async () => {
    g = await openGame({ touchDevice: true, keyboardPlay: true });

    g.start();

    expect(g.boardFocusable()).toBe(false);
    expect(g.boardRole()).toBe("img");
    expect(g.eventsCounted()).toEqual(["game-start"]);
  });

});

describe("keyboard play", () => {
  const FOG_MS = 2000;

  async function playingByKeys(options) {
    g = await openGame({ keyboardPlay: true, random: PUMPKIN, ...options });
    g.start();
    g.advanceTime(FOG_MS);
    g.advanceFrames(1);
    return g;
  }

  const onBoard = () => g.visibleItems().filter((item) => item.y >= 0);

  const lowest = () => [...g.visibleItems()].sort((a, b) => b.y - a.y)[0];

  test("the board takes focus, and names the keys", async () => {
    g = await openGame({ keyboardPlay: true });
    g.start();

    expect(g.boardFocusable()).toBe(true);
    expect(g.boardHasFocus()).toBe(true);
    expect(g.boardRole()).toBe("application");
    expect(g.boardDescription()).toMatch(/arrow/i);
    expect(g.boardDescription()).toMatch(/enter/i);
  });

  test("without the mode the board is a picture, and the keys do nothing", async () => {
    await playingByKeys({ keyboardPlay: false });
    g.advanceUntil(() => onBoard().length > 0);

    g.pressKey("ArrowRight");
    g.pressKey("Enter");
    g.advanceFrames(1);

    expect(g.boardFocusable()).toBe(false);
    expect(g.boardRole()).toBe("img");
    expect(g.focusedItem()).toBe(undefined);
    expect(g.score()).toBe(0);
  });

  test("the focus starts on the lowest item", async () => {
    await playingByKeys();
    g.advanceUntil(() => onBoard().length >= 2);
    g.advanceFrames(1);

    expect(g.focusedItem()).toEqual(lowest());
  });

  test("Enter catches the focused pumpkin", async () => {
    await playingByKeys();
    g.advanceUntil(() => onBoard().length >= 1);
    g.advanceFrames(1);

    g.pressKey("Enter");

    expect(g.score()).toBe(1);
    expect(g.popups().map((p) => p.kind)).toContain("catch");
  });

  test("Enter on a faux item costs a point", async () => {
    await playingByKeys();
    g.advanceUntil(() => onBoard().length >= 1);
    g.advanceFrames(1);
    g.pressKey("Enter");
    g.setRandom(FAUX);
    g.advanceUntil(() => g.focusedItem()?.kind === "faux");

    g.pressKey("Enter");

    expect(g.score()).toBe(0);
    expect(g.popups().map((p) => p.kind)).toContain("faux");
  });

  test("the focus moves on to the lowest item after a catch", async () => {
    await playingByKeys();
    g.advanceUntil(() => onBoard().length >= 2);
    g.advanceFrames(1);
    const first = g.focusedItem();

    g.pressKey("Enter");
    g.advanceFrames(1);

    expect(g.focusedItem()).not.toBe(undefined);
    expect(g.focusedItem()).not.toEqual(first);
    expect(g.focusedItem()).toEqual(lowest());
  });

  test("the focus moves on when the focused pumpkin is lost", async () => {
    await playingByKeys();
    g.advanceUntil(() => g.lives() === 2);
    g.advanceFrames(1);

    expect(g.focusedItem()).toEqual(lowest());
  });

  test("Right and Left move the focus across the board, and wrap", async () => {
    g = await openGame({ keyboardPlay: true, random: 0.1 });
    g.start();
    g.advanceTime(FOG_MS);
    g.setRandom(0.9);
    g.advanceUntil(() => onBoard().length >= 2);
    g.advanceFrames(1);
    const left = onBoard().sort((a, b) => a.x - b.x)[0];
    const right = onBoard().sort((a, b) => b.x - a.x)[0];
    expect(g.focusedItem()).toEqual(left);

    g.pressKey("ArrowRight");
    g.advanceFrames(1);
    expect(g.focusedItem().x).toBe(right.x);

    g.pressKey("ArrowRight");
    g.advanceFrames(1);
    expect(g.focusedItem().x).toBe(left.x);

    g.pressKey("ArrowLeft");
    g.advanceFrames(1);
    expect(g.focusedItem().x).toBe(right.x);
  });

  test("Up and Down move the focus along a column, and wrap", async () => {
    await playingByKeys();
    g.advanceUntil(() => onBoard().length >= 2);
    g.advanceFrames(1);
    const bottom = lowest();
    const top = onBoard().sort((a, b) => a.y - b.y)[0];

    g.pressKey("ArrowUp");
    g.advanceFrames(1);
    expect(g.focusedItem().y).toBeLessThan(bottom.y);

    g.pressKey("ArrowUp");
    g.advanceFrames(1);
    expect(g.focusedItem().y).toBeGreaterThan(top.y);

    g.pressKey("ArrowDown");
    g.advanceFrames(1);
    expect(g.focusedItem().y).toBeLessThan(lowest().y);
  });

  test("moving the focus says what is there", async () => {
    g = await openGame({ keyboardPlay: true, random: 0.1 });
    g.start();
    g.advanceTime(FOG_MS);
    g.setRandom(0.9);
    g.advanceUntil(() => onBoard().length >= 2);
    g.advanceFrames(1);

    g.pressKey("ArrowRight");

    expect(g.announcement()).toBe("Pumpkin");
  });

  test("the keys are ignored while paused", async () => {
    await playingByKeys();
    g.advanceUntil(() => onBoard().length >= 1);
    g.advanceFrames(1);

    g.pressKey("p");
    g.pressKey("Enter");
    g.pressKey("p");

    expect(g.score()).toBe(0);
  });

  test("the keys are ignored while the quit question is open", async () => {
    await playingByKeys();
    g.advanceUntil(() => onBoard().length >= 1);
    g.advanceFrames(1);

    g.pressKey("Escape");
    g.pressKey("Enter");
    g.keepPlaying();

    expect(g.score()).toBe(0);
  });

  test("Enter on the Pause button pauses instead of catching", async () => {
    await playingByKeys();
    g.advanceUntil(() => onBoard().length >= 1);
    g.advanceFrames(1);
    g.focusPauseControl();

    g.pressEnterOnFocus();

    expect(g.isPaused()).toBe(true);
    expect(g.score()).toBe(0);
  });

  test("Space still pauses", async () => {
    await playingByKeys();

    g.pressKey(" ");

    expect(g.isPaused()).toBe(true);
  });
});

describe("slower pace", () => {
  const FOG_MS = 2000;

  async function framesUntilFirstLoss(options) {
    g = await openGame({ random: PUMPKIN, ...options });
    g.start();
    let frames = 0;
    g.advanceUntil(() => {
      frames++;
      return g.lives() === 2;
    });
    g.close();
    return frames;
  }

  test("pumpkins take longer to fall", async () => {
    const normal = await framesUntilFirstLoss();
    const slow = await framesUntilFirstLoss({ slowPace: true });

    expect(slow).toBeGreaterThan(normal * 1.3);
  });

  test("fewer items come in the same time", async () => {
    g = await openGame({ random: PUMPKIN });
    g.start();
    g.advanceTime(FOG_MS + 3500);
    g.advanceFrames(1);
    const normal = g.visibleItems().length;
    g.close();

    g = await openGame({ random: PUMPKIN, slowPace: true });
    g.start();
    g.advanceTime(FOG_MS + 3500);
    g.advanceFrames(1);

    expect(g.visibleItems().length).toBeLessThan(normal);
  });
});

describe("visit counter events for the options", () => {
  test("starting with keyboard play and slower pace counts both", async () => {
    g = await openGame();
    g.toggleKeyboardPlay();
    g.toggleSlowPace();

    g.start();

    expect(g.eventsCounted()).toEqual([
      "game-start",
      "start-keyboard-play",
      "start-slow-pace",
    ]);
  });

  test("starting without them counts neither", async () => {
    g = await openGame();

    g.start();

    expect(g.eventsCounted()).toEqual(["game-start"]);
  });
});
