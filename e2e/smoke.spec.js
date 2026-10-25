// Real-browser smoke tests: the page as GitHub Pages serves it, with the
// real async script loading, real canvas and real mouse clicks. The jsdom
// suite in test/ covers behavior in depth; these only check that it holds
// up in an actual browser.

import { expect, test } from "@playwright/test";

const FRAME = 16;
// The opening fog lasts 2 s, then the first pumpkin falls into view.
const FIRST_PUMPKIN = 2000 + 60 * FRAME;

test.beforeEach(async ({ page }) => {
  // Pin randomness to "always a pumpkin" and record what the canvas draws,
  // starting a new frame at each clearRect.
  await page.addInitScript(() => {
    Math.random = () => 0.5;
    window.__frame = [];
    const proto = CanvasRenderingContext2D.prototype;
    const clearRect = proto.clearRect;
    const drawImage = proto.drawImage;
    proto.clearRect = function (...args) {
      window.__frame = [];
      return clearRect.apply(this, args);
    };
    proto.drawImage = function (img, x, y, w, h) {
      window.__frame.push({ src: img.src, x, y, w, h });
      return drawImage.call(this, img, x, y, w, h);
    };
  });
  await page.clock.install();
});

const visibleItems = (page) => page.evaluate(() => window.__frame);

async function start(page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Tap to start" }).click();
  await expect(page.locator("canvas")).toBeVisible();
}

test("loads without errors and Tap to start starts a game", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));

  await start(page);

  await expect(page.getByRole("img", { name: "0 points" })).toBeVisible();
  await expect(page.getByRole("img", { name: "3 lives" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("fog opens the game and the first pumpkin drops out of it", async ({ page }) => {
  await start(page);
  await expect(page.locator("#effects .smoke")).toBeAttached();
  expect(await visibleItems(page)).toEqual([]);

  await page.clock.runFor(2000 + FRAME);

  await expect(page.locator("#effects .smoke")).toHaveCount(0);
  expect((await visibleItems(page)).length).toBeGreaterThanOrEqual(1);
});

test("catching a pumpkin floats +1 over it and the page doesn't scroll", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await start(page);
  await page.clock.runFor(FIRST_PUMPKIN);
  const [pumpkin] = await visibleItems(page);
  const box = await page.locator("canvas").boundingBox();
  const cx = box.x + pumpkin.x + pumpkin.w / 2;
  const cy = box.y + pumpkin.y + pumpkin.h / 2;

  await page.mouse.click(cx, cy);

  await expect(page.getByRole("img", { name: "1 point" })).toBeVisible();
  const popup = page.locator("#effects .popup", { hasText: "+1" });
  await expect(popup).toBeVisible();
  const label = await popup.boundingBox();
  expect(Math.abs(label.x + label.width / 2 - cx)).toBeLessThan(10);
  expect(Math.abs(label.y + label.height / 2 - cy)).toBeLessThan(60);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollHeight <= window.innerHeight
    )
  ).toBe(true);
  expect(errors).toEqual([]);
});

test("losing all lives ends the game and Play Again restarts", async ({
  page,
}) => {
  await start(page);

  await page.clock.runFor(120_000);

  await expect(page.getByText("Game over!")).toBeVisible();
  // The frozen board stays under the overlay.
  await expect(page.locator("canvas")).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Play Again!" })).toBeFocused();

  await page.getByRole("button", { name: "Play Again!" }).click();

  await expect(page.locator("canvas")).toBeVisible();
  await expect(page.getByRole("img", { name: "0 points" })).toBeVisible();
  await expect(page.getByRole("img", { name: "3 lives" })).toBeVisible();
});

test("the game over card sits above the board, so taps reach its buttons", async ({
  page,
}) => {
  await start(page);
  await page.clock.runFor(120_000);
  await expect(page.getByText("Game over!")).toBeVisible();

  // Safari stacked the canvas over the card: it stayed in the DOM but
  // unpainted, and the page looked frozen. Playwright's WebKit never shows
  // it (only the real browser does), so the card must also claim its place
  // in the stacking order instead of relying on source order.
  const card = await page.evaluate(() => {
    const end = document.querySelector("#end");
    const { x, y, width, height } = end
      .querySelector(".panel")
      .getBoundingClientRect();
    const { position, zIndex } = getComputedStyle(end);
    return {
      position,
      zIndex,
      topmost: document
        .elementFromPoint(x + width / 2, y + height / 2)
        .closest("#end")?.id,
    };
  });
  expect(card.topmost).toBe("end");
  expect(card.position).not.toBe("static");
  expect(card.zIndex).not.toBe("auto");
});

