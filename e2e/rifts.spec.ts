import { test, expect } from "@playwright/test";
test("tres jefes permiten elegir vínculos de dos, tres y cuatro técnicas por la interfaz", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/?debug");
  await page.getByRole("button", { name: "Zarpar hacia East Blue" }).click();
  for (const [i, id] of (
    ["gatling", "onigiri", "sharkbrick"] as const
  ).entries()) {
    await page.getByRole("button", { name: "Grieta", exact: true }).click();
    const before = await page.evaluate(() =>
      window.__MAREA_DEBUG__!.snapshot(),
    );
    expect(before.boss).toBe(["buggy", "kuro", "arlong"][i]);
    await page.evaluate(() => window.__MAREA_DEBUG__!.advance(0.4));
    expect(
      (await page.evaluate(() => window.__MAREA_DEBUG__!.snapshot())).elapsed,
    ).toBe(before.elapsed);
    await page
      .getByRole("button", { name: "Derrotar jefe", exact: true })
      .click();
    const rewards = page.getByRole("dialog", { name: "Recompensa del jefe" });
    await expect(rewards).toBeVisible();
    await expect(rewards.locator("[data-boss-reward]")).toHaveCount(3);
    await rewards
      .getByRole("button", { name: new RegExp(`Vincular ${i + 2} técnicas`) })
      .click();
    const links = page.getByRole("dialog", { name: "Vincular técnicas" });
    await expect(links).toBeVisible();
    await links.locator(`[data-link="${id}"]`).click();
    const state = await page.evaluate(() => window.__MAREA_DEBUG__!.snapshot());
    expect(state.linked).toHaveLength(i + 2);
    expect(state.weapons).toHaveLength(i + 2);
    expect(state.character).toBe("luffy");
    expect(state.bossesDefeated).toBe(i + 1);
    await expect(page.getByRole("dialog")).toHaveCount(0);
  }
  await page.getByRole("button", { name: "Grieta", exact: true }).click();
  await page
    .getByRole("button", { name: "Derrotar jefe", exact: true })
    .click();
  await expect(page.locator("[data-boss-reward]")).toHaveCount(3);
  await expect(
    page.getByRole("button", { name: /Vincular 5 técnicas/ }),
  ).toHaveCount(0);
  await page.locator("[data-boss-reward]").first().click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(errors).toEqual([]);
});
test("cofre en móvil ofrece tres tarjetas y la tecla 3 concede únicamente la tercera", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/?debug");
  await page.getByRole("button", { name: "Zarpar hacia East Blue" }).click();
  await page.getByRole("button", { name: "Cofre", exact: true }).click();
  await page.evaluate(() =>
    window.__MAREA_DEBUG__!.advance(0.5, { x: 1, y: 0, dash: false }),
  );
  const dialog = page.getByRole("dialog", { name: "Botín del cofre" });
  await expect(dialog.locator("[data-chest]")).toHaveCount(3);
  for (let i = 0; i < 3; i++)
    await expect(dialog.locator("[data-chest]").nth(i)).toBeInViewport();
  const before = await page.evaluate(() => window.__MAREA_DEBUG__!.snapshot());
  await page.keyboard.press("Digit3");
  await expect(dialog).toHaveCount(0);
  expect(
    (await page.evaluate(() => window.__MAREA_DEBUG__!.snapshot())).rewards,
  ).toHaveLength(0);
  expect(before.rewards).toHaveLength(3);
});

test("los tres atlas de jefe contienen cuatro poses completas y diferentes", async ({
  page,
}) => {
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const results = [];
    for (const id of ["buggy", "kuro", "arlong"]) {
      const image = new Image();
      image.src = `assets/bosses/${id}-v6.png`;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = 1024;
      canvas.height = 128;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(image, 0, 0);
      const pixels = ctx.getImageData(0, 0, 1024, 128).data;
      const poses = [];
      for (let cell = 0; cell < 4; cell++) {
        let count = 0,
          border = 0,
          hash = 0;
        for (let y = 0; y < 128; y++)
          for (let x = 0; x < 256; x++) {
            const i = (y * 1024 + cell * 256 + x) * 4;
            if (pixels[i + 3]! > 100) {
              count++;
              if (x === 0 || x === 255 || y === 0 || y === 127) border++;
              hash =
                (Math.imul(hash, 31) +
                  pixels[i]! +
                  pixels[i + 1]! +
                  pixels[i + 2]!) |
                0;
            }
          }
        poses.push({ count, border, hash });
      }
      results.push({ id, width: image.width, height: image.height, poses });
    }
    return results;
  });
  for (const atlas of result) {
    expect(atlas.width).toBe(1024);
    expect(atlas.height).toBe(128);
    expect(new Set(atlas.poses.map((p) => p.hash)).size).toBe(4);
    for (const pose of atlas.poses) {
      expect(pose.count).toBeGreaterThan(1500);
      expect(pose.border).toBe(0);
    }
  }
});
