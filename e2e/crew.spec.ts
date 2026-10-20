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
  expect(state.energy).toBe(100);
  await expect(
    page.locator("#energy-text, .energy-row, .crew-hud"),
  ).toHaveCount(0);
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
  await expect(page.locator(".captain-pedestal h2")).toHaveText("Nami");
  await expect(page.locator(".captain-pedestal p")).toContainText("Usopp");
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
  await expect(page.locator("#port-captain")).toBeVisible();
  expect(
    await page
      .locator("#port-captain")
      .evaluate((canvas: HTMLCanvasElement) => {
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

test("los 39 atlas reales tienen transparencia, cuatro vistas y dos claves de marcha distintas", async ({
  page,
}) => {
  const failures: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "warning") failures.push(message.text());
  });
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const manifest: Record<string, string> = await (
      await fetch("./assets/manifest.json")
    ).json();
    return Promise.all(
      Object.entries(manifest).map(async ([id, path]) => {
        const image = new Image();
        image.src = path;
        await image.decode();
        const canvas = document.createElement("canvas");
        canvas.width = 960;
        canvas.height = 320;
        const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
        ctx.drawImage(image, 0, 0);
        const views = [0, 1, 2, 3].map((row) => {
          const first = ctx.getImageData(4 * 64, row * 80, 64, 80).data;
          const second = ctx.getImageData(7 * 64, row * 80, 64, 80).data;
          let opaque = 0,
            transparent = 0,
            difference = 0;
          for (let i = 0; i < first.length; i += 4) {
            if (first[i + 3]! > 0) opaque++;
            else transparent++;
            for (let c = 0; c < 4; c++)
              if (first[i + c] !== second[i + c]) difference++;
          }
          return { opaque, transparent, difference };
        });
        return { id, views };
      }),
    );
  });
  expect(result).toHaveLength(39);
  for (const atlas of result)
    for (const view of atlas.views) {
      expect(view.opaque, atlas.id).toBeGreaterThan(150);
      expect(view.transparent, atlas.id).toBeGreaterThan(100);
      expect(view.difference, atlas.id).toBeGreaterThan(20);
    }
  expect(failures).toEqual([]);
});

test("Luffy base abre de pie y permite demostrar la carrera y el golpe texturizado", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page
    .getByRole("button", { name: "Elegir tripulación", exact: true })
    .click();
  const idle = page.getByRole("button", { name: "De pie", exact: true });
  await expect(idle).toHaveAttribute("aria-pressed", "true");
  const standing = await page
    .locator("#crew-preview")
    .evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL());
  await page.getByRole("button", { name: "Correr", exact: true }).click();
  await expect
    .poll(() =>
      page
        .locator("#crew-preview")
        .evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL()),
    )
    .not.toBe(standing);
  await page
    .getByRole("button", { name: "Golpe de goma", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Golpe de goma", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.waitForTimeout(500);
  expect(errors).toEqual([]);
});

test("Luffy tiene seis dibujos de carrera distintos de su postura neutral en cuatro vistas", async ({
  page,
}) => {
  await page.goto("/");
  const frames = await page.evaluate(async () => {
    const manifest: Record<string, string> = await (
      await fetch("./assets/manifest.json")
    ).json();
    const image = new Image();
    image.src = manifest["hero:luffy:0"]!;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 80;
    const ctx = canvas.getContext("2d")!;
    return [0, 1, 2, 3].map((row) =>
      [0, 4, 5, 6, 7, 8, 9].map((frame) => {
        ctx.clearRect(0, 0, 64, 80);
        ctx.drawImage(image, frame * 64, row * 80, 64, 80, 0, 0, 64, 80);
        return canvas.toDataURL();
      }),
    );
  });
  for (const direction of frames) expect(new Set(direction).size).toBe(7);
});
