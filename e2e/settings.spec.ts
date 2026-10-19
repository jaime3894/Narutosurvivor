import { test, expect } from "@playwright/test";

test("HUD dentro del campo, ajustes persistentes y pantalla completa funcional", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/?debug");
  await page.getByRole("button", { name: "Zarpar hacia East Blue" }).click();
  const viewport = page.viewportSize()!;
  const field = await page.locator(".arena").boundingBox();
  expect(field!.width).toBe(viewport.width);
  expect(field!.height).toBe(viewport.height);
  await expect(
    page.locator(".energy-row,.crew-hud,.form-controls,.loadout-passives"),
  ).toHaveCount(0);
  for (const selector of ["#hp-text", "#weapon-loadout", "#pause", "#dash"]) {
    const bounds = await page.locator(selector).boundingBox();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.y).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(viewport.width);
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(viewport.height);
  }
  await page.getByRole("button", { name: "Ajustes", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "Ajustes", exact: true }),
  ).toBeVisible();
  const paused = await page.evaluate(
    () => window.__MAREA_DEBUG__!.snapshot().elapsed,
  );
  await page.selectOption("#setting-quality", "low");
  await page.selectOption("#setting-zoom", "0.8");
  await page.locator('[data-setting="damageNumbers"]').uncheck();
  await page.locator('[data-setting="calm"]').check();
  await page.locator('[data-setting="fps"]').check();
  await page.waitForTimeout(100);
  expect(
    await page.evaluate(() => window.__MAREA_DEBUG__!.snapshot().elapsed),
  ).toBe(paused);
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("dialog", { name: "Ajustes", exact: true }),
  ).toHaveCount(0);
  await expect
    .poll(() => page.evaluate(() => window.__MAREA_DEBUG__!.snapshot().status))
    .toBe("playing");
  await expect(page.locator("#fps-text")).toBeVisible();
  const buffer = await page
    .locator("#battle")
    .evaluate((canvas: HTMLCanvasElement) => ({
      w: canvas.width,
      h: canvas.height,
    }));
  expect(buffer.h).toBe(540);
  await page
    .getByRole("button", { name: "Pantalla completa", exact: true })
    .click();
  await expect
    .poll(() => page.evaluate(() => Boolean(document.fullscreenElement)))
    .toBe(true);
  await page
    .getByRole("button", { name: "Pantalla completa", exact: true })
    .click();
  await expect
    .poll(() => page.evaluate(() => Boolean(document.fullscreenElement)))
    .toBe(false);
  await page.reload();
  await page.getByRole("button", { name: "Ajustes", exact: true }).click();
  await expect(page.locator("#setting-quality")).toHaveValue("low");
  await expect(page.locator("#setting-zoom")).toHaveValue("0.8");
  await expect(page.locator('[data-setting="calm"]')).toBeChecked();
  expect(errors).toEqual([]);
});

test("HUD móvil sin recortes y ajustes desde una pausa respetan la pausa", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/?debug");
  await page.getByRole("button", { name: "Zarpar hacia East Blue" }).click();
  await page.getByRole("button", { name: "Pausar partida" }).click();
  await page
    .getByRole("button", { name: "Ajustes", exact: true })
    .last()
    .click();
  await page.selectOption("#setting-touch", "1.25");
  await page.getByRole("button", { name: "Volver", exact: true }).click();
  expect(
    await page.evaluate(() => window.__MAREA_DEBUG__!.snapshot().status),
  ).toBe("paused");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  const dash = await page.locator("#dash").boundingBox();
  expect(dash!.width).toBe(60);
  expect(dash!.x + dash!.width).toBeLessThanOrEqual(390);
});
