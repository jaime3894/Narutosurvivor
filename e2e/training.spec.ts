import { test, expect } from "@playwright/test";
test("compras por personaje persistentes y aplicadas al empezar, con bolsa compartida", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/?debug");
  await page.getByRole("button", { name: "Mejoras", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Mejoras del tripulante" });
  await expect(dialog.locator(".training-card")).toHaveCount(14);
  await expect(dialog.locator('[data-train="health"]')).toBeInViewport();
  await dialog.locator('[data-train="health"]').click();
  await expect(dialog.locator(".wallet")).toContainText("60");
  await expect(dialog.locator('[data-train="damage"]')).toBeDisabled();
  await dialog.locator("#training-character").selectOption("zoro");
  await expect(dialog.locator(".wallet")).toContainText("60");
  await dialog.locator("#training-character").selectOption("luffy");
  await expect(dialog.locator(".wallet")).toContainText("60");
  await page.getByRole("button", { name: "Volver", exact: true }).click();
  await page.reload();
  await page.getByRole("button", { name: "Comenzar supervivencia" }).click();
  const state = await page.evaluate(() => window.__MAREA_DEBUG__!.snapshot());
  expect(state.health).toBe(108);
  expect(state.character).toBe("luffy");
  await page.evaluate(() => {
    window.__MAREA_DEBUG__!.advance(15, { x: 1, y: 0, dash: false });
    window.__MAREA_DEBUG__!.setHealth(0);
    window.__MAREA_DEBUG__!.advance(0.1);
  });
  await expect(page.locator(".results-account")).toContainText(
    "berries para tu cuenta",
  );
  await page.getByRole("button", { name: "Volver al puerto" }).click();
  await expect(page.locator(".port-record")).toContainText("TRAVESÍAS 1");
  expect(errors).toEqual([]);
});
test("menú y mejoras móviles: sin desbordar, coste y retorno accesibles", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Mejoras", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.locator('[data-train="health"]')).toBeInViewport();
  await dialog.locator('[data-train="health"]').click();
  await expect(dialog.locator(".wallet")).toContainText("60");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(await dialog.evaluate((d) => d.scrollWidth <= d.clientWidth)).toBe(
    true,
  );
  await page.getByRole("button", { name: "Volver", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Comenzar supervivencia" }),
  ).toBeVisible();
});
test("el escenario cambia a 4:00 y 8:00 y las cartas llevan iconos ilustrados", async ({
  page,
}) => {
  await page.goto("/?debug");
  await page.getByRole("button", { name: "Comenzar supervivencia" }).click();
  const shots = new Set<string>();
  for (const t of [0, 240, 480]) {
    await page.evaluate((t) => window.__MAREA_DEBUG__!.setTime(t), t);
    shots.add(
      await page
        .locator("#battle")
        .evaluate((c: HTMLCanvasElement) => c.toDataURL()),
    );
  }
  expect(shots.size).toBe(3);
  expect(
    await page.evaluate(() => window.__MAREA_DEBUG__!.snapshot().stage),
  ).toBe("desert");
  await expect(page.locator(".battle-location")).toContainText(
    "DUNAS Y RUINAS",
  );
  await page.getByRole("button", { name: "+10 XP", exact: true }).click();
  await expect(page.locator("[data-upgrade] .game-icon")).toHaveCount(3);
  const background = await page
    .locator("[data-upgrade] .game-icon")
    .first()
    .evaluate((el) => getComputedStyle(el).backgroundImage);
  expect(background).toContain("icons-v7.png");
});
test("Zoro solo puede vincular sus dos técnicas; después el jefe ofrece atributos", async ({
  page,
}) => {
  await page.goto("/?debug");
  await page.getByRole("button", { name: "Capitán Zoro", exact: true }).click();
  await page.getByRole("button", { name: "Comenzar supervivencia" }).click();
  await page.evaluate(() => window.__MAREA_DEBUG__!.learnTechnique("phoenix"));
  await page.getByRole("button", { name: "Grieta", exact: true }).click();
  await page
    .getByRole("button", { name: "Derrotar jefe", exact: true })
    .click();
  await page.locator("[data-boss-reward]").first().click();
  await expect(page.locator("[data-link]")).toHaveCount(1);
  await expect(page.locator('[data-link="phoenix"]')).toBeVisible();
  await page.locator('[data-link="phoenix"]').click();
  const state = await page.evaluate(() => window.__MAREA_DEBUG__!.snapshot());
  expect(state.linked).toEqual(["onigiri", "phoenix"]);
  await page.getByRole("button", { name: "Grieta", exact: true }).click();
  await page
    .getByRole("button", { name: "Derrotar jefe", exact: true })
    .click();
  await expect(page.getByRole("button", { name: /Vincular/ })).toHaveCount(0);
  await expect(page.locator("[data-boss-reward]")).toHaveCount(3);
});

test("los jefes tienen seis dibujos de marcha distintos por vista, sin recortes", async ({
  page,
}) => {
  await page.goto("/");
  const reports = await page.evaluate(async () => {
    const result = [];
    for (const id of ["buggy", "kuro", "arlong"]) {
      const im = new Image();
      im.src = `assets/bosses/${id}-walk-v7.png`;
      await im.decode();
      const c = document.createElement("canvas");
      c.width = im.width;
      c.height = im.height;
      const ctx = c.getContext("2d")!;
      ctx.drawImage(im, 0, 0);
      const data = ctx.getImageData(0, 0, c.width, c.height).data,
        rows = [];
      for (let row = 0; row < 2; row++) {
        const frames = [];
        for (let col = 0; col < 6; col++) {
          let hash = 0,
            count = 0,
            border = 0;
          for (let y = 0; y < 128; y++)
            for (let x = 0; x < 192; x++) {
              const i = ((row * 128 + y) * c.width + col * 192 + x) * 4;
              if (data[i + 3]! > 100) {
                count++;
                hash =
                  (Math.imul(hash, 31) +
                    data[i]! +
                    data[i + 1]! +
                    data[i + 2]!) |
                  0;
                if (x === 0 || x === 191 || y === 0 || y === 127) border++;
              }
            }
          frames.push({ hash, count, border });
        }
        rows.push(frames);
      }
      result.push({ id, width: im.width, height: im.height, rows });
    }
    return result;
  });
  for (const report of reports) {
    expect(report.width).toBe(1152);
    expect(report.height).toBe(256);
    for (const row of report.rows) {
      expect(new Set(row.map((f) => f.hash)).size).toBe(6);
      for (const frame of row) {
        expect(frame.count).toBeGreaterThan(1700);
        expect(frame.border).toBe(0);
      }
    }
  }
});
