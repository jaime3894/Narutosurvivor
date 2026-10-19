import { expect, test } from "@playwright/test";
import {
  combatArtists,
  combatAtlasPath,
  combatLayout,
} from "../src/data/combat-art";

test("las poses publicadas están completas, separadas y cambian al atacar", async ({
  page,
}) => {
  const warnings: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "warning") warnings.push(message.text());
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Zarpar hacia East Blue" }).waitFor();
  const report = await page.evaluate(
    async ({ paths, layout }) =>
      Promise.all(
        paths.map(async ({ id, path }) => {
          const image = new Image();
          image.src = path;
          await image.decode();
          const c = document.createElement("canvas");
          c.width = layout.width;
          c.height = layout.height;
          const ctx = c.getContext("2d", { willReadFrequently: true })!;
          ctx.drawImage(image, 0, 0);
          const rows = [];
          for (let row = 0; row < 6; row++) {
            const hashes: string[] = [],
              cells = [];
            for (let frame = 0; frame < 6; frame++) {
              const pixels = ctx.getImageData(
                frame * layout.cellWidth,
                row * layout.cellHeight,
                layout.cellWidth,
                layout.cellHeight,
              ).data;
              let opaque = 0,
                edge = 0,
                hash = 2166136261;
              for (let y = 0; y < layout.cellHeight; y++)
                for (let x = 0; x < layout.cellWidth; x++) {
                  const i = (y * layout.cellWidth + x) * 4;
                  if (pixels[i + 3]! > 100) {
                    opaque++;
                    if (
                      x === 0 ||
                      y === 0 ||
                      x === layout.cellWidth - 1 ||
                      y === layout.cellHeight - 1
                    )
                      edge++;
                  }
                  for (let channel = 0; channel < 4; channel++)
                    hash = Math.imul(hash ^ pixels[i + channel]!, 16777619);
                }
              hashes.push(String(hash));
              cells.push({ opaque, edge });
            }
            rows.push({ distinct: new Set(hashes).size, cells });
          }
          return { id, rows };
        }),
      ),
    {
      paths: combatArtists.map((id) => ({ id, path: combatAtlasPath(id) })),
      layout: combatLayout,
    },
  );
  for (const atlas of report)
    for (const [row, view] of atlas.rows.entries()) {
      expect(view.distinct, `${atlas.id} fila ${row}`).toBeGreaterThanOrEqual(
        4,
      );
      for (const [frame, cell] of view.cells.entries()) {
        expect(cell.opaque, `${atlas.id} ${row}/${frame}`).toBeGreaterThan(200);
        expect(cell.edge, `Recorte en ${atlas.id} ${row}/${frame}`).toBe(0);
      }
    }
  expect(warnings).toEqual([]);
});

test("el selector demuestra las técnicas propias de toda la tripulación y conserva sus formas", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page
    .getByRole("button", { name: "Elegir tripulación", exact: true })
    .click();
  const names = [
    "Luffy",
    "Zoro",
    "Nami",
    "Usopp",
    "Sanji",
    "Chopper",
    "Robin",
    "Franky",
    "Brook",
    "Jinbe",
  ];
  for (const name of names) {
    await page
      .getByRole("button", {
        name: `Elegir a ${name} como capitán`,
        exact: true,
      })
      .click();
    await page.locator('[data-preview-action="punch"]').click();
    const select = page.getByRole("combobox", {
      name: "Técnica de demostración",
    });
    const options = await select
      .locator("option")
      .evaluateAll((items) =>
        items.map((item) => (item as HTMLOptionElement).value),
      );
    for (const weapon of options) {
      await select.selectOption(weapon);
      await expect(select).toHaveValue(weapon);
    }
    await page
      .getByRole("combobox", { name: "Dirección de demostración" })
      .selectOption("up");
    const before = await page
      .locator("#crew-preview")
      .evaluate((c: HTMLCanvasElement) => c.toDataURL());
    await expect
      .poll(() =>
        page
          .locator("#crew-preview")
          .evaluate((c: HTMLCanvasElement) => c.toDataURL()),
      )
      .not.toBe(before);
    await page.locator('[data-form-preview="2"]').click();
    await page.locator('[data-preview-action="punch"]').click();
    await expect(page.locator('[data-form-preview="2"]')).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  }
  expect(errors).toEqual([]);
});

test("la demostración de Zoro funciona en móvil sin desbordar el selector", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Elegir tripulación", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Elegir a Zoro como capitán", exact: true })
    .click();
  await page.getByRole("button", { name: "Ver técnica", exact: true }).click();
  await page
    .getByRole("combobox", { name: "Técnica de demostración" })
    .selectOption("phoenix");
  await page
    .getByRole("combobox", { name: "Dirección de demostración" })
    .selectOption("left");
  await page.locator("#crew-preview").scrollIntoViewIfNeeded();
  await expect(page.locator("#crew-preview")).toBeInViewport();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page
    .getByRole("button", { name: "Confirmar tripulación ↗", exact: true })
    .click();
  await page.getByRole("button", { name: "Zarpar hacia East Blue" }).click();
  await expect(page.locator("#battle")).toBeVisible();
});

test("las 54 técnicas por forma muestran nombres propios y animan en el selector", async ({
  page,
}) => {
  test.setTimeout(90000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page
    .getByRole("button", { name: "Elegir tripulación", exact: true })
    .click();
  await page.clock.install();
  let combinations = 0;
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
    await page.locator(`[data-captain="${id}"]`).click();
    await page.locator('[data-preview-action="punch"]').click();
    const select = page.locator("#preview-technique");
    const ids = await select
      .locator("option")
      .evaluateAll((options) =>
        options.map((o) => (o as HTMLOptionElement).value),
      );
    const titles = new Map<string, string[]>();
    for (const tier of [0, 1, 2]) {
      await page.locator(`[data-form-preview="${tier}"]`).click();
      await page.locator('[data-preview-action="punch"]').click();
      for (const weapon of ids) {
        await select.selectOption(weapon);
        const title = await select.locator("option:checked").textContent();
        titles.set(weapon, [...(titles.get(weapon) ?? []), title!]);
        await expect(page.locator(".form-description")).toContainText(title!);
        const before = await page
          .locator("#crew-preview")
          .evaluate((c: HTMLCanvasElement) => c.toDataURL());
        await page.clock.fastForward(850);
        await page.clock.runFor(32);
        expect(
          await page
            .locator("#crew-preview")
            .evaluate((c: HTMLCanvasElement) => c.toDataURL()),
        ).not.toBe(before);
        combinations++;
      }
    }
    for (const names of titles.values()) expect(new Set(names).size).toBe(3);
  }
  expect(combinations).toBe(54);
  expect(errors).toEqual([]);
});