test("the pause overlay sits above the board, so a tap resumes", async ({
  page,
}) => {
  await start(page);
  await page.clock.runFor(FIRST_PUMPKIN);
  await page.keyboard.press("p");
  await expect(page.locator("#paused")).toBeVisible();

  // Same Safari stacking bug as the game over card.
  const overlay = await page.evaluate(() => {
    const el = document.querySelector("#paused");
    const { x, y, width, height } = el.getBoundingClientRect();
    const { position, zIndex } = getComputedStyle(el);
    return {
      position,
      zIndex,
      topmost: document.elementFromPoint(x + width / 2, y + height / 2).id,
    };
  });
  expect(overlay.topmost).toBe("paused");
  expect(overlay.position).not.toBe("static");
  expect(overlay.zIndex).not.toBe("auto");
});

test("the game over card fits a phone screen without scrolling", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await start(page);
  await page.clock.runFor(120_000);

  const card = page.locator("#end .panel");
  await expect(card).toBeVisible();
  const box = await card.boundingBox();
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(375);
  expect(box.y + box.height).toBeLessThanOrEqual(667);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollHeight <= window.innerHeight
    )
  ).toBe(true);
});

test("the board behind the game over card follows the window", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1200, height: 800 });
  await start(page);
  await page.clock.runFor(60000);
  await expect(page.getByRole("dialog")).toBeVisible();
  const backing = () => page.locator("canvas").evaluate((el) => el.width);
  const before = await backing();

  await page.setViewportSize({ width: 600, height: 500 });

  // The CSS size follows by itself; the pixels behind it only if the board is resized.
  await expect.poll(backing).toBeLessThan(before);
});

test.describe("on a retina screen", () => {
  test.use({ deviceScaleFactor: 2 });

  test("the canvas has a pixel per device pixel and clicks still land", async ({
    page,
  }) => {
    await start(page);
    await page.clock.runFor(FIRST_PUMPKIN);
    const [pumpkin] = await visibleItems(page);
    const box = await page.locator("canvas").boundingBox();

    const backing = await page.locator("canvas").evaluate((el) => el.width);
    expect(Math.abs(backing - box.width * 2)).toBeLessThanOrEqual(1);

    await page.mouse.click(
      box.x + pumpkin.x + pumpkin.w / 2,
      box.y + pumpkin.y + pumpkin.h / 2
    );
    await expect(page.getByRole("img", { name: "1 point" })).toBeVisible();
  });
});

test("the board keeps its items on screen when resized while paused", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await start(page);
  await page.clock.runFor(FIRST_PUMPKIN);
  await page.getByRole("button", { name: "Pause" }).click();

  await page.setViewportSize({ width: 800, height: 600 });
  await expect
    .poll(async () => (await page.locator("canvas").boundingBox()).width)
    .toBeLessThan(1280 * 0.9);

  // Resizing a canvas clears it: with no frames running while paused, the
  // items must be drawn again right away.
  const painted = await page.evaluate(() => {
    const canvas = document.querySelector("canvas");
    const { data } = canvas
      .getContext("2d")
      .getImageData(0, 0, canvas.width, canvas.height);
    return data.some((value, i) => i % 4 === 3 && value > 0);
  });
  expect(painted).toBe(true);
});

test("items keep their place on the board when the window shrinks", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await start(page);
  await page.clock.runFor(FIRST_PUMPKIN);
  const [before] = await visibleItems(page);
  const boxBefore = await page.locator("canvas").boundingBox();

  await page.setViewportSize({ width: 390, height: 600 });
  await expect
    .poll(async () => (await page.locator("canvas").boundingBox()).width)
    .toBeLessThan(boxBefore.width);
  const boxAfter = await page.locator("canvas").boundingBox();
  await page.clock.runFor(FRAME);
  const [after] = await visibleItems(page);

  // Not piled against the right edge: same relative column as before.
  const column = (item, box) => item.x / box.width;
  expect(column(after, boxAfter)).toBeCloseTo(column(before, boxBefore), 1);
});

