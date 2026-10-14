// Real-browser smoke tests: the page as GitHub Pages serves it, with the
// real async script loading, real canvas and real mouse clicks. The jsdom
// suite in test/ covers behavior in depth; these only check that it holds
// up in an actual browser.

import { expect, test } from "@playwright/test";

const FRAME = 16;

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
  await page.getByRole("button", { name: "Go!" }).click();
  await expect(page.locator("canvas")).toBeVisible();
}

test("loads without errors and Go! starts a game", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));

  await start(page);

  await expect(page.locator("nav")).toContainText("0⭐️");
  await expect(page.locator("nav")).toContainText("3🧡");
  expect(errors).toEqual([]);
});

test("clicking a drawn pumpkin scores a point", async ({ page }) => {
  await start(page);
  await page.clock.runFor(1000 + 60 * FRAME);
  const [pumpkin] = await visibleItems(page);
  expect(pumpkin).toBeDefined();

  const box = await page.locator("canvas").boundingBox();
  await page.mouse.click(
    box.x + pumpkin.x + pumpkin.w / 2,
    box.y + pumpkin.y + pumpkin.h / 2
  );

  await expect(page.locator("nav")).toContainText("1⭐️");
});

test("losing all lives ends the game and Play Again restarts", async ({
  page,
}) => {
  await start(page);

  await page.clock.runFor(120_000);

  await expect(page.getByText("Game over!")).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(0);

  await page.getByRole("button", { name: "Play Again!" }).click();

  await expect(page.locator("canvas")).toBeVisible();
  await expect(page.locator("nav")).toContainText("0⭐️");
  await expect(page.locator("nav")).toContainText("3🧡");
});
