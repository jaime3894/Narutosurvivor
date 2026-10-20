import { test, expect } from "@playwright/test";
test("Imu llega al minuto 60, cambia de fase y la supervivencia continúa tras vencerlo (depuración)", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/?debug");
  await page.getByRole("button", { name: "Zarpar hacia East Blue" }).click();
  await page.evaluate(() => {
    const d = window.__MAREA_DEBUG__!;
    d.setTime(3599.99);
    d.advance(0.05);
  });
  expect(
    await page.evaluate(() => window.__MAREA_DEBUG__!.snapshot().rift),
  ).toBe(true);
  await page.evaluate(() => window.__MAREA_DEBUG__!.advance(5.1));
  expect(
    await page.evaluate(() => window.__MAREA_DEBUG__!.snapshot().boss),
  ).toBe("imu");
  await expect(page.locator("#rift-status")).toContainText("Imu");
  for (const [health, phase] of [
    [1, 1],
    [0.6, 2],
    [0.25, 3],
  ]) {
    await page.evaluate((health) => {
      const d = window.__MAREA_DEBUG__!;
      d.setBossHealth(health!);
      d.advance(0.05);
    }, health);
    expect(
      await page.evaluate(() => window.__MAREA_DEBUG__!.snapshot().imuPhase),
    ).toBe(phase);
  }
  await page
    .getByRole("button", { name: "Derrotar jefe", exact: true })
    .click();
  expect(
    await page.evaluate(() => window.__MAREA_DEBUG__!.snapshot().imuDefeated),
  ).toBe(true);
  await page.locator("[data-boss-reward]").first().click();
  await page.evaluate(() => window.__MAREA_DEBUG__!.advance(0.1));
  const state = await page.evaluate(() => window.__MAREA_DEBUG__!.snapshot());
  expect(state.status).toBe("playing");
  expect(state.elapsed).toBeGreaterThan(3600);
  expect(state.berries).toBeGreaterThanOrEqual(1000);
  expect(errors).toEqual([]);
});
test("migra las bolsas antiguas a una cuenta y comprar con Zoro reduce también la bolsa de Luffy", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem(
      "marea.profile.v1",
      JSON.stringify({
        version: 1,
        selected: "luffy",
        sailors: {
          luffy: { berries: 300, levels: { health: 2 } },
          zoro: { berries: 200, levels: { damage: 1 } },
        },
        receipts: [],
      }),
    );
  });
  await page.reload();
  await page.getByRole("button", { name: "Mejoras", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Mejoras del tripulante" });
  await expect(dialog.locator(".wallet")).toContainText("500");
  await dialog.locator("#training-character").selectOption("zoro");
  await dialog.locator('[data-train="health"]').click();
  await expect(dialog.locator(".wallet")).toContainText("440");
  await dialog.locator("#training-character").selectOption("luffy");
  await expect(dialog.locator(".wallet")).toContainText("440");
  await page.reload();
  const profile = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("marea.profile.v2")!) as {
        version: number;
        berries: number;
        sailors: { luffy: { levels: { health: number } } };
      },
  );
  expect(profile.version).toBe(2);
  expect(profile.berries).toBe(440);
  expect(profile.sailors.luffy.levels.health).toBe(2);
});
test("la pausa explica la siguiente forma y las cartas comparan valores", async ({
  page,
}) => {
  await page.goto("/?debug");
  await page.getByRole("button", { name: "Zarpar hacia East Blue" }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Pausa" })).toContainText(
    "Gear Second",
  );
  await expect(page.getByRole("dialog", { name: "Pausa" })).toContainText(
    "5/5",
  );
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.getByRole("button", { name: "+10 XP", exact: true }).click();
  await expect(
    page.locator("[data-upgrade] .upgrade-description").first(),
  ).toContainText("→");
});
