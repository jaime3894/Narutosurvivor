import { test, expect } from "@playwright/test";
test("el menú normal ofrece una sola aventura y oculta la selección de islas", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Comenzar supervivencia" }),
  ).toBeVisible();
  await expect(page.locator("#missions,[data-mission]")).toHaveCount(0);
  await expect(page.locator(".play-nav")).toContainText("Una isla");
  await page.getByRole("button", { name: "Comenzar supervivencia" }).click();
  await expect(page.locator(".battle-location")).toContainText("ISLA");
});
test("un duelo tiene recinto propio con cuatro obstáculos y regresa a la misma isla con su build", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/?debug");
  await page.getByRole("button", { name: "Comenzar supervivencia" }).click();
  await page.evaluate(() => {
    const d = window.__MAREA_DEBUG__!;
    d.setTime(960);
    d.learnTechnique("gatling");
  });
  const before = await page.evaluate(() => window.__MAREA_DEBUG__!.snapshot());
  await page.getByRole("button", { name: "Grieta", exact: true }).click();
  const entered = await page.evaluate(() => window.__MAREA_DEBUG__!.snapshot());
  const room = entered.arena;
  expect(room?.obstacles).toBe(4);
  expect(room?.name).toContain("Justicia");
  await page.evaluate(() => {
    const d = window.__MAREA_DEBUG__!;
    for (let i = 0; i < 70; i++) {
      d.setHealth(100);
      d.setBossHealth(1);
      d.advance(0.1, { x: 1, y: 0, dash: true });
    }
  });
  const moved = await page.evaluate(() => window.__MAREA_DEBUG__!.snapshot());
  expect(moved.x).toBeLessThanOrEqual(room!.cx + 398);
  expect(moved.elapsed).toBe(entered.elapsed);
  await page
    .getByRole("button", { name: "Derrotar jefe", exact: true })
    .click();
  await page
    .locator("[data-boss-reward]")
    .filter({ hasNotText: "Vincular" })
    .first()
    .click();
  const after = await page.evaluate(() => window.__MAREA_DEBUG__!.snapshot());
  expect(after.arena).toBeNull();
  expect(after.weapons).toEqual(before.weapons);
  expect(after.elapsed).toBeLessThan(entered.elapsed + 1);
  expect(errors).toEqual([]);
});

test("la isla ampliada conserva build y coordenadas al cambiar el entorno y permite recorrer sus extremos", async ({
  page,
}) => {
  await page.goto("/?debug");
  await page.getByRole("button", { name: "Comenzar supervivencia" }).click();
  const states = await page.evaluate(() => {
    const d = window.__MAREA_DEBUG__!;
    d.setPosition(14000, 10000);
    const original = d.snapshot();
    const reports = [];
    for (const t of [239.99, 479.99, 719.99, 2159.99, 3359.99]) {
      d.setTime(t);
      d.setHealth(100);
      d.advance(0.02);
      const current = d.snapshot();
      reports.push({
        weapons: current.weapons,
        x: current.x,
        y: current.y,
        mission: current.mission,
      });
    }
    d.setPosition(27000, 19000);
    return { original, reports, far: d.snapshot() };
  });
  expect(states.original.world).toEqual({ width: 28800, height: 21600 });
  for (const s of states.reports) {
    expect(s.mission).toBe("survival");
    expect(s.weapons).toEqual(states.original.weapons);
    expect(
      Math.hypot(s.x - states.original.x, s.y - states.original.y),
    ).toBeLessThan(100);
  }
  expect(states.far.x).toBeGreaterThan(26000);
  expect(states.far.y).toBeGreaterThan(18000);
});
