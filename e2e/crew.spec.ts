import { test, expect } from "@playwright/test";
import type { DebugBridge } from "../src/ui/session";
declare global {
  interface Window {
    __MAREA_DEBUG__?: DebugBridge;
  }
}

test("elegir capitán, dos nakama y transformar sin mezclar sus identidades", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/?debug");
  await page
    .getByRole("button", { name: "Elegir tripulación", exact: true })
    .click();
  const dialog = page.getByRole("dialog", { name: "Elegir tripulación" });
  await expect(dialog.locator("[data-captain]")).toHaveCount(10);
  await page
    .getByRole("checkbox", { name: "Reclutar a Zoro como nakama" })
    .check();
  await page
    .getByRole("checkbox", { name: "Reclutar a Sanji como nakama" })
    .check();
  await expect(
    page.getByRole("checkbox", { name: "Reclutar a Nami como nakama" }),
  ).toBeDisabled();
  await expect(dialog.locator("#crew-synergies")).toContainText(
    "Las alas del capitán",
  );
  await page.getByRole("button", { name: "Confirmar tripulación" }).click();
  await page.getByRole("button", { name: "Zarpar hacia East Blue" }).click();
  let state = await page.evaluate(() => window.__MAREA_DEBUG__!.snapshot());
  expect(state.character).toBe("luffy");
  expect(state.nakama.map((item) => item.character)).toEqual(["zoro", "sanji"]);
  await page.keyboard.press("KeyF");
  expect(
    await page.evaluate(() => window.__MAREA_DEBUG__!.snapshot().form),
  ).toBe(0);
  await page.getByRole("button", { name: "Desbloquear formas" }).click();
  await page.keyboard.press("KeyF");
  await expect
    .poll(() => page.evaluate(() => window.__MAREA_DEBUG__!.snapshot().form))
    .toBe(1);
  await page.evaluate(() => {
    window.__MAREA_DEBUG__!.advance(1.3);
    window.__MAREA_DEBUG__!.form(2);
  });
  await expect
    .poll(() => page.evaluate(() => window.__MAREA_DEBUG__!.snapshot().form))
    .toBe(2);
  state = await page.evaluate(() => window.__MAREA_DEBUG__!.snapshot());
  expect(state.energy).toBeLessThan(100);
  expect(state.synergies).toHaveLength(3);
  await page.evaluate(() => {
    window.__MAREA_DEBUG__!.setHealth(0);
    window.__MAREA_DEBUG__!.advance(0.1);
  });
  await page.getByRole("button", { name: "Otra partida" }).click();
  state = await page.evaluate(() => window.__MAREA_DEBUG__!.snapshot());
  expect(state.form).toBe(0);
  expect(state.nakama.map((item) => item.character)).toEqual(["zoro", "sanji"]);
  expect(errors).toEqual([]);
});

test("las 30 formas se previsualizan y los diez capitanes pueden zarpar", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/?debug");
  const previews = new Set<string>();
  for (const id of [
    "luffy",
    "zoro",
    "nami",
    "usopp",
    "sanji",
    "chopper",
    "robin",
    "franky",
    "brook",
    "jinbe",
  ]) {
    await page
      .getByRole("button", { name: "Elegir tripulación", exact: true })
      .click();
    await page.locator(`[data-captain="${id}"]`).click();
    for (const tier of [0, 1, 2]) {
      await page.locator(`[data-form-preview="${tier}"]`).click();
      await expect(page.locator("#crew-preview")).toBeVisible();
      await page.waitForTimeout(40);
      previews.add(
        await page
          .locator("#crew-preview")
          .evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL()),
      );
    }
    await page.getByRole("button", { name: "Confirmar tripulación" }).click();
    await page.getByRole("button", { name: "Zarpar hacia East Blue" }).click();
    expect(
      await page.evaluate(() => window.__MAREA_DEBUG__!.snapshot().character),
    ).toBe(id);
    await page.getByRole("button", { name: "Desbloquear formas" }).click();
    await page.evaluate(() => {
      window.__MAREA_DEBUG__!.form(2);
      window.__MAREA_DEBUG__!.advance(0.5);
    });
    expect(
      await page.evaluate(() => window.__MAREA_DEBUG__!.snapshot().form),
    ).toBe(2);
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Volver al puerto" }).click();
  }
  expect(previews.size).toBe(30);
  expect(errors).toEqual([]);
});

test("la selección móvil permite confirmar sin desbordar la pantalla", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Elegir tripulación", exact: true })
    .click();
  await page.locator('[data-captain="nami"]').click();
  await page
    .getByRole("checkbox", { name: "Reclutar a Usopp como nakama" })
    .check();
  await page.getByRole("button", { name: "Confirmar tripulación" }).click();
  await expect(page.locator(".crew-selected")).toContainText("Nami + Usopp");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("un atlas PNG local sustituye al personaje sin cambiar el código del juego", async ({
  page,
}) => {
  await page.goto("/");
  const png = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 960;
    canvas.height = 320;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ff00fa";
    ctx.fillRect(0, 0, 960, 320);
    return canvas.toDataURL("image/png").split(",")[1]!;
  });
  await page.route("**/assets/manifest.json", (route) =>
    route.fulfill({ json: { "hero:luffy:0": "assets/custom-luffy.png" } }),
  );
  await page.route("**/assets/custom-luffy.png", (route) =>
    route.fulfill({
      body: Buffer.from(png, "base64"),
      contentType: "image/png",
    }),
  );
  await page.reload();
  await expect(page.locator(".map canvas")).toBeVisible();
  expect(
    await page.locator(".map canvas").evaluate((canvas: HTMLCanvasElement) => {
      const data = canvas
        .getContext("2d")!
        .getImageData(0, 0, canvas.width, canvas.height).data;
      for (let i = 0; i < data.length; i += 4)
        if (data[i] === 255 && data[i + 1] === 0 && data[i + 2] === 250)
          return true;
      return false;
    }),
  ).toBe(true);
  await page.getByRole("button", { name: "Zarpar hacia East Blue" }).click();
  await expect(page.locator("#battle")).toBeVisible();
});
