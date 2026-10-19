import { test, expect } from "@playwright/test";

test("un jefe solo ofrece vincular ataques aprendidos y conserva sus rangos", async ({
  page,
}) => {
  await page.goto("/?debug");
  await page.getByRole("button", { name: "Zarpar hacia East Blue" }).click();
  await page.getByRole("button", { name: "Grieta", exact: true }).click();
  await page
    .getByRole("button", { name: "Derrotar jefe", exact: true })
    .click();
  await expect(page.locator("[data-boss-reward]")).toHaveCount(3);
  await expect(page.getByRole("button", { name: /Vincular/ })).toHaveCount(0);
  await page
    .locator("[data-boss-reward]")
    .filter({ hasNotText: "Vincular" })
    .first()
    .click();
  await page.evaluate(() => {
    window.__MAREA_DEBUG__!.learnTechnique("gatling");
    window.__MAREA_DEBUG__!.learnTechnique("gatling");
  });
  await page.getByRole("button", { name: "Grieta", exact: true }).click();
  await page
    .getByRole("button", { name: "Derrotar jefe", exact: true })
    .click();
  await page.getByRole("button", { name: /Vincular 2 técnicas/ }).click();
  await expect(page.locator("[data-link]")).toHaveCount(1);
  await expect(page.locator('[data-link="gatling"]')).toBeVisible();
  await expect(
    page.locator('[data-link="bazooka"],[data-link="whip"]'),
  ).toHaveCount(0);
  await page.locator('[data-link="gatling"]').click();
  const state = await page.evaluate(() => window.__MAREA_DEBUG__!.snapshot());
  expect(state.weapons).toHaveLength(2);
  expect(state.weapons.find((w) => w.id === "gatling")?.rank).toBe(2);
});

for (const [mission, bosses] of [
  ["east-blue", ["buggy", "kuro", "arlong"]],
  ["alabasta", ["mr1", "crocodile"]],
] as const) {
  test(`${mission}: minijefes, Buster Call y victoria final por interfaz (recorrido asistido por depuración)`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/?debug");
    await page
      .getByRole("button", { name: "Islas y jefes", exact: true })
      .click();
    await page.locator(`[data-mission="${mission}"]`).click();
    expect(
      (await page.evaluate(() => window.__MAREA_DEBUG__!.snapshot())).mission,
    ).toBe(mission);
    const times = mission === "east-blue" ? [75, 155] : [90];
    for (const [index, time] of times.entries()) {
      await page.evaluate((t) => {
        const b = window.__MAREA_DEBUG__!;
        b.setTime(t);
        for (let i = 0; i < 150 && !b.snapshot().boss; i++) {
          const s = b.snapshot();
          b.setHealth(100);
          if (s.status === "upgrade") b.choose(s.choices[0]!);
          else if (s.status === "chest") b.chooseChest(0);
          else b.advance(0.1);
        }
      }, time);
      expect(
        (await page.evaluate(() => window.__MAREA_DEBUG__!.snapshot())).boss,
      ).toBe(bosses[index]);
      await page
        .getByRole("button", { name: "Derrotar jefe", exact: true })
        .click();
      await expect(
        page.getByRole("dialog", { name: "Recompensa del jefe" }),
      ).toBeVisible();
      await page
        .locator("[data-boss-reward]")
        .filter({ hasNotText: "Vincular" })
        .first()
        .click();
    }
    await page.evaluate(() => {
      const b = window.__MAREA_DEBUG__!;
      b.setTime(210);
      b.advance(0.05);
    });
    await expect(page.locator("#rift-status")).toContainText("BUSTER CALL");
    await page.evaluate(() => {
      const b = window.__MAREA_DEBUG__!;
      for (let i = 0; i < 100; i++) {
        const s = b.snapshot();
        b.setHealth(100);
        if (s.status === "upgrade") b.choose(s.choices[0]!);
        else if (s.status === "chest") b.chooseChest(0);
        else b.advance(0.4, { x: 1, y: 0, dash: i % 7 === 0 });
      }
    });
    expect(
      (await page.evaluate(() => window.__MAREA_DEBUG__!.snapshot())).buster,
    ).toBe(0);
    await page.evaluate(() => {
      const b = window.__MAREA_DEBUG__!;
      b.setHealth(100);
      b.setTime(300);
      for (let i = 0; i < 150 && !b.snapshot().boss; i++) {
        const s = b.snapshot();
        b.setHealth(100);
        if (s.status === "upgrade") b.choose(s.choices[0]!);
        else if (s.status === "chest") b.chooseChest(0);
        else b.advance(0.1);
      }
    });
    const final = await page.evaluate(() => window.__MAREA_DEBUG__!.snapshot());
    expect(final.status).toBe("playing");
    expect(final.boss).toBe(bosses.at(-1));
    expect(final.finalDefeated).toBe(false);
    await page
      .getByRole("button", { name: "Derrotar jefe", exact: true })
      .click();
    await page
      .locator("[data-boss-reward]")
      .filter({ hasNotText: "Vincular" })
      .first()
      .click();
    await page.evaluate(() => {
      const b = window.__MAREA_DEBUG__!;
      for (let i = 0; i < 10 && b.snapshot().status !== "won"; i++) {
        const s = b.snapshot();
        if (s.status === "upgrade") b.choose(s.choices[0]!);
        else if (s.status === "chest") b.chooseChest(0);
        else b.advance(0.1);
      }
    });
    await expect(
      page.getByRole("dialog", { name: "Resultados" }),
    ).toContainText(
      mission === "east-blue" ? "East Blue completada" : "Alabasta completada",
    );
    expect(errors).toEqual([]);
  });
}