// 1.4.10: no sideways scrolling and a board worth playing at 320 CSS px.
for (const viewport of [
  { width: 320, height: 568 },
  { width: 375, height: 667 },
  { width: 430, height: 932 },
]) {
  test(`the HUD fits without sideways scrolling at ${viewport.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await start(page);

    const overflow = await page.evaluate(() => ({
      page: document.documentElement.scrollWidth - window.innerWidth,
      hud: [...document.querySelectorAll("#controls > li")].map(
        (li) => li.getBoundingClientRect().right - window.innerWidth
      ),
    }));

    expect(overflow.page).toBeLessThanOrEqual(0);
    for (const right of overflow.hud) expect(right).toBeLessThanOrEqual(0);
  });
}

test("the board keeps a playable height on a short, narrow screen", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 256 });
  await start(page);

  const box = await page.locator("canvas").boundingBox();

  expect(box.height).toBeGreaterThanOrEqual(150);
});

// The game ships without sound (SOUND_ENABLED in js/config.js).
test("the game has no speaker buttons and loads no sound", async ({ page }) => {
  const sounds = [];
  page.on("request", (request) => {
    if (request.url().includes("/assets/sound/")) sounds.push(request.url());
  });

  await start(page);
  await page.clock.runFor(1000);

  await expect(page.getByRole("button", { name: "Mute" })).toHaveCount(0);
  expect(sounds).toEqual([]);
});

const PAGES = [
  ["/", "Game"],
  ["/how-to-play.html", "How to play"],
  ["/about.html", "About"],
  ["/privacy.html", "Privacy"],
  ["/terms.html", "Terms"],
];

for (const [path, current] of PAGES) {
  test(`${current} page loads with the bottom bar`, async ({ page }) => {
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));

    await page.goto(path);

    const bar = page.getByRole("navigation", { name: "Site" });
    await expect(bar).toBeVisible();
    await expect(bar.getByRole("link")).toHaveText([
      "Trick or Treat",
      "Game",
      "How to play",
      "About",
      "Privacy",
      "Terms",
    ]);
    await expect(bar.locator('[aria-current="page"]')).toHaveText(current);
    expect(errors).toEqual([]);
  });
}

test("the menu reaches How to play and Play brings you back to the game", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("navigation", { name: "Site" }).getByRole("link", { name: "How to play" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/How to play/);

  await page.getByRole("link", { name: /Play Trick or Treat/ }).click();
  await expect(page.getByRole("button", { name: "Tap to start" })).toBeVisible();
});

for (const viewport of [
  { width: 1280, height: 800 },
  { width: 390, height: 844 },
]) {
  test(`the game page doesn't scroll at ${viewport.width}x${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");
    const scrolls = () =>
      page.evaluate(
        () => document.documentElement.scrollHeight > window.innerHeight
      );

    expect(await scrolls()).toBe(false);
    await page.getByRole("button", { name: "Tap to start" }).click();
    await expect(page.locator("canvas")).toBeVisible();
    expect(await scrolls()).toBe(false);
  });
}

test("the start board and the game board are the same size", async ({ page }) => {
  await page.goto("/");
  const size = () =>
    page.evaluate(() => {
      const el = document.querySelector("#start, canvas");
      const { width, height } = el.getBoundingClientRect();
      return [Math.round(width), Math.round(height)];
    });
  const before = await size();

  await page.getByRole("button", { name: "Tap to start" }).click();
  await expect(page.locator("canvas")).toBeVisible();

  expect(await size()).toEqual(before);
});

// Start options: switches on the start board, usable by keyboard alone.
for (const viewport of [
  { width: 320, height: 568 },
  { width: 375, height: 667 },
]) {
  test(`the start options fit the start board at ${viewport.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");

    const board = await page.locator("#start").boundingBox();
    for (const name of [/keyboard play/i, /slower pace/i]) {
      const box = await page.getByRole("switch", { name }).boundingBox();
      expect(box.x).toBeGreaterThanOrEqual(board.x);
      expect(box.x + box.width).toBeLessThanOrEqual(board.x + board.width);
      expect(box.y + box.height).toBeLessThanOrEqual(board.y + board.height);
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth
      )
    ).toBeLessThanOrEqual(0);
  });
}

test("keyboard play: a switch, Enter to start, Enter to catch", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("switch", { name: /keyboard play/i }).focus();
  await page.keyboard.press("Space");
  await expect(
    page.getByRole("switch", { name: /keyboard play/i })
  ).toHaveAttribute("aria-checked", "true");
  await expect(page.locator("#start")).toBeVisible();

  await page.getByRole("button", { name: "Tap to start" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("canvas")).toBeFocused();
  await page.clock.runFor(FIRST_PUMPKIN + 1000);
  await page.keyboard.press("Enter");

  await expect(page.getByRole("img", { name: "1 point" })).toBeVisible();
});