test("selector de islas móvil: contenido y botones accesibles", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Islas y jefes", exact: true })
    .click();
  await expect(
    page.getByRole("dialog", { name: "Islas y jefes" }),
  ).toBeVisible();
  await page.locator('[data-mission="alabasta"]').scrollIntoViewIfNeeded();
  await expect(page.locator('[data-mission="alabasta"]')).toBeInViewport();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
});

test("Mr.1 y Crocodile publican poses y doce dibujos de marcha transparentes sin recortes", async ({
  page,
}) => {
  await page.goto("/");
  const reports = await page.evaluate(async () => {
    const reports = [];
    for (const id of ["mr1", "crocodile"])
      for (const kind of ["poses", "walk"]) {
        const image = new Image();
        image.src = `assets/bosses/${id}${kind === "walk" ? "-walk" : ""}-v9.png`;
        await image.decode();
        const width = kind === "walk" ? 192 : 256,
          rows = kind === "walk" ? 2 : 1,
          cols = kind === "walk" ? 6 : 4;
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = 128;
        const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
        const hashes = [];
        let clipped = false,
          empty = false;
        for (let row = 0; row < rows; row++)
          for (let col = 0; col < cols; col++) {
            ctx.clearRect(0, 0, width, 128);
            ctx.drawImage(
              image,
              col * width,
              row * 128,
              width,
              128,
              0,
              0,
              width,
              128,
            );
            const bytes = ctx.getImageData(0, 0, width, 128).data;
            let opaque = 0;
            for (let y = 0; y < 128; y++)
              for (let x = 0; x < width; x++)
                if ((bytes[(y * width + x) * 4 + 3] ?? 0) > 100) {
                  opaque++;
                  if (!x || !y || x === width - 1 || y === 127) clipped = true;
                }
            if (opaque < 300 || opaque > width * 128 * 0.65) empty = true;
            hashes.push(
              Array.from(
                new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)),
              ).join(","),
            );
          }
        reports.push({
          id,
          kind,
          width: image.width,
          height: image.height,
          unique: new Set(hashes).size,
          expected: cols * rows,
          clipped,
          empty,
        });
      }
    return reports;
  });
  for (const report of reports) {
    expect(report.unique, `${report.id}/${report.kind}`).toBe(report.expected);
    expect(report.clipped).toBe(false);
    expect(report.empty).toBe(false);
  }
});
